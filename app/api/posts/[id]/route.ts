import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await context.params;
  if (!id) return NextResponse.json({ error: 'Post id is required' }, { status: 400 });

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    const post = await client.query<{ user_id: string }>(
      'SELECT user_id FROM posts WHERE id=$1 FOR UPDATE',
      [id],
    );
    if (!post.rowCount) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    if (post.rows[0].user_id !== user.id) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await client.query('DELETE FROM post_likes WHERE post_id=$1', [id]);
    await client.query('DELETE FROM comments WHERE post_id=$1', [id]);
    await client.query('DELETE FROM posts WHERE id=$1 AND user_id=$2', [id, user.id]);

    await client.query('COMMIT');
    return NextResponse.json({ ok: true, deletedPostId: id });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('DELETE /api/posts/[id]', error);
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  } finally {
    client.release();
  }
}
