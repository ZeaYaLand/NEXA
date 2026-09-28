import { db } from '../db';

export type Visibility = 'public' | 'followers' | 'private';

export async function followUser(followerId: string, followingId: string) {
  if (followerId === followingId) throw new Error('SELF_FOLLOW_NOT_ALLOWED');
  await db.query(
    `INSERT INTO nexa_follows (follower_id, following_id)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    [followerId, followingId],
  );
}

export async function unfollowUser(followerId: string, followingId: string) {
  await db.query(
    'DELETE FROM nexa_follows WHERE follower_id = $1 AND following_id = $2',
    [followerId, followingId],
  );
}

export async function blockUser(blockerId: string, blockedId: string) {
  if (blockerId === blockedId) throw new Error('SELF_BLOCK_NOT_ALLOWED');
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `INSERT INTO nexa_blocks (blocker_id, blocked_id)
       VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [blockerId, blockedId],
    );
    await client.query(
      `DELETE FROM nexa_follows
       WHERE (follower_id = $1 AND following_id = $2)
          OR (follower_id = $2 AND following_id = $1)`,
      [blockerId, blockedId],
    );
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function getFollowCounts(userId: string) {
  const result = await db.query<{ followers: string; following: string }>(
    `SELECT
       (SELECT COUNT(*)::text FROM nexa_follows WHERE following_id = $1) AS followers,
       (SELECT COUNT(*)::text FROM nexa_follows WHERE follower_id = $1) AS following`,
    [userId],
  );
  return {
    followers: Number(result.rows[0]?.followers ?? 0),
    following: Number(result.rows[0]?.following ?? 0),
  };
}
