# Phase 1 Roadmap — Foundation

All prompts below are self-contained. Clear context between sessions and paste the next prompt fresh. Do not skip a prompt or combine two into one session.

---

## Status

```
P1.1  Test infrastructure                 ○ Not started
P1.2  Types & city config                 ○ Not started
P1.3  Pulse score                         ○ Not started
P1.4  Cache & fallbacks                   ○ Not started
P1.5  Anomaly detection                   ○ Not started
P1.6  Weather & air quality fetchers      ○ Not started
P1.7  Events fetcher & crime stub         ○ Not started
P1.8  Transit fetchers                    ○ Not started
P1.9  AI context builder                  ○ Not started
P1.10 API routes                          ○ Not started
P1.11 Phase 1 final checklist             ○ Not started
```

---

## PROMPT P1.1 — Test infrastructure

```
Read CLAUDE.md, .claude/rules/testing.md, .claude/phases/1-foundation.md, and
PROGRESS.md in that order. Confirm: current phase, last completed task, next task.
Do not write any code until you have confirmed.

---

You are setting up the test infrastructure for a Next.js 15 project called Citadel.
No application code exists yet. This prompt creates the scaffolding that all future
test files will depend on. Nothing is tested yet — we are building the test harness.

Describe what you are about to create before writing any code:
- vitest.config.ts (Vitest config with jsdom, coverage thresholds, path alias)
- tests/setup.ts (global mocks: next/navigation, next-themes, global fetch)
- tests/mocks/supabase.ts (shared Supabase chainable mock)
- tests/mocks/anthropic.ts (shared Anthropic streaming mock)
- .github/workflows/ci.yml (npm ci → type-check → test → build)
- package.json scripts (dev, build, start, type-check, test, test:watch, test:coverage, lint)

Wait for confirmation before writing.

---

FILES TO CREATE:

vitest.config.ts — use the exact config from .claude/rules/testing.md. Coverage
thresholds: lines 75, functions 75, branches 70. Path alias @/ → root.

tests/setup.ts — use the exact setup from .claude/rules/testing.md. Includes:
  - @testing-library/jest-dom import
  - vi.clearAllMocks() in beforeEach, vi.restoreAllMocks() in afterEach
  - vi.mock('next/navigation') — useRouter, useParams, usePathname
  - vi.mock('next-themes') — useTheme returning { theme: 'dark', setTheme: vi.fn() }
  - global.fetch = vi.fn()

tests/mocks/supabase.ts — use the exact mock from .claude/rules/testing.md.
Must export: mockSupabaseFrom, mockSupabaseSelect, mockSupabaseEq, mockSupabaseGt,
mockSupabaseSingle, mockSupabaseUpsert, mockSupabaseInsert, and mockSupabase.
The mock chains: .from().select().eq().gt().single() all return mockReturnThis()
except the terminal calls (single, upsert, insert) which are plain vi.fn().

tests/mocks/anthropic.ts — use the exact mock from .claude/rules/testing.md.
Must export: mockStream (with toReadableStream), mockMessagesStream.
vi.mock('@anthropic-ai/sdk') with default class returning { messages: { stream } }.

.github/workflows/ci.yml:
  name: CI
  on: [push, pull_request]
  jobs:
    build:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-node@v4
          with: { node-version: '20', cache: 'npm' }
        - run: npm ci
        - run: npm run type-check
        - run: npm test
        - run: npm run build

package.json scripts (add/merge into existing):
  "dev": "next dev"
  "build": "next build"
  "start": "next start"
  "type-check": "tsc --noEmit"
  "test": "vitest run"
  "test:watch": "vitest"
  "test:coverage": "vitest run --coverage"
  "lint": "next lint"

After creating all files, install test dependencies:
  npm install -D vitest @vitest/coverage-v8 @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom @vitejs/plugin-react

Verify the test runner works with no test files yet:
  npm test
  (Expected: "No test files found" or similar — not an error)

Update PROGRESS.md: mark P1.1 complete, next = P1.2 Types & city config.
```

---

## PROMPT P1.2 — Types & city config

```
Read CLAUDE.md, .claude/rules/testing.md, .claude/phases/1-foundation.md, and
PROGRESS.md in that order. Confirm: current phase, last completed task, next task.
Do not write any code until you have confirmed.

---

You are building the TypeScript type definitions and city configuration for Citadel.
These two files are the foundation everything else imports from. No tests for this
prompt — types and static config are verified by the TypeScript compiler.

Describe what you are about to create before writing any code:
- lib/types.ts — all application interfaces
- lib/cities.ts — CITIES array with all four city configs

Wait for confirmation before writing.

---

FILES TO CREATE:

lib/types.ts — define all interfaces from CLAUDE.md's Types section exactly:
  City, TransitProvider (union type), CrimeProvider (union type), CitySnapshot,
  WeatherData, AirQualityData, EventsData (includes Event interface for tonight[]),
  TransitData, Anomaly, ChatMessage, ApiError, PulseComponents, DataType (union type),
  MetricType (union type), PulseLabel (union type)

  Also add: CacheRow interface for Supabase api_cache reads:
    { id: string; payload: unknown; fetched_at: string; expires_at: string }

  All interfaces must be exported. Use 'interface' not 'type' for object shapes.
  Union types use 'type'. No 'any' anywhere.

lib/cities.ts — export CITIES: City[] with all four city configs from CLAUDE.md.
  Use the exact lat/lng/zoom/timezone values shown.
  For mapStyle: use "mapbox://styles/mapbox/dark-v11" as placeholder — the custom
  Mapbox Studio style URL replaces this after the Studio setup in Phase 2.
  Also export: getCityById(id: string): City | undefined
    return CITIES.find(c => c.id === id)

After writing both files, run:
  npm run type-check
  (Expected: zero errors — these files have no external dependencies yet)

Update PROGRESS.md: mark P1.2 complete, next = P1.3 Pulse score.
```

---

## PROMPT P1.3 — Pulse score

```
Read CLAUDE.md, .claude/rules/testing.md, .claude/phases/1-foundation.md, and
PROGRESS.md in that order. Confirm: current phase, last completed task, next task.
Do not write any code until you have confirmed.

---

You are building the pulse score algorithm — the signature metric of the Citadel app.
It computes a 0-100 score from live city data and maps it to a label and color.
This is pure logic: no network calls, no database, easy to unit test.

Describe what you are about to create before writing any code:
- lib/pulse.ts — computePulseScore, getPulseLabel, getPulseColor, getTimeOfDayScore
- tests/lib/pulse.test.ts — 15 test cases verifying every function and boundary

Wait for confirmation before writing.

---

FILES TO CREATE:

lib/pulse.ts — implement exactly as shown in CLAUDE.md's Pulse score algorithm section:
  computePulseScore(data: CitySnapshot): number
    eventScore    = Math.min((data.events.count / 50) * 25, 25)
    crowdScore    = (data.events.totalCapacity / 100000) * 20
    transitScore  = Math.max(0, 20 - data.transit.delayCount * 1.5)
    aqScore       = Math.max(0, 15 - data.airQuality.aqi / 10)
    timeScore     = getTimeOfDayScore(data.timestamp, data.city.timezone)
    return Math.min(100, Math.round(sum))

  getPulseLabel(score: number): PulseLabel
    < 20 → 'Quiet' | 20-39 → 'Calm' | 40-59 → 'Active' | 60-79 → 'Buzzing' | ≥ 80 → 'Intense'

  getPulseColor(score: number): string
    < 20 → '#60A5FA' | 20-39 → '#4ADE80' | 40-59 → '#E8A020' | 60-79 → '#F97316' | ≥ 80 → '#EF4444'

  getTimeOfDayScore(timestamp: string, timezone: string): number
    Use Intl.DateTimeFormat with timeZone to get local hour.
    18-22 → 20 | 12-17 → 15 | 8-11 → 12 | 23 or 0-1 → 5 | else → 2

  getLocalHour(timestamp: string, timezone: string): number — private helper

tests/lib/pulse.test.ts — write all 15 test cases from .claude/phases/1-foundation.md:
  Use a helper makeMockSnapshot(overrides) to build a minimal CitySnapshot fixture.
  Test boundary values exactly (score 19, 20, 39, 40, 59, 60, 79, 80).
  For getTimeOfDayScore: construct timestamp strings at specific hours using
  new Date() manipulated to known hours. Use vi.useFakeTimers() if needed.

After writing, run:
  npm test
  (Expected: all pulse tests pass)
  npm run type-check
  (Expected: zero errors)

Update PROGRESS.md: mark P1.3 complete, next = P1.4 Cache & fallbacks.
```

---

## PROMPT P1.4 — Cache & fallbacks

```
Read CLAUDE.md, .claude/rules/testing.md, .claude/phases/1-foundation.md, and
PROGRESS.md in that order. Confirm: current phase, last completed task, next task.
Do not write any code until you have confirmed.

---

You are building two related files: the typed fallback constants (used when external
APIs fail) and the Supabase cache layer (used to avoid calling external APIs on every
request). The cache follows a check-then-fetch pattern documented in .claude/schema.md.

Describe what you are about to create before writing any code:
- lib/data/fallbacks.ts — one typed fallback constant per data type
- lib/cache.ts — getCached and setCached with TTL logic
- tests/lib/cache.test.ts — 6 test cases for cache hit, miss, and expiry

Wait for confirmation before writing.

---

FILES TO CREATE:

lib/data/fallbacks.ts — export typed constants:
  WEATHER_FALLBACK: WeatherData — all fields present, obvious placeholder values
    (temp: 0, feelsLike: 0, condition: 'Unavailable', windSpeed: 0, windDir: 'N',
    humidity: 0, uvIndex: 0, forecast: 'Data temporarily unavailable', hourly: [])

  AIR_QUALITY_FALLBACK: AirQualityData
    (aqi: 0, category: 'Unavailable', pm25: 0, pm10: 0, no2: 0, ozone: 0, stations: [])

  EVENTS_FALLBACK: EventsData
    (count: 0, totalCapacity: 0, tonight: [], byCategory: {}, locations: [])

  TRANSIT_FALLBACK: TransitData
    (delayCount: 0, delays: [], lines: [])

  CRIME_FALLBACK: Record<string, unknown>
    ({}) — crime data is untyped in v1 (stub only)

lib/cache.ts — create a Supabase client (server-side, service role key) and export:

  const TTL: Record<DataType, number> = {
    weather: 30 * 60 * 1000,       // 30 minutes in ms
    air_quality: 60 * 60 * 1000,   // 60 minutes
    events: 6 * 60 * 60 * 1000,    // 6 hours
    transit: 5 * 60 * 1000,        // 5 minutes
    crime: 24 * 60 * 60 * 1000,    // 24 hours
  }

  getCached(cityId: string, dataType: DataType): Promise<unknown | null>
    Query api_cache for (city_id, data_type) where expires_at > now().
    Return payload if found and fresh, null otherwise.
    Never throw — return null on any error.
    Select only: id, payload, fetched_at, expires_at (never select *)

  setCached(cityId: string, dataType: DataType, payload: unknown): Promise<void>
    Upsert into api_cache with expires_at = now + TTL[dataType].
    Use onConflict: 'city_id,data_type' for the upsert.
    Never throw — log error and return silently on failure.

  The Supabase client in this file uses SUPABASE_SERVICE_ROLE_KEY (server-only).
  Import from @supabase/supabase-js createClient.

tests/lib/cache.test.ts — write 6 tests from .claude/phases/1-foundation.md.
  Import mockSupabaseSingle, mockSupabaseUpsert from tests/mocks/supabase.ts.
  DO NOT import from @supabase/supabase-js directly in the test — the mock handles it.
  For cache miss: mockSupabaseSingle.mockResolvedValueOnce({ data: null, error: null })
  For cache hit: mockSupabaseSingle.mockResolvedValueOnce({ data: { payload: {...} }, error: null })
  For expiry: the query filters by expires_at > now() — a miss means no row returned
  For setCached: verify mockSupabaseUpsert was called with correct expires_at range

After writing, run:
  npm test
  (Expected: all cache tests pass — pulse tests still pass too)
  npm run type-check

Update PROGRESS.md: mark P1.4 complete, next = P1.5 Anomaly detection.
```

---

## PROMPT P1.5 — Anomaly detection

```
Read CLAUDE.md, .claude/rules/testing.md, .claude/phases/1-foundation.md, and
PROGRESS.md in that order. Confirm: current phase, last completed task, next task.
Do not write any code until you have confirmed.

---

You are building the anomaly detection system. When a live metric deviates more than
2 standard deviations from its 30-day baseline, it is logged as an anomaly. This
is how Citadel notices unusual city conditions (a transit meltdown, an AQI spike, etc).

Describe what you are about to create before writing any code:
- lib/anomaly.ts — detectAnomaly, logAnomaly, getAnomalyHistory
- tests/lib/anomaly.test.ts — 5 test cases covering detection threshold and logging

Wait for confirmation before writing.

---

FILES TO CREATE:

lib/anomaly.ts — export three functions:

  detectAnomaly(metric: MetricType, value: number, history: number[]): Anomaly | null
    If history has fewer than 10 data points: return null (not enough baseline data).
    Compute mean and standard deviation of history array.
    If (value - mean) / stddev > 2.0: return an Anomaly object.
    Anomaly.baseline = mean (rounded to 2 decimal places)
    Anomaly.deviation = (value - mean) / mean (as decimal fraction, e.g. 0.35 = 35% above)
    Anomaly.occurredAt = new Date().toISOString()
    Anomaly.description = null (populated async later by AI)
    If value is within 2σ: return null.

  logAnomaly(cityId: string, anomaly: Anomaly): Promise<void>
    Insert into anomalies table. Map Anomaly fields to column names:
      city_id, metric: anomaly.metric, value: anomaly.value,
      baseline: anomaly.baseline, deviation: anomaly.deviation,
      description: anomaly.description ?? null,
      occurred_at: anomaly.occurredAt
    Never throw — log error and return silently.

  getAnomalyHistory(cityId: string, limit = 10): Promise<Anomaly[]>
    Select from anomalies: city_id, metric, value, baseline, deviation, description, occurred_at
    Filter: city_id = cityId, occurred_at > 7 days ago
    Order: occurred_at desc, limit
    Map rows to Anomaly[] — never return null, return [] on error.

  Private helper: computeStdDev(values: number[]): number

tests/lib/anomaly.test.ts — 5 tests from .claude/phases/1-foundation.md:
  - detectAnomaly returns null with history of [50,51,49,50,52,50,51,49,50,51] and value 52
  - detectAnomaly returns Anomaly when value is clearly > 2σ above the history
  - detectAnomaly returns null when history has fewer than 10 points
  - detectAnomaly deviation is calculated correctly (percentage above baseline)
  - logAnomaly calls mockSupabaseInsert with correct column values

After writing, run:
  npm test
  (Expected: all anomaly tests pass — previous tests still pass)
  npm run type-check

Update PROGRESS.md: mark P1.5 complete, next = P1.6 Weather & air quality fetchers.
```

---

## PROMPT P1.6 — Weather & air quality fetchers

```
Read CLAUDE.md, .claude/rules/testing.md, .claude/phases/1-foundation.md, and
PROGRESS.md in that order. Confirm: current phase, last completed task, next task.
Do not write any code until you have confirmed.

---

You are building two data fetchers: weather from Open-Meteo and air quality from
OpenAQ. Both are free with no API key. Both wrap the external fetch in try/catch
and return typed fallbacks on any failure. They parse the raw API responses into
the exact WeatherData and AirQualityData shapes from lib/types.ts.

Describe what you are about to create before writing any code:
- lib/data/weather.ts — fetchWeather with Open-Meteo URL and response parser
- tests/lib/data/weather.test.ts — 5 tests covering happy path, errors, and parsing
- lib/data/airQuality.ts — fetchAirQuality with OpenAQ URL and response parser
- tests/lib/data/airQuality.test.ts — happy path, error, and missing station tests

Wait for confirmation before writing.

---

FILES TO CREATE:

lib/data/weather.ts:
  Open-Meteo URL:
    https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lng}
    &current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,relative_humidity_2m,uv_index
    &hourly=temperature_2m,weather_code&temperature_unit=fahrenheit&wind_speed_unit=mph
    &forecast_days=1&timezone=auto

  fetchWeather(lat: number, lng: number): Promise<WeatherData>
    try/catch wrapping the entire fetch + parse. Return WEATHER_FALLBACK on any error.
    Log console.error on failure with the error.

  parseWeatherResponse(json: unknown): WeatherData
    Map Open-Meteo current fields to WeatherData. Temperature is already in Fahrenheit
    (temperature_unit=fahrenheit). Map weather_code to a human-readable condition string
    using a switch/lookup (e.g. 0 → 'Clear sky', 1 → 'Mainly clear', 61 → 'Rainy', etc —
    cover at least 10 common codes, default to 'Unknown').
    forecast: build a one-sentence string from the next 6 hours of hourly data.
    windDir: convert wind_direction_10m degrees to compass string (N/NE/E/SE/S/SW/W/NW).
    hourly: map first 24 hours of hourly data to the { hour, temp, condition } shape.

lib/data/airQuality.ts:
  OpenAQ v3 URL:
    https://api.openaq.io/v3/locations/{locationId}/latest
    Fetch each locationId separately and aggregate.

  fetchAirQuality(locationIds: number[]): Promise<AirQualityData>
    Fetch all locationIds in parallel with Promise.all.
    Parse PM2.5, NO2, ozone readings from each station.
    Compute overall AQI from PM2.5 using the EPA standard breakpoints:
      PM2.5 0-12 → AQI 0-50 (Good)
      PM2.5 12.1-35.4 → AQI 51-100 (Moderate)
      PM2.5 35.5-55.4 → AQI 101-150 (Unhealthy for Sensitive Groups)
      PM2.5 55.5-150.4 → AQI 151-200 (Unhealthy)
      PM2.5 150.5+ → AQI 201+ (Very Unhealthy)
    category: map AQI range to EPA category name.
    stations: array of { lat, lng, aqi } for each station (for the map heatmap).
    Return AIR_QUALITY_FALLBACK on any error.

tests/lib/data/weather.test.ts — 5 tests:
  Mock global.fetch for each test case. Supply realistic Open-Meteo JSON fixtures.
  it('parses Open-Meteo response into WeatherData shape')
  it('returns WEATHER_FALLBACK on HTTP 500 response')
  it('returns WEATHER_FALLBACK when fetch throws a network error')
  it('temperature is in Fahrenheit (not Celsius) — verify a known value')
  it('handles missing hourly data without throwing')

tests/lib/data/airQuality.test.ts — 3 tests:
  it('parses OpenAQ response into AirQualityData shape with correct AQI category')
  it('returns AIR_QUALITY_FALLBACK when all location fetches fail')
  it('returns AIR_QUALITY_FALLBACK when locationIds array is empty')

After writing, run:
  npm test
  (Expected: all tests pass)
  npm run type-check

Update PROGRESS.md: mark P1.6 complete, next = P1.7 Events fetcher & crime stub.
```

---

## PROMPT P1.7 — Events fetcher & crime stub

```
Read CLAUDE.md, .claude/rules/testing.md, .claude/phases/1-foundation.md, and
PROGRESS.md in that order. Confirm: current phase, last completed task, next task.
Do not write any code until you have confirmed.

---

You are building the events fetcher (Ticketmaster + Eventbrite merged) and the
crime data stub. The events fetcher calls both APIs, deduplicates by venue+time,
and returns a unified EventsData shape. The crime file is a stub — it returns
CRIME_FALLBACK immediately. The real implementation comes in Phase 5.

Describe what you are about to create before writing any code:
- lib/data/events.ts — fetchEvents merging Ticketmaster and Eventbrite
- lib/data/crime.ts — stub returning CRIME_FALLBACK

Wait for confirmation before writing.

---

FILES TO CREATE:

lib/data/events.ts:
  Ticketmaster URL:
    https://app.ticketmaster.com/discovery/v2/events.json
    ?apikey={TICKETMASTER_API_KEY}&city={cityName}&size=50&sort=date,asc
    &startDateTime={todayISO}&endDateTime={tomorrowISO}

  Eventbrite URL:
    https://www.eventbriteapi.com/v3/events/search/
    ?location.address={cityName}&expand=venue,ticket_classes
    &start_date.range_start={todayISO}&start_date.range_end={tomorrowISO}
    Header: Authorization: Bearer {EVENTBRITE_API_KEY}

  fetchEvents(cityName: string): Promise<EventsData>
    Fetch both APIs in parallel with Promise.allSettled (so one failure doesn't
    block the other). Map each to a common internal Event shape. Merge the two
    arrays. Deduplicate: if two events share the same venue name and start time
    (within 30 minutes), keep only the Ticketmaster one.
    Compute: count, totalCapacity (sum of attendances), tonight (events today
    after 18:00 local time, up to 10), byCategory (count per category),
    locations array for the map layer.
    Return EVENTS_FALLBACK if both APIs fail.

  parseTicketmasterEvent(raw: unknown): Event — private helper
  parseEventbriteEvent(raw: unknown): Event — private helper

  Note: TICKETMASTER_API_KEY and EVENTBRITE_API_KEY are server-only env vars
  (no NEXT_PUBLIC_ prefix). This file is only ever called from route handlers.

lib/data/crime.ts:
  fetchCrimeData(city: City): Promise<Record<string, unknown>>
    Return Promise.resolve(CRIME_FALLBACK)
    Add a comment: real open-data implementations added in Phase 5.

No tests for events or crime in this prompt — events requires complex mocking of
two parallel APIs. The API route integration test (P1.10) will cover the happy path.
Crime is a stub with no logic to test.

After writing, run:
  npm run type-check
  (Expected: zero errors)
  npm test
  (Expected: all previous tests still pass)

Update PROGRESS.md: mark P1.7 complete, next = P1.8 Transit fetchers.
```

---

## PROMPT P1.8 — Transit fetchers

```
Read CLAUDE.md, .claude/rules/testing.md, .claude/phases/1-foundation.md, and
PROGRESS.md in that order. Confirm: current phase, last completed task, next task.
Do not write any code until you have confirmed.

---

You are building four city-specific transit data fetchers and the index that routes
to the correct one based on the city config. Each fetcher calls a different public
transit API and returns a unified TransitData shape. The MTA fetcher gets a full
test suite; the others get type checking only.

Describe what you are about to create before writing any code:
- lib/data/transit/mta.ts — New York MTA GTFS-RT alerts endpoint
- lib/data/transit/sf511.ts — San Francisco 511 transit API
- lib/data/transit/cta.ts — Chicago CTA Train Tracker
- lib/data/transit/wmata.ts — Washington DC WMATA real-time API
- lib/data/transit/index.ts — fetchTransitStatus routing function
- tests/lib/data/transit/mta.test.ts — 5 tests for MTA parsing

Wait for confirmation before writing.

---

FILES TO CREATE:

lib/data/transit/mta.ts:
  MTA Service Alerts URL:
    https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/camsys%2Fsubway-alerts
    Header: x-api-key: {MTA_API_KEY}
    The feed is a GTFS-RT protobuf, but the MTA also provides a JSON-equivalent.
    Use the JSON version: https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs
    is binary; instead use the alerts JSON endpoint or parse the feed.
    Simplification: use the MTA status page JSON API for the subway lines:
    https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-ace (etc)
    For this implementation, focus on the service alerts endpoint which returns
    active delays across all lines. Map each alert to a delay entry.
    
    fetchMtaStatus(apiKey: string): Promise<TransitData>
    Return TRANSIT_FALLBACK on any error.
    Parse: delayCount = number of active service alerts,
    delays = alerts mapped to { line, severity, description },
    lines = all subway lines with status derived from alerts presence.
    Severity: delay description mentions '> 5 min' or 'major' → 'major', else 'minor'.

lib/data/transit/sf511.ts:
  SF 511 Real-Time Departures:
    https://api.511.org/transit/lines?api_key={SF_511_API_KEY}&agency=SF&format=json
    fetchSf511Status(apiKey: string): Promise<TransitData>
    Parse lines and any service alerts. Return TRANSIT_FALLBACK on error.

lib/data/transit/cta.ts:
  CTA Train Tracker:
    https://lapi.transitchicago.com/api/1.0/ttarrivals.aspx?key={CTA_API_KEY}&mapid=40380&outputType=JSON
    fetchCtaStatus(apiKey: string): Promise<TransitData>
    Parse arrivals for delay indicators. Return TRANSIT_FALLBACK on error.

lib/data/transit/wmata.ts:
  WMATA Real-Time Train Positions:
    https://api.wmata.com/TrainPositions/TrainPositions?contentType=json
    Header: api_key: {WMATA_API_KEY}
    WMATA Incidents:
    https://api.wmata.com/Incidents.svc/json/Incidents
    Header: api_key: {WMATA_API_KEY}
    fetchWmataStatus(apiKey: string): Promise<TransitData>
    Use incidents for delay count and line status. Return TRANSIT_FALLBACK on error.

lib/data/transit/index.ts:
  fetchTransitStatus(city: City): Promise<TransitData>
    Switch on city.transit.provider:
      'mta'    → fetchMtaStatus(city.transit.apiKey ?? '')
      'sf-511' → fetchSf511Status(city.transit.apiKey ?? '')
      'cta'    → fetchCtaStatus(city.transit.apiKey ?? '')
      'wmata'  → fetchWmataStatus(city.transit.apiKey ?? '')
    TypeScript exhaustive switch — the default branch should assert never.

tests/lib/data/transit/mta.test.ts — 5 tests from .claude/phases/1-foundation.md:
  Mock global.fetch. Provide realistic fixture data for the MTA alerts endpoint.
  it('parses MTA response into TransitData shape with correct fields')
  it('maps delay described as minor to severity minor')
  it('maps delay described as major or > 5 min to severity major')
  it('returns TRANSIT_FALLBACK when feed is empty (no active alerts)')
  it('returns TRANSIT_FALLBACK on fetch failure')

After writing, run:
  npm test
  npm run type-check

Update PROGRESS.md: mark P1.8 complete, next = P1.9 AI context builder.
```

---

## PROMPT P1.9 — AI context builder

```
Read CLAUDE.md, .claude/rules/testing.md, .claude/phases/1-foundation.md, and
PROGRESS.md in that order. Confirm: current phase, last completed task, next task.
Do not write any code until you have confirmed.

---

You are building the AI context builder — the function that assembles live city data
into a structured string that gets injected into every AI prompt. It must stay under
800 tokens (~3200 characters). It is pure logic: no network calls, no database.

Describe what you are about to create before writing any code:
- lib/ai/context.ts — buildCityContext assembling a CitySnapshot into a prompt string
- tests/lib/ai/context.test.ts — 7 tests verifying content and character count

Wait for confirmation before writing.

---

FILES TO CREATE:

lib/ai/context.ts — implement buildCityContext exactly as shown in CLAUDE.md's
AI context builder section. Also implement:

  formatLocalTime(timestamp: string, timezone: string): string
    Format as "Tuesday, 7:30 PM" using Intl.DateTimeFormat with the city timezone.

  buildCityContext(snapshot: CitySnapshot): string
    Assemble the template from CLAUDE.md.
    After assembling, check: if output.length > 3200, warn in development only:
      if (process.env.NODE_ENV === 'development') {
        console.warn('buildCityContext: output exceeds 3200 chars:', output.length)
      }
    Truncate events.tonight to maximum 5 entries before stringifying.
    Return the assembled string.

tests/lib/ai/context.test.ts — 7 tests from .claude/phases/1-foundation.md:
  Build a makeMockSnapshot() helper with a full, realistic CitySnapshot fixture.
  it('includes city name and state')
  it('includes pulse score and label')
  it('includes weather temp and condition')
  it('includes AQI value')
  it('renders "None" when events.tonight is empty')
  it('renders "None" when transit.delays is empty')
  it('output is under 3200 characters for a typical realistic snapshot')

After writing, run:
  npm test
  npm run type-check

Update PROGRESS.md: mark P1.9 complete, next = P1.10 API routes.
```

---

## PROMPT P1.10 — API routes

```
Read CLAUDE.md, .claude/rules/testing.md, .claude/phases/1-foundation.md, and
PROGRESS.md in that order. Confirm: current phase, last completed task, next task.
Do not write any code until you have confirmed.

---

You are building three API route handlers: the main city snapshot endpoint (which
orchestrates all the data fetching), and two read-only endpoints for pulse history
and anomaly logs. The snapshot route is the most important — it implements the
cache-first pattern that drives the entire app.

Describe what you are about to create before writing any code:
- app/api/city/[id]/snapshot/route.ts — cache-first data assembly
- app/api/pulse/[id]/route.ts — pulse score + 7-day history
- app/api/anomalies/[id]/route.ts — recent anomaly log
- tests/api/snapshot.test.ts — 5 integration tests for the snapshot route

Wait for confirmation before writing.

---

FILES TO CREATE:

app/api/city/[id]/snapshot/route.ts:
  Next.js 15: params is a Promise — must be awaited before use.
  export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
  
  1. Validate city ID: use getCityById(id). Return 404 ApiError if not found.
  2. For each dataType ['weather', 'air_quality', 'events', 'transit', 'crime']:
     a. cached = await getCached(city.id, dataType)
     b. if cached: use cached
     c. if not: fetch from provider, await setCached(city.id, dataType, result)
  3. Assemble CitySnapshot:
     city, timestamp: new Date().toISOString(),
     weather, airQuality, events, transit,
     pulseScore: computePulseScore(snapshot),
     pulseLabel: getPulseLabel(score),
     pulseColor: getPulseColor(score)
  4. Detect anomalies:
     Pull last 30 days of pulse_history for this city.
     detectAnomaly('pulse', pulseScore, historyValues) — log if found.
  5. Write pulse to history:
     Insert into pulse_history: city_id, pulse_score, components JSON, recorded_at.
     Use service role client. Do not block the response on this write (fire-and-forget).
  6. Fetch recent anomalies: getAnomalyHistory(city.id)
  7. Return Response.json({ ...snapshot, anomalies })

  All errors use the ApiError shape: { error: string, code: string }
  Catch-all: return 500 with code 'INTERNAL_ERROR' on unhandled exceptions.

app/api/pulse/[id]/route.ts:
  Next.js 15: export async function GET(req: Request, { params }: { params: Promise<{ id: string }> })
  const { id } = await params
  Validate city ID → 404 if not found.
  Fetch last 168 rows of pulse_history for the city (7 days × 24h), ordered desc.
  Return { cityId: id, currentPulse: most recent score, history: rows }

app/api/anomalies/[id]/route.ts:
  Next.js 15: export async function GET(req: Request, { params }: { params: Promise<{ id: string }> })
  const { id } = await params
  Validate city ID → 404 if not found.
  Call getAnomalyHistory(id, 20).
  Return { cityId: id, anomalies }

tests/api/snapshot.test.ts — 5 tests from .claude/phases/1-foundation.md:
  These are integration tests of the route handler. Mock:
    - All lib/data/* fetchers (fetchWeather, fetchAirQuality, etc)
    - lib/cache.ts (getCached, setCached)
    - lib/anomaly.ts (detectAnomaly, logAnomaly)
    - Supabase client (for pulse_history writes and anomaly history reads)
  
  it('returns 404 for unknown city ID xyz')
  it('returns 200 with correct CitySnapshot shape for city new-york')
  it('uses cached data when getCached returns a value — no external fetch called')
  it('calls fetchWeather when getCached returns null for weather')
  it('includes computed pulseScore in the response')

After writing, run:
  npm test
  npm run type-check
  npm run build (may fail on missing Next.js setup — that is fine at this stage;
  the important thing is type-check and test pass)

Update PROGRESS.md: mark P1.10 complete, next = P1.11 Phase 1 final checklist.
```

---

## PROMPT P1.11 — Phase 1 final checklist

```
Read CLAUDE.md, .claude/rules/testing.md, .claude/phases/1-foundation.md, and
PROGRESS.md in that order. Confirm: current phase, last completed task, next task.
Do not write any code until you have confirmed.

---

This is the final checklist for Phase 1. No new code. Run each check and report
the result. Fix any failures before marking the phase complete.

---

Run in order and report each result:

1. npm run type-check
   Expected: zero errors. Fix any that appear.

2. npm test
   Expected: all tests pass. Fix any failures.

3. npm run test:coverage
   Expected: lines ≥ 75%, functions ≥ 75%, branches ≥ 70%.
   If below threshold: identify which files are untested and add the missing tests.

4. npm run build
   This will likely fail if Next.js is not yet bootstrapped — that is acceptable
   at this stage. The important thing is that the lib/ and API route TypeScript
   compiles without errors (step 1).

5. Manual API check (requires .env.local to be populated):
   curl http://localhost:3000/api/city/new-york/snapshot
   Expected: valid CitySnapshot JSON with pulseScore, weather, transit, etc.

6. Cache verification:
   After the curl above, open your Supabase dashboard → Table Editor → api_cache.
   Confirm: rows exist for new-york with data_type in [weather, air_quality, events,
   transit, crime] and expires_at in the future.
   Run the same curl again — it should return faster (cache hit).

7. npm audit
   Expected: no high or critical vulnerabilities.

After all checks pass, update PROGRESS.md:
  - Move P1.11 to Completed
  - Change "Current phase" to "Phase 2 — Shell & Map (not started)"
  - Update the "In progress" section to the first item of Phase 2

Proceed to PHASE2ROADMAP.md when ready.
```
