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
  const conversationId = new URL(req.url).searchParams.get('conversation');
  const username = new URL(req.url).searchParams.get('username');
  if (username) {
    const r = await db.query(`SELECT id, username, last_seen_at, (last_seen_at IS NOT NULL AND last_seen_at > NOW()-INTERVAL '45 seconds') AS online FROM users WHERE lower(username)=lower($1) LIMIT 1`, [username]);
    if (!r.rowCount) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    return NextResponse.json({ presence: r.rows[0] });
  }
  if (!conversationId) return NextResponse.json({ presence: [] });
  const r = await db.query(`SELECT u.id,u.username,u.display_name AS "displayName",u.last_seen_at,(u.last_seen_at IS NOT NULL AND u.last_seen_at > NOW()-INTERVAL '45 seconds') AS online FROM conversation_members cm JOIN users u ON u.id=cm.user_id WHERE cm.conversation_id=$1 AND u.id<>$2`, [conversationId,user.id]);
  return NextResponse.json({ presence: r.rows });
}
