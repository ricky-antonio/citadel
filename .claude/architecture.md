# Architecture

## Directory structure

```
citadel/
├── app/                          # Next.js App Router — pages and API routes
│   ├── page.tsx                  # Root redirect → /city/chicago
│   ├── error.tsx                 # Global error boundary (client component)
│   ├── layout.tsx                # Root layout — ThemeProvider, Sentry init, fonts
│   ├── globals.css               # CSS variables, Tailwind base, scrollbar styles
│   ├── city/
│   │   └── [id]/
│   │       └── page.tsx          # Main dashboard — dynamic Mapbox map + all overlays
│   └── api/
│       ├── city/
│       │   └── [id]/
│       │       ├── snapshot/
│       │       │   └── route.ts  # GET — full city data snapshot, cache-first
│       │       └── briefing/
│       │           └── route.ts  # GET — daily AI briefing, cached per city per day
│       ├── chat/
│       │   └── route.ts          # POST — streaming AI chat with live city context
│       ├── pulse/
│       │   └── [id]/
│       │       └── route.ts      # GET — current pulse score + 7-day history
│       └── anomalies/
│           └── [id]/
│               └── route.ts      # GET — recent anomaly log for a city
│
├── components/
│   ├── map/
│   │   ├── CityMap.tsx           # Full-viewport Mapbox map, base layer only
│   │   ├── MapLayers.tsx         # Data layer manager — AQ, events, transit, crowd
│   │   ├── AQLayer.tsx           # Air quality heatmap layer
│   │   ├── EventLayer.tsx        # Event location pins with clustering
│   │   ├── TransitLayer.tsx      # Transit line status overlay
│   │   └── CrowdLayer.tsx        # Derived crowd density fill layer
│   ├── orbital/
│   │   ├── OrbitalCore.tsx       # SVG rings + animated core circle + pulse score
│   │   ├── OrbitalMetric.tsx     # Single metric node (dot + value + label)
│   │   └── OrbitalLayout.tsx     # Positions four nodes at cardinal points
│   ├── panels/
│   │   ├── PanelBase.tsx         # Floating glass panel base — position, blur, border
│   │   ├── WeatherPanel.tsx      # Weather details, anchors top-left
│   │   ├── AQPanel.tsx           # Air quality breakdown, anchors top-right
│   │   ├── TransitPanel.tsx      # Transit status, anchors bottom-right
│   │   ├── EventsPanel.tsx       # Events feed, anchors bottom-left
│   │   ├── AnomalyPanel.tsx      # Anomaly log, anchors left-center
│   │   └── HistoryPanel.tsx      # Pulse history chart, anchors right-center
│   ├── chat/
│   │   ├── ChatDrawer.tsx        # Slide-up chat panel, covers 42vh from bottom
│   │   ├── ChatMessage.tsx       # Single message bubble (user or assistant)
│   │   ├── ChatSuggestions.tsx   # Three contextual question chips
│   │   └── StreamingText.tsx     # Token-by-token streaming with amber cursor
│   ├── nav/
│   │   ├── CitySelector.tsx      # Dropdown with all four cities + pulse scores
│   │   ├── LayerToggle.tsx       # Toggle visibility of map data layers
│   │   └── ThemeToggle.tsx       # Dark/light mode switch
│   └── shared/
│       ├── PulseScore.tsx        # Pulse score badge with color coding
│       ├── MetricBadge.tsx       # Generic metric pill (label + value + unit)
│       ├── LiveDot.tsx           # Animated green live indicator
│       └── ErrorBanner.tsx       # In-panel error state
│
├── lib/
│   ├── types.ts                  # All TypeScript interfaces — source of truth
│   ├── cities.ts                 # City config array (CITIES constant)
│   ├── pulse.ts                  # computePulseScore, getPulseLabel, getPulseColor
│   ├── cache.ts                  # getCached, setCached — Supabase api_cache helpers
│   ├── anomaly.ts                # detectAnomaly, logAnomaly, getAnomalyHistory
│   └── data/
│       ├── weather.ts            # fetchWeather (Open-Meteo)
│       ├── airQuality.ts         # fetchAirQuality (OpenAQ)
│       ├── events.ts             # fetchEvents (Ticketmaster + Eventbrite merged)
│       ├── crime.ts              # fetchCrimeData (stub → Phase 5 open-data impl)
│       ├── fallbacks.ts          # Typed fallback constants for each data type
│       └── transit/
│           ├── index.ts          # fetchTransitStatus — routes to provider
│           ├── mta.ts            # New York MTA GTFS-RT
│           ├── sf511.ts          # San Francisco 511
│           ├── cta.ts            # Chicago CTA
│           └── wmata.ts          # Washington DC WMATA
│   └── ai/
│       ├── context.ts            # buildCityContext — assembles snapshot for AI prompt
│       ├── chat.ts               # streamChatResponse — Anthropic streaming
│       ├── briefing.ts           # generateDailyBriefing — cached daily report
│       └── suggestions.ts        # generateSuggestions — contextual question chips
│
├── tests/
│   ├── setup.ts                  # Global test setup — mocks, matchers
│   ├── mocks/
│   │   ├── supabase.ts           # Shared Supabase mock — always import from here
│   │   └── anthropic.ts          # Shared Anthropic mock — always import from here
│   ├── lib/
│   │   ├── pulse.test.ts
│   │   ├── cache.test.ts
│   │   ├── anomaly.test.ts
│   │   └── data/
│   │       ├── weather.test.ts
│   │       ├── airQuality.test.ts
│   │       └── transit/
│   │           └── mta.test.ts
│   │   └── ai/
│   │       ├── context.test.ts
│   │       └── chat.test.ts
│   ├── components/
│   │   ├── OrbitalCore.test.tsx
│   │   ├── OrbitalLayout.test.tsx
│   │   ├── ChatMessage.test.tsx
│   │   ├── StreamingText.test.tsx
│   │   └── PanelBase.test.tsx
│   └── api/
│       ├── snapshot.test.ts
│       ├── chat.test.ts
│       └── pulse.test.ts
│
├── .github/
│   └── workflows/
│       └── ci.yml
│
├── CLAUDE.md
├── PROGRESS.md
├── DECISIONS.md
├── CHANGELOG.md
├── README.md
├── .env.example
├── .gitignore
├── next.config.ts
├── tailwind.config.ts
├── vitest.config.ts
└── tsconfig.json
```

---

## Server vs client component rules

Next.js App Router defaults to Server Components. Follow these rules without exception:

**Always Server Components (no `"use client"`):**
- `app/page.tsx`, `app/layout.tsx`
- `app/api/**/route.ts` — these are route handlers, not components
- Any component that only receives data as props and renders static markup

**Always Client Components (`"use client"` at the top):**
- `CityMap.tsx` — uses Mapbox GL JS which accesses `window`
- All orbital components — use `useEffect` for animations
- All panel components — use `useState` for open/close
- `ChatDrawer.tsx`, `ChatMessage.tsx`, `StreamingText.tsx` — use `useState`, `useRef`
- `CitySelector.tsx`, `LayerToggle.tsx`, `ThemeToggle.tsx` — interactive controls
- `app/error.tsx` — required by Next.js to be a client component

**Dynamic import rule — mandatory:**
```tsx
// app/city/[id]/page.tsx
const CityMap = dynamic(() => import('@/components/map/CityMap'), {
  ssr: false,
  loading: () => <div style={{ width: '100vw', height: '100vh', background: '#060A0F' }} />,
})
```
Never import `mapbox-gl` or `react-map-gl` without `ssr: false`. It will crash the build.

---

## State management

There is no global state library. State is co-located with the component that owns it.

**`app/city/[id]/page.tsx` owns:**
- `snapshot: CitySnapshot | null` — current city data
- `loading: boolean` — whether snapshot is fetching
- `activePanel: PanelId | null` — which floating panel is open (`'weather' | 'aq' | 'transit' | 'events' | 'anomaly' | 'history' | null`)
- `chatOpen: boolean` — whether the chat drawer is visible
- `activeLayers: LayerId[]` — which map layers are visible

This page owns all top-level state and passes it down via props. No context providers needed — the component tree is shallow enough that prop drilling is appropriate.

**`ChatDrawer.tsx` owns:**
- `messages: ChatMessage[]` — conversation history
- `inputValue: string` — current input field content
- `streaming: boolean` — whether AI is currently responding

**`CityMap.tsx` owns:**
- `mapRef: MutableRefObject<MapRef>` — direct Mapbox map reference for layer updates

**What no component owns:**
- City configuration — comes from `lib/cities.ts` (static import)
- Theme — owned by `next-themes` ThemeProvider
- Nothing is fetched inside a component — all data comes through `page.tsx` → props

---

## Data fetching rules

- All external API calls originate in `app/api/**/route.ts` route handlers — never from client components
- All queries to Supabase live in `lib/cache.ts`, `lib/anomaly.ts`, and AI briefing helpers — never inline in route handlers
- Never use `select *` — always name columns explicitly in Supabase queries
- Never call `fetch()` from inside a component — components receive data as props
- Optimistic UI is required on all mutations (currently none in v1 — no user mutations)

**Polling pattern:**
```tsx
useEffect(() => {
  const refetch = async () => {
    setLoading(true)
    const data = await fetch(`/api/city/${cityId}/snapshot`).then(r => r.json())
    setSnapshot(data)
    setLoading(false)
  }
  refetch()
  const interval = setInterval(refetch, 5 * 60 * 1000)
  return () => clearInterval(interval)
}, [cityId])
```

---

## Key data flows

### 1. City page load
```
browser → GET /city/chicago
  → app/city/[id]/page.tsx renders (server)
  → dynamic imports CityMap with ssr: false
  → page.tsx useEffect triggers GET /api/city/chicago/snapshot
    → route.ts checks api_cache for each data type
    → cache hit: return payload
    → cache miss: fetch external API → write to api_cache → return payload
    → computePulseScore(snapshot)
    → detectAnomaly() for each metric → logAnomaly() if triggered
    → return CitySnapshot JSON
  → setSnapshot(data) → triggers re-render
  → CityMap renders with city + snapshot
  → OrbitalLayout renders with snapshot data
  → All panels receive snapshot as prop (hidden until clicked)
```

### 2. User sends a chat message
```
user types message → hits Enter or Send button
  → ChatDrawer.tsx handler:
      setStreaming(true)  ← FIRST statement, before any await
      append user message to messages[]
      POST /api/chat { message, cityId, history }
        → route.ts: check rate limit (x-forwarded-for IP)
          → 429 if exceeded: return error, setStreaming(false)
        → getCitySnapshot(cityId)  ← from cache (fast)
        → buildCityContext(snapshot)
        → client.messages.stream({ model, system, messages })
        → return ReadableStream
      → StreamingText.tsx reads stream chunk-by-chunk
      → setStreamedText(prev => prev + chunk) on each chunk
      → cursor blinks while streaming, disappears on done
      → setStreaming(false) on stream end
      → append final assistant message to messages[]
```

### 3. City switch
```
user clicks city in CitySelector dropdown
  → CitySelector calls onCityChange(newCityId)
  → page.tsx: setFading(true) → 300ms CSS opacity 0
  → router.push(`/city/${newCityId}`)  ← navigation
  → new page.tsx mounts, fetches new snapshot
  → CityMap re-initialises with new city coordinates
  → OrbitalLayout fades in with new city data → 300ms CSS opacity 1
```

---

## API route inventory

| Path | Method | Description | Rate limited |
|------|--------|-------------|-------------|
| `/api/city/[id]/snapshot` | GET | Full city data snapshot (weather + AQ + events + transit). Cache-first pattern. | Yes — 60 req/min per IP |
| `/api/city/[id]/briefing` | GET | Daily AI briefing. Cached per city per day in `ai_briefings`. | No |
| `/api/chat` | POST | Streaming AI chat. Requires `{message, cityId, history}`. | Yes — 20 req/min per IP |
| `/api/pulse/[id]` | GET | Current pulse score + 7-day hourly history from `pulse_history`. | No |
| `/api/anomalies/[id]` | GET | Recent anomaly log for a city, last 7 days. | No |

All routes return `{ error: string, code: string }` on failure. See `lib/types.ts` for `ApiError`.

---

## Caching strategy

| Layer | What | Where | TTL |
|-------|------|-------|-----|
| Supabase `api_cache` | External API responses per city+type | Postgres | weather: 30m, air_quality: 60m, events: 6h, transit: 5m, crime: 24h |
| Supabase `ai_briefings` | Daily AI briefing per city | Postgres | Until end of calendar day (per city timezone) |
| Next.js route cache | `GET /api/city/[id]/snapshot` | Edge | `no-store` — always checks Supabase cache directly |
| Mapbox tile cache | Map tiles | Browser (Mapbox internal) | Mapbox default |

The Supabase cache is the primary cache layer. Next.js route cache is disabled for data routes — stale data is worse than a Supabase read.

---

## Error shape

All API route handlers and lib functions that can fail return or throw this shape:

```ts
interface ApiError {
  error: string   // human-readable message, safe to show the user
  code: string    // machine-readable code, e.g. "RATE_LIMITED", "CITY_NOT_FOUND", "UPSTREAM_FAILURE"
}
```

Data fetchers in `lib/data/` never throw — they return typed fallbacks. Route handlers catch thrown errors and serialize them to this shape with a 4xx or 5xx status.

---

## Performance rules

- **Mapbox**: dynamic import with `ssr: false` — mandatory (see above)
- **Map layer updates**: `setData()` not unmount/remount — mandatory (see DECISIONS.md)
- **Pulse history chart**: use `@tanstack/react-virtual` when rendering more than 168 points (7 days × 24h)
- **Dynamic imports for heavy panels**: `HistoryPanel` and `AnomalyPanel` may be dynamically imported since they are rarely open simultaneously
- **Chat context token budget**: `buildCityContext` output must stay under 800 tokens (~3200 characters). Log a `console.warn` in development if exceeded.
- **No `select *`**: always name columns in Supabase queries — prevents silent breakage if schema changes

---

## Multi-tenant / collaboration unlock path

Not applicable to v1 — the app is fully public with no user concept.

If user accounts are added in a future version:
- Add `user_id uuid references auth.users` to any user-specific tables
- Add RLS policies for `SELECT/INSERT/UPDATE/DELETE` filtered by `auth.uid()`
- The current schema (api_cache, ai_briefings, anomalies, pulse_history) is shared public data — no per-user rows needed
- Saved city preferences, custom alerts, or annotations would require new tables with RLS from day one
