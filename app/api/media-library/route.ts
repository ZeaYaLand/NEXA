import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { ensureSocialMediaSchema } from '@/lib/social-media-schema';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await ensureSocialMediaSchema();
    const kind = new URL(req.url).searchParams.get('kind');
    const values: string[] = [];
    const where = kind === 'video' || kind === 'music' ? 'WHERE m.kind=$1' : '';
    if (where) values.push(kind!);
    const result = await db.query(`
      SELECT m.id,m.user_id,m.kind,m.media_key,m.mime_type,m.title,m.description,m.cover_key,m.created_at,m.like_count,m.comment_count,
             u.username,
             EXISTS(SELECT 1 FROM media_likes ml WHERE ml.media_id=m.id AND ml.user_id=$${values.length+1}) AS liked
      FROM media_items m JOIN users u ON u.id=m.user_id
      ${where}
      ORDER BY m.created_at DESC
    `, [...values, user.id]);
    return NextResponse.json({ items: result.rows.map((m) => ({
      ...m,
      media_url: `/api/media/presign?key=${encodeURIComponent(m.media_key)}`,
      cover_url: m.cover_key ? `/api/media/presign?key=${encodeURIComponent(m.cover_key)}` : null,
    })) });
  } catch (error) {
    console.error('GET /api/media-library', error);
    return NextResponse.json({ error: 'Не удалось загрузить медиатеку' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await ensureSocialMediaSchema();
    const body = await req.json();
    const kind = String(body.kind || '');
    const mediaKey = String(body.mediaKey || '');
    const mimeType = String(body.mimeType || 'application/octet-stream');
    const title = String(body.title || '').trim().slice(0, 160);
    const description = String(body.description || '').slice(0, 2000);
    const coverKey = body.coverKey ? String(body.coverKey) : null;
    const validVideo = kind === 'video' && mediaKey.startsWith(`library/${user.id}/`) && mimeType.startsWith('video/');
    const validMusic = kind === 'music' && mediaKey.startsWith(`library/${user.id}/`) && mimeType.startsWith('audio/');
    if ((!validVideo && !validMusic) || !title) return NextResponse.json({ error: 'Укажите название и корректный видео/аудиофайл' }, { status: 400 });
    if (coverKey && !coverKey.startsWith(`library/${user.id}/`)) return NextResponse.json({ error: 'Недопустимая обложка' }, { status: 403 });
    const id = crypto.randomUUID();
    const result = await db.query(`
      INSERT INTO media_items (id,user_id,kind,media_key,mime_type,title,description,cover_key)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING id,kind,media_key,mime_type,title,description,cover_key,created_at,like_count,comment_count
    `, [id,user.id,kind,mediaKey,mimeType,title,description,coverKey]);
    const item = result.rows[0];
    return NextResponse.json({ item: { ...item, username: user.username, liked: false, media_url: `/api/media/presign?key=${encodeURIComponent(mediaKey)}`, cover_url: coverKey ? `/api/media/presign?key=${encodeURIComponent(coverKey)}` : null } }, { status: 201 });
  } catch (error) {
    console.error('POST /api/media-library', error);
    return NextResponse.json({ error: 'Не удалось опубликовать медиа' }, { status: 500 });
  }
}
