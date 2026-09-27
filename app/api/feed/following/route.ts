import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const result = await db.query(`
      SELECT p.id, p.content, p.created_at, u.id AS user_id, u.username,
        (SELECT count(*)::int FROM post_likes l WHERE l.post_id = p.id) AS like_count,
        (SELECT count(*)::int FROM comments c WHERE c.post_id = p.id) AS comment_count,
        EXISTS (SELECT 1 FROM post_likes l WHERE l.post_id = p.id AND l.user_id = $1) AS liked
      FROM posts p JOIN users u ON u.id = p.user_id
      WHERE p.user_id IN (SELECT following_id FROM follows WHERE follower_id = $1)
      ORDER BY p.created_at DESC LIMIT 50
    `, [user.id]);
    return NextResponse.json({ posts: result.rows });
  } catch (error) {
    console.error('following feed', error);
    return NextResponse.json({ error: 'Failed to load following feed' }, { status: 500 });
  }
}
