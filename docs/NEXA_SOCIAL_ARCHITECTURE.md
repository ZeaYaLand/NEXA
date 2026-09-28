# NEXA — Social Network Architecture

NEXA remains a real social network. The goal is to make the existing social primitives deeper, more polished and more original — not turn the product into a game or command center.

## Core product

Users can:
- create a profile;
- follow people;
- publish text, photos and supported media;
- react, comment, share and save posts;
- discover people and communities;
- communicate through messages;
- receive notifications;
- manage privacy and account settings.

These familiar primitives are the foundation. NEXA differentiates itself through its visual language and original ranking/reputation mechanics.

## NEXA Crown

The crown is a real status layer attached to the social graph. It is earned through ranking, not purchased and not granted at signup.

### NEXA Score

The score is derived from multiple quality signals rather than a single public counter:
- meaningful engagement;
- conversation quality;
- saves and shares;
- follower growth adjusted for authenticity;
- consistency;
- original content;
- community contribution;
- negative signals such as spam reports, abusive behavior and artificial engagement.

The exact weighting should remain server-side and changeable without a client update. Never trust a client-provided score.

### Ranking views

- **NEXA TOP** — overall leaderboard.
- **RISING** — users whose score and authentic engagement are accelerating.
- **CREATORS** — strong original-content contributors.
- **COMMUNITY** — people contributing to communities.
- **CROWN** — users currently holding a Crown status.

Rankings need time windows (current, weekly, monthly, all-time) and deterministic pagination.

### Crown levels

Initial implementation should support configurable levels rather than hard-coded permanent numbers:
- Crown candidate;
- Crown;
- Elite Crown;
- NEXA Crown.

Thresholds are server-side configuration. A user can lose a Crown if their qualifying ranking falls below the required level for the defined evaluation period.

## Anti-abuse rules

The ranking system must not reward obvious spam. Implement rate limits and quality adjustments for:
- repeated reactions between the same accounts;
- burst follows/unfollows;
- duplicate comments;
- suspicious engagement velocity;
- self-interaction loops;
- automated-looking activity.

Moderation and account safety signals must be able to reduce ranking eligibility without exposing private moderation details.

## Profile integration

A profile can show:
- current rank;
- NEXA Score summary;
- rank movement;
- Crown status;
- verified ranking achievements;
- recent public posts.

Do not expose sensitive scoring inputs or private moderation data.

## Implementation order

1. Add database entities for score snapshots, ranking periods and crown awards.
2. Add server-side scoring service with configurable weights.
3. Add ranking API with pagination and filters.
4. Add Crown eligibility/award service.
5. Add profile ranking card.
6. Add a beautiful TOP/RISING interface.
7. Add anti-abuse safeguards and automated tests.
8. Optimize with indexes, caching and background recalculation as the user base grows.

## Design direction

Modern social network, not dashboard:
- strong content hierarchy;
- generous cards and media;
- polished typography;
- restrained glass surfaces;
- subtle motion;
- distinctive NEXA crown visual;
- mobile-first layouts that expand naturally on desktop.

Avoid copying another network's exact navigation, labels, visual layout or interaction choreography. Familiar social actions can remain familiar; NEXA's identity should come from its own design system and Crown/ranking mechanics.
