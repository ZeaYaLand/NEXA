import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

type Params = { params: Promise<{ conversationId: string }> };

async function ensureSchema() {
  await db.query(`
    ALTER TABLE messages
      ADD COLUMN IF NOT EXISTS reply_to_message_id TEXT,
      ADD COLUMN IF NOT EXISTS forwarded_from_message_id TEXT,
      ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS deleted_for_all BOOLEAN NOT NULL DEFAULT false;

    CREATE TABLE IF NOT EXISTS message_reactions (
      message_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      reaction TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (message_id, user_id, reaction)
    );

    CREATE TABLE IF NOT EXISTS pinned_messages (
      conversation_id TEXT NOT NULL,
      message_id TEXT NOT NULL,
      pinned_by TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (conversation_id, message_id)
    );

    CREATE TABLE IF NOT EXISTS message_reports (
      id BIGSERIAL PRIMARY KEY,
      message_id TEXT NOT NULL,
      conversation_id TEXT NOT NULL,
      reporter_id TEXT NOT NULL,
      reason TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_message_reactions_message ON message_reactions(message_id);
    CREATE INDEX IF NOT EXISTS idx_pinned_messages_conversation ON pinned_messages(conversation_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_message_reports_message ON message_reports(message_id);
  `);
}

async function member(conversationId: string, userId: string) {
  const r = await db.query(
    'SELECT role FROM conversation_members WHERE conversation_id=$1 AND user_id=$2 LIMIT 1',
    [conversationId, userId]
  );
  return r.rows[0] as { role?: string } | undefined;
}

async function blockedByDirectMember(conversationId: string, userId: string) {
  const r = await db.query(
    `SELECT 1 FROM conversations c
     JOIN conversation_members other ON other.conversation_id=c.id AND other.user_id<>$2
     JOIN nexa_blocks b ON (b.blocker_id=$2 AND b.blocked_id=other.user_id)
                         OR (b.blocker_id=other.user_id AND b.blocked_id=$2)
     WHERE c.id=$1 AND c.type='direct' LIMIT 1`,
    [conversationId, userId]
  );
  return !!r.rowCount;
}

async function messageInConversation(messageId: string, conversationId: string) {
  const r = await db.query(
    `SELECT id, conversation_id, sender_id, content, media_url, media_type,
            file_name, file_size, mime_type, media_duration_seconds,
            created_at, edited_at, deleted_at, deleted_for_all,
            reply_to_message_id, forwarded_from_message_id
     FROM messages WHERE id=$1 AND conversation_id=$2 LIMIT 1`,
    [messageId, conversationId]
  );
  return r.rows[0];
}

function jsonError(error: unknown, fallback: string) {
  console.error(fallback, error);
  return NextResponse.json({ error: fallback }, { status: 500 });
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await ensureSchema();
    const { conversationId } = await params;
    const m = await member(conversationId, user.id);
    if (!m) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    if (await blockedByDirectMember(conversationId, user.id)) return NextResponse.json({ error: 'Пользователь заблокирован' }, { status: 403 });

    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'pinned';

    if (action === 'reactions') {
      const messageId = url.searchParams.get('messageId');
      if (!messageId || !(await messageInConversation(messageId, conversationId))) {
        return NextResponse.json({ error: 'Message not found' }, { status: 404 });
      }
      const r = await db.query(
        `SELECT reaction, COUNT(*)::int AS count,
                BOOL_OR(user_id=$2) AS mine
         FROM message_reactions WHERE message_id=$1
         GROUP BY reaction ORDER BY count DESC, reaction`,
        [messageId, user.id]
      );
      return NextResponse.json({ reactions: r.rows });
    }

    if (action === 'pinned') {
      const r = await db.query(
        `SELECT p.message_id,p.pinned_by,p.created_at,m.content,m.sender_id,m.created_at AS message_created_at
         FROM pinned_messages p JOIN messages m ON m.id=p.message_id
         WHERE p.conversation_id=$1 ORDER BY p.created_at DESC LIMIT 100`,
        [conversationId]
      );
      return NextResponse.json({ pinned: r.rows });
    }

    if (action === 'search') {
      const q = (url.searchParams.get('q') || '').trim();
      if (!q) return NextResponse.json({ messages: [] });
      const r = await db.query(
        `SELECT id,content,created_at,sender_id,file_name,media_type
         FROM messages
         WHERE conversation_id=$1 AND deleted_for_all=false
           AND content ILIKE $2
         ORDER BY created_at DESC LIMIT 100`,
        [conversationId, `%${q}%`]
      );
      return NextResponse.json({ messages: r.rows });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return jsonError(error, 'Не удалось загрузить данные сообщений');
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await ensureSchema();
    const { conversationId } = await params;
    const m = await member(conversationId, user.id);
    if (!m) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    if (await blockedByDirectMember(conversationId, user.id)) return NextResponse.json({ error: 'Пользователь заблокирован' }, { status: 403 });

    let body: Record<string, unknown>;
    try { body = await req.json(); } catch { return NextResponse.json({ error: 'Некорректные данные' }, { status: 400 }); }

    const action = String(body.action || '');
    const messageId = String(body.messageId || '');
    const message = messageId ? await messageInConversation(messageId, conversationId) : null;

    if (!message && ['react','reply','forward','pin','unpin','edit','delete_for_all','report'].includes(action)) {
      return NextResponse.json({ error: 'Сообщение не найдено' }, { status: 404 });
    }

    if (action === 'react') {
      const reaction = String(body.reaction || '').trim().slice(0, 32);
      if (!reaction) return NextResponse.json({ error: 'Реакция не указана' }, { status: 400 });
      const exists = await db.query(
        'SELECT 1 FROM message_reactions WHERE message_id=$1 AND user_id=$2 AND reaction=$3',
        [messageId, user.id, reaction]
      );
      if (exists.rowCount) {
        await db.query('DELETE FROM message_reactions WHERE message_id=$1 AND user_id=$2 AND reaction=$3', [messageId,user.id,reaction]);
        return NextResponse.json({ ok:true, active:false, reaction });
      }
      await db.query('INSERT INTO message_reactions(message_id,user_id,reaction) VALUES($1,$2,$3) ON CONFLICT DO NOTHING', [messageId,user.id,reaction]);
      return NextResponse.json({ ok:true, active:true, reaction });
    }

    if (action === 'reply') {
      const content = String(body.content || '').trim();
      if (!content) return NextResponse.json({ error: 'Ответ пустой' }, { status: 400 });
      if (content.length > 5000) return NextResponse.json({ error: 'Ответ слишком длинный' }, { status: 400 });
      const r = await db.query(
        `INSERT INTO messages(conversation_id,sender_id,content,reply_to_message_id)
         VALUES($1,$2,$3,$4)
         RETURNING id,content,created_at,sender_id,reply_to_message_id`,
        [conversationId,user.id,content,messageId]
      );
      return NextResponse.json({ message:r.rows[0] }, { status:201 });
    }

    if (action === 'forward') {
      const targetConversationId = String(body.targetConversationId || '');
      if (!targetConversationId) return NextResponse.json({ error:'Чат для пересылки не указан' }, { status:400 });
      const targetMember = await member(targetConversationId,user.id);
      if (!targetMember) return NextResponse.json({ error:'Нет доступа к чату назначения' }, { status:403 });
      const r = await db.query(
        `INSERT INTO messages(conversation_id,sender_id,content,media_url,media_type,file_name,file_size,mime_type,media_duration_seconds,forwarded_from_message_id)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         RETURNING id,content,created_at,sender_id,media_url,media_type,file_name,file_size,mime_type,media_duration_seconds,forwarded_from_message_id`,
        [targetConversationId,user.id,message.content,message.media_url,message.media_type,message.file_name,message.file_size,message.mime_type,message.media_duration_seconds,messageId]
      );
      return NextResponse.json({ message:r.rows[0] }, { status:201 });
    }

    if (action === 'pin' || action === 'unpin') {
      if (!['owner','admin'].includes(String(m.role))) return NextResponse.json({ error:'Только администратор может закреплять сообщения' }, { status:403 });
      if (action === 'pin') {
        await db.query('INSERT INTO pinned_messages(conversation_id,message_id,pinned_by) VALUES($1,$2,$3) ON CONFLICT DO NOTHING',[conversationId,messageId,user.id]);
      } else {
        await db.query('DELETE FROM pinned_messages WHERE conversation_id=$1 AND message_id=$2',[conversationId,messageId]);
      }
      return NextResponse.json({ ok:true, pinned:action==='pin' });
    }

    if (action === 'edit') {
      if (message!.sender_id !== user.id) return NextResponse.json({ error:'Можно изменять только свои сообщения' }, { status:403 });
      const content = String(body.content || '').trim();
      if (!content) return NextResponse.json({ error:'Сообщение пустое' }, { status:400 });
      if (content.length > 5000) return NextResponse.json({ error:'Сообщение слишком длинное' }, { status:400 });
      const r = await db.query('UPDATE messages SET content=$1,edited_at=NOW() WHERE id=$2 AND conversation_id=$3 RETURNING id,content,edited_at',[content,messageId,conversationId]);
      return NextResponse.json({ message:r.rows[0] });
    }

    if (action === 'delete_for_all') {
      if (message!.sender_id !== user.id && !['owner','admin'].includes(String(m.role))) return NextResponse.json({ error:'Нет прав на удаление' }, { status:403 });
      const r = await db.query(
        `UPDATE messages SET content='Сообщение удалено',media_url=NULL,media_type=NULL,file_name=NULL,file_size=NULL,mime_type=NULL,media_duration_seconds=NULL,deleted_at=NOW(),deleted_for_all=true
         WHERE id=$1 AND conversation_id=$2 RETURNING id,content,deleted_for_all`,
        [messageId,conversationId]
      );
      return NextResponse.json({ message:r.rows[0] });
    }

    if (action === 'report') {
      const reason = String(body.reason || 'other').trim().slice(0,120);
      await db.query('INSERT INTO message_reports(message_id,conversation_id,reporter_id,reason) VALUES($1,$2,$3,$4)',[messageId,conversationId,user.id,reason]);
      return NextResponse.json({ ok:true });
    }

    return NextResponse.json({ error:'Неизвестное действие' }, { status:400 });
  } catch (error) {
    return jsonError(error, 'Не удалось выполнить действие с сообщением');
  }
}
