# NEXA Design System

NEXA is a modern social network, not a dashboard. The visual system must make content and people the focus.

## Visual direction

- Dark-first interface with a near-black base.
- Clean surfaces with subtle glass depth, not excessive blur.
- Strong white typography and restrained electric accents.
- The NEXA crown is the signature visual motif.
- Rounded cards, intentional spacing and soft motion.
- No imitation of another social network's exact layout.

## Layout

### Mobile
- One compact top navigation/header.
- Contextual menu for secondary destinations.
- No permanent bottom bar when the contextual menu is available.
- Feed cards use the full available width.
- Touch targets at least 44px.
- Composer and media controls remain reachable with one hand.

### Desktop
- Three-zone layout where useful: navigation, content, contextual panel.
- Content column remains readable rather than stretching across the screen.
- Navigation can collapse without changing route semantics.
- Profile and community pages can use wider media layouts.

## Components

- `NexaShell`: responsive application frame.
- `NexaNav`: primary and contextual navigation.
- `PostCard`: content, author identity, media, reactions and actions.
- `ProfileHeader`: identity, follow state, stats and Crown state.
- `CrownBadge`: the NEXA-specific status visual.
- `FeedComposer`: create post flow.
- `RankCard`: NEXA TOP/RISING summaries.
- `EmptyState`, `LoadingState`, `ErrorState`: consistent product states.

## Motion

Motion communicates state, not decoration: page transitions, reaction feedback, menu opening and Crown changes should be short and interruptible. Respect reduced-motion preferences.

## Accessibility

- Keyboard navigation on desktop.
- Visible focus states.
- Semantic buttons and links.
- Text alternatives for icons.
- Respect `prefers-reduced-motion`.
- Do not encode essential meaning by color alone.

## Product rule

A beautiful interface is not enough. Every visual component must correspond to a real product state or real data. No fake counters, demo users or decorative controls that do nothing.
