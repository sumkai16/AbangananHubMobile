# Mobile Scope — Screens & Sequencing

**Date:** 2026-07-27
**Continues:** `plans/mobile-client-bootstrap.md`.
**Server counterpart:** `../AbangananHub/plans/mobile-api-gaps.md`, which owns the
five server-side changes this scope requires. Nothing here duplicates that.

## Context

The bootstrap plan created this repo and a typed API client. Since then the app
has grown real screens (auth, tabs, browse, property detail, favorites, inquiry)
without a scope defining where it stops. This plan fixes that: **what ships, in
what order, and what deliberately doesn't.**

Decided:
- **Roles:** Tenant **and** Landlord. Admin stays web-only — it is an oversight
  console (audit logs, approval queues, payout marking), not a phone surface.
- **Target:** a **demo-able companion app** — an Expo dev build on one device at
  the September 2026 defense. No app-store submission, no production EAS
  credentials, no OTA channel. The web app remains the product of record.
- **Heavy subsystems, all in scope:** realtime chat over Reverb, Expo push, map
  browse + the landlord pin picker, landlord KYC in a WebView.
- **Design:** port the tokens, use native patterns. Palette and type roles from
  `context/DESIGN.md` (which inherits the web app's `#156F8C` / `#2AA7A1` /
  `#69D2C6` fills-and-borders-only / `#FF8A65` CTA / `#F7FCFC` / `#1F2937` /
  `#64748B` / `#E2E8F0`). Poppins headings, Inter body; **Source Serif 4 is
  dropped** — it is a large-page-title face with no native equivalent role.
  Native tab bars, native date/time pickers, native sheets. Do **not** reproduce
  Blade layouts, `<x-card>` chrome, or the web's custom `<x-datetime-picker>`.

## Already built

`src/lib/{api,auth,properties,reservations,favorites}.ts` (typed against the
server's API Resources, with the decimal-as-string coercion the server's JSON
requires), `AuthProvider` + `Stack.Protected` route guarding in
`src/app/_layout.tsx`, login/register, the three-tab shell in
`src/components/app-tabs.tsx`, browse, property detail, reservation inquiry.

Two known deviations to carry forward: SDK 54's classic `Tabs` API is used
because only SDK 54 is installed on the test device (revisit on a dev build), and
`src/constants/theme.ts` is still template greyscale — brand colors are applied
directly at call sites. Fold the palette into a real theme module before the
screen count grows.

---

## Screens

### Shared — 9
Login · Register · Social sign-in (native Google/Facebook SDK →
`POST /auth/{provider}/token`, built server-side and never yet called) ·
Chat list · Chat thread · Notifications · Profile view · Profile edit ·
Change password · File a complaint

The chat thread header carries the stage stepper and the move-in clock, both fed
by `active_clock` from the server (gap 3) — **do not re-derive which clock is
running here.** Realtime via Echo on `conversation.{id}` against the Sanctum
broadcasting-auth route (`laravel-echo` + `pusher-js` are installed, unwired).

### Tenant — 11
Browse (list + **map**, `react-native-maps` with OSM tiles; the
OSRM/Overpass/Nominatim calls are plain HTTP and move over unchanged) ·
Property detail · Favorites · Reservations list · Reservation detail (status
journey) · Agreement + sign · **Payment WebView** · Confirm / dispute move-in ·
Handover scheduling · Tenancy + rent ledger · Pay rent (WebView) · Write a review

**Payment flow:** `POST .../pay` returns `checkout_url`; open it in the WebView;
**intercept navigation to `success_url` rather than loading it**; close and call
`.../payment/reconcile`. Same for rent. Reconcile is not belt-and-braces — in
local dev PayMongo cannot reach the machine, so the webhook never fires and
reconcile is the *only* path that settles the payment. No deep links: they need a
server `success_url` change, universal-link association files, and they fail
differently per platform. Interception is entirely client-side.

### Landlord — 13
Dashboard · Properties list · Property detail · Property create/edit (incl. the
**tap-to-pin location picker** — a rewrite of the web `location-picker.js`
*interaction* against `react-native-maps`' native drag handling, not of its
logic) · Units list · Unit create/edit · Reservations pipeline (advance / reject
/ cancel / mark turned-over) · Tenancies list · Tenancy detail (record payment,
remind, end) · Walk-in tenant form · Collections + Payouts (read-only) ·
Occupancy + Analytics · Reviews + reply · Rate tenant · **KYC WebView**

**Unit photos:** the server's ≥3 live-capture rule is preserved as-is. Expo's
camera returns images that never round-trip a picker, so this is *less* forgeable
than the web's `DataTransfer` trick — but it is still a client assertion. The
server keeps validating the count; do not ask for a fake server-side
"verification" that only appears to close the gap.

**Occupancy/Analytics** render with a native chart lib — both server controllers
already build plain arrays, so no Chart.js parity work is needed.

**KYC WebView:** accepted consequence — the wizard already collapses to its
mobile step-bar below `lg`, so it renders fine, but it is web UI in a native
shell and will look like it. Once per landlord.

Role is read from `GET /profile` at boot and picks the tab set, mirroring the
server's `User::homeRoute()` — the existing single source for "where does this
user land."

---

## Sequencing

0. **Server gaps + Reverb-from-device check** (`../AbangananHub/plans/mobile-api-gaps.md`).
   No chat work starts until the Reverb transport answer is known.
1. **Shell hardening** — real theme module, role-switched navigator, social
   sign-in, profile screens.
2. **Tenant read path** — map browse, reservations list/detail. (Property detail
   and favorites already exist.)
3. **Chat + notifications + push** — unblocks both roles' remaining flows.
4. **Tenant money path** — agreement, payment WebView, escrow/handover, ledger,
   rent payment, review.
5. **Landlord** — dashboard → reservations → tenancies/collections → property &
   unit CRUD (hardest: multipart upload + pin picker) → payouts/occupancy/
   analytics → KYC WebView.
6. **Docs** — close the two Open Questions in `context/ARCHITECTURE.md` §6 and
   the styling question in `context/DESIGN.md` §5; record the role-switching and
   payment-interception decisions.

---

## Verification

Point the client at the server's `escrow:scenarios` and `walkin:scenarios`
fixture accounts unchanged — they build the otherwise unreachable backdated
escrow and ledger states and print login credentials. Per screen, on a device:

- A web-sent message arrives live in an open thread.
- A push lands with the app killed, and deep-links to the right screen.
- A GCash and a QRPh checkout both complete in the WebView, and reconcile settles
  the payment **with the webhook disabled**.
- A suspended account's stored token is rejected and the app lands on login.
- Creating a unit with fewer than 3 captures is refused by the server.
- **Cross-client:** perform each state transition on mobile, confirm the web view
  for the counterparty reflects it, and vice versa. Two clients on one state
  machine is where this will actually break.
