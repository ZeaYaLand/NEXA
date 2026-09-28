# NEXA — Product Vision

NEXA is not a copy of VK, Telegram, Instagram or another existing network. Existing products can inspire interaction quality, but NEXA's product language and core mechanics are its own.

## Product identity

- Mobile-first, equally polished on desktop.
- Dark visual system: black base, blue/red neon accents, glass surfaces, thin luminous borders, subtle grain/glitch.
- Real social network: people create their own content; no fictional characters or game framing.
- Navigation is a unified menu system; mobile does not depend on a permanent bottom tab bar.
- Every new feature must have a clear reason to exist inside NEXA rather than being a copy of a competitor feature.

## NEXA-native mechanics

### 1. Pulse
A temporary personal signal that describes what a person is doing or looking for right now.

Examples: Creating · Exploring · Free to chat · Listening · Busy · Looking for people.

Pulse is time-limited, can include a short custom line, and becomes a discovery signal instead of a static profile field.

### 2. Trails
Posts can be connected into a Trail. A Trail is a living chain around an idea, event, project or story. Instead of a flat comment tree, users can continue a thought and see how it evolved.

### 3. Drops
A Drop is a small piece of content designed for a short window: a photo, thought, link, poll or announcement. Drops can be collected into a permanent profile archive by the author.

### 4. Signals
NEXA reactions are semantic signals rather than one universal like. A post can receive signals such as Vibe, Curious, Useful, Agree or Surprise. The author sees what their content caused, not only a number.

### 5. Spaces
Spaces are persistent interest areas built around a topic. They combine a feed, shared resources, events and Trails without forcing the user into a generic group-chat model.

### 6. Identity Layer
A profile is more than a bio. Users control a visual identity card, interests, Pulse history, selected Trails, Drops and activity visibility. Privacy is a first-class part of the profile model.

### 7. NEXA Flow
The main feed should eventually support multiple user intents: For You, Following, Explore and Near Me (only when the user explicitly enables location). The system should explain why something appears instead of becoming a black-box feed.

### 8. Studio
A creator workspace for drafting, media organization, post planning, reusable visual presets and content insights. Studio is separate from the public feed so creation does not clutter the social experience.

## Platform layers

### Layer A — Core social graph
Accounts, profiles, follows, blocks, privacy, posts, comments, saves, notifications and direct messages.

### Layer B — NEXA-native graph
Pulse, Trails, Drops, Signals and Spaces. These should be modeled as first-class entities rather than UI-only features.

### Layer C — Discovery
Search, Explore, recommendations, topic discovery and explainable ranking signals.

### Layer D — Creation
Media uploads, editing, drafts, Studio and content organization.

### Layer E — Trust & control
Report, moderation queues, rate limits, privacy controls, account security, content visibility and audit events.

## Design rules

1. Do not add a feature only because another social network has it.
2. Prefer fewer, deeper interactions over a long list of shallow buttons.
3. Keep the main feed focused; specialized experiences belong in their own sections.
4. Every screen must work on a phone first and then expand cleanly for desktop.
5. Avoid hard-coded demo users and fake activity in production UI.
6. Do not ship a visual-only feature if the underlying data model cannot support it later.
7. New APIs must validate input, enforce authentication and return predictable error shapes.

## Delivery order

### Phase 1 — Foundation
- Establish the new visual system and responsive navigation.
- Remove obsolete recorder/voice/circle code paths.
- Introduce a clean feature-module structure.
- Add product-level loading, empty, error and permission states.

### Phase 2 — Identity
- Rebuild profile as an identity hub.
- Add Pulse with persistence and expiration.
- Add privacy controls for profile/activity visibility.

### Phase 3 — Original content model
- Trails.
- Drops.
- Signals.
- Feed support for these entities.

### Phase 4 — Spaces and discovery
- Spaces.
- Explore.
- Explainable discovery.
- Topic graph and search improvements.

### Phase 5 — Creation and scale
- Studio.
- Media pipeline improvements.
- Drafts.
- Performance, caching, pagination and background jobs.

### Phase 6 — Trust and production hardening
- Moderation tools.
- Rate limits.
- Security review.
- Accessibility.
- Mobile/desktop regression checks.

The goal is a recognizable NEXA product language: the interface should feel modern immediately, while the underlying mechanics make it clear that NEXA is its own social network.
