import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const result = await db.query(`
      SELECT n.id,n.type,n.created_at,n.read_at,u.username,u.display_name AS "displayName",n.post_id
      FROM notifications n
      JOIN users u ON u.id=n.actor_id
      WHERE n.recipient_id=$1
      ORDER BY n.created_at DESC LIMIT 50`, [user.id]);
    const unread = await db.query('SELECT count(*)::int AS count FROM notifications WHERE recipient_id=$1 AND read_at IS NULL', [user.id]);
    return NextResponse.json({ notifications: result.rows, unread: unread.rows[0].count });
  } catch (error) {
    console.error('GET notifications', error);
    return NextResponse.json({ error: 'Failed to load notifications' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    if (body.all === true) {
      await db.query('UPDATE notifications SET read_at=now() WHERE recipient_id=$1 AND read_at IS NULL', [user.id]);
    } else if (typeof body.id === 'string' || typeof body.id === 'number') {
      await db.query('UPDATE notifications SET read_at=now() WHERE id=$1 AND recipient_id=$2', [body.id, user.id]);
    } else {
      return NextResponse.json({ error: 'Provide all=true or a notification id' }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('PATCH notifications', error);
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
  }
}
