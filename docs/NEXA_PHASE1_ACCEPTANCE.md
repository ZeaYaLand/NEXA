# NEXA Phase 1 — Social Foundation

Phase 1 is the real social-network foundation. A feature is not considered implemented when only its button exists.

## Identity
- Registration/login/session state works on mobile and desktop.
- Profile edit persists display name, username, avatar, bio and privacy.
- Profile ownership is enforced server-side.

## Social graph
- Follow/unfollow persists.
- Followers/following counts come from database state.
- Block prevents unwanted profile/content interactions.
- Privacy rules are enforced before returning protected content.

## Content
- Create text posts.
- Create posts with multiple media items.
- Edit/delete only when authorized.
- Public/followers/private visibility is enforced server-side.
- Comments support replies.
- Reactions persist and can be changed/removed.
- Save/unsave persists.
- Share creates a real social action rather than a decorative counter.

## Notifications
- Follow, reaction, comment, reply and share events create notifications.
- Read/unread state persists.
- Notifications are scoped to the recipient.

## UX
- Every operation has loading, success and failure states.
- Mobile and desktop use the same domain behavior.
- No fake counters, demo activity or dead controls.
- UI follows the NEXA dark modern design system.

## Quality gate
Before moving to Phase 2, verify:
1. TypeScript/build passes.
2. Database migrations/schema are repeatable.
3. Unauthorized mutations fail.
4. Mobile layout works without horizontal overflow.
5. Core social flows survive a refresh and a new session.
