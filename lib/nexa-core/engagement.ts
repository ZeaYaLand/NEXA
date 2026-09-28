import { db } from '../db';

export async function setReaction(postId: string, userId: string, reaction: string) {
  await db.query(
    `DELETE FROM nexa_reactions WHERE post_id = $1 AND user_id = $2;
     INSERT INTO nexa_reactions (post_id, user_id, reaction) VALUES ($1, $2, $3);`,
    [postId, userId, reaction],
  );
}

export async function removeReaction(postId: string, userId: string) {
  await db.query('DELETE FROM nexa_reactions WHERE post_id = $1 AND user_id = $2', [postId, userId]);
}

export async function sharePost(postId: string, userId: string) {
  const result = await db.query<{ id: string }>(
    `INSERT INTO nexa_shares (post_id, user_id) VALUES ($1, $2) RETURNING id`,
    [postId, userId],
  );
  return result.rows[0].id;
}

export async function notifyUser(
  userId: string,
  type: string,
  actorId?: string,
  entityId?: string,
  payload: Record<string, unknown> = {},
) {
  await db.query(
    `INSERT INTO nexa_notifications (user_id, actor_id, type, entity_id, payload)
     VALUES ($1, $2, $3, $4, $5::jsonb)`,
    [userId, actorId ?? null, type, entityId ?? null, JSON.stringify(payload)],
  );
}

export async function markNotificationRead(notificationId: string, userId: string) {
  const result = await db.query(
    `UPDATE nexa_notifications SET read_at = now()
     WHERE id = $1 AND user_id = $2`,
    [notificationId, userId],
  );
  return result.rowCount === 1;
}
