# Mobile WBS — Module Plan

**Date:** 2026-07-27
**Window:** August 1 – September 15, 2026 (6 weeks), ahead of the September
defense.
**Owner:** Axcee F. Cabusas (all mobile modules). Joseph stays on web —
WBS 2.5 Tenant Profile Management (Frontend), still `~`, and WBS 14
Deployment, still `✕`.
**Supersedes:** `plans/mobile-scope.md`'s sequencing section. That file's
screen inventory and design decisions still stand; this file replaces its
ordering with module numbering that matches the project Gantt.

**UI pass, 2026-07-27:** every screen built so far was brought in line with
a tenant prototype (Browse/Saved/Messages/Reservations/Profile) and audited
against `context/DESIGN.md` §7's rules — see that file's new §8 for the
resulting canonical patterns (hero exception, floating overlap cards, the
two-variant `PropertyCard`, stat tiles, status/filter pills). Tab bar
renamed and reordered to match (Browse/Saved/Messages/Reservations/Profile).
This was a visual pass, not a scope change — module statuses below are
unaffected except where noted.

## Context

The project Gantt tracks 15 web modules (WBS 0–14), all `✔` except 2.5
(partial) and 14 (Deployment, not started). The mobile client is new work
with no rows on that chart, so it was being planned as loose phases while
everything else is tracked per module.

This gives mobile the same treatment: **module numbers mirror the web WBS**,
so `M2 Tenant Management` on mobile is the same surface as `2 Tenant
Management` on web and the rows drop into the existing chart. Web modules
**4 (Admin/System Management)** and **6 (Unit Approval)** have no mobile
counterpart — admin is web-only by design, so those numbers are skipped
rather than reused for something else.

One module has no web counterpart: **M15 Payments & Escrow**. On web this
lives inside WBS 8; on mobile it is the largest and highest-risk block of
work (WebView checkout, reconcile-vs-webhook, two escrow clocks, handover,
rent ledger) and is broken out so the risk is visible on the chart instead
of buried as sub-tasks of a reservation row.

### Server dependency

Four server-side gaps block specific mobile modules. They live in
`../AbangananHub/plans/mobile-api-gaps.md` and are scheduled here inside the
module they block, not as a separate up-front phase — each is a few hours of
work and doing them just-in-time avoids a week of server work with nothing to
show.

| Gap | Blocks |
|---|---|
| A.1 `expo_push_token` + `ExpoPushNotifier` | M10 |
| A.2 Token→session WebView bridge | M3.6 |
| A.4 `POST /reports`, `conversations/resolve`, `landlord/profile/me` | M12, M7.4, M3.5 |
| A.5 Reverb reachable from a device | M7 (verify **before** M7 starts) |

---

## Modules

Status legend: `✔` done · `~` partial · `✕` not started

### M0 — Foundation and Core `✔`
| # | Task | Status |
|---|---|---|
| M0.1 | Expo + TypeScript + expo-router scaffold | ✔ |
| M0.2 | NativeWind + design tokens (`tailwind.config.js`) | ✔ |
| M0.3 | API client — Bearer token, 401 → clear token | ✔ |
| M0.4 | Secure token storage (`expo-secure-store`) | ✔ |
| M0.5 | Navigation shell + `Stack.Protected` auth gating | ✔ |
| M0.6 | Animated splash overlay | ✔ |
| M0.7 | Reusable UI components (`gradient-button`, `text-field`, cards) | ~ |

### M1 — User and Access Management `~`
| # | Task | Status |
|---|---|---|
| M1.1 | Login screen + `POST /auth/login` | ✔ |
| M1.2 | Register screen + `POST /auth/register` | ✔ |
| M1.3 | Logout + Account tab | ✔ |
| M1.4 | Session restore on cold start | ✔ |
| M1.5 | **Role shell** — `GET /profile` hydrates roles at cold start (`auth-context.tsx`); `isLandlord` drives what Account shows | ✔ |
| M1.6 | Social login (native Google/Facebook SDK → `POST /auth/{provider}/token`) | ✕ |
| M1.7 | Profile view / edit / change password | ✕ |

> M1.5 shipped **the mechanism**, not a landlord tab set — M3's screens don't
> exist yet, so there is nothing to switch the tabs *to*. Account now reads
> `isLandlord` and shows either "Become a landlord" (→ M3.6) or a status line
> for verified landlords. Revisit the tab bar itself once M3.1 (dashboard)
> exists — that's when "Tenant vs Landlord tab set" becomes literal.
> **Forgot/reset password is out of scope** — web-only Breeze flow, no API
> endpoint. Mobile links to the web page.

### M2 — Tenant Management `~`
| # | Task | Status |
|---|---|---|
| M2.1 | Browse / property list | ✔ |
| M2.2 | Location search | ✔ |
| M2.3 | Property detail (gallery, units, reviews) | ✔ |
| M2.4 | Verified badge / legit indicators | ✔ |
| M2.5 | Favorites | ✔ |
| M2.6 | Filter chips — type, max price, verified, sort | ✕ |
| M2.7 | **Map view** — `react-native-maps` + OSM tiles | ✕ |
| M2.8 | Tenant profile screen | ✕ (shares M1.7) |

### M3 — Landlord Management `✕`
| # | Task | Status |
|---|---|---|
| M3.1 | Landlord dashboard | ✕ |
| M3.2 | Properties list + detail | ✕ |
| M3.3 | Add / edit property | ✕ |
| M3.4 | Property photo upload (multipart) | ✕ |
| M3.5 | Landlord profile — `GET/PATCH landlord/profile/me` shipped server-side | ✕ client screen |
| M3.6 | Verification wizard in WebView | ✔ |
| M3.7 | Tap-to-pin location picker | ✕ |

> M3.7 is a rewrite of `location-picker.js`'s *interaction* against
> `react-native-maps`' native drag handling — not of its logic. Budget it
> like new work, not a port.

### M5 — Unit Management `✕`
| # | Task | Status |
|---|---|---|
| M5.1 | Units list per property | ✕ |
| M5.2 | Add / edit unit | ✕ |
| M5.3 | **Live camera capture, ≥3 photos** (`expo-camera`) | ✕ |
| M5.4 | Delete unit + delete media | ✕ |
| M5.5 | Pricing, capacity, `unit_type`/`floor`/`security_deposit` | ✕ |

> M5.5's three fields only became real columns on 2026-07-27 (the misnamed
> migration fix). They exist server-side now and are already typed in
> `src/lib/properties.ts`.

### M7 — Messaging / Chat System `✔`
| # | Task | Status |
|---|---|---|
| M7.0 | Verify Reverb from a physical device (A.5) | ✔ **PASS**, confirmed on hardware July 27 2026 |
| M7.1 | Conversation list (`(tabs)/messages.tsx`) | ✔ |
| M7.2 | Chat thread + send message (`conversation/[id].tsx`) | ✔ |
| M7.3 | Real-time via Echo on `conversation.{id}` (`lib/echo.ts`) | ✔ |
| M7.4 | Resolve conversation | ✔ |
| M7.5 | Stage stepper + move-in clock in thread header | ✔ (`stage-stepper.tsx` + reused `MoveInClockCard`) |

> M7.0 passed: a physical device held a WebSocket to Reverb and authorized a
> private channel. `lib/echo.ts` wraps `laravel-echo` + `pusher-js`, passing
> the resolved `Pusher` class explicitly (`options.Pusher`) since React
> Native has no `window.Pusher` global for Echo to fall back to — see that
> file's comment for why a plain default import of `pusher-js` breaks at
> runtime despite typechecking (two different builds, two different export
> shapes, one `.d.ts`). Echo is (re)created on sign-in with the fresh Bearer
> token and torn down on sign-out.
>
> M7.5 renders from `move_in_clock` on `ReservationResource` (shipped
> 2026-07-27) via the shared `MoveInClockCard` component — the same one
> M15.4 built. **Do not re-derive which clock is running** — that decision
> is server-side precisely so this screen and the web view cannot disagree.
> The stage stepper mirrors `_stage-stepper.blade.php`'s six-node model
> exactly, including its one derived rule ("Paid" = Signed + a held
> deposit) — read off `move_in_clock !== null` rather than a payments list,
> since a clock only exists while a deposit is held.
>
> Verified against the escrow fixtures through the real HTTP kernel:
> `GET /conversations/{id}` returned the exact shape `lib/conversations.ts`
> expects, `POST .../messages` and `POST .../resolve` both round-tripped
> correctly. One real finding: the store() response omits `is_read`/
> `is_system` (an `ApiResource::attr()` sparse-select artifact — a
> freshly-created model doesn't carry DB-default columns until refetched),
> so both are typed optional, not `boolean`, matching this codebase's
> established convention for that Resource behavior.
> polling and M7.5 still works.
>
> **This is the one module that can't be built ahead of you.** Everything
> else in this plan that didn't need a device was built through M15 — M7 is
> next once the Reverb check comes back.

### M8 — Reservation Management `~`
| # | Task | Status |
|---|---|---|
| M8.1 | Reservation inquiry form | ✔ |
| M8.2 | Reservations list + status filter | ✔ |
| M8.3 | Reservation detail + status journey stepper | ✔ |
| M8.4 | Cancel reservation | ✔ |
| M8.5 | Landlord reservation pipeline — advance / reject / cancel / mark turned over | ✕ |
| M8.6 | Walk-in tenant form | ✕ |

### M9 — Review and Rating System `✕`
| # | Task | Status |
|---|---|---|
| M9.1 | Star rating component | ✕ |
| M9.2 | Tenant submits property review | ✕ |
| M9.3 | Reviews on property detail | ~ (displayed, not submittable) |
| M9.4 | Landlord reply to review | ✕ |
| M9.5 | Landlord rates tenant | ✕ |

### M10 — Notification System `✕`
| # | Task | Status |
|---|---|---|
| M10.1 | **Server: `expo_push_token` + `ExpoPushNotifier` (A.1)** | ✕ |
| M10.2 | Register device token on login | ✕ |
| M10.3 | In-app notification list | ✕ |
| M10.4 | Mark read / mark all read | ✕ |
| M10.5 | Push receipt → deep-link into the right screen | ✕ |

> A.1 hangs push off `Notification::notify()`, the one factory every
> creation site already funnels through. Adding it anywhere else means some
> notification type silently never pushes.

### M11 — Occupancy Monitoring `✕`
| # | Task | Status |
|---|---|---|
| M11.1 | Occupancy dashboard (landlord) | ✕ |
| M11.2 | Unit status display (Available / Reserved / Occupied / Maintenance) | ✕ |

### M12 — Complaint and Reporting `✕`
| # | Task | Status |
|---|---|---|
| M12.1 | Server: `POST /reports` + `GET /tenant/reports` | ✔ |
| M12.2 | Report submission form | ✕ |
| M12.3 | My reports list | ✕ |

### M13 — Reports Module `✕`
| # | Task | Status |
|---|---|---|
| M13.1 | Landlord analytics — native charts | ✕ |
| M13.2 | Rent collections list | ✕ |
| M13.3 | Payouts (read-only) | ✕ |

> **CSV / PDF export is out of scope on mobile** (web WBS 13.4 has no mobile
> counterpart) — the server API deliberately doesn't expose it. A report is
> something to print or attach, not a phone screen.

### M14 — Build and Distribution `✕`
| # | Task | Status |
|---|---|---|
| M14.1 | EAS dev build for the test device | ✕ |
| M14.2 | App icon + splash | ✕ |
| M14.3 | Point `.env` at the deployed VPS API (depends on web WBS 14) | ✕ |
| M14.4 | End-to-end device testing against fixtures | ✕ |
| M14.5 | Defense demo rehearsal | ✕ |

> No app-store submission, no production EAS credentials, no OTA channel —
> the target is a demo-able companion app on one device.

### M15 — Payments and Escrow `~` *(no web WBS counterpart — see Context)*
| # | Task | Status |
|---|---|---|
| M15.1 | Agreement view + sign (`agree` + `accept_tc`) | ✔ |
| M15.2 | Initial payment — WebView checkout, `success_url` interception | ✔ |
| M15.3 | Payment reconcile | ✔ |
| M15.4 | Escrow status + move-in clock display (`move-in-clock.tsx`, reads `move_in_clock`, does not re-derive) | ✔ |
| M15.5 | Confirm move-in | ✔ |
| M15.6 | Dispute move-in | ✔ |
| M15.7 | Handover scheduling — propose / confirm | ✔ |
| M15.8 | Rent ledger | ✔ |
| M15.9 | Pay rent — WebView + reconcile (shares `payment-webview-flow.tsx` with M15.2) | ✔ |
| M15.10 | Landlord: record payment, remind, end tenancy | ✕ |

> Tenant money path (M15.1–M15.9) complete July 27 2026. Verified against
> `escrow:scenarios` fixtures through the real HTTP kernel — button logic
> matched the fixture table exactly across all five escrow states, including
> the overdue-but-still-confirmable case (#136) and the disputed case (#137)
> showing neither action. M15.10 waits on M3 (no landlord screens exist to
> host it in yet).

---

## Schedule

**Status July 27 2026:** M15.4–M15.9, M1.5, M3.6, M7 (all of it — chat, real-time,
resolve, stage stepper), and the A.1/A.2/A.4 server endpoints landed in one
session, ahead of the Week 1/2 slots below. M7.0 (the Reverb device check)
**passed** on hardware, which is what unblocked the rest of M7 the same day.
Dates below are now a floor, not a forecast — treat W1–W2 as already banked.

| Week | Dates | Modules |
|---|---|---|
| W1 | Aug 3–8 | ~~M15.4–M15.9~~ ✔ done July 27. M2.6 filters remains. |
| W2 | Aug 10–15 | ~~M7 chat (incl. M7.0 PASS)~~ ✔ done July 27. M10 push client remains (server ✔) |
| W3 | Aug 17–22 | ~~M1.5~~ ✔ done July 27. M1.6–M1.7 profile/social, M9 reviews, M12 client (server ✔) |
| W4 | Aug 24–29 | M3 landlord properties (~~A.2~~ ✔, M3.6 ✔, M3.7 pin picker remains), M2.7 map |
| W5 | Aug 31–Sep 5 | M5 units incl. live capture, M8.5–M8.6, M15.10 |
| W6 | Sep 7–12 | M11, M13, M14 build + device testing + rehearsal |

**Rationale for the order.** The tenant money path finishes first (W1)
because it is the most-demoed flow and is already 3 tasks from complete.
Chat and push come next (W2) because M7.0 is a hard gate — if a device
can't reach Reverb, several screens change shape, and that must surface in
week 2, not week 5. The role shell (M1.5) leads W3 because every landlord
module depends on it. Landlord work fills W4–W5, with the two hardest
items (pin picker, live camera capture) split across separate weeks rather
than stacked.

### If the schedule slips
Cut in this order, and say so rather than half-finishing:
1. **M13** analytics — read-only, least demoed
2. **M11** occupancy — same
3. **M2.7** map — browse works without it
4. **M3.6** KYC WebView — landlords can verify on web once; drops A.2 too
5. **M1.6** social login — email/password already works

Never cut: M15 (money path), M7 (chat), M8, M14.

---

## Verification

Per `context/RULES.md`, manual with fixtures — no test suite.

- Point the client at the server's `escrow:scenarios` and `walkin:scenarios`
  fixture accounts (`tenant@escrow-fixture.test` / `escrow-test-1234`).
  They build the backdated escrow and ledger states that are otherwise
  unreachable.
- Every module closes on a **physical device**, not Expo Web — camera
  capture, push and the WebView payment flow don't exist in the web preview.
- **Cross-client check per module:** perform each state transition on
  mobile, confirm the web view for the counterparty reflects it, and vice
  versa. Two clients driving one state machine is where this breaks.
