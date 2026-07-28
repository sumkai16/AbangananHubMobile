# Swap Ionicons → lucide-react-native (app-wide)

## Context
Full swap from `@expo/vector-icons`'s `Ionicons` to `lucide-react-native`
across all 34 files that import it. `lucide-react-native` and its peer
dependency `react-native-svg` are installed.

Key difference: Ionicons has separate filled/outline icon names
(`'heart'`/`'heart-outline'`); Lucide has one icon per concept, toggled
via the `fill` prop instead. Three places accept an icon identity as a
prop/value (`Button.icon`, `MenuRow.icon` in account.tsx, `InfoRow.icon`
in reservation/[id]/index.tsx) — these change from a string-name type to
`LucideIcon` (component reference), same for two lookup tables
(`notifications.tsx`'s `TYPE_ICON`, `search.tsx`'s `BROWSE_TYPES`).

## Icon name mapping
alert-circle(-outline)→AlertCircle · arrow-back→ArrowLeft · bed-outline→Bed
· business-outline→Building2 · calendar-outline→Calendar ·
card-outline→CreditCard · cash-outline→Banknote ·
chatbubble(-outline)→MessageCircle · checkmark→Check ·
checkmark-circle→CheckCircle2 · checkmark-done-outline→CheckCheck ·
chevron-back→ChevronLeft · chevron-forward→ChevronRight ·
close→X · close-circle→XCircle · document-text(-outline)→FileText ·
eye-outline→Eye · eye-off-outline→EyeOff · flag-outline→Flag ·
grid(-outline)→LayoutGrid · heart(-outline)→Heart (fill toggle) ·
home(-outline)→Home (fill toggle) · location-outline→MapPin ·
lock-closed-outline→Lock · log-in-outline→LogIn ·
notifications(-outline)→Bell (fill toggle) · person-outline→User ·
receipt-outline→Receipt · ribbon-outline→Award · search→Search ·
share-outline→Share2 · shield-checkmark→ShieldCheck ·
square-outline→Square · star(-outline)→Star (fill toggle) ·
swap-vertical→ArrowUpDown · time-outline→Clock

## Status: Implemented
All 34 files migrated. Fixed-name call sites swapped 1:1
(`<Ionicons name="x" .../>` → `<IconX .../>`). Ternary filled/outline
sites (heart, star, tab bar icons) now toggle `fill` on one component.
Genuinely-different-icon ternaries (move-in-clock, payment-webview-flow)
resolved via a local `const Icon = condition ? A : B`. Prop-typed sites
(`Button`, `MenuRow`, `InfoRow`, `TYPE_ICON`, `BROWSE_TYPES`) changed from
Ionicons name strings to `LucideIcon` component references.

## Verification
- `npx tsc --noEmit` clean.
- `npx expo lint` clean (no unused Ionicons imports left).
- `grep -rn "Ionicons" src/` returns nothing.
