'use client';

import { useEffect, useRef, useState } from 'react';

type Mode = 'voice' | 'circle';

type Props = {
  mode: Mode;
  onCancel: () => void;
  onRecorded: (blob: Blob, type: Mode) => Promise<void> | void;
  onError?: (message: string) => void;
};

const pickMime = (mode: Mode) => {
  const candidates = mode === 'voice'
    ? ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus']
    : ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'];
  return candidates.find(value => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(value)) || '';
};

const friendlyError = (error: unknown, mode: Mode) => {
  const name = error instanceof DOMException ? error.name : '';
  if (name === 'NotAllowedError' || name === 'SecurityError') return 'Нет доступа к микрофону/камере. Разреши доступ в браузере и попробуй ещё раз.';
  if (name === 'NotFoundError') return mode === 'voice' ? 'Микрофон не найден на устройстве.' : 'Камера или микрофон не найдены на устройстве.';
  if (name === 'NotReadableError') return 'Микрофон или камера уже используются другим приложением.';
  if (name === 'OverconstrainedError') return 'Камера не поддерживает выбранный режим. Попробуй ещё раз.';
  if (name === 'AbortError') return 'Запись была прервана. Попробуй ещё раз.';
  return mode === 'voice' ? 'Не удалось начать запись голосового сообщения.' : 'Не удалось начать запись видеокружка.';
};

export default function MessageRecorder({ mode, onCancel, onRecorded, onError }: Props) {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    return () => {
      recorderRef.current?.stop();
      streamRef.current?.getTracks().forEach(track => track.stop());
    };
  }, []);

  useEffect(() => {
    if (!recording) return;
    const timer = window.setInterval(() => setSeconds(value => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [recording]);

  const fail = (error: unknown) => {
    const message = friendlyError(error, mode);
    onError?.(message);
    onCancel();
  };

  const start = async () => {
    if (recording || busy) return;
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('MediaDevices API is unavailable');
      if (typeof MediaRecorder === 'undefined') throw new Error('MediaRecorder is unavailable');
      const mime = pickMime(mode);
      if (!mime) throw new Error('No supported recording format');

      const stream = await navigator.mediaDevices.getUserMedia(
        mode === 'voice'
          ? { audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } }
          : { audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: { facingMode: 'user' } }
      );

      streamRef.current = stream;
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream, { mimeType: mime });

      recorder.ondataavailable = event => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onerror = () => {
        stream.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        recorderRef.current = null;
        setRecording(false);
        setSeconds(0);
        onError?.(mode === 'voice' ? 'Ошибка записи голосового сообщения.' : 'Ошибка записи видеокружка.');
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        const blob = new Blob(chunksRef.current, { type: mime.split(';')[0] });
        chunksRef.current = [];
        if (!blob.size) {
          setRecording(false);
          setSeconds(0);
          onError?.('Запись получилась пустой. Попробуй записать ещё раз.');
          return;
        }
        setBusy(true);
        try {
          await onRecorded(blob, mode);
        } catch (error) {
          fail(error);
        } finally {
          setBusy(false);
        }
      };

      recorderRef.current = recorder;
      recorder.start(250);
      setSeconds(0);
      setRecording(true);
    } catch (error) {
      streamRef.current?.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      fail(error);
    }
  };

  const stop = () => {
    if (!recorderRef.current || !recording) return;
    recorderRef.current.stop();
    recorderRef.current = null;
    setRecording(false);
  };

  const cancel = () => {
    const recorder = recorderRef.current;
    if (recorder) {
      recorder.ondataavailable = null;
      recorder.onstop = null;
      recorder.onerror = null;
      if (recorder.state !== 'inactive') recorder.stop();
      recorderRef.current = null;
    }
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    chunksRef.current = [];
    setRecording(false);
    setSeconds(0);
    onCancel();
  };

  const format = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  const buttonStyle: React.CSSProperties = {
    height: 42,
    border: '1px solid #292d39',
    borderRadius: 12,
    background: '#090b10',
    color: '#fff',
    padding: '0 12px',
    fontWeight: 700,
    cursor: busy ? 'default' : 'pointer',
    whiteSpace: 'nowrap',
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
      {recording ? (
        <>
          <span aria-label="Идёт запись" style={{ color: '#ff557d', fontWeight: 800, whiteSpace: 'nowrap' }}>● {format}</span>
          <button type="button" onClick={cancel} disabled={busy} style={buttonStyle}>Отмена</button>
          <button type="button" onClick={stop} disabled={busy} style={{ ...buttonStyle, background: '#f5f7fb', color: '#07080b' }}>{busy ? 'Отправка…' : 'Отправить'}</button>
        </>
      ) : (
        <button type="button" onClick={start} disabled={busy} style={buttonStyle} aria-label={mode === 'voice' ? 'Записать голосовое сообщение' : 'Записать видеокружок'}>
          {mode === 'voice' ? '🎙️ Записать' : '🔵 Записать'}
        </button>
      )}
    </div>
  );
}
