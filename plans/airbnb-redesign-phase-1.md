# Airbnb-Inspired Redesign — Phase 1 (Browse + Property Detail)

## Context
The user wants to restructure AbangananHub Mobile's UI around Airbnb's mobile
interaction patterns (from reference screenshots: onboarding, search/explore,
listing detail, reviews, booking, trip detail, host profile) while keeping
the app's own locked color palette, typography, and flat/no-shadow tone from
`context/DESIGN.md`. This is not a re-skin — it's borrowing *structure and
interaction shape* (compressed search pill, full-bleed carousels, sticky
CTA bars, rating-forward reviews) and translating it through the existing
design tokens and component set, not importing Airbnb's own visual identity.

Given the size (~25 screens), this is being built in phases. **Phase 1**
covers shared primitives plus the two flagship screens — Browse and Property
Detail — so the direction can be confirmed on real screens before it
propagates. Later phases (not part of this plan) apply the same language to
search takeover polish, reviews, the booking/reservation flow, and the
remaining tabs.

Four Airbnb patterns were approved for adoption, translated to this app's
data model (confirmed via user decisions below):
1. Compressed single-segment "Where" search pill (no When/Who segments —
   this app has no date-based booking or guest-count filter, so those
   Airbnb segments have no backing data and won't be fabricated)
2. Guest-favourite badge on property cards, computed client-side from
   `avg_rating`/`review_count` thresholds (no backend field exists yet)
3. Sticky bottom price/CTA bar on Property Detail — "From ₱X,XXX/month" +
   a CTA that scrolls to the units list if >1 available unit, or opens
   inquiry directly if exactly 1 (existing per-unit "Send Inquiry" buttons
   stay as the real per-unit action; the bar is a shortcut/anchor)
4. Full-bleed edge-to-edge image carousel with floating overlay buttons
   (back/share/heart/report) on Property Detail

## Status: Implemented (Phase 1)
- `src/components/search-pill.tsx` — new
- `src/components/ui/bottom-action-bar.tsx` — new
- `src/components/ui/image-carousel.tsx` — new
- `src/components/property-card.tsx` — guest-favourite badge added
- `src/app/(tabs)/index.tsx` — swapped inline search bar for `SearchPill`
- `src/app/property/[id].tsx` — full-bleed `ImageCarousel`, `Share.share()`,
  sticky `BottomActionBar` with smart single/multi-unit CTA
- `src/app/search.tsx` — header row restyled to match the pill
- `npx tsc --noEmit` passes clean

## Deferred to Phase 2+ (not built yet)
- Reviews screen: big aggregate score + per-category rating bars + sort-by
  bottom sheet (needs a bottom-sheet decision — hand-rolled modal vs.
  `@gorhom/bottom-sheet`).
- `BottomActionBar` rollout to `reservation/inquire.tsx`,
  `reservation/[id]/agreement.tsx`, `pay.tsx`, `pay-rent.tsx`.
- Visual/token polish pass on Messages, Reservations list, More/Account,
  Notifications, Saved (Saved gets the new badge automatically, already
  wired via `property-card.tsx`).

## Verification
- `npx expo start` — open on device via Expo Go.
- Browse tab: pill renders in place of old search bar, tapping it opens
  `search.tsx`, hero/cards unchanged, badge appears on qualifying cards
  only (avg_rating ≥ 4.8, review_count ≥ 10).
- Property Detail: carousel is edge-to-edge with working page dots,
  overlay buttons (back/share/report/heart) functional, sticky bar shows
  correct lowest price and correct CTA behavior for both single-unit and
  multi-unit properties, content isn't clipped behind the bar when
  scrolled to bottom.
- Manual test against real fixture data (no automated suite in this repo)
  — test on a physical device or real emulator, not just Expo Web.
