import { db } from '@/lib/db';
import { ensureNexaCoreSchema } from './runtime-schema';

export type NexaRankRow = {
  rank: number;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  score: number;
  posts7d: number;
  likes7d: number;
  comments7d: number;
  followers: number;
  uniqueCommenters7d: number;
  balance: number;
  crown: 'nexa' | 'elite' | 'crown' | null;
  crownEligible: boolean;
};

/**
 * NEXA Pulse is intentionally multi-signal: one viral post cannot dominate the table.
 * The balance multiplier rewards creators who generate more than one kind of activity.
 */
export async function calculateNexaRanking(limit = 50): Promise<NexaRankRow[]> {
  await ensureNexaCoreSchema();
  const safeLimit = Math.max(1, Math.min(100, Math.floor(limit)));
  const result = await db.query(`
    WITH activity AS (
      SELECT
        u.id AS user_id,
        u.username,
        u.display_name,
        u.avatar_url,
        COUNT(DISTINCT p.id)::int AS posts_7d,
        COALESCE((SELECT COUNT(*)::int FROM post_likes pl JOIN posts lp ON lp.id = pl.post_id WHERE lp.user_id = u.id AND pl.created_at >= NOW() - INTERVAL '7 days'), 0) AS likes_7d,
        COALESCE((SELECT COUNT(*)::int FROM comments cc JOIN posts cp ON cp.id = cc.post_id WHERE cp.user_id = u.id AND cc.created_at >= NOW() - INTERVAL '7 days'), 0) AS comments_7d,
        COALESCE((SELECT COUNT(*)::int FROM follows f WHERE f.following_id = u.id), 0) AS followers,
        COALESCE((SELECT COUNT(DISTINCT cc.author_id)::int FROM comments cc JOIN posts cp ON cp.id = cc.post_id WHERE cp.user_id = u.id AND cc.created_at >= NOW() - INTERVAL '7 days'), 0) AS unique_commenters_7d
      FROM users u
      LEFT JOIN posts p ON p.user_id = u.id AND p.created_at >= NOW() - INTERVAL '7 days'
      GROUP BY u.id, u.username, u.display_name, u.avatar_url
    ), scored AS (
      SELECT *,
        CASE
          WHEN GREATEST(likes_7d, comments_7d) = 0 THEN 0
          ELSE LEAST(1, LEAST(likes_7d, comments_7d)::numeric / GREATEST(likes_7d, comments_7d)::numeric)
        END AS balance,
        (
          posts_7d * 4.0 +
          likes_7d * 1.4 +
          comments_7d * 2.6 +
          followers * 0.8 +
          unique_commenters_7d * 3.0 +
          LEAST(posts_7d, 14) * 3.0 +
          LEAST(40, SQRT((likes_7d + comments_7d)::numeric) * 5.0)
        ) AS raw_score
      FROM activity
    )
    SELECT *,
      ROUND(raw_score * (1.0 + balance * 0.35), 4) AS score,
      ROW_NUMBER() OVER (ORDER BY raw_score * (1.0 + balance * 0.35) DESC, user_id) AS rank
    FROM scored
    ORDER BY score DESC, user_id
    LIMIT $1
  `, [safeLimit]);

  const rows = result.rows.map((r: any) => ({
    rank: Number(r.rank),
    userId: String(r.user_id),
    username: r.username,
    displayName: r.display_name,
    avatarUrl: r.avatar_url,
    score: Number(r.score),
    posts7d: Number(r.posts_7d),
    likes7d: Number(r.likes_7d),
    comments7d: Number(r.comments_7d),
    followers: Number(r.followers),
    uniqueCommenters7d: Number(r.unique_commenters_7d),
    balance: Number(r.balance),
    crown: null as NexaRankRow['crown'],
    crownEligible: false,
  }));

  for (const row of rows) {
    const eligible = row.rank <= 10 && row.posts7d >= 2 && row.likes7d + row.comments7d >= 5;
    row.crownEligible = eligible;
    if (eligible) row.crown = row.rank === 1 ? 'nexa' : row.rank <= 3 ? 'elite' : 'crown';
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN');
    await client.query(`UPDATE nexa_crowns SET revoked_at = NOW() WHERE revoked_at IS NULL`);
    for (const row of rows) {
      await client.query(`
        INSERT INTO nexa_score_snapshots (user_id, period, score, rank, measured_at)
        VALUES ($1, 'rolling_7d', $2, $3, NOW())
        ON CONFLICT (user_id, period)
        DO UPDATE SET score = EXCLUDED.score, rank = EXCLUDED.rank, measured_at = EXCLUDED.measured_at
      `, [row.userId, row.score, row.rank]);
      if (row.crown) {
        await client.query(`INSERT INTO nexa_crowns (user_id, level) VALUES ($1, $2)`, [row.userId, row.crown]);
      }
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  return rows;
}
