import { db } from '../db';
import type { Visibility } from './social';

export async function canViewUserContent(viewerId: string | null, ownerId: string, visibility: Visibility) {
  if (viewerId === ownerId) return true;
  if (visibility === 'public') return true;
  if (!viewerId) return false;

  const blocked = await db.query(
    `SELECT 1 FROM nexa_blocks
     WHERE (blocker_id = $1 AND blocked_id = $2)
        OR (blocker_id = $2 AND blocked_id = $1)
     LIMIT 1`,
    [viewerId, ownerId],
  );
  if (blocked.rowCount) return false;

  if (visibility === 'private') return false;

  const follow = await db.query(
    `SELECT 1 FROM nexa_follows WHERE follower_id = $1 AND following_id = $2 LIMIT 1`,
    [viewerId, ownerId],
  );
  return Boolean(follow.rowCount);
}
