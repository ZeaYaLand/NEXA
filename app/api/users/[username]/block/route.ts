import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(_: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { username } = await params;
  const target = await db.query('SELECT id FROM users WHERE username=$1 LIMIT 1', [username.toLowerCase()]);
  if (!target.rows[0]) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  const block = await db.query('SELECT 1 FROM user_blocks WHERE blocker_id=$1 AND blocked_id=$2 LIMIT 1', [user.id, target.rows[0].id]);
  return NextResponse.json({ blocked: block.rowCount > 0 });
}

export async function POST(_: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { username } = await params;
  const target = await db.query('SELECT id FROM users WHERE username=$1 LIMIT 1', [username.toLowerCase()]);
  if (!target.rows[0]) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  if (target.rows[0].id === user.id) return NextResponse.json({ error: 'Cannot block yourself' }, { status: 400 });
  await db.query('INSERT INTO user_blocks(blocker_id,blocked_id) VALUES($1,$2) ON CONFLICT DO NOTHING', [user.id, target.rows[0].id]);
  await db.query('DELETE FROM follows WHERE follower_id=$1 AND following_id=$2', [user.id, target.rows[0].id]);
  await db.query('DELETE FROM follows WHERE follower_id=$1 AND following_id=$2', [target.rows[0].id, user.id]);
  return NextResponse.json({ blocked: true });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { username } = await params;
  const target = await db.query('SELECT id FROM users WHERE username=$1 LIMIT 1', [username.toLowerCase()]);
  if (!target.rows[0]) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  await db.query('DELETE FROM user_blocks WHERE blocker_id=$1 AND blocked_id=$2', [user.id, target.rows[0].id]);
  return NextResponse.json({ blocked: false });
}
