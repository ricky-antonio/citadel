# Citadel

## Required reading
Before writing any code, read these files in order:
1. CLAUDE.md (this file)
2. .claude/rules/testing.md
3. .claude/phases/<current-phase>.md
4. PROGRESS.md

Confirm you have read all four by stating: the current phase, the last completed task,
and the next task. Do not write a single line of code until this confirmation is complete.

---

**Tagline:** The city, decoded.
**Status:** Phase 1 — Foundation

---

## Brand
- Name: Citadel — wordmark rendered as all-caps `CITADEL`
- Wordmark: Inter Black, wide letter spacing, all caps, `#E8A020` amber on dark / `#1A1200` on light
- Icon: Minimal fortress/tower mark in amber — clean enough at 16px favicon
- Voice: Direct, intelligent — never corporate, never cute

## Stack
- Next.js 15 (App Router)
- Tailwind CSS
- TypeScript (strict mode)
- mapbox-gl + react-map-gl — map rendering and all data layers
- @supabase/supabase-js + @supabase/ssr — database client (Postgres)
- @anthropic-ai/sdk — AI chat and briefings (model: `claude-sonnet-4-6`)
- next-themes — dark/light mode switching
- @tanstack/react-virtual — pulse history chart virtualization
- @upstash/ratelimit + @vercel/kv — IP-based rate limiting
- react-focus-trap — panel and modal focus management
- Sentry — production error monitoring
- Vitest + React Testing Library + @vitest/coverage-v8 — unit/component/integration tests
- Playwright — E2E critical path tests (browser, Chromium only)
- GitHub Actions — CI

**External APIs (all server-side except Mapbox):**
- Open-Meteo (weather, free, no key)
- OpenAQ v3 (air quality, free, key required — register at openaq.org)
- Ticketmaster Discovery API (events, key required)
- Eventbrite API (supplementary events — **restricted**: /v3/events/search removed for new keys; fetcher returns empty fallback, Ticketmaster-only in practice)
- MTA API (NYC transit, **no key required** — feeds are fully open as of 2025)
- 511 SF Bay API (SF transit, key required)
- CTA API (Chicago transit, key required)
- WMATA API (DC transit, key required)
- NYC Open Data / DataSF / Chicago Data Portal / DC Open Data (crime, free, no key — Phase 5)

## Environment variables
```
NEXT_PUBLIC_MAPBOX_TOKEN
ANTHROPIC_API_KEY
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
OPENAQ_API_KEY
TICKETMASTER_API_KEY
EVENTBRITE_API_KEY
SF_511_API_KEY
CTA_API_KEY
WMATA_API_KEY
KV_URL
KV_REST_API_URL
KV_REST_API_TOKEN
KV_REST_API_READ_ONLY_TOKEN
SENTRY_DSN
NEXT_PUBLIC_SITE_URL
```

`NEXT_PUBLIC_MAPBOX_TOKEN` is exposed client-side — Mapbox GL JS requires it. Restrict it to your domain in the Mapbox dashboard. All other keys are server-only and must never appear in client bundles.

## Detailed references
| Topic | File |
|-------|------|
| Pre-build setup & API verification | .claude/setup.md |
| Database schema | .claude/schema.md |
| Design system | .claude/design.md |
| Architecture & patterns | .claude/architecture.md |
| Code standards | .claude/rules/code.md |
| Testing rules | .claude/rules/testing.md |
| Security rules | .claude/rules/security.md |
| Phase 1 — Foundation | .claude/phases/1-foundation.md |
| Phase 2 — Shell & Map | .claude/phases/2-shell-and-map.md |
| Phase 3 — Orbital & Panels | .claude/phases/3-orbital-and-panels.md |
| Phase 4 — AI & Chat | .claude/phases/4-ai-and-chat.md |
| Phase 5 — Map Layers | .claude/phases/5-map-layers.md |
| Phase 6 — Polish & Deploy | .claude/phases/6-polish-and-deploy.md |

## Key decisions
| Decision | Rationale |
|----------|-----------|
| No auth — fully public | App is a read-only intelligence dashboard; no user data to protect |
| Supabase cache-first for all external APIs | Prevents rate limit exhaustion on city switches; single cache miss per TTL window |
| Mapbox dynamic import with `ssr: false` | `mapbox-gl` accesses `window` on load — crashes Next.js SSR build |
| Fallback objects instead of throwing on API failure | Dashboard degrades gracefully with stale/empty data rather than blanking |
| `setInterval` + `useEffect` for polling (not SWR/React Query) | Unnecessary abstraction for a single polling use-case in a non-auth app |
| `@upstash/ratelimit` + `@vercel/kv` for rate limiting | Native Vercel integration; sliding window per IP; no separate Redis infra |
| Orbital UI built from scratch in SVG | No component library has this pattern; must be custom |
| Map layers use Mapbox `setData()` instead of unmount/remount | Unmounting causes flash; `setData` updates in place with built-in 200ms transition |
| Crime data deferred to Phase 5 | Free open-data APIs, no keys needed, but not in CitySnapshot types — nothing blocks Phases 1–4 |
| Model: `claude-sonnet-4-6` | Latest Sonnet — upgraded from `claude-sonnet-4-20250514` in original brief |

## Non-goals for v1
- User auth, accounts, or saved preferences
- Mobile-optimised layout (desktop-first; responsive is nice-to-have)
- Social sharing or embeds
- Paid API tiers — free APIs only
- Server-side rendering of the map
- Real-time WebSocket connections (polling every 5 minutes is sufficient)
- User-submitted data or annotations

## Loading & responsiveness
Every user action must produce immediate visible feedback. Silence after a click is a bug.

- Navigation: use `<Link>` for all user-visible nav — never `router.push()` for nav items
- Page loading: every page with a context loading flag must show a skeleton — never an empty flash
- Async buttons: set `loading = true` as the first statement in the handler, before any `await`
- Submit buttons: change label to present-participle ("Loading…") and set `disabled={true}`
- City switch: `300ms` fade out → data update → `300ms` fade in — never a blank map flash
- AI streaming: the streaming text IS the loading state — never show a spinner waiting for tokens
- Destructive actions: require a confirmation step before starting any loading state

## Scaffold command
```bash
npx create-next-app@15 citadel --typescript --tailwind --app --no-src-dir
npm install mapbox-gl react-map-gl @anthropic-ai/sdk @supabase/supabase-js @supabase/ssr next-themes @tanstack/react-virtual @upstash/ratelimit @vercel/kv react-focus-trap gtfs-realtime-bindings
npm install -D @types/mapbox-gl
npm install -D vitest @vitest/coverage-v8 @vitejs/plugin-react @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom
npm install -D @playwright/test && npx playwright install chromium
npx @sentry/wizard@latest -i nextjs
```

---

## Session rules

**Start of every session:**
1. Read CLAUDE.md, the current phase file, and PROGRESS.md
2. State out loud: current phase, last completed task, next task
3. Do not write code until this confirmation is done

**During every session:**
- Authoring order: `types → lib → lib test → component → component test` — no exceptions
- Never move to the next module until the current one's tests pass
- Every async button sets `loading = true` as its very first statement — before any `await`
- Every page gated behind a loading flag shows a skeleton — never an empty list flash
- All nav links use `<Link>` not programmatic navigation
- TypeScript errors must be zero before ending the session

**End of every session:**
```bash
npm run type-check     # zero errors
npm test               # all pass
npm run test:coverage  # above phase threshold
npm run build          # production build succeeds
```

Update PROGRESS.md before closing. Commit only when all four pass.

**A broken session (never acceptable):**
- Skipping tests to move faster
- Committing with failing tests or TypeScript errors
- Calling a phase complete without the manual verification checklist
- Writing a component before its lib functions are tested
- "Looks like it works" without running the checklist
