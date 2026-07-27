# DESIGN.md — Design System

## 0. Source of truth
The palette, tone, and identity are **inherited from the web app**, not
reinvented here — `../AbangananHub/context/DESIGN.md` is the canonical
source. Read it first. This file only translates fixed decisions (colors,
tone) and adds what's specific to a native client (touch targets, platform
conventions) — it does not restate the web app's Tailwind-specific rules
(§9 hover states, §11 CSS class audits) that don't apply to React Native.

## 1. Tone
Same as web: **trustworthy**, not playful/startup-trendy, not corporate
enterprise. Flat, structured, purposeful — color reserved for status, not
decoration.

## 2. Color Palette (locked, identical to web — do not drift)

| Role | Hex | Usage |
|---|---|---|
| Primary (Deep Ocean Blue) | `#156F8C` | Headers, key navigation elements |
| Secondary (Ocean Teal) | `#2AA7A1` | Primary buttons, icons, active states — fills/backgrounds only, **never as text on white** (fails WCAG AA) |
| Accent (Aqua) | `#69D2C6` | Badges, highlights — fills only, same contrast restriction |
| CTA (Soft Coral) | `#FF8A65` | Primary call-to-action buttons (locked hex — see the server repo's memory note on this; do not substitute another coral) |
| Background (Ice White) | `#F7FCFC` | Screen background |
| Section Background (Mist Blue) | `#EEF8F8` | Distinguishes content sections |
| Surface/Card (White) | `#FFFFFF` | Cards, sheets, modals |
| Text primary (Charcoal) | `#1F2937` | Headings, essential content |
| Text muted (Slate Gray) | `#64748B` | Descriptions, secondary labels |
| Borders (Soft Gray) | `#E2E8F0` | Card borders, dividers |
| Success (Emerald Green) | `#22C55E` | Confirmed/verified/paid states |
| Warning (Amber) | `#FBBF24` | Due, pending, caution |
| Error (Red) | `#EF4444` | Validation errors, overdue, failed |

**One accent for CTAs** (`#FF8A65`) — everything else neutral or teal-family.
`#2AA7A1`/`#69D2C6` are fill/background only, never foreground text.

## 3. Typography — native system fonts (decided 2026-07-27)
**SF Pro on iOS, Roboto on Android — React Native's default.** No
`expo-font`, no bundled font files, no loading gate.

Chosen over loading web's Poppins + Inter. The web trio (Poppins headings,
Inter body, Source Serif 4 for large page titles) stays on web. Reasons:

- **Nobody sees both at once.** Font parity across platforms buys
  consistency for an audience of one — the developer with both open. A
  tenant uses the app or the site, not both simultaneously.
- **System fonts are what "modern and native" means.** An app in Poppins
  reads as a website in a shell. SF Pro/Roboto are what every other app on
  the device uses, which is the point.
- **No FOUT, no bundle cost, no load gate.** `expo-font` would need a
  loading state before first paint on every cold start.
- **Source Serif 4 is dropped outright.** It exists on web for large page
  titles — a role with no mobile equivalent, since phone screens don't have
  hero titles at that scale. A serif used at 20px stops being a signal.

The palette (§2) is what carries the brand across platforms, not the
typeface. Do not add `expo-font` without revisiting this section.

**Type scale** (mirrors web's 12/14/16/20/24, minus the display sizes):

| Role | Size | Weight |
|---|---|---|
| Screen title | 24 | 800 (`font-black`) |
| Section heading | 17 | 700 |
| Card title | 15 | 600 |
| Body | 14 | 400 |
| Label / button | 13–15 | 500–600 |
| Caption / meta | 11–12 | 400–600 |

Weights stop at 800. Real system fonts have optical weights; stacking
`font-black` on small text just muddies it.

## 4. Platform Conventions (native-specific, no web equivalent)
- **Touch targets minimum 44×44pt** (iOS HIG) / 48×48dp (Material) — a
  button sized to match a web `<button>`'s padding is often too small to
  tap reliably.
- **Safe areas**: every screen respects `react-native-safe-area-context`
  (already installed) — no content under the notch/status bar/home
  indicator.
- **Platform-appropriate navigation chrome**: back gesture on iOS, hardware
  back button on Android — Expo Router handles this by default; don't
  fight it with a custom back button unless a screen genuinely needs one.
- **`prefers-reduced-motion` equivalent**: respect
  `AccessibilityInfo.isReduceMotionEnabled()` for any custom animation,
  same principle as the web app's `motion-reduce:` variants.

## 5. Styling approach — NativeWind (decided 2026-07-27)
Chosen over plain `StyleSheet.create` and a component library (Tamagui,
React Native Paper): NativeWind carries the web app's Tailwind-class
muscle memory and lets the locked palette (§2) live in one place —
`tailwind.config.js` `theme.extend.colors` — instead of scattered hex
literals per screen. A component library was rejected because its visual
defaults (buttons, cards, spacing) would need overriding throughout to
match the locked palette above, which is more upfront work than starting
from utility classes.

Setup (already done):
- `tailwind.config.js` — palette tokens named after the roles in §2
  (`primary`, `secondary`, `accent`, `cta`, `background`, `section`,
  `surface`, `text-primary`, `text-muted`, `border`, `success`,
  `warning`, `error`). Use these tokens (`bg-primary`, `text-error`),
  never raw hex, so a palette change only touches this file.
- `babel.config.js` / `metro.config.js` wire NativeWind's Babel preset
  and Metro transform.
- `src/global.css` — Tailwind directives, imported once in
  `src/app/_layout.tsx`.
- `nativewind-env.d.ts` — `className` prop typing on RN components.

Use utility classes (`className="bg-surface p-4 rounded-lg"`) on every
screen — don't mix in `StyleSheet.create` for new work; a mixed approach
across screens is worse than either choice alone.

## 6. What NOT to do
- Don't invent a new palette or "mobile-friendly" color adjustments — the
  brand is the brand across platforms.
- Don't build a second design system in parallel with web's — if a
  component's visual spec isn't obvious from this file, check the web
  app's rendered UI (or `../AbangananHub/context/DESIGN.md`) before
  guessing.

## 7. Mobile UI direction — minimal, modern, clean (decided 2026-07-27)

This is not a departure from web. Web's own §2 already reads "flat white
cards, structure and hierarchy do the work, color is reserved for status,"
and it retired glassmorphism in July 2026 for exactly that. Mobile
**intensifies** that direction, because a 390px-wide screen punishes
decoration far faster than a 1400px one does.

Concrete rules — each is checkable in review, not a vibe:

**a. Flat fills only. No gradients.** The `GradientButton`
(`bg-gradient-to-r from-[#2AA7A1] to-[#156F8C]`, ported from web's auth
modal) was **deleted 2026-07-27** and replaced by
`src/components/ui/button.tsx`. Solid `#2AA7A1` for primary actions, solid
`#FF8A65` for the CTA. A gradient is decoration doing a job that a solid
fill does better and more legibly at phone scale.

**b. One button component.** `ui/button.tsx`, four variants —
`primary` (teal), `cta` (coral), `outline`, `danger`. Every variant is 48px
tall, clearing the §4 touch-target minimum without call sites remembering
it. **Don't hand-roll a `Pressable` styled as a button**; the app had five
bespoke ones before this rule existed. A `Pressable` is still correct for
things that aren't buttons — checkbox rows, list rows, cards.

**c. One coral CTA per screen, at most.** Two `variant="cta"` buttons on
one screen means neither is the call to action. Everything else is
`primary` or `outline`.

**d. Cards keep the hairline border.** `border border-border` on
`bg-surface`, `rounded-2xl`, over the `#F7FCFC` background — same signature
as web. **No shadows**: Android elevation and iOS shadow don't match, and
chasing parity between them costs more than the border does. The border
alone is enough separation on a quiet background.

**e. Whitespace over dividers.** Prefer a gap between elements to a rule
between them. Internal dividers only inside a grouped list where rows must
read as one surface (the agreement's terms table, an info row stack).

**f. Color earns its place.** Teal/coral/amber/red/green mean something —
status, or an action. Nothing is tinted because it looked plain. A screen
whose only color is the one button is working correctly.

**g. Icons are 15–18px, muted by default.** `#64748B` unless the icon is
carrying status (then the status color) or sitting on a filled button
(then white). Icon-only controls still need a 44pt hit area.

**h. Radius scale: `rounded-lg` (8) / `rounded-xl` (12) / `rounded-2xl`
(16).** Cards and sheets `2xl`, buttons and inputs `xl`, small chips and
icon tiles `lg`. Pills (`rounded-full`) for status badges only.

**i. Empty and loading states are designed, not afterthoughts.** Every
list screen has one: a muted icon, a one-line statement of fact, and a
sentence saying what to do about it. They are the first thing a panel sees
on a fresh account.

### Still unused after this decision
`expo-linear-gradient` remains in `package.json` but nothing imports it.
Left installed rather than removed mid-sprint — if nothing needs it by M14,
drop it.

## 8. Screen patterns (decided 2026-07-27, from the tenant prototype)

The tenant gave a six-screen prototype (Browse, Saved, Messages,
Reservations, Profile) to lock visual consistency against. These patterns
are now canonical — match them rather than improvising a new shape when a
new screen needs one of these elements.

**Tab bar order and labels:** Browse, Saved, Messages, Reservations,
Profile — exact prototype order and wording, not "Home"/"Favorites"/
"Account". `app-tabs.tsx` is the source of truth.

**The dark hero is a one-time exception to §7's flat/light rule**, not a
precedent for more of them. `bg-[#0F172A]` — the same navy the web app's
footer already uses (`footer-dark-bg-exception` in the server repo's own
design memory) — appears exactly once, at the top of Browse. `accent`
(`#69D2C6`) is used as **foreground text** inside it, which §2 forbids
everywhere else — the ban is about accent-on-white failing WCAG; on this
dark navy the contrast is fine, the same reasoning that lets the web
footer do it. Don't extend the dark treatment to other screens or extend
accent-as-text onto any light background.

**Floating overlap card:** a white rounded element that overlaps the
bottom edge of the section above it by `-mt-4`/`-mt-5` (Browse's search
bar over the hero, Profile's stat tiles over the teal header band). Use
sparingly — it's a "this connects to what's above it" signal, not a
default card treatment.

**`PropertyCard` has two variants, one component** (`property-card.tsx`):
`list` (full-width — photo, category badge top-left, heart top-right,
title, address in `primary` — not `secondary`, which fails WCAG on white —
rating, price right-aligned) and `featured` (compact, fixed-width, for
horizontal scrollers — badge + title + price only, no room for address/
rating at that width). Don't create a third card component; add a variant
if a new context needs one.

**Stat tiles**: three bordered `rounded-2xl` cards in a row, big bold
number on top, small muted label below (`Reservations`' Total/In Progress/
Occupied, `Profile`'s Saved/Reservations). The number's color carries
meaning when the stat has one (amber for in-progress, green for occupied);
neutral `text-primary` otherwise. Never fabricate a number the API doesn't
provide — an honest `—` beats a guess (see Profile's Rating tile, omitted
entirely until a real endpoint exists, rather than hardcoding one).

**Status pills**: `rounded-full` chip, tinted background, bold text in the
matching status color — the one place `text-secondary`/`text-success`/etc.
as foreground text is fine, because the background is tinted, not white.

**Filter/category pills**: horizontal scroll, unselected = `border-border`
outline on `surface`, selected = solid `bg-secondary` with white text. Used
for both the type filter chips and the popular-areas chips.
