import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

const ONLINE_MS = 45_000;

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await db.query('UPDATE users SET last_seen_at=NOW(), updated_at=NOW() WHERE id=$1', [user.id]);
  return NextResponse.json({ ok: true, online: true });
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const url = new URL(req.url);
  const conversationId = url.searchParams.get('conversation');
  const username = url.searchParams.get('username');
  if (username) {
    const r = await db.query(`SELECT id, username, last_seen_at, (last_seen_at IS NOT NULL AND last_seen_at > NOW()-INTERVAL '45 seconds') AS online FROM users WHERE lower(username)=lower($1) LIMIT 1`, [username]);
    if (!r.rowCount) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    const targetId = r.rows[0].id;
    if (targetId !== user.id) {
      const blocked = await db.query('SELECT 1 FROM nexa_blocks WHERE (blocker_id=$1 AND blocked_id=$2) OR (blocker_id=$2 AND blocked_id=$1) LIMIT 1', [user.id, targetId]);
      if (blocked.rowCount) return NextResponse.json({ error: 'Not available' }, { status: 403 });
    }
    return NextResponse.json({ presence: r.rows[0] });
  }
  if (!conversationId) return NextResponse.json({ presence: [] });
  const member = await db.query('SELECT 1 FROM conversation_members WHERE conversation_id=$1 AND user_id=$2 LIMIT 1', [conversationId, user.id]);
  if (!member.rowCount) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const r = await db.query(`SELECT u.id,u.username,u.display_name AS "displayName",u.last_seen_at,(u.last_seen_at IS NOT NULL AND u.last_seen_at > NOW()-INTERVAL '45 seconds') AS online FROM conversation_members cm JOIN users u ON u.id=cm.user_id WHERE cm.conversation_id=$1 AND u.id<>$2 AND NOT EXISTS (SELECT 1 FROM nexa_blocks b WHERE (b.blocker_id=$2 AND b.blocked_id=u.id) OR (b.blocker_id=u.id AND b.blocked_id=$2))`, [conversationId,user.id]);
  return NextResponse.json({ presence: r.rows });
}
