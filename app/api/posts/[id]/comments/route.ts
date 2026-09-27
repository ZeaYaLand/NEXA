import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const result = await db.query(`
      SELECT c.id, c.content, c.created_at, u.id AS user_id, u.username
      FROM comments c JOIN users u ON u.id = c.user_id
      WHERE c.post_id = $1 ORDER BY c.created_at ASC LIMIT 100
    `, [id]);
    return NextResponse.json({ comments: result.rows });
  } catch (error) {
    console.error('GET comments', error);
    return NextResponse.json({ error: 'Failed to load comments' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const body = await request.json();
  const content = String(body.content ?? '').trim();
  if (!content) return NextResponse.json({ error: 'Comment cannot be empty' }, { status: 400 });
  if (content.length > 1000) return NextResponse.json({ error: 'Comment is too long' }, { status: 400 });
  try {
    const result = await db.query(
      `INSERT INTO comments (post_id, user_id, content) VALUES ($1, $2, $3) RETURNING id, content, created_at`,
      [id, user.id, content]
    );
    return NextResponse.json({ comment: { ...result.rows[0], user_id: user.id, username: user.username } }, { status: 201 });
  } catch (error) {
    console.error('POST comments', error);
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}
