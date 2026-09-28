# NEXA — Feature Master Plan

This is the implementation checklist for NEXA as a real, modern social network. Ranking/Crown is intentionally deferred until the core product is solid.

## Core social
- [ ] Authentication, sessions and account recovery
- [ ] Profiles and profile editing
- [ ] Follow/unfollow and follower lists
- [ ] Block/mute controls
- [ ] Posts: text, photos and supported media
- [ ] Multiple media per post
- [ ] Edit/delete own posts
- [ ] Reactions
- [ ] Comments and threaded replies
- [ ] Share/repost
- [ ] Save/bookmark
- [ ] Post visibility controls
- [ ] Pagination/infinite loading

## Home and discovery
- [ ] Personalized home feed
- [ ] Following feed
- [ ] Explore/discovery
- [ ] People search
- [ ] Post search
- [ ] Hashtags/topics
- [ ] Trending content without ranking/Crown dependency
- [ ] Explainable recommendation reasons where possible

## Messaging
- [ ] Conversation list
- [ ] One-to-one chat
- [ ] Group conversations
- [ ] Message reactions
- [ ] Reply to message
- [ ] Edit/delete own message
- [ ] Read state
- [ ] Typing/presence where infrastructure supports it
- [ ] Media attachments
- [ ] Search conversations/messages

## Notifications
- [ ] Reactions
- [ ] Comments/replies
- [ ] Follows
- [ ] Mentions
- [ ] Shares
- [ ] Message notifications
- [ ] Read/unread state
- [ ] Notification preferences

## Media
- [ ] Secure uploads
- [ ] Image optimization
- [ ] Gallery/viewer
- [ ] Multiple images per post
- [ ] Avatar and cover media
- [ ] Upload validation and size limits

## Communities
- [ ] Community creation
- [ ] Membership
- [ ] Community posts
- [ ] Roles/moderation
- [ ] Community discovery
- [ ] Community privacy

## Settings and trust
- [ ] Account settings
- [ ] Privacy settings
- [ ] Notification settings
- [ ] Active sessions/security
- [ ] Report content/user
- [ ] Block/mute
- [ ] Rate limits
- [ ] Moderation states
- [ ] Audit/security events

## NEXA-original layer
These come after the core is reliable:
- [ ] Original interaction mechanics
- [ ] NEXA-specific content formats
- [ ] Distinctive profile identity features
- [ ] Social discovery mechanics that are not copies of another network
- [ ] Crown/ranking system

## Design requirements for every feature
- Mobile first and fully usable on desktop.
- Modern dark NEXA visual language.
- No permanent mobile bottom bar when contextual navigation is available.
- No fake/demo counters in production UI.
- Every button must have a real action or be removed.
- Loading, empty, error and permission states are designed.
- Accessibility and reduced-motion support.
- Backend authorization must not rely on the client.
