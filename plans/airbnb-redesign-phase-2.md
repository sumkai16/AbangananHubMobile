# Airbnb-Inspired Redesign — Phase 2 (Reviews + Agreement sticky bar)

## Context
Continuation of `plans/airbnb-redesign-phase-1.md`, picking up two items
explicitly deferred there: the reviews redesign and `BottomActionBar`
rollout beyond Property Detail.

## Scope decision: rating bars
Airbnb's reviews screen shows per-category bars (Cleanliness, Accuracy,
etc.). This app's `Review` type (`src/lib/properties.ts`) only stores a
single `rating` per review — no per-category breakdown exists in the data
model. Per DESIGN.md's own rule (never fabricate a stat the API doesn't
provide — see the Profile rating stat precedent), Phase 2 does **not**
build fake category bars. Instead: a big aggregate score (already-available
`avg_rating`/`review_count`) plus a real sort-by control, which is fully
backed by existing data (`rating`, `created_at` per review).

## Implemented
- `src/components/ui/sort-sheet.tsx` — new. Hand-rolled bottom sheet
  (`Modal` + slide-up, no `@gorhom/bottom-sheet` dependency — none was
  installed, and this keeps the zero-extra-library pattern established in
  Phase 1). Generic `SortSheet<T>` for a single-choice sort list.
- `src/app/property/[id].tsx` — reviews section reworked: big score number
  + star row + review count, a sort pill (Most recent / Highest rated /
  Lowest rated) opening `SortSheet`, reviews list re-sorted client-side via
  a new `sortReviews()` helper. No new API calls.
- `src/app/reservation/[id]/agreement.tsx` — the screen's primary action
  ("Pay initial deposit" when awaiting payment, "Rent ledger" when
  Occupied) moved from an inline trailing button into `BottomActionBar`
  (from Phase 1), so it stays visible while scrolling the agreement text.
  Content padding adjusted (`pb-24` when a sticky bar is present) so
  nothing is clipped.
- `npx tsc --noEmit` passes clean.

## Deliberately not done in Phase 2
- `reservation/inquire.tsx`: single short form, the submit button is
  already on-screen without scrolling — a sticky bar adds chrome without
  solving a real visibility problem here. Skipped.
- `pay.tsx` / `pay-rent.tsx`: both are thin wrappers around
  `PaymentWebViewFlow`, which owns its own WebView-driven UI end to end —
  retrofitting a sticky price bar around a WebView doesn't fit the
  component's structure without a larger refactor of
  `payment-webview-flow.tsx` itself. Left as a follow-up if that shared
  component is revisited.
- Token/spacing polish pass on Messages, Reservations list, More/Account,
  Notifications, Saved — still deferred; none of these screens have a
  structural gap the 4 approved Airbnb patterns address, so they're lower
  priority than the functional gaps closed above.

## Verification
- `npx tsc --noEmit` clean.
- Property Detail: score/star row renders correctly for a property with
  reviews, sort pill opens the sheet, selecting an option re-sorts the
  list and closes the sheet, "No reviews yet" state unaffected.
- Agreement screen: sticky bar appears only in the awaiting-payment or
  Occupied states, doesn't overlap content when scrolled to bottom, both
  the Sign Agreement checkbox flow and the move-in-clock actions above it
  are unaffected.
