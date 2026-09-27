import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  if (id === user.id) return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
  try {
    const existing = await db.query('SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = $2', [user.id, id]);
    if (existing.rowCount) await db.query('DELETE FROM follows WHERE follower_id = $1 AND following_id = $2', [user.id, id]);
    else await db.query('INSERT INTO follows (follower_id, following_id) VALUES ($1, $2)', [user.id, id]);
    const count = await db.query('SELECT count(*)::int AS count FROM follows WHERE following_id = $1', [id]);
    return NextResponse.json({ following: !existing.rowCount, count: count.rows[0].count });
  } catch (error) {
    console.error('follow', error);
    return NextResponse.json({ error: 'Failed to update follow' }, { status: 500 });
  }
}
