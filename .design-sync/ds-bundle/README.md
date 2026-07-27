# AbangananHub — design tokens

Tokens-only sync. AbangananHub's mobile client (this repo) is React Native +
Expo — there is no browser-renderable component build (no Storybook, no
bundlable `dist/`), so no live components are bound to this project. What's
synced here is the **locked brand palette**, so any design built in Claude
Design at least starts from the real colors instead of generic defaults.

## Source of truth

- Colors: `tailwind.config.js` → `theme.extend.colors` (mobile repo)
- Full usage rules and rationale: `context/DESIGN.md` §2 (mobile repo),
  which in turn inherits from the web app's `context/DESIGN.md` — the web
  app is canonical; this mobile repo does not reinvent the palette.

## Rules when designing with these tokens

- One accent for CTAs (`#FF8A65` / `--color-cta`) — everything else neutral
  or teal-family. Don't introduce a second call-to-action color.
- `--color-secondary` and `--color-accent` are fill/background only — never
  used as foreground text on white (fails WCAG AA contrast).
- Typography is intentionally **not fixed yet**: the web app uses
  Poppins (headings) + Inter (body) + Source Serif 4 (large titles only),
  but whether the mobile client loads those same web fonts or uses each
  platform's native system font (SF Pro / Roboto) is an open decision
  (`context/DESIGN.md` §3) — don't silently pick one when generating mobile
  screens; flag it as a fork to resolve.
- Native platform conventions apply on top of these tokens: 44×44pt / 48×48dp
  minimum touch targets, safe-area-aware layout, platform-native navigation
  chrome (see `context/DESIGN.md` §4).
