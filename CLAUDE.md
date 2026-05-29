# CLAUDE.md

Working context for Claude Code on the Kinema project. This file is committed to
git, so it travels across devices. (Personal/machine-local memory in `~/.claude/`
does NOT travel — put anything that should persist across machines here.)

For product overview, stack, and full setup, see `README.md`. This file is the
"where are we / what's next" log, not a duplicate of the README.

---

## Run / dev gotchas

- `npm run dev` needs a `.env` file (gitignored, so NOT in the repo). Required:
  `GEMINI_API_KEY`, `FIRECRAWL_API_KEY`, and the Firebase client config. Without
  these the server crashes on boot (Firecrawl throws "API key is required").
  When moving to a new machine, recreate `.env` by hand.
- `npm run lint` = `tsc --noEmit` (type-check, no separate test suite).
- After cloning on a new machine: `npm install` (node_modules is gitignored).
- **Fresh-clone gotcha (seen on Windows 2026-05-28):** if `npm run lint` fails
  with `Cannot find module 'firebase-admin/...'` errors, they're ALL in
  `scripts/migrate-clients-to-client-users.ts` (a one-off, not part of the app).
  Cause: the first `npm install` didn't pull `firebase-admin` (a devDependency).
  Fix: just re-run `npm install` — it's not a real regression. The app itself
  type-checks fine without it.

## Architecture quick map

- `src/hooks/useFilmContext.tsx` — holds `activeClient` + `activeFilm` (React
  state + localStorage). Switching client auto-clears a film that belongs to a
  different client.
- `src/services/dbService.ts` — all Firestore CRUD.
- `src/lib/routes.ts` — URL builders for the Client→Film hierarchy.
- `src/components/layout/FilmRouteSync.tsx` — for `/clients/:clientId/films/:filmId/*`
  routes, reads URL params and hydrates context (URL is the source of truth).
- `firestore.rules` — per-tenant security rules. `security_spec.md` documents the
  invariants.

## Client → Film hierarchy (the current big initiative)

Goal: introduce a Client entity (production house / studio / indie producer) as
the parent of Film, and surface it across the app.

Phase log:

- **Phase 0** (1443248) — hygiene before the refactor.
- **Phase 1a** (373a70f) — Client entity schema, dbService methods, Firestore
  rules. Renamed the legacy `clients` auth-allowlist collection to `client_users`
  so the `clients` name could be reused for the Client entity. Zero UI changes.
- **Phase 1b** (97ab0ac) — Clients page, one-click migration tool for
  unassigned campaigns, New Campaign requires a Client, sidebar shows active
  client, Campaigns page grouped by Client.
- **Phase 1c** (commits a72c470 + dc0149b) — film-scoped URLs
  `/clients/:clientId/films/:filmId/<tool>`, sidebar client-switcher dropdown,
  Library + Overview grouped by Client, reassign film between clients via
  EditCampaignModal. **MERGED to `main` via PR #1 on 2026-05-29** (merge commit
  `1faca79`; feature branch deleted). Vercel auto-deploys from `main`. Note: the
  browser smoke-test was skipped before merge, so exercise the new routes
  (deep-link refresh, back/forward across tools, sidebar switcher incl.
  cross-client film clearing, reassign) on the live deploy if anything looks off.

### Legacy `clients` → `client_users` migration

A script exists at `scripts/migrate-clients-to-client-users.ts`
(`npm run migrate:clients`, dry-run by default). **It is NOT needed right now**:
as of 2026-05-28 no non-team users have ever signed in to the portal, so the old
`clients` auth-allowlist collection is empty. Only run it if you later onboard
client-portal users (people from a production house) who predate Phase 1a.

## What's next (Phase 2 candidates, none started)

1. Wire `activeClient` into Campaigns + Library as a *filter* (recommended — the
   sidebar switcher currently sets context but neither page scopes to it, so the
   switcher feels half-built).
2. Client-detail page at `/clients/:clientId` (that client's films + retainer /
   engagement at a glance).
3. Member / access management — `Client.members[]` exists in the type but has no
   UI yet; needed before onboarding the first non-team portal user.

Phase 1c is merged, so the recommended next step is #1.
