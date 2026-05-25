# Setup Guide

Step-by-step for a developer who has never seen this project. No vague steps.

---

## 1. Prerequisites

| Tool | Required version | Check |
|------|-----------------|-------|
| Node.js | 20.x or 22.x | `node --version` |
| npm | 10.x+ | `npm --version` |
| Git | Any recent | `git --version` |

No other global tools required. All dev tooling runs via `npm run`.

---

## 2. Infrastructure setup

### 2a. Supabase

1. Go to [supabase.com](https://supabase.com) → New project
2. Create **two** projects: one for local dev (`citadel-dev`), one for production (`citadel-prod`)
3. For each project, go to **Settings → API** and copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role secret` key → `SUPABASE_SERVICE_ROLE_KEY`
4. Run the schema setup (Section 4) in each project's SQL Editor

### 2b. Mapbox

1. Go to [account.mapbox.com](https://account.mapbox.com) → Tokens → Create a token
2. Scope: check `styles:read`, `tiles:read`, `geocoding:read`
3. Copy the token → `NEXT_PUBLIC_MAPBOX_TOKEN`
4. **After deploying to production:** Return to this token → Allowed URLs → add your production domain. Without this, anyone can use your token.
5. In [Mapbox Studio](https://studio.mapbox.com): duplicate the `dark-v11` style, apply the custom overrides from `.claude/design.md` (road colors, water, land, buildings, labels), publish it, and copy the style URL to each city config in `lib/cities.ts`

### 2c. Anthropic

1. Go to [console.anthropic.com](https://console.anthropic.com) → API Keys → Create key
2. Copy → `ANTHROPIC_API_KEY`
3. The app uses `claude-sonnet-4-6`. Ensure your account has access.

### 2d. Ticketmaster

1. Go to [developer.ticketmaster.com](https://developer.ticketmaster.com) → Get Your API Key
2. Create an app → copy the Consumer Key → `TICKETMASTER_API_KEY`
3. Free tier: 5,000 API calls/day — more than sufficient

### 2e. Eventbrite

1. Go to [eventbrite.com/platform](https://www.eventbrite.com/platform) → Get Started → Create an app
2. Copy the Private Token → `EVENTBRITE_API_KEY`
3. Free tier is sufficient for this app's usage

### 2f. Transit APIs

**MTA (New York)**
1. Go to [api.mta.info](https://api.mta.info) → Register
2. Copy your API key → `MTA_API_KEY`
3. The app uses the GTFS-RT feed (real-time subway status)

**511 SF Bay (San Francisco)**
1. Go to [511.org/open-data/token](https://511.org/open-data/token) → Request a token
2. Copy → `SF_511_API_KEY`

**CTA (Chicago)**
1. Go to [www.transitchicago.com/developers/traintracker.aspx](https://www.transitchicago.com/developers/traintracker.aspx) → Register
2. Copy your API key → `CTA_API_KEY`

**WMATA (Washington DC)**
1. Go to [developer.wmata.com](https://developer.wmata.com) → Get a Key → Default Tier
2. Copy the Primary Key → `WMATA_API_KEY`
3. Default tier: 10 calls/second, 50,000/day — sufficient

### 2g. Vercel KV (for rate limiting)

This step can be deferred until deploying to Vercel. For local development, rate limiting can be stubbed.

When ready to deploy:
1. In Vercel dashboard → Storage → Create → KV (Redis)
2. Name it `citadel-kv` → Create
3. Go to the KV database → Settings → copy all four env vars:
   - `KV_URL`
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
   - `KV_REST_API_READ_ONLY_TOKEN`
4. Add these to your Vercel project's environment variables for all environments

### 2h. Sentry

Run from the project root after initial `npm install`:
```bash
npx @sentry/wizard@latest -i nextjs
```

This interactive wizard will:
- Create a Sentry project
- Add `SENTRY_DSN` to your environment
- Create `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`
- Update `next.config.ts` with Sentry's `withSentryConfig` wrapper

---

## 3. Environment variables

Copy `.env.example` to `.env.local` and fill in each value:

```bash
cp .env.example .env.local
```

| Variable | What it is | Where to get it | Breaks if wrong |
|----------|-----------|-----------------|-----------------|
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox GL JS access token | Mapbox account → Tokens | Map won't render — blank dark screen |
| `ANTHROPIC_API_KEY` | Anthropic API key | Anthropic console | Chat returns 500; briefing fails |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Supabase Settings → API | All cache reads/writes fail |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (public, read) | Supabase Settings → API | All cache reads fail |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server, write) | Supabase Settings → API | All cache writes fail; anomaly logging fails |
| `TICKETMASTER_API_KEY` | Ticketmaster Discovery API | developer.ticketmaster.com | Events data falls back to empty |
| `EVENTBRITE_API_KEY` | Eventbrite API | eventbrite.com/platform | Eventbrite events fall back to empty |
| `MTA_API_KEY` | MTA real-time feed | api.mta.info | NYC transit falls back; other cities unaffected |
| `SF_511_API_KEY` | 511 SF Bay API | 511.org/open-data/token | SF transit falls back |
| `CTA_API_KEY` | Chicago CTA Train Tracker | transitchicago.com/developers | Chicago transit falls back |
| `WMATA_API_KEY` | WMATA real-time API | developer.wmata.com | DC transit falls back |
| `KV_URL` | Vercel KV connection URL | Vercel dashboard → Storage → KV | Rate limiting fails open (no rate limit) |
| `KV_REST_API_URL` | Vercel KV REST endpoint | Vercel dashboard → Storage → KV | Same as above |
| `KV_REST_API_TOKEN` | Vercel KV auth token | Vercel dashboard → Storage → KV | Same as above |
| `KV_REST_API_READ_ONLY_TOKEN` | Vercel KV read-only token | Vercel dashboard → Storage → KV | Same as above |
| `SENTRY_DSN` | Sentry project DSN | Sentry project settings | Errors not reported to Sentry |
| `NEXT_PUBLIC_SITE_URL` | Production domain URL | Your deployment URL | Mapbox token restriction verification |

**Note on KV vars in local dev:** `@vercel/kv` will fail to connect if KV vars are absent. Wrap rate limiting in a try/catch that fails open (allow the request) in development:
```ts
try {
  const { success } = await ratelimit.limit(ip)
  if (!success) return Response.json({ error: 'Too many requests', code: 'RATE_LIMITED' }, { status: 429 })
} catch {
  // KV not configured locally — fail open
}
```

---

## 4. Schema setup

In the Supabase SQL Editor for your dev project, run these statements in order:

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

Run the same SQL in your production Supabase project when you're ready to deploy.

**Important:** After creating the tables, immediately run the RLS setup from Section 7 before doing anything else. Without RLS, the anon key can write to any table.

---

## 5. Seed data

No seed data required. All data is fetched live from external APIs on first request. The cache tables start empty and populate automatically.

For local testing of the anomaly detection logic, you can manually insert a few `pulse_history` rows:

```sql
insert into pulse_history (city_id, pulse_score, components, recorded_at) values
  ('new-york', 72, '{"weather":12,"aqi":12,"events":20,"transit":15,"time_of_day":13}', now() - interval '1 hour'),
  ('new-york', 65, '{"weather":12,"aqi":12,"events":15,"transit":18,"time_of_day":8}',  now() - interval '2 hours'),
  ('new-york', 58, '{"weather":10,"aqi":10,"events":15,"transit":16,"time_of_day":7}',  now() - interval '3 hours');
```

---

## 6. Verification checklist

Run these checks before writing a line of application code. All must pass.

**Supabase:**
```bash
# From the project root, with .env.local populated:
curl "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/api_cache?select=id&limit=1" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY"
# Expected: [] (empty array, not an error)
```

**Anthropic:**
```bash
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model":"claude-sonnet-4-6","max_tokens":10,"messages":[{"role":"user","content":"ping"}]}'
# Expected: response with content[0].text
```

**Mapbox:**
Open `http://localhost:3000/city/new-york` after `npm run dev`. The map should render the dark Mapbox style centred on New York. If it shows a blank dark screen, the token is wrong or the map import is broken.

**Ticketmaster:**
```bash
curl "https://app.ticketmaster.com/discovery/v2/events.json?apikey=$TICKETMASTER_API_KEY&city=New+York&size=1"
# Expected: JSON with _embedded.events array
```

**Transit (WMATA example):**
```bash
curl "https://api.wmata.com/TrainPositions/TrainPositions?contentType=json" \
  -H "api_key: $WMATA_API_KEY"
# Expected: JSON with TrainPositions array
```

**Dev server starts cleanly:**
```bash
npm run dev
# Expected: ready on http://localhost:3000 with zero errors in terminal
```

---

## 7. RLS verification

No RLS is configured in this app — all tables are public read, with writes going through server-side route handlers using the service role key.

**Verify that the anon key cannot write:**
```bash
# This should fail with a 403 or permission error:
curl "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/api_cache" \
  -X POST \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"city_id":"test","data_type":"weather","payload":{},"expires_at":"2099-01-01"}'
# Expected: 401 or 403 — not 201
```

**Verify that service role key can write:**
```bash
curl "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/api_cache" \
  -X POST \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"city_id":"test","data_type":"weather","payload":{},"expires_at":"2099-01-01"}'
# Expected: 201 — created

# Clean up:
curl "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/api_cache?city_id=eq.test" \
  -X DELETE \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
```

Supabase projects allow anon writes by default. You **must** enable RLS and add policies. Run this in the SQL Editor for both dev and production projects:

```sql
-- Enable RLS on all tables
alter table api_cache      enable row level security;
alter table ai_briefings   enable row level security;
alter table anomalies      enable row level security;
alter table pulse_history  enable row level security;
alter table ai_usage       enable row level security;

-- Allow public read on all tables
create policy "public read api_cache"     on api_cache     for select using (true);
create policy "public read ai_briefings"  on ai_briefings  for select using (true);
create policy "public read anomalies"     on anomalies     for select using (true);
create policy "public read pulse_history" on pulse_history for select using (true);
create policy "public read ai_usage"      on ai_usage      for select using (true);

-- No anon writes — service role bypasses RLS automatically
```

After running, re-run the anon write test above — it should now return 403.
