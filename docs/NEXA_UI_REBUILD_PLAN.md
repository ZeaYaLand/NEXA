# NEXA UI rebuild

The first interface migration targets the three surfaces users see most: home feed, profile, and navigation.

## Home
- Real feed cards with strong media hierarchy.
- Composer at the top.
- Reaction/share/save actions use real API state.
- Empty/loading/error states are designed, not placeholders.
- Ranking preview can appear as a compact secondary card without taking over the feed.

## Profile
- Identity header with avatar, name, username, bio and follow state.
- Followers/following remain accessible.
- Posts and media are clearly separated where data supports it.
- Crown appears only when the account has a real Crown record.
- No fake counters or decorative achievements.

## Navigation
- One consistent route model across mobile and desktop.
- Mobile uses a compact contextual menu instead of a permanent bottom tab bar.
- Desktop can expose primary destinations directly.
- Active route is always obvious.
- Secondary destinations stay discoverable without crowding the feed.

## Visual language
- Black/near-black base.
- White typography.
- Subtle glass surfaces and borders.
- Electric accent used sparingly.
- Crown is the signature NEXA motif.
- Motion is short and purposeful.

## Migration rule
Do not replace the whole application in one commit. Rebuild one surface at a time while keeping existing routes and APIs working. Every migrated surface must pass mobile and desktop regression checks before the next surface is changed.
