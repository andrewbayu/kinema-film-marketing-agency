# CLAUDE.md

Working context for Claude Code on the Kinema project. This file is committed to
git, so it travels across devices. (Personal/machine-local memory in `~/.claude/`
does NOT travel — put anything that should persist across machines here.)

For product overview, stack, and full setup, see `README.md`. This file is the
"where are we / what's next" log, not a duplicate of the README.

---

## PENDING ACTIONS — Phase 1c not yet merged (as of 2026-05-28)

These are the open steps Andrew has NOT done yet. Work top to bottom. Delete a
checkbox once done; delete this whole section once Phase 1c is merged + synced.

Branch with all the work: `worktree-phase-1c-client-hierarchy` (fully pushed to
origin).

> **STATUS UPDATE — 2026-05-28, later (Windows PC session):**
> Verified the fresh Windows clone is healthy — `tsc --noEmit` clean and `npm run
> dev` boots on localhost:3000. Andrew **chose to SKIP the manual browser
> smoke-test** (step 1 below) and go straight to the PR. So the **immediate next
> action is step 2 — create the PR** — but he had to leave before doing it, and is
> **continuing on the MacBook.**
>
> **On the Mac, do this first:**
> ```
> git checkout worktree-phase-1c-client-hierarchy
> git pull            # fast-forwards to pick up this CLAUDE.md update
> ```
> The Mac already has node_modules + `.env`, so no reinstall needed (unless `git
> pull` warns the type-check is red — see the firebase-admin note in Run / dev
> gotchas). Then go to **step 2**. Step 1 is optional; run it only if you want the
> manual click-through before merging.

### 1. (Optional — DEFERRED by choice on 2026-05-28) Smoke-test locally first

```
git fetch origin
git checkout worktree-phase-1c-client-hierarchy
npm install          # node_modules is gitignored — needed on a fresh clone
npm run dev          # needs .env present (see Run / dev gotchas below)
```
Open http://localhost:3000 and verify:
- [ ] Click a film in Campaigns → URL becomes `/clients/<clientId>/films/<filmId>/audience-dna`
- [ ] Refresh that deep URL → page still loads (does NOT bounce to home); activeClient + activeFilm rehydrate
- [ ] Back/forward across tools (AudienceDNA ↔ BoxPredict ↔ etc.) keeps the same film
- [ ] Sidebar dropdown under "CLIENT" → switch client → a film from a different client clears
- [ ] Campaigns + Library + Overview show films grouped under client-name headers (Unassigned last)
- [ ] Edit a film → Client dropdown appears at top of the modal → changing it moves the film to another client on save
- [ ] Legacy flat route `/audience-dna` still loads (uses activeFilm from context)

If anything breaks: fix on the SAME branch, commit, push. Don't start a new branch.

### 2. Open the Pull Request

`gh` CLI is NOT installed locally, so open it in the browser:

URL: https://github.com/andrewbayu/kinema-film-marketing-agency/pull/new/worktree-phase-1c-client-hierarchy

- Base branch: `main`  ·  Compare branch: `worktree-phase-1c-client-hierarchy`
- Title: `Phase 1c — film-scoped URLs, switcher, grouping, reassign`
- Body (paste this):

```markdown
## Summary
Closes Phase 1b deferred items so the Client→Film hierarchy is first-class.

- URL routing /clients/:clientId/films/:filmId/<tool> — new FilmRouteSync layout
  makes the URL the source of truth. Legacy flat routes kept for back-compat.
- Sidebar client-switcher dropdown (replaces the read-only ACTIVE CLIENT block).
  Tool nav links resolve to film-scoped URLs when a film is active.
- Library + Overview grouped by Client (mirrors Campaigns; Overview groups the
  top-5 slice).
- Reassign film via EditCampaignModal client picker.

New: src/lib/routes.ts (URL builders), src/components/layout/FilmRouteSync.tsx.
Also adds scripts/migrate-clients-to-client-users.ts (one-off; not needed now).

## Verified
- tsc --noEmit clean, vite build succeeds.

## Pre-merge / pre-deploy checklist
- [ ] Browser smoke-test: deep-link refresh, back/forward across tools, sidebar
      switcher (incl. cross-client film clearing), reassign flow, grouped headers.
- [x] Firestore `clients`→`client_users` migration: NOT needed — no non-team
      portal users have ever signed in (confirmed 2026-05-28). The script is in
      the repo only for if that changes later.
```

- Click **Create pull request**.

### 3. Merge

On the PR page:
- [ ] Click **Merge pull request** → **Confirm merge**
- [ ] (Optional) **Delete branch** to clean up the remote branch

After merge, Vercel auto-deploys from `main` (if that hookup is configured) and
the new code goes live.

### 4. Sync local `main` (every machine you use)

```
git checkout main
git pull
```

Note: on the Mac, local `main` is currently 1 commit ahead of origin/main (a
leftover fast-forward that was never pushed — it's a duplicate of what's on the
branch, harmless). After the PR merges, `git pull` reconciles it. If git
complains about divergence, `git reset --hard origin/main` on `main` is safe
here because the work is preserved on the merged branch — but ONLY do that with
Andrew's say-so.

### 5. Moving to the Windows PC

All code is on GitHub, so just clone there:
```
git clone git@github.com:andrewbayu/kinema-film-marketing-agency.git
cd kinema-film-marketing-agency
git checkout worktree-phase-1c-client-hierarchy   # or `main` after the PR merges
npm install
```
Then recreate `.env` by hand (it is gitignored — copy the values from the Mac's
`.env`): `GEMINI_API_KEY`, `FIRECRAWL_API_KEY`, and the Firebase client config.
Then `npm run dev`. Do NOT copy the git *worktree* across machines — it's
machine-specific; just `git checkout` the branch directly on Windows.

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
- **Phase 1c** (branch `worktree-phase-1c-client-hierarchy`, commits a72c470 +
  dc0149b) — film-scoped URLs `/clients/:clientId/films/:filmId/<tool>`, sidebar
  client-switcher dropdown, Library + Overview grouped by Client, reassign film
  between clients via EditCampaignModal. STATUS: pushed, PR not yet merged.

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

Recommended ordering: merge Phase 1c first, then start #1.
