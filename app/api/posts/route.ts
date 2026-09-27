import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const result = await db.query(`
      SELECT p.id, p.content, p.created_at, u.id AS user_id, u.username
      FROM posts p
      JOIN users u ON u.id = p.user_id
      ORDER BY p.created_at DESC
      LIMIT 50
    `);
    return NextResponse.json({ posts: result.rows });
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
    if (!content) return NextResponse.json({ error: 'Post cannot be empty' }, { status: 400 });
    if (content.length > 2000) return NextResponse.json({ error: 'Post is too long' }, { status: 400 });

    const result = await db.query(
      `INSERT INTO posts (user_id, content) VALUES ($1, $2)
       RETURNING id, content, created_at`,
      [user.id, content]
    );

    return NextResponse.json({ post: { ...result.rows[0], user_id: user.id, username: user.username } }, { status: 201 });
  } catch (error) {
    console.error('POST /api/posts', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}
