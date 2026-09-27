import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const FUNCTION_URL = process.env.NEON_MEDIA_FUNCTION_URL;
const MAX_SIZE = 50 * 1024 * 1024;

async function allowed(conversationId: string, userId: string) {
  const r = await db.query('SELECT 1 FROM conversation_members WHERE conversation_id=$1 AND user_id=$2', [conversationId, userId]);
  return !!r.rowCount;
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!FUNCTION_URL) return NextResponse.json({ error: 'Media storage is not configured' }, { status: 503 });

  const body = await req.json();
  const conversationId = String(body.conversationId || '');
  const fileName = String(body.fileName || 'file').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 180);
  const contentType = String(body.contentType || 'application/octet-stream');
  const size = Number(body.size || 0);
  if (!conversationId || !await allowed(conversationId, user.id)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (!Number.isFinite(size) || size <= 0 || size > MAX_SIZE) return NextResponse.json({ error: 'Файл слишком большой (максимум 50 МБ)' }, { status: 400 });

  const mediaType = contentType.startsWith('image/') ? 'image' : contentType.startsWith('video/') ? 'video' : contentType.startsWith('audio/') ? 'audio' : 'file';
  const key = `messages/${conversationId}/${user.id}/${Date.now()}-${crypto.randomUUID()}-${fileName}`;
  const r = await fetch(`${FUNCTION_URL.replace(/\/$/, '')}/presign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ operation: 'upload', key, contentType })
  });
  const data = await r.json();
  if (!r.ok) return NextResponse.json({ error: data.error || 'Не удалось получить URL загрузки' }, { status: 502 });
  return NextResponse.json({ uploadUrl: data.url, key, mediaType, fileName, fileSize: size, mimeType: contentType });
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!FUNCTION_URL) return NextResponse.json({ error: 'Media storage is not configured' }, { status: 503 });
  const key = new URL(req.url).searchParams.get('key') || '';
  if (!key || !key.includes(`/${user.id}/`)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const r = await fetch(`${FUNCTION_URL.replace(/\/$/, '')}/presign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ operation: 'download', key })
  });
  const data = await r.json();
  if (!r.ok) return NextResponse.json({ error: data.error || 'Не удалось получить URL' }, { status: 502 });
  return NextResponse.redirect(data.url);
}
