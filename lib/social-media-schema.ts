import { db } from '@/lib/db';

let ready: Promise<void> | null = null;

/** Creates the persistent tables used by Stories, Videos and Music. Safe to call on every request. */
export function ensureSocialMediaSchema(): Promise<void> {
  if (ready) return ready;
  ready = db.query(`
    CREATE TABLE IF NOT EXISTS stories (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      media_key TEXT NOT NULL,
      media_type TEXT NOT NULL,
      caption TEXT DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
      view_count INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS stories_active_idx ON stories (expires_at DESC);
    CREATE INDEX IF NOT EXISTS stories_user_idx ON stories (user_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS media_items (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      kind TEXT NOT NULL CHECK (kind IN ('video','music')),
      media_key TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      cover_key TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      like_count INTEGER NOT NULL DEFAULT 0,
      comment_count INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS media_items_kind_idx ON media_items (kind, created_at DESC);
    CREATE INDEX IF NOT EXISTS media_items_user_idx ON media_items (user_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS media_likes (
      media_id TEXT NOT NULL REFERENCES media_items(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (media_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS media_comments (
      id TEXT PRIMARY KEY,
      media_id TEXT NOT NULL REFERENCES media_items(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS media_comments_media_idx ON media_comments (media_id, created_at ASC);
  `).then(() => undefined).catch((error) => {
    ready = null;
    throw error;
  });
  return ready;
}
