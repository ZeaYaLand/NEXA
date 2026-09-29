import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

async function isMember(conversationId: string, userId: string) {
  const r = await db.query(
    'SELECT 1 FROM conversation_members WHERE conversation_id=$1 AND user_id=$2 LIMIT 1',
    [conversationId, userId],
  );
  return !!r.rowCount;
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const conversationId = String(body.conversationId || '');
  const typing = Boolean(body.typing);
  if (!conversationId) return NextResponse.json({ error: 'conversationId is required' }, { status: 400 });
  if (!(await isMember(conversationId, user.id))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (typing) {
    await db.query(`INSERT INTO conversation_typing(conversation_id,user_id,updated_at) VALUES($1,$2,NOW()) ON CONFLICT(conversation_id,user_id) DO UPDATE SET updated_at=NOW()`, [conversationId, user.id]);
  } else {
    await db.query('DELETE FROM conversation_typing WHERE conversation_id=$1 AND user_id=$2', [conversationId, user.id]);
  }
  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const conversationId = new URL(req.url).searchParams.get('conversation');
  if (!conversationId) return NextResponse.json({ typing: [] });
  if (!(await isMember(conversationId, user.id))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const r = await db.query(`SELECT u.id,u.username,u.display_name AS "displayName" FROM conversation_typing t JOIN users u ON u.id=t.user_id WHERE t.conversation_id=$1 AND t.user_id<>$2 AND t.updated_at>NOW()-INTERVAL '4 seconds'`, [conversationId, user.id]);
  await db.query(`DELETE FROM conversation_typing WHERE conversation_id=$1 AND updated_at<=NOW()-INTERVAL '6 seconds'`, [conversationId]);
  return NextResponse.json({ typing: r.rows });
}