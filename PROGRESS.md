# Citadel — Progress

## Current phase
Phase 1 — Foundation (in progress)

## Completed
<!-- Newest entries go at the top. Never delete completed items — they are the audit trail. -->

### P1.2 — Types & city config
- `lib/types.ts` — all interfaces and union types: City, WeatherData, HourlyForecast, AirQualityData, Event, EventsData, TransitAlert, TransitData, Anomaly, ChatMessage, ApiError, PulseComponents, CitySnapshot, CacheRow; union types: TransitProvider, CrimeProvider, DataType, MetricType, PulseLabel, TransitSeverity
- `lib/cities.ts` — CITIES array (New York, San Francisco, Chicago, Washington DC) + getCityById helper
- `npm run type-check` — zero errors ✓

### P1.1 — Test infrastructure
- `package.json` — all scripts (dev, build, start, type-check, test, test:watch, test:coverage, test:e2e, lint)
- `tsconfig.json` — strict mode, `@/` alias, bundler module resolution
- `next.config.ts` — minimal Next.js 15 config
- `postcss.config.mjs` — Tailwind v4 PostCSS plugin
- `eslint.config.mjs` — Next.js flat ESLint config
- `app/layout.tsx`, `app/page.tsx`, `app/globals.css` — minimal App Router shell
- `vitest.config.ts` — jsdom, coverage thresholds (75/75/70), `@/` alias
- `tests/setup.ts` — jest-dom, clearAllMocks/restoreAllMocks, next/navigation mock, next-themes mock, global fetch
- `tests/mocks/supabase.ts` — chainable Supabase mock
- `tests/mocks/anthropic.ts` — streaming Anthropic mock
- `.github/workflows/ci.yml` — CI: npm ci → type-check → test → build
- All main + test dependencies installed (`npm install` clean)
- `npm run type-check` — zero errors ✓
- `npm test` — passes with `--passWithNoTests` ✓

### P1.2 — Types & city config
- `lib/types.ts` — all interfaces and union types: City, WeatherData, HourlyForecast, AirQualityData, Event, EventsData, TransitAlert, TransitData, Anomaly, ChatMessage, ApiError, PulseComponents, CitySnapshot, CacheRow; union types: TransitProvider, CrimeProvider, DataType, MetricType, PulseLabel, TransitSeverity
- `lib/cities.ts` — CITIES array (New York, San Francisco, Chicago, Washington DC) + getCityById helper
- `npm run type-check` — zero errors ✓

### P1.4 — Cache & fallbacks
- `lib/data/fallbacks.ts` — WEATHER_FALLBACK, AIR_QUALITY_FALLBACK, EVENTS_FALLBACK, TRANSIT_FALLBACK, CRIME_FALLBACK typed against actual interfaces
- `lib/cache.ts` — `getCached` (select with expires_at > now filter, returns null on miss/error), `setCached` (upsert with TTL-derived expires_at, logs error silently on failure); TTL map: weather 30m, air_quality 60m, events 6h, transit 5m, crime 24h
- `tests/lib/cache.test.ts` — 6 tests: null on miss, gt filter verified on stale path, payload on hit, correct TTL for weather/transit/events
- `npm test` — 21/21 pass ✓
- `npm run type-check` — zero errors ✓

### P1.3 — Pulse score
- `lib/pulse.ts` — `computePulseScore`, `getPulseLabel`, `getPulseColor`, `getTimeOfDayScore`, private `getLocalHour`
- `tests/lib/pulse.test.ts` — 15 tests covering all functions and boundary values (19/20, 39/40, 59/60, 79/80)
- `npm test` — 15/15 pass ✓
- `npm run type-check` — zero errors ✓

## In progress
- [ ] P1.5 — Anomaly detection (`lib/anomaly.ts`, `tests/lib/anomaly.test.ts`)



## Known issues
None.

## Setup notes
None yet — see .claude/setup.md for the full setup sequence.
