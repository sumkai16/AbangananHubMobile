# ARCHITECTURE.md — System Architecture

## 1. Stack Summary
- Framework: Expo SDK 57, React Native 0.86, React 19
- Language: TypeScript
- Navigation: Expo Router (file-based, `src/app/`)
- Auth: Bearer token (Laravel Sanctum) stored via `expo-secure-store`, never AsyncStorage — a Sanctum token is a credential, not app state
- Real-time: `laravel-echo` + `pusher-js` against the server's Reverb instance (installed, not yet wired to a screen)
- Payments/verification: `react-native-webview`, opening the server's existing hosted-checkout / verification-wizard web pages rather than reimplementing them natively (see Design Decisions)
- Server: Laravel 12 + Sanctum API at `../AbangananHub`, consumed at `/api/v1` — this repo owns no data, no business logic, no validation rules beyond form-level UX. The source of truth for "what does this endpoint return" is the server's `app/Http/Resources/` and controllers, not this file.

## 2. Current State (as of 2026-07-27)
`src/lib/api.ts` + `src/lib/auth.ts` — a typed API client and
login/register/logout helpers. `src/lib/auth-context.tsx` — `AuthProvider`/
`useAuth()`, the one global-state exception `RULES.md` allows, exposing
`{ user, isAuthenticated, isLoading, signIn, signUp, signOut }`.

Routing is now auth-gated: `src/app/_layout.tsx` wraps the tree in
`AuthProvider` and renders a root `Stack` with `Stack.Protected` guards —
`(tabs)` (the default Expo tabs template, `index.tsx`/`explore.tsx`) when
`isAuthenticated`, `(auth)` (`login.tsx`/`register.tsx`) otherwise. Route
groups are transparent in the URL, so links use `/login`/`/register`, not
`/(auth)/login`. NativeWind is wired (see `DESIGN.md` §5) and the auth
screens use it.

**Browse & property detail (2026-07-27):** `src/lib/properties.ts` — typed
`listProperties`/`getProperty`/`toggleFavorite` against `GET /properties`,
`GET /properties/{id}`, `POST /favorites/{id}/toggle`. The Home tab
(`(tabs)/index.tsx`) is a two-column `FlatList` of `PropertyCard`s with
location search (search-on-submit, not per-keystroke) and infinite scroll;
`property/[id].tsx` is a top-level route (not inside `(tabs)`), pushed as a
stack screen over the tabs, showing the image carousel, units, amenities,
and a favorite toggle. Both are optimistic-then-reconciled on favorite
toggle, matching the web app's pattern. **Deferred, not built:** the map
view, and the type/price/verified filter chips the web version has (user
chose "list + basic search only" as the first cut — see `PRD.md`).

**Not yet built:** anything past auth + browse/detail — no reservation
flow, no chat, no profile screens. **Do not assume anything beyond this
exists** — read `src/` before planning new work.

## 3. API Client (`src/lib/api.ts`)
Token storage goes through `src/lib/token-storage.ts`, not `expo-secure-store`
directly — `SecureStore` has no web implementation and throws when called
from `npx expo start --web` (`getValueWithKeyAsync is not a function`). The
wrapper uses `SecureStore` on iOS/Android and falls back to `localStorage`
on web. This only matters for web smoke-testing; the real app is native.

An `axios` instance with two interceptors:
- **Request:** attaches `Authorization: Bearer <token>` from
  `expo-secure-store`, read fresh on every request rather than cached in a
  variable — so a token refresh or logout takes effect on the very next
  call with no extra plumbing.
- **Response:** on a 401, clears the stored token. A 401 means the token is
  dead — either the user logged out elsewhere, or the account was suspended
  server-side (`EnsureAccountActive` revokes the presenting token; see the
  server's `ARCHITECTURE.md`). The client doesn't try to distinguish those
  cases; both mean "show the logged-out state."

`baseURL` comes from `EXPO_PUBLIC_API_URL` (`.env`, gitignored — see
`.env.example`). **This must be a LAN IP, not `127.0.0.1`/`localhost`** — a
physical device or emulator resolves those to itself, not the dev machine.
Android emulators (not physical devices) can alternatively use the special
alias `10.0.2.2`.

## 4. Auth (`src/lib/auth.ts`)
`login()`/`register()` call `Api\AuthController` (`../AbangananHub`), both
of which return the same `{user, token, roles}` shape (unified 2026-07-27 —
see the server's ARCHITECTURE.md Key Decisions Log) so the client has one
code path for "I am now signed in" regardless of which endpoint got there.
`logout()` calls the server to revoke the token, then clears it locally
inside a `finally` — even if the network call fails, the user's intent is
to be logged out on this device.

The persisted-auth-state provider now exists (`auth-context.tsx`, above).
It answers `isAuthenticated` from token *presence* only — there is no
`/me` endpoint yet, so `user` stays `null` across an app restart until the
next login; screens needing user details can't rely on it surviving a
restart yet. A 401 elsewhere in the app (via `api.ts`'s response
interceptor) clears the stored token but does not yet notify
`AuthProvider`, so `isAuthenticated` can go stale mid-session until the
next restart or explicit `signOut()` — fine for now since no screen reacts
to session death beyond the next API call failing, but worth an event
bridge once that matters.

**Not yet built:** the native Google/Facebook sign-in flow — the server's
`POST /api/v1/auth/{provider}/token` endpoint exists specifically for this
and has never been called by anything; see the server's ARCHITECTURE.md.

## 5. Design Decisions (carried over from `plans/mobile-app.md` in the server repo)

**Payments open a WebView, not a native PayMongo SDK.** The checkout
endpoints (`pay`, `payRent`) return a `checkout_url` as JSON instead of
redirecting; the app opens it in a WebView and **intercepts navigation to
`success_url` instead of letting the WebView load it**, then calls the
matching `/payment/reconcile` endpoint. Chosen over a native payment SDK
because the server's webhook + escrow logic has no automated test coverage
and a second payment integration would need to stay in lockstep with it
forever — see the server repo's `ARCHITECTURE.md` Key Decisions Log,
2026-07-27 entries.

**Landlord verification also opens a WebView (planned, not built).** The
web verification wizard does live face-api.js liveness detection with a
per-user calibrated pitch baseline — porting that to React Native means
finding a native equivalent for the tiny 68-point landmark model and
re-tuning every threshold, for a flow each landlord completes exactly once.
Needs a token-to-session bridge endpoint on the server first (not built).

**No Redux/MobX/Zustand.** See `RULES.md` § State Management. A
data-fetching library (React Query, most likely) is the next real
architectural addition once there are enough screens to justify one — not
installed yet, don't add it speculatively.

## 6. Open Questions
- **A physical device reaching Reverb has not been proven.** The server's
  Phase 0 probe verified the broadcasting-auth *logic* in-process; it did
  not verify a phone can hold a live WebSocket to the dev machine over LAN.
  Test this before building the chat screen, not after.
## 7. Resolved

**"Which escrow clock is currently running" — resolved server-side,
2026-07-27.** `ReservationResource` now serializes `move_in_clock`:
`{active_clock: 'turnover'|'confirmation'|null, deadline_at,
days_remaining, disputed}`, computed by `Reservation::moveInClockState()`.
The web app's `_move-in-clock.blade.php` was refactored onto that same
method at the same time, so the Blade partial and this client read one
answer rather than two derivations that could disagree about which clock is
live. **Read `move_in_clock` — do not re-derive it here** from the raw
`keys_turned_over_at` / `move_in_deadline_at` timestamps, which are also in
the payload but are not sufficient on their own (Clock 1 falls back to a
computed deadline before the nightly backfill runs).
