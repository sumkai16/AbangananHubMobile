# Airbnb-Inspired Redesign — Phase 3 (Auth + Tenancy + dispute.tsx cleanup)

## Context
Phases 1–2 (documented in `plans/airbnb-redesign-phase-1.md` and
`phase-2.md`) redesigned Browse, Property Detail, and the Agreement
screen. A survey of the remaining untouched screens (auth, reports,
profile, tenancy/handover/dispute) found that most are already short,
compliant forms/lists with no structural gap — no Airbnb pattern applies
to them. Two screens are the real exception, plus one small consistency
fix, all confirmed with the user:

1. **Auth screens** (`login.tsx`, `register.tsx`) — these still use a
   compact centered card, not the full-screen onboarding layout from the
   user's Airbnb reference screenshots. **Scope: layout restyle only** —
   email/password stays the real auth method; no social login buttons,
   since nothing is wired up client-side (the server endpoint exists but
   has never been called). Building social auth is new functionality, not
   part of this visual pass.
2. **`reservation/[id]/tenancy.tsx`** — already has a big-number balance
   headline and a single primary "Pay" CTA; genuine fit for the
   `BottomActionBar` pattern established in Phase 1, for consistency with
   Property Detail and Agreement.
3. **`reservation/[id]/dispute.tsx`** — hand-rolls a multiline `TextInput`
   instead of using the shared `TextField` component every other form
   uses. One-line consistency fix, not a redesign — but `TextField`
   didn't support multiline at all, so it needs a small `multiline` prop
   added first.

Reports, profile, and handover screens are explicitly **not** touched —
confirmed already compliant with `context/DESIGN.md`, no structural gap.

## Status: Implemented
- `src/components/ui/auth-header.tsx` — optional `size?: 'compact' |
  'large'` prop, default unchanged.
- `src/app/(auth)/login.tsx`, `register.tsx` — dropped the boxed card,
  content on `bg-background` directly, `AuthHeader size="large"`.
- `src/app/reservation/[id]/tenancy.tsx` — "Pay" CTA moved into
  `BottomActionBar`, only rendered when `payable_period` exists; scroll
  padding adjusted.
- `src/components/ui/text-field.tsx` — `multiline?: boolean` prop added.
- `src/app/reservation/[id]/dispute.tsx` — hand-rolled `TextInput` swapped
  for `TextField multiline`.
- `npx tsc --noEmit` passes clean.

## Deliberately not touched
Reports (`index.tsx`, `submit.tsx`), profile (`edit.tsx`,
`change-password.tsx`), `handover.tsx`, `inquire.tsx` — already compliant,
no structural gap; `inquire.tsx`/`reports/submit.tsx`'s hand-rolled
multiline inputs were out of the approved cleanup scope (only
`dispute.tsx` was confirmed).

## Verification
- `npx tsc --noEmit` clean.
- Login/Register: full-screen layout renders without the boxed card,
  fields/buttons/links functional, error banners still display correctly.
- Tenancy: sticky bar appears only when `payable_period` exists, tapping
  it navigates to `/pay-rent`, content isn't clipped, "All paid" state has
  no bar and no leftover padding gap.
- Dispute: `TextField` multiline renders/grows correctly, counter and
  min-length messaging still work, submit still disabled below
  `DISPUTE_REASON_MIN`.
- Manual test on a physical device/emulator — no automated suite in this
  repo.
