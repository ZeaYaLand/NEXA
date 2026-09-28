'use client';

import { useEffect, useRef, useState } from 'react';

type Mode = 'voice' | 'circle';

type Props = {
  mode: Mode;
  onCancel: () => void;
  onRecorded: (blob: Blob, type: Mode) => Promise<void> | void;
};

export default function MessageRecorder({ mode, onCancel, onRecorded }: Props) {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach(track => track.stop());
    };
  }, []);

  useEffect(() => {
    if (!recording) return;
    const timer = window.setInterval(() => setSeconds(value => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [recording]);

  const start = async () => {
    if (recording || busy) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia(
        mode === 'voice' ? { audio: true } : { audio: true, video: true }
      );
      streamRef.current = stream;
      const mime = mode === 'voice'
        ? (MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm')
        : (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus') ? 'video/webm;codecs=vp9,opus' : 'video/webm');
      const recorder = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      recorder.ondataavailable = event => {
        if (event.data.size) chunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        const blob = new Blob(chunksRef.current, { type: mime });
        chunksRef.current = [];
        if (!blob.size) return;
        setBusy(true);
        try {
          await onRecorded(blob, mode);
        } finally {
          setBusy(false);
        }
      };
      recorderRef.current = recorder;
      recorder.start();
      setSeconds(0);
      setRecording(true);
    } catch {
      onCancel();
    }
  };

  const stop = () => {
    if (!recorderRef.current || !recording) return;
    recorderRef.current.stop();
    recorderRef.current = null;
    setRecording(false);
  };

  const cancel = () => {
    if (recorderRef.current) {
      recorderRef.current.ondataavailable = null;
      recorderRef.current.onstop = null;
      recorderRef.current.stop();
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

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {recording ? (
        <>
          <span aria-label="Идёт запись">● {format}</span>
          <button type="button" onClick={cancel} disabled={busy}>Отмена</button>
          <button type="button" onClick={stop} disabled={busy}>{busy ? 'Отправка…' : 'Отправить'}</button>
        </>
      ) : (
        <button type="button" onClick={start} disabled={busy} aria-label={mode === 'voice' ? 'Записать голосовое сообщение' : 'Записать видеокружок'}>
          {mode === 'voice' ? '🎙️ Записать' : '🔵 Записать'}
        </button>
      )}
    </div>
  );
}
