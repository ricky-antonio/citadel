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

### P1.5 — Anomaly detection
- `lib/anomaly.ts` — `detectAnomaly` (null if <10 pts or ≤2σ; baseline = mean rounded 2dp; deviation = (value−mean)/mean), `logAnomaly` (insert with snake_case column mapping, never throws), `getAnomalyHistory` (select last 7 days desc limit, maps rows to Anomaly[], returns [] on error); private `computeStdDev`
- `tests/mocks/supabase.ts` — added `mockSupabaseOrder` (returns this) and `mockSupabaseLimit` (overridden per-test with `mockResolvedValueOnce` for multi-row terminal)
- `tests/lib/anomaly.test.ts` — 6 tests: null within 2σ, anomaly above 2σ, null <10 pts, deviation formula, logAnomaly insert columns, getAnomalyHistory row mapping
- `npm test` — 27/27 pass ✓
- `npm run type-check` — zero errors ✓

### P1.6 — Weather & air quality fetchers
- `lib/data/weather.ts` — `fetchWeather(lat, lng)` (Open-Meteo, temp already °F from URL param), `parseWeatherResponse(json)` (weather_code→condition switch with 19 codes, maps first 24h of hourly to HourlyForecast[]); returns WEATHER_FALLBACK on any error
- `lib/data/airQuality.ts` — `fetchAirQuality(lat, lng)` (OpenAQ v3, X-API-Key header); step 1: GET /v3/locations filtered to active within 48h; step 2: Promise.all GET /v3/locations/{id}/latest for up to 5 stations; averages PM2.5 values; EPA breakpoint AQI formula; returns AIR_QUALITY_FALLBACK on missing key or any error
- `tests/lib/data/weather.test.ts` — 6 tests: happy path shape, HTTP 500 fallback, network throw fallback, °F passthrough, missing hourly → [], weather_code mapping
- `tests/lib/data/airQuality.test.ts` — 3 tests: happy path AQI/category, all latest fail → fallback, empty locations → fallback
- `npm test` — 36/36 pass ✓
- `npm run type-check` — zero errors ✓

## In progress
- [ ] P1.7 — Events fetcher & crime stub (`lib/data/events.ts`, `lib/data/crime.ts`, transit fetchers)



## Known issues
None.

## Setup notes
None yet — see .claude/setup.md for the full setup sequence.
