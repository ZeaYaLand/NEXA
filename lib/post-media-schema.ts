import { db } from '@/lib/db';

let ready: Promise<void> | null = null;

/** Idempotently adds the media fields needed by photo posts. */
export function ensurePostMediaSchema(): Promise<void> {
  if (ready) return ready;
  ready = db.query(`
    ALTER TABLE posts ADD COLUMN IF NOT EXISTS media_url TEXT;
    ALTER TABLE posts ADD COLUMN IF NOT EXISTS media_type TEXT;
  `).then(() => undefined).catch((error) => {
    ready = null;
    throw error;
  });
  return ready;
}
