# NEXA Groups & Channels

Telegram-like model for NEXA.

## Groups
- Group chat with many members.
- Owner, admins and members.
- Admin permissions: manage chat, delete messages, invite users, pin messages, change info.
- Public username or private invite link.
- Group messages, replies and pinned messages.

## Channels
- Broadcast-first community.
- Owner/admins publish posts.
- Subscribers read posts.
- Optional comments/replies through a linked discussion group.
- Public username or private invite link.
- Subscriber/member management.

## Shared
- Avatar, title and description.
- Public/private visibility.
- Invite links.
- Member management.
- Admin roles and permissions.
- Message history.
- Pinning and deletion according to permissions.

## Routes
- `/communities` — discovery and creation.
- `/communities/[id]` — group/channel chat/feed.
- `/communities/[id]/members` — members and admins.
- `/communities/[id]/settings` — owner/admin controls.
- `/communities/join/[code]` — invite link entry.

The UI can be deployed independently, but persistence and cross-user visibility must use the Neon schema in `docs/communities-schema.sql`; do not use localStorage for the production implementation.
