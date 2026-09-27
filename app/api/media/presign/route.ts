import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const FUNCTION_URL = process.env.NEON_MEDIA_FUNCTION_URL;
const MAX_SIZE = 50 * 1024 * 1024;

async function allowed(conversationId: string, userId: string) {
  const r = await db.query(
    'SELECT 1 FROM conversation_members WHERE conversation_id=$1 AND user_id=$2',
    [conversationId, userId]
  );
  return !!r.rowCount;
}

async function readJsonResponse(response: Response) {
  const text = await response.text();
  if (!text.trim()) return null;

  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError('Unauthorized', 401);
    if (!FUNCTION_URL) return jsonError('Media storage is not configured', 503);

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return jsonError('Некорректные данные запроса', 400);
    }

    const conversationId = String(body.conversationId || '');
    const fileName = String(body.fileName || 'file')
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .slice(0, 180);
    const contentType = String(
      body.mimeType || body.contentType || 'application/octet-stream'
    );
    const rawSize = body.fileSize ?? body.size;
    const size = Number(rawSize);

    if (!conversationId || !(await allowed(conversationId, user.id))) {
      return jsonError('Forbidden', 403);
    }

    if (!Number.isFinite(size) || size <= 0) {
      return jsonError('Не удалось определить размер файла', 400);
    }

    if (size > MAX_SIZE) {
      return jsonError('Файл слишком большой (максимум 50 МБ)', 400);
    }

    const mediaType = contentType.startsWith('image/')
      ? 'image'
      : contentType.startsWith('video/')
        ? 'video'
        : contentType.startsWith('audio/')
          ? 'audio'
          : 'file';

    const key =
      `messages/${conversationId}/${user.id}/` +
      `${Date.now()}-${crypto.randomUUID()}-${fileName}`;

    let response: Response;
    try {
      response = await fetch(`${FUNCTION_URL.replace(/\/$/, '')}/presign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'upload',
          key,
          contentType,
        }),
      });
    } catch (error) {
      console.error('Media upload presign fetch failed:', error);
      return jsonError('Не удалось связаться с хранилищем', 502);
    }

    const data = await readJsonResponse(response);

    if (!response.ok) {
      const message =
        typeof data?.error === 'string'
          ? data.error
          : `Ошибка хранилища (${response.status})`;
      return jsonError(message, 502);
    }

    if (!data || typeof data.url !== 'string' || !data.url) {
      console.error('Invalid upload presign response:', {
        status: response.status,
        data,
      });
      return jsonError('Хранилище не вернуло URL загрузки', 502);
    }

    return NextResponse.json({
      uploadUrl: data.url,
      key,
      mediaType,
      fileName,
      fileSize: size,
      mimeType: contentType,
    });
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

    if (!key || !key.includes(`/${user.id}/`)) {
      return jsonError('Forbidden', 403);
    }

    let response: Response;
    try {
      response = await fetch(`${FUNCTION_URL.replace(/\/$/, '')}/presign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operation: 'download', key }),
      });
    } catch (error) {
      console.error('Media download presign fetch failed:', error);
      return jsonError('Не удалось связаться с хранилищем', 502);
    }

    const data = await readJsonResponse(response);

    if (!response.ok) {
      const message =
        typeof data?.error === 'string'
          ? data.error
          : `Ошибка хранилища (${response.status})`;
      return jsonError(message, 502);
    }

    if (!data || typeof data.url !== 'string' || !data.url) {
      console.error('Invalid download presign response:', {
        status: response.status,
        data,
      });
      return jsonError('Хранилище не вернуло URL файла', 502);
    }

    return NextResponse.redirect(data.url);
  } catch (error) {
    console.error('GET /api/media/presign error:', error);
    return jsonError('Ошибка при получении файла', 500);
  }
}
