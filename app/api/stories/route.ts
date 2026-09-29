import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const result = await db.query(`
      SELECT s.id, s.user_id, s.media_key, s.media_type, s.caption, s.created_at, s.expires_at, s.view_count,
             u.username
      FROM stories s JOIN users u ON u.id=s.user_id
      WHERE s.expires_at > NOW()
        AND NOT EXISTS (
          SELECT 1 FROM nexa_blocks b
          WHERE (b.blocker_id=$1 AND b.blocked_id=s.user_id)
             OR (b.blocker_id=s.user_id AND b.blocked_id=$1)
        )
        AND (
          s.user_id=$1
          OR EXISTS (SELECT 1 FROM nexa_follows f WHERE f.follower_id=$1 AND f.following_id=s.user_id)
        )
      ORDER BY s.created_at DESC
      LIMIT 100
    `, [user.id]);
    return NextResponse.json({ stories: result.rows.map((s) => ({ ...s, media_url: `/api/media/presign?key=${encodeURIComponent(s.media_key)}` })) });
  } catch (error) {
    console.error('GET /api/stories', error);
    return NextResponse.json({ error: 'Не удалось загрузить истории' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    const mediaKey = String(body.mediaKey || '');
    const mediaType = String(body.mediaType || 'image');
    const caption = String(body.caption || '').slice(0, 500);
    if (!mediaKey || !/^stories\//.test(mediaKey) || !['image', 'video'].includes(mediaType)) {
      return NextResponse.json({ error: 'История должна содержать фото или видео' }, { status: 400 });
    }
    if (!mediaKey.startsWith(`stories/${user.id}/`)) return NextResponse.json({ error: 'Недопустимый файл' }, { status: 403 });
    const id = crypto.randomUUID();
    const result = await db.query(`
      INSERT INTO stories (id,user_id,media_key,media_type,caption,expires_at)
      VALUES ($1,$2,$3,$4,$5,NOW()+INTERVAL '24 hours')
      RETURNING id, created_at, expires_at
    `, [id, user.id, mediaKey, mediaType, caption]);
    return NextResponse.json({ story: { ...result.rows[0], media_key: mediaKey, media_type: mediaType, caption, media_url: `/api/media/presign?key=${encodeURIComponent(mediaKey)}` } }, { status: 201 });
  } catch (error) {
    console.error('POST /api/stories', error);
    return NextResponse.json({ error: 'Не удалось создать историю' }, { status: 500 });
  }
}
