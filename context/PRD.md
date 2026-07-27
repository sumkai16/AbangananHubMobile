# PRD.md — Product Requirements (Mobile Client)

## 1. What this is
The React Native + Expo client for AbangananHub — the mobile counterpart to
the server-rendered Laravel web app at `../AbangananHub`. Full problem
statement and target users are in the server repo's `context/PRD.md`; this
file covers what's specific to the mobile client: scope, phasing, and what's
deliberately excluded.

## 2. Scope decided (2026-07-27)
- **Tenant + Landlord roles.** Admin stays web-only — a single-admin
  platform doesn't justify a mobile admin surface.
- **React Native + Expo**, matching what `../AbangananHub/context/ARCHITECTURE.md`
  and `PRD.md` already named as the intended stack when the API layer was
  scaffolded ahead of this client existing.
- **Payments via WebView on the existing hosted checkout**, not a native
  PayMongo SDK — see `ARCHITECTURE.md` § Design Decisions.

## 3. Server dependency
This app has **no independent backend**. Every feature here depends on the
matching endpoint existing and working in `../AbangananHub` first. The full
inventory of what's built server-side and what's still missing is in that
repo's `plans/mobile-app.md` — read it before assuming an endpoint exists.

As of 2026-07-27, the server-side API work (Phases 0–3 of that plan) is
complete: 66 routes covering auth, browse, chat, notifications, the full
tenant money/escrow/rent-ledger path, and the full landlord write surface
(property/unit CRUD, walk-in tenants, payments, payouts, occupancy,
analytics, reviews).

Of the five server gaps in `../AbangananHub/plans/mobile-api-gaps.md`, four
are done (Expo push plumbing, the KYC WebView session bridge, and the three
missing endpoints — `POST /reports`, `conversations/resolve`,
`landlord/profile/me`). The fifth — **verifying Reverb is reachable from a
physical device** — cannot be done from this side; it needs a phone on the
LAN and gates M7 (chat).

## 4. Feature set, by module
Work is tracked as a **mobile WBS whose module numbers mirror the project
Gantt's web modules** — `M2 Tenant Management` here is the same surface as
web WBS `2`. Web modules 4 (Admin) and 6 (Unit Approval) have no mobile
counterpart and those numbers are skipped, not reused. `M15 Payments &
Escrow` has no web counterpart: on web it sits inside WBS 8, but on mobile
it is the largest, highest-risk block and is broken out to stay visible.

Full task breakdown, schedule and cut order: **`plans/mobile-wbs.md`**.

| Module | Status |
|---|---|
| M0 Foundation and Core | ✔ |
| M1 User and Access Management | ~ auth + role hydration done; social login, profile edit open |
| M2 Tenant Management | ~ browse/detail/favorites done; filters and map open |
| M3 Landlord Management | ~ KYC WebView done; dashboard, property/unit CRUD, pin picker open |
| M5 Unit Management | ✕ |
| M7 Messaging / Chat | ✔ Reverb device check passed; list, thread, real-time, resolve, stage stepper all done |
| M8 Reservation Management | ~ tenant side done; landlord pipeline and walk-in open |
| M9 Review and Rating | ✕ |
| M10 Notification System | ✕ client (server push plumbing done) |
| M11 Occupancy Monitoring | ✕ |
| M12 Complaint and Reporting | ✕ client (server endpoints done) |
| M13 Reports Module | ✕ export deliberately excluded |
| M14 Build and Distribution | ✕ |
| M15 Payments and Escrow | ~ full tenant money path done (agreement, pay, escrow, dispute, handover, rent ledger, pay rent) — landlord-side (M15.10) open |

**Window:** August 1 – September 15 2026, owned by Axcee. Joseph continues
on web (WBS 2.5, WBS 14).

## 5. Explicitly out of scope
- Admin — web-only, by design (see § Scope decided)
- Anything the web app itself doesn't have (refunds, live PayMongo,
  legally-binding contracts — see the server repo's PRD § Explicitly Out
  of Scope, which applies here too since this client can't do what the
  API doesn't support)
- CSV export, printable payment receipts — desktop-document concerns the
  server API deliberately didn't expose to mobile (see server
  `ARCHITECTURE.md`, 2026-07-27 Key Decisions Log)
- A second design system — see `DESIGN.md` § 6

## 6. Success metric
Feature parity for the Tenant and Landlord roles with the web app's
equivalent flows, demonstrable on a physical device — not just Expo Web,
since camera capture and the WebView payment flow don't exist in the web
preview.

The target is a **demo-able companion app**: an Expo dev build running on
one device at the September defense. No app-store submission, no production
EAS credentials, no OTA channel. The web app remains the product of record.
