import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

type Params = { params: Promise<{ conversationId: string }> };

function mediaViewUrl(value: unknown) {
  if (typeof value !== 'string' || !value) return value ?? null;
  if (!value.startsWith('messages/')) return value;
  return `/api/media/presign?key=${encodeURIComponent(value)}`;
}

async function blockedByDirectMember(conversationId: string, userId: string) {
  const r = await db.query(
    `SELECT 1 FROM conversations c
     JOIN conversation_members other ON other.conversation_id=c.id AND other.user_id<>$2
     JOIN user_blocks b ON (b.blocker_id=$2 AND b.blocked_id=other.user_id)
                         OR (b.blocker_id=other.user_id AND b.blocked_id=$2)
     WHERE c.id=$1 AND c.type='direct' LIMIT 1`,
    [conversationId, userId]
  );
  return !!r.rowCount;
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { conversationId } = await params;
    await db.query('ALTER TABLE conversation_members ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMPTZ');
    const member = await db.query('SELECT 1 FROM conversation_members WHERE conversation_id=$1 AND user_id=$2', [conversationId, user.id]);
    if (!member.rowCount) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    if (await blockedByDirectMember(conversationId, user.id)) return NextResponse.json({ error: 'Пользователь заблокирован' }, { status: 403 });
    const r = await db.query(`SELECT m.id,m.content,m.created_at,m.sender_id,m.media_url,m.media_type,m.file_name,m.file_size,m.mime_type,m.media_duration_seconds,u.username,u.display_name AS "displayName" FROM messages m JOIN users u ON u.id=m.sender_id WHERE m.conversation_id=$1 ORDER BY m.created_at ASC LIMIT 200`, [conversationId]);
    await db.query('UPDATE conversation_members SET last_read_at=NOW() WHERE conversation_id=$1 AND user_id=$2', [conversationId, user.id]);
    return NextResponse.json({ messages: r.rows.map(m => ({ ...m, media_url: mediaViewUrl(m.media_url) })) });
  } catch (error) {
    console.error('GET conversation messages error:', error);
    return NextResponse.json({ error: 'Не удалось загрузить сообщения' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { conversationId } = await params;
    await db.query('ALTER TABLE conversation_members ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMPTZ');
    const member = await db.query('SELECT 1 FROM conversation_members WHERE conversation_id=$1 AND user_id=$2', [conversationId, user.id]);
    if (!member.rowCount) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    if (await blockedByDirectMember(conversationId, user.id)) return NextResponse.json({ error: 'Пользователь заблокирован' }, { status: 403 });

    let b: Record<string, unknown>;
    try { b = await req.json(); } catch { return NextResponse.json({ error: 'Некорректные данные сообщения' }, { status: 400 }); }

    const content = String(b.content || '').trim();
    const mediaUrl = b.mediaUrl ? String(b.mediaUrl) : null;
    const mediaType = b.mediaType ? String(b.mediaType) : null;
    const fileName = b.fileName ? String(b.fileName) : null;
    const fileSize = b.fileSize == null ? null : Number(b.fileSize);
    const mimeType = b.mimeType ? String(b.mimeType) : null;
    const mediaDuration = b.mediaDuration == null ? null : Number(b.mediaDuration);

    if (!content && !mediaUrl) return NextResponse.json({ error: 'Сообщение пустое' }, { status: 400 });
    if (content.length > 5000) return NextResponse.json({ error: 'Сообщение слишком длинное' }, { status: 400 });
    if (mediaUrl && !mediaUrl.startsWith(`messages/${conversationId}/${user.id}/`)) return NextResponse.json({ error: 'Некорректный файл' }, { status: 400 });
    if (fileSize !== null && (!Number.isFinite(fileSize) || fileSize <= 0 || fileSize > 50 * 1024 * 1024)) return NextResponse.json({ error: 'Некорректный размер файла' }, { status: 400 });

    const r = await db.query(`INSERT INTO messages(conversation_id,sender_id,content,media_url,media_type,file_name,file_size,mime_type,media_duration_seconds) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id,content,created_at,sender_id,media_url,media_type,file_name,file_size,mime_type,media_duration_seconds`, [conversationId, user.id, content || ' ', mediaUrl, mediaType, fileName, fileSize, mimeType, mediaDuration]);
    const row = r.rows[0];
    return NextResponse.json({ message: { ...row, media_url: mediaViewUrl(row.media_url), username: user.username, displayName: user.displayName } }, { status: 201 });
  } catch (error) {
    console.error('POST conversation message error:', error);
    return NextResponse.json({ error: 'Не удалось отправить сообщение' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { conversationId } = await params;
    const member = await db.query('SELECT 1 FROM conversation_members WHERE conversation_id=$1 AND user_id=$2', [conversationId, user.id]);
    if (!member.rowCount) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const id = new URL(req.url).searchParams.get('messageId');
    if (!id) return NextResponse.json({ error: 'messageId is required' }, { status: 400 });
    const r = await db.query('DELETE FROM messages WHERE id=$1 AND conversation_id=$2 AND sender_id=$3 RETURNING id', [id, conversationId, user.id]);
    if (!r.rowCount) return NextResponse.json({ error: 'Message not found or not yours' }, { status: 404 });
    return NextResponse.json({ ok: true, id });
  } catch (error) {
    console.error('DELETE conversation message error:', error);
    return NextResponse.json({ error: 'Не удалось удалить сообщение' }, { status: 500 });
  }
}
