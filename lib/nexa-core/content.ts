import { db } from '../db';
import type { Visibility } from './social';

export async function createPost(
  authorId: string,
  content: string,
  visibility: Visibility = 'public',
  media: Array<{ url: string; type: string }> = [],
) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const post = await client.query<{ id: string }>(
      `INSERT INTO nexa_posts (author_id, content, visibility)
       VALUES ($1, $2, $3) RETURNING id`,
      [authorId, content.trim(), visibility],
    );

    for (const [position, item] of media.entries()) {
      await client.query(
        `INSERT INTO nexa_post_media (post_id, media_url, media_type, position)
         VALUES ($1, $2, $3, $4)`,
        [post.rows[0].id, item.url, item.type, position],
      );
    }
    await client.query('COMMIT');
    return post.rows[0].id;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function deletePost(postId: string, authorId: string) {
  const result = await db.query(
    'DELETE FROM nexa_posts WHERE id = $1 AND author_id = $2',
    [postId, authorId],
  );
  return result.rowCount === 1;
}

export async function toggleSave(postId: string, userId: string) {
  const existing = await db.query(
    'SELECT 1 FROM nexa_saves WHERE post_id = $1 AND user_id = $2',
    [postId, userId],
  );
  if (existing.rowCount) {
    await db.query('DELETE FROM nexa_saves WHERE post_id = $1 AND user_id = $2', [postId, userId]);
    return false;
  }
  await db.query('INSERT INTO nexa_saves (post_id, user_id) VALUES ($1, $2)', [postId, userId]);
  return true;
}

export async function addComment(postId: string, authorId: string, content: string, parentId?: string) {
  const result = await db.query<{ id: string }>(
    `INSERT INTO nexa_comments (post_id, author_id, content, parent_id)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [postId, authorId, content.trim(), parentId ?? null],
  );
  return result.rows[0].id;
}
