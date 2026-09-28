import { db } from '@/lib/db';

let ready: Promise<void> | null = null;

/** Runtime schema for NEXA's own ranking/crown layer. Safe to call repeatedly. */
export function ensureNexaCoreSchema(): Promise<void> {
  if (ready) return ready;
  ready = db.query(`
    CREATE EXTENSION IF NOT EXISTS pgcrypto;

    CREATE TABLE IF NOT EXISTS nexa_score_snapshots (
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      period TEXT NOT NULL,
      score NUMERIC(14,4) NOT NULL DEFAULT 0,
      rank INTEGER,
      measured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (user_id, period)
    );
    CREATE INDEX IF NOT EXISTS nexa_score_rank_idx ON nexa_score_snapshots(period, rank) WHERE rank IS NOT NULL;

    CREATE TABLE IF NOT EXISTS nexa_crowns (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      level TEXT NOT NULL CHECK (level IN ('candidate','crown','elite','nexa')),
      awarded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      revoked_at TIMESTAMPTZ
    );
    CREATE INDEX IF NOT EXISTS nexa_crowns_user_idx ON nexa_crowns(user_id, awarded_at DESC);
  `).then(() => undefined).catch(error => {
    ready = null;
    throw error;
  });
  return ready;
}
