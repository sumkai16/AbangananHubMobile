# CLAUDE.md

This is the React Native + Expo client for **AbangananHub**, a rental
marketplace whose server (Laravel, `/api/v1`) lives in the sibling repo at
`../AbangananHub`. This repo is client-only — no PHP, no migrations, no
Blade. When a change needs a new endpoint or a server-side fix, that work
happens in `../AbangananHub`, not here.

Project context and rules live in `context/`:
- `context/RULES.md` — coding & implementation rules (SOLID/DRY/KISS, naming, error handling, state management)
- `context/ARCHITECTURE.md` — app architecture, navigation, API client, auth, real-time
- `context/DESIGN.md` — design system / UI conventions (palette is inherited from the web app, not reinvented)
- `context/PRD.md` — product requirements for the mobile client specifically

Read the relevant file(s) before non-trivial work. If a question can only be
answered by the server (an endpoint's exact response shape, a validation
rule, a policy check), read the source in `../AbangananHub` rather than
guessing — the API Resources and FormRequests there are the actual contract.

## Planning
When finalizing a plan (plan mode), save a copy into `plans/` in this repo
(descriptive kebab-case filename), in addition to the default plan-mode
location. Keeps design decisions and their reasoning versioned alongside the
code instead of only living in a local scratch file.

## Git commits
Author commits as the user only. Do not add a `Co-Authored-By: Claude` (or
any AI) trailer.
