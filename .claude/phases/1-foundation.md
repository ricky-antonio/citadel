# Phase 1 — Foundation

**Complete this phase entirely before starting Phase 2.**

This phase produces no visible UI. It produces a fully typed, fully tested data and logic layer that every later phase builds on. If the foundation is shaky, everything built on top of it will be too.

---

## What to build

- [ ] `lib/types.ts` — all TypeScript interfaces (City, CitySnapshot, WeatherData, AirQualityData, EventsData, TransitData, Anomaly, ChatMessage, ApiError, PulseComponents)
- [ ] `lib/cities.ts` — CITIES array with all four city configs (New York, San Francisco, Chicago, Washington DC)
- [ ] `lib/pulse.ts` — `computePulseScore`, `getPulseLabel`, `getPulseColor`, `getTimeOfDayScore`
- [ ] `tests/lib/pulse.test.ts` — all pulse tests (see below)
- [ ] `lib/data/fallbacks.ts` — typed fallback constants for WEATHER, AIR_QUALITY, EVENTS, TRANSIT, CRIME
- [ ] `lib/cache.ts` — `getCached(cityId, dataType)`, `setCached(cityId, dataType, payload)`, TTL map per data type
- [ ] `tests/lib/cache.test.ts` — all cache tests
- [ ] `lib/anomaly.ts` — `detectAnomaly(metric, value, history)`, `logAnomaly(cityId, anomaly)`, `getAnomalyHistory(cityId)`
- [ ] `tests/lib/anomaly.test.ts` — all anomaly tests
- [ ] `lib/data/weather.ts` — `fetchWeather(lat, lng)` — Open-Meteo, returns `WeatherData`
- [ ] `tests/lib/data/weather.test.ts`
- [ ] `lib/data/airQuality.ts` — `fetchAirQuality(locationIds)` — OpenAQ, returns `AirQualityData`
- [ ] `tests/lib/data/airQuality.test.ts`
- [ ] `lib/data/events.ts` — `fetchEvents(cityName)` — Ticketmaster + Eventbrite merged, returns `EventsData`
- [ ] `lib/data/transit/mta.ts` — `fetchMtaStatus()` — returns `TransitData`
- [ ] `lib/data/transit/sf511.ts` — `fetchSf511Status()` — returns `TransitData`
- [ ] `lib/data/transit/cta.ts` — `fetchCtaStatus()` — returns `TransitData`
- [ ] `lib/data/transit/wmata.ts` — `fetchWmataStatus()` — returns `TransitData`
- [ ] `lib/data/transit/index.ts` — `fetchTransitStatus(city)` — routes to correct provider
- [ ] `tests/lib/data/transit/mta.test.ts`
- [ ] `lib/data/crime.ts` — `fetchCrimeData(city)` — stub returning `CRIME_FALLBACK` (real impl in Phase 5)
- [ ] `lib/ai/context.ts` — `buildCityContext(snapshot)` — assembles snapshot into AI prompt string
- [ ] `tests/lib/ai/context.test.ts`
- [ ] `app/api/city/[id]/snapshot/route.ts` — GET, cache-first, assembles full CitySnapshot
- [ ] `tests/api/snapshot.test.ts`
- [ ] `app/api/pulse/[id]/route.ts` — GET, returns pulse score + 7-day history
- [ ] `app/api/anomalies/[id]/route.ts` — GET, returns recent anomaly log
- [ ] `tests/mocks/supabase.ts` — shared Supabase mock
- [ ] `tests/mocks/anthropic.ts` — shared Anthropic mock (needed in Phase 4, create now)
- [ ] `tests/setup.ts` — global test setup
- [ ] `vitest.config.ts` — test configuration
- [ ] `.github/workflows/ci.yml` — `npm ci → type-check → test → build`

---

## Key flows to implement

### Cache-first snapshot
```
GET /api/city/new-york/snapshot
  for each dataType in ['weather', 'air_quality', 'events', 'transit', 'crime']:
    row = getCached('new-york', dataType)
    if row:  use row.payload
    else:    payload = fetchXxx(); setCached('new-york', dataType, payload, ttl)
  snapshot = assembleSnapshot(cityConfig, weatherData, aqData, eventsData, transitData)
  snapshot.pulseScore = computePulseScore(snapshot)
  snapshot.pulseLabel = getPulseLabel(snapshot.pulseScore)
  snapshot.pulseColor = getPulseColor(snapshot.pulseScore)
  anomaly = detectAnomaly('pulse', snapshot.pulseScore, history)
  if anomaly: logAnomaly('new-york', anomaly)
  return Response.json(snapshot)
```

### Pulse score computation
```
computePulseScore({events, transit, airQuality, timestamp, city}):
  eventScore    = min((events.count / 50) * 25, 25)
  crowdScore    = (events.totalCapacity / 100000) * 20
  transitScore  = max(0, 20 - transit.delayCount * 1.5)
  aqScore       = max(0, 15 - airQuality.aqi / 10)
  timeScore     = getTimeOfDayScore(timestamp, city.timezone)
  return min(100, round(eventScore + crowdScore + transitScore + aqScore + timeScore))
```

---

## Tests to write

### `tests/lib/pulse.test.ts`
```
it('computePulseScore returns correct value for known inputs')
it('score never exceeds 100')
it('score never drops below 0')
it('getPulseLabel returns Quiet for score < 20')
it('getPulseLabel returns Calm for score 20-39')
it('getPulseLabel returns Active for score 40-59')
it('getPulseLabel returns Buzzing for score 60-79')
it('getPulseLabel returns Intense for score >= 80')
it('getPulseColor returns blue hex for Quiet range')
it('getPulseColor returns green hex for Calm range')
it('getPulseColor returns amber hex for Active range')
it('getPulseColor returns orange hex for Buzzing range')
it('getPulseColor returns red hex for Intense range')
it('getTimeOfDayScore returns 20 for evening hours 18-22')
it('getTimeOfDayScore returns lowest score for overnight hours')
```

### `tests/lib/cache.test.ts`
```
it('getCached returns null when no row exists for city+type')
it('getCached returns null when row exists but expires_at is in the past')
it('getCached returns payload when row exists and is fresh')
it('setCached upserts row with correct expires_at for weather (30 min)')
it('setCached upserts row with correct expires_at for transit (5 min)')
it('setCached upserts row with correct expires_at for events (6 hours)')
```

### `tests/lib/anomaly.test.ts`
```
it('detectAnomaly returns null when value is within 2 standard deviations')
it('detectAnomaly returns anomaly object when value exceeds 2σ threshold')
it('detectAnomaly calculates deviation as percentage above baseline')
it('logAnomaly inserts correct row to anomalies table')
it('getAnomalyHistory returns recent anomalies for a city')
```

### `tests/lib/data/weather.test.ts`
```
it('parses Open-Meteo response into WeatherData shape')
it('returns WEATHER_FALLBACK on HTTP error response')
it('returns WEATHER_FALLBACK on network failure (fetch throws)')
it('converts temperature from Celsius to Fahrenheit correctly')
it('handles missing hourly forecast data without throwing')
```

### `tests/lib/data/transit/mta.test.ts`
```
it('parses MTA GTFS-RT feed into TransitData shape')
it('maps delay < 5 min as severity minor')
it('maps delay >= 5 min as severity major')
it('returns TRANSIT_FALLBACK on empty feed')
it('returns TRANSIT_FALLBACK on fetch failure')
```

### `tests/lib/ai/context.test.ts`
```
it('buildCityContext includes city name and state')
it('buildCityContext includes pulse score and label')
it('buildCityContext includes weather conditions')
it('buildCityContext includes AQI value')
it('buildCityContext handles zero events gracefully')
it('buildCityContext handles zero transit delays gracefully')
it('output is under 3200 characters for typical snapshot')
```

### `tests/api/snapshot.test.ts`
```
it('returns 404 for unknown city ID')
it('returns 200 with CitySnapshot shape for valid city ID')
it('returns cached data when cache is fresh (no external API calls)')
it('calls external APIs on cache miss')
it('assembles pulse score into response')
```

---

## Manual verification checklist

Before marking Phase 1 complete:

- [ ] `npm run type-check` — zero errors
- [ ] `npm test` — all tests pass
- [ ] `npm run test:coverage` — lines ≥ 75%, functions ≥ 75%, branches ≥ 70%
- [ ] `npm run build` — production build succeeds (no app pages yet — that's fine)
- [ ] `curl http://localhost:3000/api/city/new-york/snapshot` returns a valid CitySnapshot JSON (not an error)
- [ ] A second identical request hits the cache (verify via Supabase table editor — `api_cache` row should exist)
- [ ] `curl http://localhost:3000/api/pulse/new-york` returns pulse score + history array
- [ ] No API keys appear in `npm run build` output or `.next/static/` files (except `NEXT_PUBLIC_MAPBOX_TOKEN`)

---

## Coverage target after this phase
Lines ≥ 75% · Functions ≥ 75% · Branches ≥ 70%
