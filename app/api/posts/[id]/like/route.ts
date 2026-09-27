import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  try {
    const existing = await db.query('SELECT 1 FROM post_likes WHERE post_id = $1 AND user_id = $2', [id, user.id]);
    if (existing.rowCount) {
      await db.query('DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2', [id, user.id]);
    } else {
      await db.query('INSERT INTO post_likes (post_id, user_id) VALUES ($1, $2)', [id, user.id]);
    }
    const count = await db.query('SELECT count(*)::int AS count FROM post_likes WHERE post_id = $1', [id]);
    return NextResponse.json({ liked: !existing.rowCount, count: count.rows[0].count });
  } catch (error) {
    console.error('POST /api/posts/[id]/like', error);
    return NextResponse.json({ error: 'Failed to update like' }, { status: 500 });
  }
}
