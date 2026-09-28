# NEXA Core

This directory is the foundation of NEXA as a real social network.

## Principles

- The social graph is the primary product: users, profiles, follows, posts, reactions, comments, communities and messages.
- Domain logic belongs on the server. The client never decides permissions, ranking, ownership or trust-sensitive values.
- APIs should use stable identifiers and cursor pagination for feeds.
- Privacy is enforced before data is returned, not hidden only in the UI.
- Media is referenced by stored keys/URLs; large files do not belong in PostgreSQL rows.
- New NEXA-specific systems such as Crown ranking build on top of the core instead of replacing it.

## Core layers

`nexa-core/types.ts` contains shared domain contracts.

Future modules should follow this shape:

- `auth` — identity and sessions
- `social` — follows, blocks and relationships
- `content` — posts, comments, reactions, saves and shares
- `feed` — cursor-based feed assembly
- `communities` — community membership and moderation
- `messaging` — conversations and messages
- `notifications` — user activity notifications
- `media` — upload metadata and processing
- `ranking` — NEXA Score, leaderboards and Crown eligibility
- `trust` — reports, rate limits and abuse signals

The existing application routes remain compatible while these domains are introduced incrementally. Do not rewrite the entire application in one deployment; migrate one domain at a time and keep regression checks green.
