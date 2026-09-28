import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { ensureSocialMediaSchema } from '@/lib/social-media-schema';

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await ensureSocialMediaSchema();
    const { id } = await params;
    const exists = await db.query('SELECT 1 FROM media_likes WHERE media_id=$1 AND user_id=$2', [id, user.id]);
    if (exists.rowCount) {
      await db.query('DELETE FROM media_likes WHERE media_id=$1 AND user_id=$2', [id, user.id]);
      await db.query('UPDATE media_items SET like_count=GREATEST(0,like_count-1) WHERE id=$1', [id]);
      const count = await db.query('SELECT like_count FROM media_items WHERE id=$1', [id]);
      return NextResponse.json({ liked: false, count: count.rows[0]?.like_count ?? 0 });
    }
    await db.query('INSERT INTO media_likes(media_id,user_id) VALUES($1,$2) ON CONFLICT DO NOTHING', [id, user.id]);
    await db.query('UPDATE media_items SET like_count=like_count+1 WHERE id=$1', [id]);
    const count = await db.query('SELECT like_count FROM media_items WHERE id=$1', [id]);
    return NextResponse.json({ liked: true, count: count.rows[0]?.like_count ?? 0 });
  } catch (error) {
    console.error('POST /api/media-library/[id]/like', error);
    return NextResponse.json({ error: 'Не удалось изменить лайк' }, { status: 500 });
  }
}
