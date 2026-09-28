import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { ensureSocialMediaSchema } from '@/lib/social-media-schema';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await ensureSocialMediaSchema();
    const { id } = await params;
    const result = await db.query(`SELECT c.id,c.content,c.created_at,c.user_id,u.username FROM media_comments c JOIN users u ON u.id=c.user_id WHERE c.media_id=$1 ORDER BY c.created_at ASC LIMIT 200`, [id]);
    return NextResponse.json({ comments: result.rows });
  } catch (error) {
    console.error('GET media comments', error);
    return NextResponse.json({ error: 'Не удалось загрузить комментарии' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await ensureSocialMediaSchema();
    const { id } = await params;
    const body = await req.json();
    const content = String(body.content || '').trim().slice(0, 1000);
    if (!content) return NextResponse.json({ error: 'Комментарий пустой' }, { status: 400 });
    const media = await db.query('SELECT id FROM media_items WHERE id=$1', [id]);
    if (!media.rowCount) return NextResponse.json({ error: 'Медиа не найдено' }, { status: 404 });
    const commentId = crypto.randomUUID();
    const result = await db.query(`INSERT INTO media_comments(id,media_id,user_id,content) VALUES($1,$2,$3,$4) RETURNING id,content,created_at`, [commentId,id,user.id,content]);
    await db.query('UPDATE media_items SET comment_count=comment_count+1 WHERE id=$1', [id]);
    return NextResponse.json({ comment: { ...result.rows[0], user_id: user.id, username: user.username } }, { status: 201 });
  } catch (error) {
    console.error('POST media comments', error);
    return NextResponse.json({ error: 'Не удалось добавить комментарий' }, { status: 500 });
  }
}
