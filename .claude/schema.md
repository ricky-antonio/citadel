# Database Schema

All tables live in the Supabase project (Postgres). No RLS — all data is public read-only city intelligence. No user-specific data exists in v1.

---

## Tables

### `api_cache`

Stores the last successful response from each external API per city. The primary cache layer that prevents rate limit exhaustion.

```sql
create table api_cache (
  id          uuid        primary key default gen_random_uuid(),
  city_id     text        not null,
  data_type   text        not null,  -- 'weather' | 'air_quality' | 'events' | 'transit' | 'crime'
  payload     jsonb       not null,
  fetched_at  timestamptz not null default now(),
  expires_at  timestamptz not null,
  unique(city_id, data_type)
);

create index api_cache_lookup
  on api_cache (city_id, data_type, expires_at);
```

**TTL per data_type:**
| data_type | TTL | Rationale |
|-----------|-----|-----------|
| `weather` | 30 minutes | Changes slowly; Open-Meteo rate limits are generous |
| `air_quality` | 60 minutes | Station readings update hourly |
| `events` | 6 hours | Event listings don't change mid-day |
| `transit` | 5 minutes | Most time-sensitive — delays change constantly |
| `crime` | 24 hours | Open-data portals update nightly |

**Query gotchas:**
- Always check `expires_at > now()` when reading — a row existing does not mean it is fresh
- The `unique(city_id, data_type)` constraint means `setCached` must use `upsert` (INSERT ... ON CONFLICT DO UPDATE)
- Never `select *` — the payload column can be large. Select `id, city_id, data_type, payload, fetched_at, expires_at`

---

### `ai_briefings`

Daily AI-generated city brief. Generated once per city per day on first request, then served from cache for all subsequent requests the same day.

```sql
create table ai_briefings (
  id           uuid   primary key default gen_random_uuid(),
  city_id      text   not null,
  briefing     text   not null,
  generated_at timestamptz not null default now(),
  date         date   not null default current_date,
  unique(city_id, date)
);
```

**Notes:**
- No index needed — queries always hit the unique constraint on (city_id, date)
- The `date` column uses the UTC date from `current_date`. For timezone accuracy per city, the briefing generation logic should pass the city's local date explicitly
- briefing is plain text, not HTML — never render with `dangerouslySetInnerHTML`

---

### `anomalies`

Historical log of metric spikes — when pulse, AQI, or transit delays deviated significantly from recent baseline (> 2 standard deviations from 30-day average).

```sql
create table anomalies (
  id          uuid        primary key default gen_random_uuid(),
  city_id     text        not null,
  metric      text        not null,  -- 'pulse' | 'aqi' | 'transit' | 'events'
  value       float       not null,
  baseline    float       not null,
  deviation   float       not null,  -- percentage above baseline
  description text,                  -- AI-generated one-liner, nullable
  occurred_at timestamptz not null default now()
);

create index anomalies_city
  on anomalies (city_id, occurred_at desc);
```

**Notes:**
- `description` is nullable — the AI one-liner is generated asynchronously and may not be ready immediately
- `deviation` is stored as a decimal fraction: 0.35 = 35% above baseline
- `metric` enum values: `'pulse' | 'aqi' | 'transit' | 'events'`

---

### `pulse_history`

Hourly pulse score snapshots per city. Used for the history chart in `HistoryPanel.tsx` and for anomaly baseline calculations (30-day rolling window).

```sql
create table pulse_history (
  id          uuid        primary key default gen_random_uuid(),
  city_id     text        not null,
  pulse_score float       not null,
  components  jsonb       not null,  -- { weather, aqi, events, transit, time_of_day }
  recorded_at timestamptz not null default now()
);

create index pulse_history_city
  on pulse_history (city_id, recorded_at desc);
```

**Notes:**
- `components` stores the breakdown that produced the score, enabling debugging and future per-component charts
- Expected shape: `{ weather: number, aqi: number, events: number, transit: number, time_of_day: number }`
- Never `select *` — select `city_id, pulse_score, components, recorded_at`
- For the history chart: `select city_id, pulse_score, recorded_at from pulse_history where city_id = $1 order by recorded_at desc limit 168` (7 days × 24h)
- For anomaly baseline: aggregate with `avg` and `stddev` over 30 days

---

### `ai_usage`

Logs every Anthropic API call for cost monitoring. Enables diagnosing token usage spikes.

```sql
create table ai_usage (
  id          uuid    primary key default gen_random_uuid(),
  city_id     text,                   -- null for non-city-specific calls
  route       text    not null,       -- '/api/chat' | '/api/city/[id]/briefing'
  tokens_in   integer,
  tokens_out  integer,
  duration_ms integer,
  created_at  timestamptz default now()
);
```

**Notes:**
- Log after every successful Anthropic call — not on rate-limited or failed requests
- `city_id` is nullable — some calls may not be city-specific in future
- No index needed — queries are ad-hoc analytics, not on the hot path

---

## Enums

Implemented as TypeScript union types in `lib/types.ts`, not as Postgres enums (easier to evolve without migrations).

```ts
type DataType    = 'weather' | 'air_quality' | 'events' | 'transit' | 'crime'
type MetricType  = 'pulse' | 'aqi' | 'transit' | 'events'
type TransitProvider = 'mta' | 'sf-511' | 'cta' | 'wmata'
type CrimeProvider   = 'nyc-open-data' | 'datasf' | 'chicago-data-portal' | 'dc-open-data'
type PulseLabel  = 'Quiet' | 'Calm' | 'Active' | 'Buzzing' | 'Intense'
```

---

## Foreign key relationships

No foreign keys between tables — city_id is a plain text identifier matching keys in `lib/cities.ts`. This is intentional: the city configuration lives in code, not the database.

```
api_cache.city_id    ──── (string key) ──── lib/cities.ts CITIES[].id
ai_briefings.city_id ──── (string key) ──── lib/cities.ts CITIES[].id
anomalies.city_id    ──── (string key) ──── lib/cities.ts CITIES[].id
pulse_history.city_id──── (string key) ──── lib/cities.ts CITIES[].id
ai_usage.city_id     ──── (string key) ──── lib/cities.ts CITIES[].id (nullable)
```

**Dependency / creation order:**
```
1. api_cache       (no dependencies)
2. ai_briefings    (no dependencies)
3. anomalies       (no dependencies)
4. pulse_history   (no dependencies)
5. ai_usage        (no dependencies)
```

All five tables are independent — any creation order is safe.

---

## RLS policies

No RLS is required. All data is public city intelligence with no user-specific rows. The Supabase anon key has full read access. The service role key is used for writes (setCached, logAnomaly, writePulseHistory, logAiUsage) in server-only route handlers.

**Important:** The `SUPABASE_SERVICE_ROLE_KEY` must never appear in client-side code or `NEXT_PUBLIC_*` variables. All write operations go through server-side route handlers only.

---

## Triggers

None in v1. Pulse history writing and anomaly logging are done explicitly in route handler logic rather than via database triggers. This keeps the logic visible and testable in application code.

---

## Storage buckets

None in v1. No user file uploads, no image storage.

---

## Migration ordering

Run these SQL statements in order when setting up a new Supabase project:

```sql
-- 1. api_cache
create table api_cache (
  id          uuid        primary key default gen_random_uuid(),
  city_id     text        not null,
  data_type   text        not null,
  payload     jsonb       not null,
  fetched_at  timestamptz not null default now(),
  expires_at  timestamptz not null,
  unique(city_id, data_type)
);
create index api_cache_lookup on api_cache (city_id, data_type, expires_at);

-- 2. ai_briefings
create table ai_briefings (
  id           uuid        primary key default gen_random_uuid(),
  city_id      text        not null,
  briefing     text        not null,
  generated_at timestamptz not null default now(),
  date         date        not null default current_date,
  unique(city_id, date)
);

-- 3. anomalies
create table anomalies (
  id          uuid        primary key default gen_random_uuid(),
  city_id     text        not null,
  metric      text        not null,
  value       float       not null,
  baseline    float       not null,
  deviation   float       not null,
  description text,
  occurred_at timestamptz not null default now()
);
create index anomalies_city on anomalies (city_id, occurred_at desc);

-- 4. pulse_history
create table pulse_history (
  id          uuid        primary key default gen_random_uuid(),
  city_id     text        not null,
  pulse_score float       not null,
  components  jsonb       not null,
  recorded_at timestamptz not null default now()
);
create index pulse_history_city on pulse_history (city_id, recorded_at desc);

-- 5. ai_usage
create table ai_usage (
  id          uuid        primary key default gen_random_uuid(),
  city_id     text,
  route       text        not null,
  tokens_in   integer,
  tokens_out  integer,
  duration_ms integer,
  created_at  timestamptz default now()
);
```

---

## Query gotchas

**`api_cache` — always check expiry:**
```ts
// WRONG — row may exist but be stale
.from('api_cache').select('payload').eq('city_id', id).eq('data_type', type).single()

// CORRECT — filter by expires_at
.from('api_cache')
  .select('payload, fetched_at')
  .eq('city_id', id)
  .eq('data_type', type)
  .gt('expires_at', new Date().toISOString())
  .single()
```

**`api_cache` — upsert on write (unique constraint):**
```ts
.from('api_cache').upsert(
  { city_id, data_type, payload, fetched_at: now, expires_at },
  { onConflict: 'city_id,data_type' }
)
```

**`pulse_history` — 30-day baseline for anomaly detection:**
```ts
.from('pulse_history')
  .select('pulse_score')
  .eq('city_id', cityId)
  .gte('recorded_at', thirtyDaysAgo.toISOString())
// Then compute avg and stddev in application code
```

**`ai_briefings` — check today's date (not datetime):**
```ts
.from('ai_briefings')
  .select('briefing')
  .eq('city_id', cityId)
  .eq('date', today)  // today = new Date().toISOString().slice(0, 10)
  .single()
```
