# RULES.md — Coding & Implementation Rules

These mirror `../AbangananHub/context/RULES.md`'s intent and process —
plan-before-implementing, DRY at the right threshold, money paths get extra
care — translated to this stack (Expo, TypeScript, React Native) instead of
copied verbatim, since this is a client consuming an API, not a server
owning a database.

## Core Principles
- **SOLID** — especially Single Responsibility. A screen component fetches
  and renders; API calls live in `src/lib/`, not inlined in a component.
- **DRY** — extract when logic repeats 3+ times, not before. A hook used by
  two screens is still worth extracting if the alternative is copy-pasted
  fetch/loading/error state.
- **KISS** — default to the boring, obvious Expo/React Native solution. No
  Redux, no MobX, no custom state-management framework until a real need
  outgrows `useState`/`useContext` — see State Management below.

## Plan Before Implementing
Same discipline as the server repo: **no feature or non-trivial screen
starts with an edit.**
1. **Investigate first** — read the relevant API controller/Resource in
   `../AbangananHub` before assuming a response shape. Read the existing
   screens/hooks in this repo before adding a new pattern next to one that
   already does the same thing differently.
2. **Present the plan** — approach, files touched, design decisions.
3. **Ask about real forks only** — UX pattern, navigation structure, data
   shape. Don't ask about anything with an obvious default.
4. **Then implement.**

Use plan mode for anything multi-screen or design-bearing. Skip the ceremony
for a one-line fix, a rename, or a typo.

## Naming
- Variables/functions: camelCase (`reservationStatus`, `getVerifiedLandlords()`)
- Components/files: PascalCase for components (`PropertyCard.tsx`), kebab-case
  for Expo Router route files (`app/property/[id].tsx` — the bracket syntax
  is the router's, not a naming choice)
- Types/interfaces: PascalCase (`AuthUser`, `PropertyResource`)
- Hooks: `use` prefix, camelCase (`useAuth`, `usePropertyList`)
- API client functions: verb-first, matching the server action they call
  (`payRent`, `confirmMoveIn` — name them after the Laravel controller
  method they hit, so the two are easy to correlate)

## Error Handling
- **Every API call site handles the error case explicitly** — a try/catch
  around the `api.*` call, or a query library's built-in error state. A
  silently-swallowed rejected promise is the mobile equivalent of an empty
  `catch {}` block, and just as forbidden.
- **422 (validation) errors from the API carry an `errors` object per field**
  — match them to form fields the same way Laravel's own `@error` directive
  would, don't just show a generic toast for a validation failure.
- **401 means the token is dead** — `src/lib/api.ts`'s response interceptor
  already clears it; screens should react to "logged out" state, not retry.
- Never `console.log` left in committed code — use a real logger or nothing.
- No swallowed promise rejections (`.catch(() => {})`).

## State Management
- Server data (properties, reservations, conversations) is **not**
  duplicated into global client state by hand — fetch it where it's needed,
  cache it with a data-fetching library once the app has enough screens to
  justify one (React Query is the natural fit given the API's shape; not
  installed yet — see ARCHITECTURE.md).
- Local UI state (form fields, modal open/closed) stays in `useState` on the
  component that owns it. Don't lift state further than the screen that
  needs it.
- Auth state (current user, token presence) is the one thing that
  legitimately needs to be global — a context provider, not a full state
  library, for that alone.

## Money & Escrow Screens
The server repo's `context/RULES.md` has a whole section on money-moving
code because the escrow and rent-payment logic runs unattended and moves
real (sandbox) money. On the client, the equivalent discipline is narrower
but still real:
- **Never compute an amount client-side and send it to the server.** Every
  payment endpoint (`pay`, `payRent`) resolves the amount server-side from
  the reservation/ledger — the client's job is to display what the server
  says, not to calculate and assert a number. This mirrors the server's own
  rule (`Tenant\PaymentController`: "never trust a client-supplied period or
  amount").
- **The WebView payment flow intercepts navigation, it doesn't trust it.**
  When the WebView navigates to `success_url`, treat that as "go call
  `/payment/reconcile`", not as "payment succeeded" — the reconcile
  endpoint is the source of truth, since PayMongo's redirect can fire before
  the webhook lands.
- Disable the pay button while a checkout session request is in flight — a
  double-tap on a slow connection is the mobile version of the double-click
  the server's row-locking exists to survive.

## Testing
- No automated test suite yet, matching the server repo's capstone-scope
  choice. Manual testing against the server's dev fixtures
  (`escrow:scenarios`, `walkin:scenarios` in `../AbangananHub`) is the
  pattern — log in as the fixture accounts those commands print, don't
  hand-build test data in the app.
- **Test on a physical device or a real emulator early, not just Expo Web.**
  Camera capture (verification, unit photos), the WebView payment flow, and
  push notifications don't exist in the web preview — a screen that "works"
  in `npm run web` can be untested in the ways that matter most.
- `EXPO_PUBLIC_API_URL` must point at a LAN IP, never `127.0.0.1`/`localhost`
  — see `.env.example`. If the app can't reach the API, check this first.

## Git Discipline
- Conventional commits (`feat:`, `fix:`, `chore:`, `docs:`)
- Separate commits per concern
- Never `git add .` across unrelated work
- This repo and `../AbangananHub` are independent git histories — a change
  that touches both a new endpoint and its screen is two commits in two
  repos, not one.

## Build Order (Layer-by-Layer)
1. Confirm the API contract exists (read the controller + Resource in
   `../AbangananHub`, or add it there first if it doesn't)
2. `src/lib/` — the typed API call(s) the screen needs
3. Screen component — fetch, loading/error states, render
4. Wire into navigation (`app/` route file)
Confirm output at each step before proceeding to the next.
