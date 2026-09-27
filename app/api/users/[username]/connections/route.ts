import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const type = new URL(request.url).searchParams.get('type') === 'following' ? 'following' : 'followers';
  try {
    const user = await db.query('SELECT id FROM users WHERE lower(username)=lower($1) LIMIT 1', [username]);
    if (!user.rowCount) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    const id = user.rows[0].id;
    const sql = type === 'followers'
      ? `SELECT u.id,u.username,u.display_name AS "displayName",u.avatar_url AS "avatarUrl" FROM follows f JOIN users u ON u.id=f.follower_id WHERE f.following_id=$1 ORDER BY u.username`
      : `SELECT u.id,u.username,u.display_name AS "displayName",u.avatar_url AS "avatarUrl" FROM follows f JOIN users u ON u.id=f.following_id WHERE f.follower_id=$1 ORDER BY u.username`;
    const result = await db.query(sql, [id]);
    return NextResponse.json({ type, users: result.rows });
  } catch (error) {
    console.error('connections', error);
    return NextResponse.json({ error: 'Failed to load connections' }, { status: 500 });
  }
}
