# Citadel — Progress

## Current phase
Phase 5 — Map Layers

## Completed
<!-- Newest entries go at the top. Never delete completed items — they are the audit trail. -->

### P5.3 — Transit lines + crowd density
- `public/geojson/transit/{new-york,san-francisco,chicago,washington-dc}.json` — GeoJSON FeatureCollection with LineString features per line; line_ids match provider route IDs (MTA: "1"/"A"/etc, SF: "N"/"J"/etc, CTA: "Red Line"/etc, WMATA: "RD"/"BL"/etc)
- `public/geojson/neighbourhoods/{new-york,san-francisco,chicago,washington-dc}.json` — 10–11 polygon features per city for crowd density
- `components/map/TransitLayer.tsx` — `updateTransitLayer(map, transit, cityId, visible)`: fetches GeoJSON once (module-scope cache); joins delay status to features via `getLineStatus` (handles comma-separated WMATA format + exact MTA/CTA IDs); line-color match expression (green/amber/red); 2px width + 3px hover via feature state on `generateId: true` source; cursor pointer; mousemove/mouseleave hover tracking with WeakMap per map
- `components/map/CrowdLayer.tsx` — `updateCrowdLayer(map, events, cityId, visible)`: fetches neighbourhood GeoJSON once; `computeCrowdScore` counts events within polygon bounding box, normalises to 0–1 (cap 5 events = 1.0); fill-opacity interpolated 0→0.4; both layers guard `!cityId` and handle fetch failures gracefully
- `components/map/MapLayers.tsx` — wired in `updateTransitLayer` and `updateCrowdLayer` in `doUpdate`; renders "Crowd density (estimated)" label (absolute, bottom 40px, right 16px, 9px, var(--tx-3)) when crowd layer is active
- `app/api/chat/route.ts` — removed unused `getClient` function and `start` variable (leftover deferred ai_usage logging; was breaking production build)
- `tests/components/TransitLayer.test.ts` — 13 tests: empty cityId guard, fetch+addSource+addLayer, delayed/suspended/normal status, WMATA comma-separated matching, visibility, cache hit setData, fetch fail/non-ok, isStyleLoaded guard, no re-registration, hover mousemove/mouseleave handlers
- `tests/components/CrowdLayer.test.ts` — 11 tests: empty cityId guard, fetch+addSource+addLayer, crowd_score 0/positive/capped/outside bbox, non-Polygon geometry, events without coordinates, visibility, cache hit setData, fetch fail, isStyleLoaded guard
- `tests/components/AQLayer.test.ts` — 7 direct tests for AQLayer covering addSource/addLayer, GeoJSON mapping, null/empty inputs, setData path, visibility; these were previously only mocked in MapLayers tests
- `tests/components/MapLayers.test.tsx` — added mocks and 4 new tests for updateTransitLayer/updateCrowdLayer calls and crowd density label rendering
- `tests/lib/ai/suggestions.test.ts` — 14 tests covering all branches in generateSuggestions (temp ≥90, ≤35, rain/storm, pleasant; delayCount >10/>0/0; AQI >100, events tonight, pulse ≥75, ≤25, normal)
- `npm run type-check` — zero errors ✓
- `npm test` — 234/234 pass ✓
- `npm run test:coverage` — lines 86.39%, functions 86.48%, branches 76.39%, statements 84.61% (all above 80/80/75 thresholds) ✓
- `npm run build` — production build succeeds ✓
- Next: P5.4 — Crime data real implementations

### P5.2 — Event pins layer
- `lib/types.ts` — added `lat?: number`, `lng?: number` to `Event`; coordinates travel with the event so panel and map are always the same source of truth
- `lib/data/events.ts` — `parseTicketmasterEvent` extracts venue coordinates from `_embedded.venues[0].location.latitude/longitude` and spreads them onto `Event` when valid; events without coordinates simply omit the fields
- `components/map/EventLayer.tsx` — plain function `updateEventLayer(map, events, visible)`: derives GeoJSON from `events.tonight` filtered to events with `lat`/`lng` — if an event has no pin it has no coordinates, never a silent mismatch with the panel; addSource+addLayers (clusters, cluster-count, event-points) on first call, setData on subsequent; cluster click → `getClusterExpansionZoom` + `easeTo`; pin click → styled Popup; cursor pointer on hover; `WeakSet` prevents duplicate handler registration; setLayoutProperty for visibility on all three layers
- `components/map/MapLayers.tsx` — imports and calls `updateEventLayer(map, snapshot?.events ?? null, activeLayers.includes('events'))` in `doUpdate`
- `tests/components/MapLayers.test.tsx` — added mock for `updateEventLayer`; 2 new tests: calls updateEventLayer with events + visibility flag, calls with null when snapshot is null; 179/179 tests pass
- `npm run type-check` — zero errors ✓
- `npm test` — 179/179 pass ✓
- Next: P5.3 — Transit lines + crowd density

### P5.1 — MapLayers manager + AQ heatmap
- `lib/types.ts` — added `AQStation` interface (`lat, lng, aqi`) and `stations: AQStation[]` to `AirQualityData`
- `lib/data/fallbacks.ts` — added `stations: []` to `AIR_QUALITY_FALLBACK`
- `lib/data/airQuality.ts` — updated to collect per-station coordinates and AQI; returns `stations[]` in result alongside averaged `aqi`
- `components/map/AQLayer.tsx` — plain function `updateAQLayer(map, airQuality, visible)`: converts stations to GeoJSON FeatureCollection; addSource+addLayer on first call, setData on subsequent calls; heatmap paint with green→amber→red color ramp at 0.4 opacity; setLayoutProperty for visibility
- `components/map/MapLayers.tsx` — `'use client'` component; renders null; `useEffect([snapshot, activeLayers, mapRef])` calls `updateAQLayer` via `doUpdate`; guards `getMap` availability (defensive check for test environment); waits for style load with `map.once('style.load', doUpdate)` if not yet loaded
- `components/map/CityMap.tsx` — removed `_snapshot`/`_activeLayers` prefixes; renders `<MapLayers snapshot={snapshot} activeLayers={activeLayers} mapRef={mapRef} />` inside `<Map>`
- All 9 existing test files with inline `airQuality` mocks updated to include `stations: []`; `tests/lib/data/airQuality.test.ts` updated to assert `stations` array in happy-path result
- `tests/components/MapLayers.test.tsx` — 3 tests: renders null, calls updateAQLayer with correct args on valid snapshot, does not throw when snapshot is null
- `npm run type-check` — zero errors ✓
- `npm test` — 178/178 pass ✓
- Next: P5.2 complete ✓

### P4.5 — Phase 4 final checklist
- `vitest.config.ts` — thresholds raised to Phase 4 targets: lines 80%, functions 80%, branches 75%
- `npm run type-check` — zero errors ✓
- `npm test` — 175/175 pass ✓
- `npm run test:coverage` — lines 88.56%, functions 92.41%, branches 75.19% (all above 80/80/75 thresholds) ✓
- `npm run build` — production build succeeds; all 5 API routes dynamic ✓
- Manual verification: all 10 checks pass ✓ (drawer, chips, streaming, cursor, rate limit, Escape, briefing, cache, ai_usage briefing, no direct Anthropic calls from client)
- `ai_usage` for streaming chat deferred to Phase 6 — tracked in PHASE6ROADMAP.md P6.7
- Phase 4 complete ✓
- Next: P5.1 — Phase 5 map layers

### P4.4 — ChatSuggestions + ChatDrawer + wire into page
- `components/chat/ChatSuggestions.tsx` — horizontal scrollable row of up to 3 amber chip buttons; tabIndex/Enter keyboard accessible; calls onSelect(suggestion) on click or Enter
- `components/chat/ChatDrawer.tsx` — 'use client'; 42vh slide-up drawer; generates suggestions from snapshot on mount; handleSend: setStreaming(true) first, builds user+assistant messages, fetches /api/chat, parses Anthropic SSE (content_block_delta) and E2E mock (type:text) formats; connection error caught and shown in UI; Escape key closes via onClose; auto-scroll to bottom on new messages; send button disabled when empty or streaming
- `app/city/[id]/page.tsx` — imported ChatDrawer; renders `{chatOpen && snapshot && <ChatDrawer cityId={cityId} snapshot={snapshot} onClose={() => setChatOpen(false)} />}` above the fade overlay section
- `tests/setup.tsx` — added `window.HTMLElement.prototype.scrollIntoView = vi.fn()` to silence jsdom's lack of scrollIntoView
- `tests/components/ChatSuggestions.test.tsx` — 4 tests: renders chips, limits to 3, click calls onSelect, Enter calls onSelect
- `tests/components/ChatDrawer.test.tsx` — 13 tests: header, close button, close-on-click, close-on-Escape, input a11y, suggestions visible when empty, send disabled when empty, send enables on type, fetch called on submit, non-ok API shows error, fetch throws shows connection error, Anthropic SSE streaming (content_block_delta), simplified mock SSE format, malformed JSON lines skipped
- `npm run type-check` — zero errors ✓
- `npm test` — 160/160 pass ✓
- `npm run test:coverage` — lines 88.86%, functions 94.85%, branches 74.12% (all above 78/78/72 thresholds) ✓
- `npm run build` — production build succeeds ✓
- Next: P4.5 — Phase 4 final checklist

### P4.3 — StreamingText + ChatMessage components
- `lib/types.ts` — added `streaming?: boolean` to `ChatMessage` interface
- `components/chat/StreamingText.tsx` — inline `<span>` renders text as plain text; shows blinking amber `|` cursor via `blink-cursor` keyframe when `streaming` is true; never uses dangerouslySetInnerHTML
- `components/chat/ChatMessage.tsx` — user messages: right-aligned, amber-tinted background, plain text; assistant messages: left-aligned, glass surface, rendered via `<StreamingText streaming={message.streaming ?? false}`; aria-label on both
- `tests/components/StreamingText.test.tsx` — 4 tests: text render, cursor visible when streaming, cursor hidden when not, empty string
- `tests/components/ChatMessage.test.tsx` — 4 tests: user message text, right-alignment style, StreamingText for assistant, streaming=true passed through to cursor span
- `npm run type-check` — zero errors ✓
- `npm test` — 142/142 pass ✓
- Next: P4.4 — ChatSuggestions + ChatDrawer

### P4.2 — Chat + briefing API routes
- `app/api/chat/route.ts` — POST, rate-limited (Ratelimit.slidingWindow 20/1m), validates message (required, string, ≤500 chars), cityId (in VALID_CITY_IDS), history (array, slice to 20); calls getCitySnapshot → buildSystemPrompt/buildUserMessage → Anthropic messages.stream; fire-and-forget ai_usage insert; returns ReadableStream with Content-Type: text/event-stream; fails open if KV unavailable
- `app/api/city/[id]/briefing/route.ts` — GET, validates city via getCityById, calls getDailyBriefing, returns { cityId, briefing }; wrapped in try/catch → 500 on failure
- `tests/api/chat.test.ts` — 8 integration tests: 400 missing message, 400 missing cityId, 400 message >500 chars, 404 unknown cityId, 429 rate limited, 200 streaming response, city name in system prompt, 500 on Anthropic error
- `tests/mocks/anthropic.ts` — updated: added mockFinalMessage to mockStream; changed default export mock from vi.fn(arrow) → class (arrow functions can't be used as constructors with new Anthropic())
- `npm run type-check` — zero errors ✓
- `npm test` — 134/134 pass ✓
### P4.1 — AI lib functions
- `lib/ai/chat.ts` — `buildSystemPrompt(snapshot)` (system prompt with city name) and `buildUserMessage(userMessage, snapshot)` (prepends buildCityContext output); both pure, no side effects
- `lib/ai/briefing.ts` — `getCitySnapshot(cityId)` (cache-first snapshot assembler, same logic as snapshot route but callable from lib); `getDailyBriefing(cityId)` (checks ai_briefings for today, generates via Anthropic messages.create if missing, upserts to ai_briefings, inserts to ai_usage)
- `lib/ai/suggestions.ts` — `generateSuggestions(snapshot)` returns 3 contextual chip strings; rule-based on weather temp/condition, transit delay count, AQI, events tonight, pulse score
- `tests/lib/ai/chat.test.ts` — 6 tests: city name in system prompt, Citadel identity, user question in message, Live city data prefix, buildCityContext embedded, question positioned after context
- `npm run type-check` — zero errors ✓
- `npm test` — 126/126 pass ✓

### P3.7 — Phase 3 final checklist
- `vitest.config.ts` — thresholds raised to Phase 3 targets: lines 78%, functions 78%, branches 72%
- `tests/components/OrbitalLayout.test.tsx` — added 8 tests covering: Space key, transit/events click callbacks, "On time" transit display, AQI amber branch (aqi 51–100), AQI red branch (aqi > 100), transit red branch (delayCount > 5); 120 tests total
- `tests/components/PanelBase.test.tsx` — added 4 tests covering: left-center anchor, right-center anchor, mousedown outside closes panel, mousedown inside does not close panel
- `app/city/[id]/page.tsx` — added `position: 'absolute', inset: 0` to the fade wrapper div; fixes orbital scroll bug where FocusTrap focused inside a panel caused the browser to scroll the static fade div into view, shifting the map upward and creating a black area at the bottom of the viewport
- `npm run type-check` — zero errors ✓
- `npm test` — 120/120 pass ✓
- `npm run test:coverage` — lines 91.69%, functions 93.93%, branches 77.57% (all above 78/78/72 thresholds) ✓
- `npm run build` — production build succeeds ✓
- `npm audit` — 0 high/critical vulnerabilities (2 moderate PostCSS unfixable without Next.js downgrade) ✓
- `components/panels/PanelBase.tsx` — replaced broken `react-focus-trap` (uses `componentWillMount`, removed in React 18, so trap never fired on React 19) with manual focus trap: `tabIndex={-1}` on panel div, `useEffect` focusing panel on mount, Tab/Shift+Tab handler wrapping focus within focusable children
- Manual verification (all 14 checks pass): orbital centred ✓; pulse score/label correct ✓; all 4 panels open from correct edges ✓; panels glassy ✓; Escape closes panel ✓; outside click closes panel ✓; Tab trapped inside open panel ✓; Tab reaches orbital nodes when closed ✓; Enter on orbital node opens panel ✓; city dropdown shows 4 cities with scores ✓; Escape/outside click close dropdown ✓; layer checkboxes toggle state ✓; city switch NY→Chicago fades and re-centres ✓; orbital float animation staggered ✓
- Phase 3 complete

### P3.4 — TransitPanel + EventsPanel + AnomalyPanel + HistoryPanel
- `components/panels/TransitPanel.tsx` — PanelBase anchor="bottom-right"; green all-clear when delayCount === 0; amber delay count + alert list (line name + severity badge + description, up to 5); unique lines derived from alerts (up to 8) with colored dots; severity 'minor' → amber, 'major' → red
- `components/panels/EventsPanel.tsx` — PanelBase anchor="bottom-left"; empty state if no tonight events; count header; up to 5 events with name/time/venue + attendance badges (amber for 1K–9K, red for 10K+)
- `components/panels/AnomalyPanel.tsx` — PanelBase anchor="left-center"; empty state if none; up to 10 anomalies with metric badge, deviation %, AI description or "Analyzing…", relative time via Intl.RelativeTimeFormat
- `components/panels/HistoryPanel.tsx` — 'use client'; PanelBase anchor="right-center"; fetches /api/pulse/{cityId} on mount; empty state if < 2 points; 248×100px SVG polyline chart (oldest left, newest right); amber stroke #E8A020 strokeWidth=2; @tanstack/react-virtual horizontal virtualizer for circle points; current pulse in 32px amber text below
- `npm run type-check` — zero errors ✓
- `npm test` — 79/79 pass ✓

### P2.6 — Phase 2 final checklist
- `app/page.tsx` — fixed redirect from `/city/chicago` → `/city/new-york` (regression from P2.3)
- `npm run type-check` — zero errors ✓
- `npm test` — 63/63 pass ✓
- `npm run test:coverage` — lines 92.89%, functions 97.91%, branches 78.1% (all above 75/75/70 thresholds) ✓
- `npm run build` — production build succeeds; all 3 API routes dynamic ✓
- Manual: `http://localhost:3002` → 307 → `/city/new-york` ✓
- Manual: `/city/new-york`, `/city/san-francisco`, `/city/chicago`, `/city/washington-dc` → 200 ✓
- Manual: `/city/xyz` → client-side redirect to `/city/new-york` ✓
- Manual: loading skeleton (dark screen + "Loading…") appears before map tiles ✓
- Manual: dark map fills full viewport with no white edges or scrollbar ✓
- `npm audit` — no high/critical vulnerabilities (2 moderate PostCSS issues unfixable without breaking Next.js downgrade) ✓
- Phase 2 complete

### P2.4 — CityMap component
- `components/map/CityMap.tsx` — full-viewport react-map-gl/mapbox `Map` component; accepts `city`, `snapshot`, `activeLayers` props; `initialViewState` from `city.lat/lng/zoom`; `style={{ width: '100vw', height: '100vh' }}`; `attributionControl={false}`; mapRef for Phase 5 layer updates
- `app/city/[id]/page.tsx` — dynamic import of CityMap with `ssr: false`; dark background `#060A0F` loading fallback; replaces placeholder div; `activeLayers` now consumed (void suppressor removed)
- `tests/setup.tsx` — renamed from `setup.ts` (JSX required for react-map-gl mock); `vi.mock('react-map-gl/mapbox', ...)` with `data-testid="mock-map"` and `data-zoom` attribute
- `vitest.config.ts` — updated `setupFiles` to `./tests/setup.tsx`
- `tests/components/CityMap.test.tsx` — 3 tests: renders with null snapshot, renders with full snapshot, verifies zoom from city.zoom
- Fixed: react-map-gl v8 exports from `react-map-gl/mapbox` sub-path (not root); updated both component and mock
- `npm run type-check` — zero errors ✓
- `npm test` — 56/56 pass ✓
- Dev server: `http://localhost:3001/city/new-york` returns 200 ✓

### P2.3 — Routing + error boundary
- `app/page.tsx` — permanent redirect to `/city/new-york` (fixed from `/city/chicago`)
- `app/error.tsx` — global error boundary client component; centered amber "Something went wrong." + "Try again" reset button; 44px minimum tap target
- `app/city/[id]/page.tsx` — dashboard page client component; reads cityId via `useParams()`; validates city ID (redirects unknown → `/city/new-york`); state: snapshot, loading, activePanel, chatOpen, activeLayers, fading; snapshot fetch on mount + 5-min polling with clearInterval cleanup; Escape key handler closes activePanel then chatOpen; loading skeleton while `loading && !snapshot`; placeholder for CityMap (P2.4)
- `npm run type-check` — zero errors ✓
- `npm test` — 53/53 pass ✓
- Dev server: `http://localhost:3000` → 307 → `/city/new-york`, city page returns 200 ✓

### P1.11 — Phase 1 final checklist
- `npm run type-check` — zero errors ✓
- `npm test` — 53/53 pass ✓
- `npm run test:coverage` — lines 92.46%, functions 97.67%, branches 76.92% (all above 75/75/70 thresholds) ✓
- `npm run build` — Next.js 15.5.18, all 3 API routes render as dynamic server routes ✓
- `curl /api/city/new-york/snapshot` — valid CitySnapshot JSON (pulseScore: 42, pulseLabel: "Active", weather, 363 transit alerts) ✓
- `curl /api/pulse/new-york` — currentPulse + history array ✓
- Cache hit verified: second request returned same data at same speed ✓
- `npm audit fix --force` — upgraded Next.js 15.3.2 → 15.5.18 to address critical CVEs; remaining moderate PostCSS issue is unfixable without breaking downgrade to Next.js 9.x ✓

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

### P1.7 — Events fetcher & crime stub
- `lib/data/events.ts` — `fetchEvents(cityName)` Ticketmaster-only; parses events into `EventsData` (count, totalCapacity, tonight); private `parseTicketmasterEvent`; uses local date+time from Ticketmaster response for "tonight" filtering (≥18:00); returns `EVENTS_FALLBACK` on missing key, HTTP error, or any exception
- `lib/data/crime.ts` — `fetchCrimeData(city)` stub returning `CRIME_FALLBACK`; real open-data implementations deferred to Phase 5
- No tests for these two files — events integration covered by P1.10 snapshot test; crime is a zero-logic stub
- `npm run type-check` — zero errors ✓
- `npm test` — 36/36 pass ✓

### P1.8 — Transit fetchers
- `lib/data/transit/mta.ts` — `fetchMtaStatus()` (no API key); fetches MTA GTFS-RT protobuf, decodes with `gtfs-realtime-bindings`, maps alert entities to `TransitAlert[]`; text-based severity ('major'/'No service' → major, else minor); returns `TRANSIT_FALLBACK` on empty feed or any error
- `lib/data/transit/sf511.ts` — `fetchSf511Status(apiKey)` — same protobuf parsing, returns provider-specific fallback on error
- `lib/data/transit/cta.ts` — `fetchCtaStatus(apiKey)` — JSON API, normalizes `ImpactedService.Service` (object | array), filters train alerts (`ServiceType === 'T'`), excludes elevator status
- `lib/data/transit/wmata.ts` — `fetchWmataStatus(apiKey)` — WMATA Incidents JSON endpoint with `api_key` header, parses semicolon-delimited `LinesAffected`
- `lib/data/transit/index.ts` — `fetchTransitStatus(city)` exhaustive switch on `city.transitProvider`; API keys from env vars
- `tests/lib/data/transit/mta.test.ts` — 5 tests: shape, minor severity, major severity, empty feed fallback, fetch failure fallback
- `npm test` — 41/41 pass ✓
- `npm run type-check` — zero errors ✓

### P1.9 — AI context builder
- `lib/ai/context.ts` — `formatLocalTime(timestamp, timezone)` (Intl.DateTimeFormat, "Tuesday, 7:30 PM" format); `buildCityContext(snapshot)` assembles city name/state, local time, pulse score/label, weather, AQI, events tonight (capped at 5, "None" fallback), transit alerts ("None" fallback); warns in dev if output > 3200 chars
- `tests/lib/ai/context.test.ts` — 7 tests: city name/state, pulse score/label, weather temp/condition, AQI, empty events → "None", empty delays → "None", output under 3200 chars
- `npm test` — 48/48 pass ✓
- `npm run type-check` — zero errors ✓

### P1.10 — API routes
- `lib/pulse-history.ts` — `getPulseHistory(cityId, days)` (scores array for anomaly detection), `getPulseHistoryRows(cityId, limit)` (full rows for pulse endpoint), `writePulseScore(cityId, pulseScore, components)` (fire-and-forget insert); all Supabase queries kept in lib per code rules
- `app/api/city/[id]/snapshot/route.ts` — cache-first orchestration for all 5 data types; assembles CitySnapshot with pulse score/label/color/components; detects anomalies against 30-day history; fire-and-forget pulse history write; returns snapshot + recent anomalies
- `app/api/pulse/[id]/route.ts` — last 168 rows of pulse_history (7 days); returns currentPulse + history array
- `app/api/anomalies/[id]/route.ts` — calls getAnomalyHistory(id, 20); returns anomalies array
- `tests/api/snapshot.test.ts` — 5 integration tests: 404 for unknown city, 200 with CitySnapshot shape, cache hit skips external fetchers, cache miss triggers fetchWeather, pulseScore 0–100 in response
- Fixed pre-existing ESLint issue in `lib/data/crime.ts` (`_city` → `_`); updated `eslint.config.mjs` to allow `^_` prefixed args/vars
- `npm test` — 53/53 pass ✓
- `npm run type-check` — zero errors ✓
- `npm run test:coverage` — lines 92.46%, functions 97.67%, branches 76.92% (all above phase thresholds) ✓
- `npm run build` — production build passes; all 3 routes appear as dynamic server routes ✓

### P3.6 — Wire all overlays into page.tsx
- `lib/types.ts` — added `anomalies: Anomaly[]` to `CitySnapshot` (was returned by route but missing from type)
- `app/api/city/[id]/snapshot/route.ts` — moved `anomalies` into the `CitySnapshot` object directly (removed spread hack)
- `components/nav/NavBar.tsx` — new pill nav component; absolute-positioned at top-center; CITADEL wordmark + CitySelector + LayerToggle + LiveDot + "Live" label + Ask button + ThemeToggle; height 44px, borderRadius 22px, glassmorphism styles
- `app/city/[id]/page.tsx` — wired all overlays: NavBar (always visible), OrbitalLayout + all 6 panels (weather/aq/transit/events/anomaly/history) inside fade wrapper; `handleCityChange` with 300ms fade out → router.push; `activeLayers` now mutable with `setActiveLayers`; removed `void fading/setFading` suppressors; fixed unknown cityId redirect to `/city/new-york`
- Test fixtures updated: `anomalies: []` added to CityMap, OrbitalLayout, context, and pulse test mocks
- `npm run type-check` — zero errors ✓
- `npm test` — 109/109 pass ✓

### P3.5 — Nav components + shared badges
- `components/shared/PulseScore.tsx` — colored score badge; `sm` size: 6px dot + number inline (10px); `md` size: 13px number + optional label below (9px); color from `getPulseColor(score)`
- `components/shared/MetricBadge.tsx` — generic metric pill; label in `var(--tx-2)` + bold value + optional unit; small pill with panel-bg background and border
- `components/nav/CitySelector.tsx` — trigger button with current city name + ▾; dropdown with all four cities and state abbreviations; PulseScore badge per city when score available; current city highlighted with amber border-left; aria-selected; arrow-key navigation; Escape + outside-click close; aria-haspopup="listbox" + aria-expanded
- `components/nav/LayerToggle.tsx` — trigger "Layers ▾"; four checkbox options (air-quality, events, transit, crowd); toggle adds/removes from activeLayers array; Escape + outside-click close; aria-expanded
- `tests/components/PulseScore.test.tsx` — 6 tests: score render, label render, no label, dot in sm, amber color (rgb normalized), blue color (rgb normalized)
- `tests/components/MetricBadge.test.tsx` — 5 tests: label, value, value+unit, string value, no undefined in output
- `tests/components/CitySelector.test.tsx` — 8 tests: trigger renders city name, no dropdown initially, opens on click, shows all four cities, calls onCityChange, closes after selection, Escape closes, aria-haspopup/expanded, pulse score badges shown, aria-selected on current
- `tests/components/LayerToggle.test.tsx` — 8 tests: trigger renders, no dropdown initially, opens + shows 4 checkboxes, unchecked when empty, checked for active layer, toggle on, toggle off, Escape closes, aria-expanded
- `npm run type-check` — zero errors ✓
- `npm test` — 109/109 pass ✓

### P3.3 — PanelBase + WeatherPanel + AQPanel
- `components/panels/PanelBase.tsx` — glass panel shell; position constants for all 6 anchors; slide-in animation via mounted state + 1ms setTimeout; Escape keydown handler; outside mousedown handler; FocusTrap wrapper; amber title + LiveDot header
- `components/panels/WeatherPanel.tsx` — wraps PanelBase at top-left; 32px temperature + condition; wind speed + humidity rows; hourly forecast strip (6 items, time→hour label)
- `components/panels/AQPanel.tsx` — wraps PanelBase at top-right; 32px AQI + colored category badge; dominant pollutant row; color-coded 0–300 gradient bar with circle marker
- `tests/setup.tsx` — added `vi.mock('react-focus-trap')` default export passthrough
- `tests/components/PanelBase.test.tsx` — 4 tests: renders children, renders title, Escape calls onClose, role+aria-label
- `npm run type-check` — zero errors ✓
- `npm test` — 79/79 pass ✓

### P3.2 — OrbitalMetric + OrbitalLayout
- `components/orbital/OrbitalMetric.tsx` — single metric node: colored dot + value + label; float animation via inline `animation`/`animationDelay` props; `tabIndex={0}`, `role="button"`, `aria-label`, `data-testid`; Enter/Space keyboard handler
- `components/orbital/OrbitalLayout.tsx` — positions OrbitalCore + 4 OrbitalMetric nodes at N/E/S/W; AQI color breakpoints (≤50 green, ≤100 amber, 101+ red); transit color by delay count (0=green, 1-5=amber, 6+=red); staggered animation delays 0s/1s/2s/3s; uses `snapshot.weather.temperature` (°F)
- `tests/components/OrbitalLayout.test.tsx` — 8 tests: 4 value render tests, 2 click handler tests (weather + aq), all-four tabIndex test, Enter key test
- `npm run type-check` — zero errors ✓
- `npm test` — 75/75 pass ✓

### P3.1 — OrbitalCore SVG component
- `components/orbital/OrbitalCore.tsx` — pure SVG component (no state, no `'use client'`); three concentric amber rings (r=139/99/59, opacity 0.12/0.18/0.25); core circle r=36 (#1A1200 fill, #E8A020 stroke); pulse score text y=138 fontSize=22; pulse label text y=150 fontSize=9 uppercase; `role="img"`, `aria-label`, `aria-live="polite"` for screen readers
- `tests/components/OrbitalCore.test.tsx` — 4 tests: score rendering, label uppercasing, aria-label content, three ring circles
- `npm run type-check` — zero errors ✓
- `npm test` — 67/67 pass ✓

### P2.5 — Shared UI atoms
- `components/nav/ThemeToggle.tsx` — dark/light toggle using `next-themes` `useTheme`; renders ☀/◑ icon; `aria-label` describes switch target; min 44×44px tap target
- `components/shared/LiveDot.tsx` — 6px green (#4ADE80) circle with `pulse-dot` CSS animation; `aria-label="Live data"`
- `components/shared/ErrorBanner.tsx` — in-panel error state; accepts optional `message` prop (default: "Data temporarily unavailable"); red tinted background/border
- `tests/components/ThemeToggle.test.tsx` — 3 tests: aria-label, setTheme('light') on dark, setTheme('dark') on light; uses `vi.hoisted` for proper mock overrides
- `tests/components/LiveDot.test.tsx` — 2 tests: aria-label, green background color
- `tests/components/ErrorBanner.test.tsx` — 2 tests: default message, custom message
- `npm run type-check` — zero errors ✓
- `npm test` — 63/63 pass ✓

### P2.2 — Global CSS + root layout
- `app/globals.css` — added `:root` CSS variables (all `--amber-*`, `--panel-*`, `--nav-bg`, `--chat-bg`, `--bg-*`, `--border-subtle`, `--tx-*`, `--radius*`, `--z-*`); `[data-theme='light']` overrides; base html/body styles (overflow hidden, zero margin); custom 4px scrollbar; `@keyframes float`, `pulse-dot`, `blink-cursor`
- `app/layout.tsx` — `Inter` + `JetBrains_Mono` via `next/font/google` with CSS variables; `ThemeProvider` (`attribute="data-theme"`, `defaultTheme="dark"`, `enableSystem={false}`); `suppressHydrationWarning`; updated metadata
- `npm run type-check` — zero errors ✓

### P2.1 — Project bootstrap
- `next.config.ts` — added `reactStrictMode: true` and webpack alias for `mapbox-gl`
- `app/globals.css` — `@theme` block with full amber palette, dark surface palette, and font family tokens (Tailwind v4 — no `tailwind.config.ts` needed)
- All production and dev dependencies already present from Phase 1 ✓
- `npm run type-check` — zero errors ✓



## Known issues
None.

## Setup notes
None yet — see .claude/setup.md for the full setup sequence.
