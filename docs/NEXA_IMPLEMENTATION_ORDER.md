# NEXA implementation order

This is the execution order for turning NEXA into a complete modern social network.

## Phase 1 — Social foundation
- authentication/session correctness
- profiles and profile editing
- follows/followers
- blocks and privacy
- posts and multi-media posts
- comments/replies
- reactions
- saves and shares
- notifications

## Phase 2 — Feed
- cursor pagination
- following feed
- personalized feed foundation
- post composer
- media viewer
- search and discovery

## Phase 3 — Communication
- conversations
- group conversations
- message delivery/read state
- replies/reactions/edit/delete
- attachment metadata

## Phase 4 — Communities
- create/manage community
- membership and roles
- community feed
- moderation

## Phase 5 — Product polish
- unified responsive design system
- mobile contextual navigation
- desktop navigation
- loading/error/empty states
- accessibility and reduced motion
- image optimization

## Phase 6 — Original NEXA systems
- original discovery mechanics
- original social interactions
- Crown/ranking system
- advanced reputation signals

Do not implement all phases as one giant rewrite. Each phase must preserve existing working routes and pass build checks before the next phase is migrated.
