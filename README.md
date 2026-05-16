# Kinema

Data-driven film marketing platform for the Indonesian theatrical market. A joint venture between Kata.ai and Samara Group.

Kinema combines a curated Gemini system prompt (encoding Indonesian market priors — release-window multipliers, genre baselines, production-house landscape, platform dynamics) with web-grounded data from Firecrawl to produce five proprietary analyses for film campaigns.

## Features

- **AudienceDNA™** — Segments Indonesian audiences (3–4 per film) with behavioral scores, platform mix, and resonance estimates.
- **BoxPredict™** — Bear/base/bull admissions and revenue scenarios, sensitivity analysis, risk flags, and geographic targeting.
- **VisibilityTracker** — Search/social/PR scans with funnel-to-ticket modeling and trajectory tracking against the H-7 plateau.
- **CineForge™** — AI-generated creative briefs (hooks, visuals, captions, CTAs) per audience segment and distribution channel.
- **FIB Generator** — Film Intelligence Briefing that bundles results into a client-ready PDF/Word deliverable.
- **Live Ticker** — Box-office tracking with per-city occupancy.

## Stack

- **Frontend:** React 19, TypeScript, Vite, TailwindCSS 4, React Router 7, Recharts, Motion (Framer)
- **Backend:** Express server (`server.ts`) that doubles as Vite dev middleware and proxies AI calls
- **AI:** Google Gemini (`gemini-2.5-pro`) + Firecrawl for web-grounded context
- **Data/Auth:** Firebase Auth (Google sign-in) + Firestore with strict per-tenant security rules
- **Exports:** jspdf, docx, html-to-image

## Access tiers

Enforced both in `useAuth` and `firestore.rules`:

- **Public** — landing page only
- **Client** — email present in the `clients` collection; full dashboard
- **Admin** — super-admin email, `admins/{uid}`, or `team/{email}`; access to `/admin/*` for client/team management

## Run locally

Prerequisites: Node.js 20+.

1. Install dependencies:
   ```
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in:
   - `GEMINI_API_KEY` — Google AI Studio key
   - `FIRECRAWL_API_KEY` — Firecrawl key (optional; required for web-grounded scans)
   - Firebase client config (see `src/lib/firebase.ts`)
3. Start the dev server (Express + Vite middleware on port 3000):
   ```
   npm run dev
   ```

## Scripts

- `npm run dev` — start Express + Vite in dev mode
- `npm run build` — build the client (Vite) and bundle the server (esbuild → `dist/server.cjs`)
- `npm start` — run the bundled production server
- `npm run lint` — type-check with `tsc --noEmit`

## Project layout

```
server.ts                 # Express server + AI proxy endpoints
src/
  App.tsx                 # Routes + auth guards
  pages/                  # Overview, Campaigns, AudienceDNA, BoxPredict,
                          # VisibilityTracker, LiveTicker, CineForge,
                          # FIBGenerator, Library, AdminDashboard, ...
  components/             # forms, landing, layout, modals, ui, visibility
  hooks/                  # useAuth, useFilmContext, useVisibilityTracker, ...
  lib/                    # firebase, gemini, prompts, types, utils
  services/               # apiClient, dbService (Firestore CRUD), firecrawlService
firestore.rules           # Per-tenant security rules
security_spec.md          # Data invariants + rejection-test catalog
```
