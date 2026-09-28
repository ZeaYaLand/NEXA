-- NEXA core social graph. PostgreSQL.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS nexa_profiles (
  user_id UUID PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','followers','private')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nexa_follows (
  follower_id UUID NOT NULL,
  following_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id <> following_id)
);
CREATE INDEX IF NOT EXISTS idx_nexa_follows_following ON nexa_follows(following_id, created_at DESC);

CREATE TABLE IF NOT EXISTS nexa_blocks (
  blocker_id UUID NOT NULL,
  blocked_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);

CREATE TABLE IF NOT EXISTS nexa_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  media_url TEXT,
  media_type TEXT,
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','followers','private')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_nexa_posts_feed ON nexa_posts(created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_nexa_posts_author ON nexa_posts(author_id, created_at DESC, id DESC);

CREATE TABLE IF NOT EXISTS nexa_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL,
  author_id UUID NOT NULL,
  parent_id UUID,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_nexa_comments_post ON nexa_comments(post_id, created_at ASC);

CREATE TABLE IF NOT EXISTS nexa_reactions (
  post_id UUID NOT NULL,
  user_id UUID NOT NULL,
  reaction TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id, reaction)
);
CREATE INDEX IF NOT EXISTS idx_nexa_reactions_post ON nexa_reactions(post_id, reaction);

CREATE TABLE IF NOT EXISTS nexa_saves (
  post_id UUID NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS nexa_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_nexa_shares_post ON nexa_shares(post_id, created_at DESC);

CREATE TABLE IF NOT EXISTS nexa_communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nexa_community_members (
  community_id UUID NOT NULL,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member','moderator','owner')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (community_id, user_id)
);

CREATE TABLE IF NOT EXISTS nexa_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  actor_id UUID,
  type TEXT NOT NULL,
  entity_id UUID,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_nexa_notifications_user ON nexa_notifications(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS nexa_score_snapshots (
  user_id UUID NOT NULL,
  period TEXT NOT NULL,
  score NUMERIC(14,4) NOT NULL DEFAULT 0,
  rank INTEGER,
  measured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, period)
);
CREATE INDEX IF NOT EXISTS idx_nexa_score_rank ON nexa_score_snapshots(period, rank) WHERE rank IS NOT NULL;

CREATE TABLE IF NOT EXISTS nexa_crowns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('candidate','crown','elite','nexa')),
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_nexa_crowns_user ON nexa_crowns(user_id, awarded_at DESC);
