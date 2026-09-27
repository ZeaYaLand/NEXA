import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { username } = await params;

  try {
    const target = await db.query(
      'SELECT id FROM users WHERE username = $1 LIMIT 1',
      [decodeURIComponent(username)]
    );

    if (!target.rowCount) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const targetId = target.rows[0].id as string;
    if (targetId === user.id) return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });

    const blocked = await db.query(
      'SELECT 1 FROM user_blocks WHERE (blocker_id=$1 AND blocked_id=$2) OR (blocker_id=$2 AND blocked_id=$1) LIMIT 1',
      [user.id, targetId]
    );
    if (Number(blocked.rowCount ?? 0) > 0) {
      return NextResponse.json({ error: 'Нельзя подписаться на заблокированного пользователя' }, { status: 403 });
    }

    const existing = await db.query(
      'SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = $2',
      [user.id, targetId]
    );

    if (existing.rowCount) {
      await db.query('DELETE FROM follows WHERE follower_id = $1 AND following_id = $2', [user.id, targetId]);
    } else {
      await db.query('INSERT INTO follows (follower_id, following_id) VALUES ($1, $2)', [user.id, targetId]);
      await db.query("INSERT INTO notifications (recipient_id, actor_id, type) VALUES ($1, $2, 'follow')", [targetId, user.id]);
    }

    const count = await db.query('SELECT count(*)::int AS count FROM follows WHERE following_id = $1', [targetId]);
    return NextResponse.json({ following: !existing.rowCount, count: count.rows[0].count });
  } catch (error) {
    console.error('follow', error);
    return NextResponse.json({ error: 'Failed to update follow' }, { status: 500 });
  }
}
