import { db } from '../db';

export type FeedCursor = { createdAt: string; id: string };

export async function getPublicFeed(limit = 20, cursor?: FeedCursor) {
  const safeLimit = Math.min(Math.max(limit, 1), 50);
  const params: unknown[] = [];
  let where = `p.visibility = 'public'`;
  if (cursor) {
    params.push(cursor.createdAt, cursor.id);
    where += ` AND (p.created_at, p.id) < ($1::timestamptz, $2::uuid)`;
  }
  params.push(safeLimit);

  const result = await db.query(
    `SELECT p.id, p.author_id, p.content, p.visibility, p.created_at, p.updated_at,
            COALESCE(json_agg(json_build_object('url', m.media_url, 'type', m.media_type, 'position', m.position)
              ORDER BY m.position) FILTER (WHERE m.id IS NOT NULL), '[]') AS media
       FROM nexa_posts p
       LEFT JOIN nexa_post_media m ON m.post_id = p.id
      WHERE ${where}
      GROUP BY p.id
      ORDER BY p.created_at DESC, p.id DESC
      LIMIT $${params.length}`,
    params,
  );

  const rows = result.rows;
  const last = rows.at(-1);
  return {
    items: rows,
    nextCursor: last ? { createdAt: last.created_at, id: last.id } : null,
  };
}
