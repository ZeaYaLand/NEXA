import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { canViewUserContent } from '@/lib/nexa-core/privacy';
import { ensurePostMediaSchema } from '@/lib/post-media-schema';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await ensurePostMediaSchema();
    const result = await db.query(`
      SELECT
        p.id,
        p.content,
        p.created_at,
        p.media_url,
        p.media_type,
        p.visibility,
        u.id AS user_id,
        u.username,
        (SELECT count(*)::int FROM post_likes l WHERE l.post_id = p.id) AS like_count,
        (SELECT count(*)::int FROM comments c WHERE c.post_id = p.id) AS comment_count,
        EXISTS (
          SELECT 1 FROM post_likes l
          WHERE l.post_id = p.id AND l.user_id = $1
        ) AS liked
      FROM posts p
      JOIN users u ON u.id = p.user_id
      WHERE p.user_id IN (
        SELECT following_id
        FROM follows
        WHERE follower_id = $1
      )
      ORDER BY p.created_at DESC
      LIMIT 50
    `, [user.id]);

    const posts = [];
    for (const post of result.rows) {
      if (await canViewUserContent(user.id, post.user_id, post.visibility)) {
        posts.push(post);
      }
    }

    return NextResponse.json({ posts });
  } catch (error) {
    console.error('following feed', error);
    return NextResponse.json({ error: 'Failed to load following feed' }, { status: 500 });
  }
}
