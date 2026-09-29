import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(_: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { username } = await params;
  const target = await db.query('SELECT id FROM users WHERE lower(username)=lower($1) LIMIT 1', [username]);
  if (!target.rows[0]) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  const targetId = target.rows[0].id;
  const blocks = await db.query(
    'SELECT blocker_id FROM nexa_blocks WHERE (blocker_id=$1 AND blocked_id=$2) OR (blocker_id=$2 AND blocked_id=$1)',
    [user.id, targetId]
  );
  const blockedByMe = blocks.rows.some(row => row.blocker_id === user.id);
  const blockedByThem = blocks.rows.some(row => row.blocker_id === targetId);
  return NextResponse.json({ blocked: blockedByMe, blockedByMe, blockedByThem, interactionBlocked: blockedByMe || blockedByThem });
}

export async function POST(_: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { username } = await params;
  const target = await db.query('SELECT id FROM users WHERE lower(username)=lower($1) LIMIT 1', [username]);
  if (!target.rows[0]) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  const targetId = target.rows[0].id;
  if (targetId === user.id) return NextResponse.json({ error: 'Cannot block yourself' }, { status: 400 });
  await db.query('INSERT INTO nexa_blocks(blocker_id,blocked_id) VALUES($1,$2) ON CONFLICT DO NOTHING', [user.id, targetId]);
  await db.query('DELETE FROM nexa_follows WHERE (follower_id=$1 AND following_id=$2) OR (follower_id=$2 AND following_id=$1)', [user.id, targetId]);
  return NextResponse.json({ blocked: true, blockedByMe: true, blockedByThem: false, interactionBlocked: true });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { username } = await params;
  const target = await db.query('SELECT id FROM users WHERE lower(username)=lower($1) LIMIT 1', [username]);
  if (!target.rows[0]) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  const targetId = target.rows[0].id;
  await db.query('DELETE FROM nexa_blocks WHERE blocker_id=$1 AND blocked_id=$2', [user.id, targetId]);
  return NextResponse.json({ blocked: false, blockedByMe: false, blockedByThem: false, interactionBlocked: false });
}
