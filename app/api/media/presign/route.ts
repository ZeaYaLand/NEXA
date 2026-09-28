import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const FUNCTION_URL = process.env.NEON_MEDIA_FUNCTION_URL;
const MAX_SIZE = 50 * 1024 * 1024;

async function allowedConversation(conversationId: string, userId: string) {
  const r = await db.query('SELECT 1 FROM conversation_members WHERE conversation_id=$1 AND user_id=$2', [conversationId, userId]);
  return !!r.rowCount;
}

async function readJsonResponse(response: Response) {
  const text = await response.text();
  if (!text.trim()) return null;
  try { return JSON.parse(text) as Record<string, unknown>; } catch { return null; }
}

function jsonError(error: string, status: number) { return NextResponse.json({ error }, { status }); }

function parseKey(key: string) {
  const message = key.match(/^messages\/([^/]+)\/([^/]+)\/[^/]+$/);
  if (message) return { scope: 'message' as const, conversationId: message[1] as string };
  const social = key.match(/^(stories|library)\/([^/]+)\/[^/]+$/);
  if (social) return { scope: social[1] as 'stories'|'library', ownerId: social[2] as string };
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError('Unauthorized', 401);
    if (!FUNCTION_URL) return jsonError('Media storage is not configured', 503);
    let body: Record<string, unknown>;
    try { body = await req.json(); } catch { return jsonError('Некорректные данные запроса', 400); }

    const conversationId = String(body.conversationId || '');
    const scope = String(body.scope || (conversationId ? 'message' : ''));
    const fileName = String(body.fileName || 'file').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 180);
    const contentType = String(body.mimeType || body.contentType || 'application/octet-stream');
    const size = Number(body.fileSize ?? body.size);

    if (!['message', 'stories', 'library'].includes(scope)) return jsonError('Некорректная область хранения', 400);
    if (scope === 'message' && (!conversationId || !(await allowedConversation(conversationId, user.id)))) return jsonError('Forbidden', 403);
    if (!Number.isFinite(size) || size <= 0) return jsonError('Не удалось определить размер файла', 400);
    if (size > MAX_SIZE) return jsonError('Файл слишком большой (максимум 50 МБ)', 400);

    const mediaType = contentType.startsWith('image/') ? 'image' : contentType.startsWith('video/') ? 'video' : contentType.startsWith('audio/') ? 'audio' : 'file';
    const key = scope === 'message'
      ? `messages/${conversationId}/${user.id}/${Date.now()}-${crypto.randomUUID()}-${fileName}`
      : `${scope}/${user.id}/${Date.now()}-${crypto.randomUUID()}-${fileName}`;

    let response: Response;
    try {
      response = await fetch(`${FUNCTION_URL.replace(/\/$/, '')}/presign`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operation: 'upload', key, contentType }),
      });
    } catch (error) {
      console.error('Media upload presign fetch failed:', error);
      return jsonError('Не удалось связаться с хранилищем', 502);
    }
    const data = await readJsonResponse(response);
    if (!response.ok) {
      const message = typeof data?.error === 'string' ? data.error : `Ошибка хранилища (${response.status})`;
      return jsonError(message, 502);
    }
    if (!data || typeof data.url !== 'string' || !data.url) return jsonError('Хранилище не вернуло URL загрузки', 502);
    return NextResponse.json({ uploadUrl: data.url, key, mediaType, fileName, fileSize: size, mimeType: contentType });
  } catch (error) {
    console.error('POST /api/media/presign error:', error);
    return jsonError('Ошибка при подготовке загрузки файла', 500);
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError('Unauthorized', 401);
    if (!FUNCTION_URL) return jsonError('Media storage is not configured', 503);
    const key = new URL(req.url).searchParams.get('key') || '';
    const parsed = parseKey(key);
    if (!parsed) return jsonError('Некорректный media key', 400);
    if (parsed.scope === 'message' && !(await allowedConversation(parsed.conversationId, user.id))) return jsonError('Forbidden', 403);

    let response: Response;
    try {
      response = await fetch(`${FUNCTION_URL.replace(/\/$/, '')}/presign`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operation: 'download', key }),
      });
    } catch (error) {
      console.error('Media download presign fetch failed:', error);
      return jsonError('Не удалось связаться с хранилищем', 502);
    }
    const data = await readJsonResponse(response);
    if (!response.ok) {
      const message = typeof data?.error === 'string' ? data.error : `Ошибка хранилища (${response.status})`;
      return jsonError(message, 502);
    }
    if (!data || typeof data.url !== 'string' || !data.url) return jsonError('Хранилище не вернуло URL файла', 502);
    return NextResponse.redirect(data.url);
  } catch (error) {
    console.error('GET /api/media/presign error:', error);
    return jsonError('Ошибка при получении файла', 500);
  }
}
