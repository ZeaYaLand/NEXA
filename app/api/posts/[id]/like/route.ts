import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { canViewUserContent } from '@/lib/nexa-core/privacy';
import type { Visibility } from '@/lib/nexa-core/types';

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  try {
    const post = await db.query('SELECT user_id, visibility FROM posts WHERE id = $1', [id]);
    if (!post.rowCount) return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    if (!await canViewUserContent(user.id, post.rows[0].user_id, post.rows[0].visibility as Visibility)) {
      return NextResponse.json({ error: 'Post is not available' }, { status: 403 });
    }
    const existing = await db.query('SELECT 1 FROM post_likes WHERE post_id = $1 AND user_id = $2', [id, user.id]);
    if (existing.rowCount) {
      await db.query('DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2', [id, user.id]);
    } else {
      await db.query('INSERT INTO post_likes (post_id, user_id) VALUES ($1, $2)', [id, user.id]);
      if (post.rows[0].user_id !== user.id) {
        await db.query("INSERT INTO notifications (recipient_id, actor_id, type, post_id) VALUES ($1, $2, 'like', $3)", [post.rows[0].user_id, user.id, id]);
      }
    }
    const count = await db.query('SELECT count(*)::int AS count FROM post_likes WHERE post_id = $1', [id]);
    return NextResponse.json({ liked: !existing.rowCount, count: count.rows[0].count });
  } catch (error) {
    console.error('POST like', error);
    return NextResponse.json({ error: 'Failed to update like' }, { status: 500 });
  }
}
