import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const result = await db.query(`SELECT n.id,n.type,n.created_at,n.read_at,u.username,u.display_name AS "displayName",n.post_id FROM notifications n JOIN users u ON u.id=n.actor_id WHERE n.recipient_id=$1 ORDER BY n.created_at DESC LIMIT 50`, [user.id]);
  const unread = await db.query('SELECT count(*)::int AS count FROM notifications WHERE recipient_id=$1 AND read_at IS NULL', [user.id]);
  return NextResponse.json({ notifications: result.rows, unread: unread.rows[0].count });
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  if (body.all) await db.query('UPDATE notifications SET read_at=now() WHERE recipient_id=$1 AND read_at IS NULL', [user.id]);
  else if (body.id) await db.query('UPDATE notifications SET read_at=now() WHERE id=$1 AND recipient_id=$2', [body.id, user.id]);
  return NextResponse.json({ ok: true });
}
