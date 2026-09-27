-- NEXA Telegram-like groups/channels foundation
-- Apply after Neon access is restored.

create table if not exists communities (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('group','channel')),
  owner_id uuid not null,
  username text unique,
  title text not null,
  description text not null default '',
  avatar_url text,
  is_public boolean not null default true,
  invite_code text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists community_members (
  community_id uuid not null references communities(id) on delete cascade,
  user_id uuid not null,
  role text not null default 'member' check (role in ('owner','admin','member')),
  can_manage_chat boolean not null default false,
  can_delete_messages boolean not null default false,
  can_invite_users boolean not null default false,
  can_pin_messages boolean not null default false,
  can_change_info boolean not null default false,
  joined_at timestamptz not null default now(),
  primary key (community_id, user_id)
);

create table if not exists community_messages (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references communities(id) on delete cascade,
  author_id uuid,
  body text not null default '',
  reply_to_id uuid references community_messages(id) on delete set null,
  is_pinned boolean not null default false,
  created_at timestamptz not null default now(),
  edited_at timestamptz
);

create table if not exists community_invites (
  code text primary key,
  community_id uuid not null references communities(id) on delete cascade,
  created_by uuid not null,
  expires_at timestamptz,
  max_uses integer,
  uses integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_community_members_user on community_members(user_id);
create index if not exists idx_community_messages_community on community_messages(community_id, created_at desc);
create index if not exists idx_community_invites_community on community_invites(community_id);
