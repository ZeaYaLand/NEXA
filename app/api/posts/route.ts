import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { canViewUserContent } from '@/lib/nexa-core/privacy';
import type { Visibility } from '@/lib/nexa-core/types';

const visibilityValues: Visibility[] = ['public', 'followers', 'private'];

export async function GET() {
  try {
    const user = await getCurrentUser();
    const result = await db.query(`
      SELECT p.id, p.content, p.created_at, p.media_url, p.media_type, p.visibility,
        u.id AS user_id, u.username,
        (SELECT count(*)::int FROM post_likes l WHERE l.post_id = p.id) AS like_count,
        (SELECT count(*)::int FROM comments c WHERE c.post_id = p.id) AS comment_count,
        ${user ? 'EXISTS (SELECT 1 FROM post_likes l WHERE l.post_id = p.id AND l.user_id = $1)' : 'false'} AS liked
      FROM posts p
      JOIN users u ON u.id = p.user_id
      ORDER BY p.created_at DESC
      LIMIT 100
    `, user ? [user.id] : []);

    const posts = [];
    for (const post of result.rows) {
      if (await canViewUserContent(user?.id ?? null, post.user_id, post.visibility as Visibility)) {
        posts.push(post);
      }
    }

    return NextResponse.json({ posts });
  } catch (error) {
    console.error('GET /api/posts', error);
    return NextResponse.json({ error: 'Failed to load posts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const content = String(body.content ?? '').trim();
    const mediaUrl = typeof body.mediaUrl === 'string' ? body.mediaUrl.trim() : '';
    const mediaType = typeof body.mediaType === 'string' ? body.mediaType.trim() : '';
    const visibility = typeof body.visibility === 'string' ? body.visibility : 'public';

    if (!visibilityValues.includes(visibility as Visibility)) {
      return NextResponse.json({ error: 'Invalid visibility' }, { status: 400 });
    }
    if (!content && !mediaUrl) return NextResponse.json({ error: 'Добавь текст или фото' }, { status: 400 });
    if (content.length > 2000) return NextResponse.json({ error: 'Post is too long' }, { status: 400 });
    if (mediaUrl && mediaUrl.length > 6_000_000) return NextResponse.json({ error: 'Фото слишком большое после сжатия' }, { status: 400 });
    if (mediaUrl && !mediaUrl.startsWith('data:image/')) return NextResponse.json({ error: 'Разрешены только изображения' }, { status: 400 });

    const result = await db.query(
      `INSERT INTO posts (user_id, content, media_url, media_type, visibility)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, content, created_at, media_url, media_type, visibility`,
      [user.id, content, mediaUrl || null, mediaType || (mediaUrl ? 'image' : null), visibility]
    );

    return NextResponse.json({
      post: {
        ...result.rows[0],
        user_id: user.id,
        username: user.username,
        like_count: 0,
        comment_count: 0,
        liked: false,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/posts', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}
