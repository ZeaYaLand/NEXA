import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

type ConversationRow = {
  id: string;
  type: string;
  title: string | null;
  username: string | null;
  description: string | null;
  avatar_url: string | null;
  is_public: boolean;
  created_at: string;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number | string | null;
  members: unknown[];
};

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const r = await db.query<ConversationRow>(`
    SELECT c.id,c.type,c.title,c.username,c.description,c.avatar_url,c.is_public,c.created_at,
      latest.content AS last_message,latest.created_at AS last_message_at,
      COALESCE(unread.unread_count,0)::int AS unread_count,
      json_agg(json_build_object('id',u.id,'username',u.username,'displayName',u.display_name,'avatarUrl',u.avatar_url,'role',cm.role,'status',cm.status)) AS members
    FROM conversations c
    JOIN conversation_members cm ON cm.conversation_id=c.id
    JOIN users u ON u.id=cm.user_id
    LEFT JOIN LATERAL (
      SELECT m.content,m.created_at FROM messages m
      WHERE m.conversation_id=c.id ORDER BY m.created_at DESC LIMIT 1
    ) latest ON true
    LEFT JOIN LATERAL (
      SELECT count(*) AS unread_count FROM messages m
      WHERE m.conversation_id=c.id AND m.sender_id<>$1
        AND (cm.last_read_at IS NULL OR m.created_at>cm.last_read_at)
    ) unread ON true
    WHERE c.id IN (SELECT conversation_id FROM conversation_members WHERE user_id=$1)
    GROUP BY c.id,latest.content,latest.created_at,unread.unread_count
    ORDER BY COALESCE(latest.created_at,c.created_at) DESC
  `, [user.id]);

  const unreadTotal = r.rows.reduce((n: number, c: ConversationRow) => n + Number(c.unread_count || 0), 0);
  return NextResponse.json({ conversations: r.rows, unreadTotal });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const b = await req.json();
  const target = String(b.userId || '');
  if (!target || target === user.id) {
    return NextResponse.json({ error: 'Invalid user' }, { status: 400 });
  }

  const blocked = await db.query(
    `SELECT 1 FROM nexa_blocks
     WHERE (blocker_id=$1 AND blocked_id=$2)
        OR (blocker_id=$2 AND blocked_id=$1)
     LIMIT 1`,
    [user.id, target],
  );
  if (blocked.rowCount) {
    return NextResponse.json({ error: 'Пользователь заблокирован' }, { status: 403 });
  }

  const found = await db.query(`
    SELECT c.id FROM conversations c
    JOIN conversation_members a ON a.conversation_id=c.id AND a.user_id=$1
    JOIN conversation_members b ON b.conversation_id=c.id AND b.user_id=$2
    WHERE c.type='direct'
      AND (SELECT count(*) FROM conversation_members x WHERE x.conversation_id=c.id)=2
    LIMIT 1
  `, [user.id, target]);

  let id = found.rows[0]?.id;
  if (!id) {
    const c = await db.query("INSERT INTO conversations(type) VALUES('direct') RETURNING id");
    id = c.rows[0].id;
    await db.query(
      `INSERT INTO conversation_members(conversation_id,user_id,role,status)
       VALUES($1,$2,'member','active'),($1,$3,'member','active')`,
      [id, user.id, target],
    );
  }

  return NextResponse.json({ conversationId: id });
}
