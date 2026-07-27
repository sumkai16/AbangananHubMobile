# Mobile Client Bootstrap

**Date:** 2026-07-27
**Status:** Done.

## Context
`../AbangananHub/plans/mobile-app.md` planned and shipped the server-side
work (66 API routes) needed before a mobile client could exist. This is the
matching bootstrap on the client side: create the Expo project, wire a
minimal API client, and set up the same governance structure
(`CLAUDE.md`/`context/`/`plans/`/`docs/`) the server repo uses, adapted to
this stack.

## What was decided
- **Location:** sibling repo at `C:\Projects\AbangananHubMobile`, not a
  subfolder of `AbangananHub` — separate git history, separate release
  cycle, doesn't couple the PHP/Composer and npm/RN toolchains in one repo.
- **TypeScript**, not JavaScript — the server API now returns a stable
  typed shape via `app/Http/Resources`, so TS lets the client catch a
  drifted field name at compile time instead of on a phone at runtime.
- **Expo Router** (file-based, `src/app/`), the current Expo default,
  over manually wiring React Navigation stacks.

## What was built
- `npx create-expo-app` scaffold — Expo SDK 57, React Native 0.86, React 19,
  TypeScript, Expo Router, default tabs template.
- Installed: `expo-secure-store` (token storage), `react-native-webview`
  (payment/verification WebView flows), `laravel-echo` + `pusher-js`
  (Reverb, unwired), `axios`.
- `src/lib/api.ts` — axios instance, Bearer token attached from
  `expo-secure-store` on every request, 401 clears the stored token.
- `src/lib/auth.ts` — `login`/`register`/`logout`, typed against
  `Api\AuthController`'s actual `{user, token, roles}` response shape.
- `.env.example` / `.env` — `EXPO_PUBLIC_API_URL` etc. `.env` added to
  `.gitignore` (it wasn't by the default template — only `.env*.local`
  was ignored).
- Governance structure mirroring the server repo: this `plans/` dir,
  `context/{RULES,ARCHITECTURE,DESIGN,PRD}.md`, `docs/specs/`, `CLAUDE.md`.

## Verified
- `npx tsc --noEmit` — `src/lib/api.ts` and `auth.ts` type-check clean (two
  pre-existing template errors in unrelated files, not introduced by this
  work — missing `expo-env.d.ts`/CSS-module types, generated on first
  `expo start`).
- Started the Laravel server with `php artisan serve --host=0.0.0.0
  --port=8000` and confirmed `http://<LAN IP>:8000/api/v1/properties`
  returns real data over the same address the `.env` is configured to use
  — not just localhost working by coincidence.

## Not done (see `context/ARCHITECTURE.md` § Open Questions)
- No screens beyond the default template. No auth flow wired to a UI. No
  navigation structure beyond the two default tabs.
- Reverb reachability from a physical device is unverified.
- Styling approach (NativeWind vs. StyleSheet vs. component library) is
  undecided — see `context/DESIGN.md` § 5.
- "Which escrow clock is running" isn't in the API response yet — a small
  server-side addition needed before the move-in-clock screen can be built
  without re-deriving logic that already lives in a Blade partial.
