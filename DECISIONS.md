# Decisions

Every non-obvious architectural choice with its rationale and rejected alternatives.
Add an entry here whenever a meaningful decision is made — during planning or mid-build.

---

## No authentication — fully public
**Decision:** The app has no user auth, no sessions, no accounts.
**Why:** Citadel is a read-only intelligence dashboard. There is no user-specific data to protect, no preferences to save, and no personalization in v1. Auth would add complexity with zero user benefit.
**Alternatives rejected:** Supabase Auth with anonymous sessions (adds infra complexity for no gain); OAuth for a "save favourite city" feature (out of scope for v1).
**Date:** 2026-05-24

---

## Supabase cache-first pattern for all external APIs
**Decision:** All external API calls go through `/api/city/[id]/snapshot`. The route checks `api_cache` first — only calls the external API on a cache miss, then writes back to cache with a typed TTL per data type.
**Why:** Prevents rate limit exhaustion when multiple users switch cities simultaneously. External APIs (especially transit at 5-min TTL) would be hammered without this layer. Also keeps the client fast — city switch latency is bounded by Supabase read time, not external API latency.
**Alternatives rejected:** Client-side SWR calling external APIs directly (exposes API keys, no rate protection); in-memory Node.js cache (lost on function restart in serverless).
**Date:** 2026-05-24

---

## Mapbox dynamic import with `ssr: false`
**Decision:** `CityMap.tsx` is always loaded via `dynamic(() => import(...), { ssr: false })`.
**Why:** `mapbox-gl` calls `window` and `document` on module load — this crashes Next.js's SSR build. There is no workaround; the dynamic import is mandatory.
**Alternatives rejected:** Conditional `typeof window !== 'undefined'` guards (unreliable with Next.js hydration); `"use client"` alone (insufficient — the import still runs in SSR context).
**Date:** 2026-05-24

---

## Typed fallback objects instead of throwing on API failure
**Decision:** Every data fetcher in `lib/data/` wraps the external call in try/catch. On failure, it returns a typed fallback constant from `lib/data/fallbacks.ts` rather than throwing.
**Why:** The dashboard should degrade gracefully when one data source is unavailable. Throwing propagates to the snapshot endpoint, which would return a 500 and blank the entire UI. Partial data is always better than a crash.
**Alternatives rejected:** `null` returns (breaks type safety throughout); re-throwing with error boundary (blanks the map, not just the failing panel); showing error state per panel (requires significant component complexity for a non-auth app where the user can't fix the error).
**Date:** 2026-05-24

---

## `setInterval` + `useEffect` for data polling (not SWR or React Query)
**Decision:** The 5-minute snapshot refresh uses a plain `setInterval` in `useEffect` with a `clearInterval` on cleanup.
**Why:** This app has one data-fetching pattern: refresh all city data every 5 minutes. SWR and React Query are powerful tools for apps with complex caching, mutation, and revalidation needs — none of which apply here. The added dependency and abstraction would be premature.
**Alternatives rejected:** SWR (dependency overhead, overkill for single polling interval); React Query (same); WebSocket / Server-Sent Events for push updates (external APIs don't support it; polling is sufficient at 5-min granularity).
**Date:** 2026-05-24

---

## `@upstash/ratelimit` + `@vercel/kv` for rate limiting
**Decision:** Rate limiting uses the Upstash `Ratelimit` class backed by Vercel KV (Redis). Sliding window per IP: `/api/chat` at 20 req/min, `/api/city/[id]/snapshot` at 60 req/min.
**Why:** Vercel KV integrates natively with the deployment platform — zero additional infrastructure. Upstash's sliding window algorithm is accurate under burst traffic. The chat route is the highest-risk endpoint because a single user can exhaust Anthropic credits quickly.
**Alternatives rejected:** Next.js middleware with in-memory counters (lost on function restart, inaccurate across instances); `express-rate-limit` (not applicable to Next.js route handlers); Vercel's built-in firewall rules (not granular enough per route).
**Date:** 2026-05-24

---

## Orbital UI built from scratch in SVG
**Decision:** `OrbitalCore.tsx`, `OrbitalMetric.tsx`, and `OrbitalLayout.tsx` are custom SVG components — no third-party charting or animation library.
**Why:** This UI pattern (concentric rings, cardinal metric nodes, float animation) does not exist in any component library. Using a charting library (D3, Recharts) would mean fighting its abstractions to produce something it was not designed for. Raw SVG with CSS animations is simpler, more performant, and gives full control.
**Alternatives rejected:** D3.js (overkill, heavy, imperative style clashes with React); Framer Motion for the full orbital (possible but the geometry is SVG anyway); canvas (harder to make accessible, no DOM focus management).
**Date:** 2026-05-24

---

## Mapbox `setData()` instead of unmount/remount on data refresh
**Decision:** Map layer data is updated using `(map.getSource('id') as GeoJSONSource).setData(newGeoJSON)`. Layers are never unmounted and re-added on a refresh cycle.
**Why:** Unmounting and remounting a Mapbox layer causes a visible flash as the layer disappears and reappears. `setData` updates the source in place with Mapbox's built-in 200ms transition — the update is invisible to the user.
**Alternatives rejected:** Removing and re-adding layers (flash); `key` prop on the Map component to force remount (nukes all layers, resets zoom/pan).
**Date:** 2026-05-24

---

## Crime data deferred to Phase 5
**Decision:** `lib/data/crime.ts` is a typed stub in Phase 1 that returns `CRIME_FALLBACK`. The real open-data API implementations are built in Phase 5 alongside other map layer work.
**Why:** Crime data is not in `CitySnapshot` types and not referenced by the pulse algorithm or AI context builder. Nothing in Phases 1–4 depends on it. The open-data APIs (NYC Open Data, DataSF, Chicago Data Portal, DC Open Data) are free/no-key but require per-city implementation — it belongs with the other layer work in Phase 5.
**Alternatives rejected:** Implementing in Phase 1 (blocks nothing, adds distraction); marking out of scope for v1 (crime data IS in the City config and types — deferring is cleaner than removing).
**Date:** 2026-05-24

---

## Model: `claude-sonnet-4-6`
**Decision:** All Anthropic API calls use model `claude-sonnet-4-6`.
**Why:** This is the current latest Sonnet release as of project start (2026-05-24). The original brief specified `claude-sonnet-4-20250514`, which maps to an earlier release.
**Alternatives rejected:** `claude-opus-4-7` (higher quality but ~5× more expensive per token for a rate-limited free-tier app); `claude-haiku-4-5` (faster/cheaper but too terse for city intelligence responses).
**Date:** 2026-05-24

---

## Playwright for E2E testing (not Cypress)
**Decision:** Browser-level E2E tests use Playwright with Chromium only. The suite lives in `tests/e2e/` and is run separately from Vitest (`npm run test:e2e`).
**Why:** Playwright handles SSE/streaming responses natively via `page.waitForResponse` and `page.route()` response fulfillment — Citadel's AI chat route streams `text/event-stream` and Cypress has known limitations here. Playwright also starts a dev server automatically via `webServer` config, making CI setup simpler. Chromium-only is sufficient for the critical path; cross-browser divergence is unlikely for a dashboard app.
**Alternatives rejected:** Cypress (streaming support is experimental, requiring cy.intercept workarounds); Playwright with all three browsers (overkill for v1, adds CI time without meaningful coverage gain).
**Date:** 2026-05-24

---

## Light mode uses Mapbox `light-v11` style
**Decision:** When the user toggles to light mode via `next-themes`, the map switches to `mapbox://styles/mapbox/light-v11`. Panel backgrounds invert to `rgba(245,242,236,0.92)` with dark text. The orbital amber (#E8A020) is unchanged.
**Why:** `light-v11` is Mapbox's maintained light basemap and pairs well with amber accents without additional Studio customization. The dark custom style (amber roads, near-black surfaces) is the hero; light mode is a functional secondary.
**Alternatives rejected:** Custom light Studio style (additional setup complexity, out of proportion to the nice-to-have nature of light mode); `streets-v12` (too colorful, clashes with the amber brand).
**Date:** 2026-05-24
