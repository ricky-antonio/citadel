# CITADEL

**The city, decoded.**

A live city intelligence dashboard for New York, San Francisco, Chicago, and Washington DC. Eight external APIs aggregated server-side, a custom orbital SVG pulse UI built from scratch, five GeoJSON map layers, and a streaming Anthropic AI assistant with real-time city context injected per message.

**Live:** [citadel.rickycodes.dev](https://citadel.rickycodes.dev)

> Next.js 15 · TypeScript (strict) · Mapbox GL JS · Anthropic Claude Sonnet 4.6 · Supabase

---

## Overview

Citadel solves two genuinely hard full-stack problems: aggregating multiple unreliable external APIs into a consistent, always-available interface, and building a custom UI primitive — the orbital — that doesn't exist in any component library.

The entire UI lives on top of a full-viewport Mapbox map. There's no page layout, no sidebar, no content area outside the map — it fills the screen completely and everything else floats over it. The orbital, data panels, nav pill, and chat drawer are all absolutely positioned overlays. This means the map can never flash, never blank, and never remount — city switches fly to the new centre with `map.flyTo()` on the existing instance, and data layer updates call `source.setData()` in place.

The data challenge is that eight external APIs have different rate limits, update frequencies, and failure modes. A Supabase cache layer sits in front of all of them — the snapshot route checks the cache first and only calls the external API on a miss. Simultaneous city switches by multiple users share the same cached response, so external APIs are hit at most once per TTL window regardless of concurrent traffic.

---

## Tech Stack

### Frontend

| Technology | Usage |
|---|---|
| **Next.js 15** (App Router) | File-based routing, server components, route handlers, dynamic imports |
| **TypeScript** (strict mode) | End-to-end type safety across all API shapes, component props, and route responses |
| **Tailwind CSS** | Utility-first styling with a custom amber brand palette and CSS variable system |
| **Mapbox GL JS** + react-map-gl | Full-viewport map, five GeoJSON data layers, theme-reactive style switching |
| **Custom SVG orbital UI** | Concentric-ring pulse display with cardinal metric nodes — built from scratch, no component library |
| **@tanstack/react-virtual** | Virtualised pulse history chart for long data series |

### Backend & Data

| Technology | Usage |
|---|---|
| **Supabase** (Postgres) | API response cache, AI briefing cache, anomaly log, pulse history |
| **Cache-first pattern** | All external API calls go through `/api/city/[id]/snapshot` — cache checked first, external call only on miss |
| **Upstash + Vercel KV** | Sliding-window rate limiting on chat (15 req/min) and snapshot (60 req/min) routes |
| **Typed fallbacks** | Every data fetcher returns a typed fallback constant on failure — the dashboard degrades gracefully, never blanks |

### AI

| Technology | Usage |
|---|---|
| **Anthropic Claude Sonnet 4.6** | Streaming city assistant with full real-time snapshot context injected per message |
| **Daily briefings** | Cached-per-city AI summary generated once per day, served instantly on subsequent requests |
| **Anomaly detection** | Statistical deviation from 30-day rolling baseline triggers AI-generated descriptions |
| **AI usage logging** | Every Anthropic call logged to `ai_usage` with token counts and duration for cost monitoring |

### External APIs (all server-side)

| API | Data | Cities |
|---|---|---|
| Open-Meteo | Weather | All |
| OpenAQ v3 | Air quality | All |
| Ticketmaster Discovery | Live events | All |
| MTA GTFS-RT | Real-time transit | New York |
| 511 SF Bay | Real-time transit | San Francisco |
| CTA Train Tracker | Real-time transit | Chicago |
| WMATA | Real-time transit | Washington DC |
| NYC / SF / Chicago / DC Open Data | Crime incidents | All |

### Testing & Quality

| Technology | Usage |
|---|---|
| **Vitest** + React Testing Library | Unit, component, and integration tests — 307 tests, 92% line coverage |
| **@vitest/coverage-v8** | Coverage with enforced thresholds (85% lines · 85% functions · 80% branches) |
| **Playwright** | E2E critical path tests in Chromium; all API routes mocked via `page.route()` |
| **Sentry** | Production error monitoring |

---

## Architecture

**Cache-first snapshot pattern.**
Every city data request hits Supabase first. On a cache miss, the route fetches from the external API, writes back with a typed TTL (weather: 30 min, transit: 5 min, events: 6 hr), and returns the result. External APIs are only called once per TTL window regardless of concurrent traffic — a city switch by one user warms the cache for all subsequent users.

**Orbital UI built from scratch.**
`OrbitalCore`, `OrbitalMetric`, and `OrbitalLayout` are custom SVG components with no component library dependency. The concentric-ring pattern with cardinal metric nodes and staggered float animations doesn't exist off the shelf. Each node has `role="button"`, `tabIndex`, `aria-label`, and `aria-expanded` — accessibility was part of the spec, not an afterthought.

**Map updates without remount.**
`mapbox-gl` accesses `window` on module load and crashes Next.js SSR. `CityMap` is loaded via `dynamic(() => import(...), { ssr: false })`. City switches call `map.flyTo()` on the existing instance — no unmount, no flash. Data layer updates call `source.setData()` in place. Theme switches call `map.setStyle()` and re-register all data sources via a persistent `style.load` listener.

**Streaming AI with context injection.**
The chat route assembles a real-time city snapshot — weather, AQI, transit delays, events tonight, active anomalies — and injects it into the system prompt before streaming the response. Token counts and duration are logged to `ai_usage` via a `TransformStream` flush callback that fires after the stream closes, keeping the response path non-blocking.

**Statistical anomaly detection.**
Each snapshot writes a pulse history row. `detectAnomaly` computes a rolling mean and standard deviation over the last 30 days and flags deviations beyond 2σ. Detected anomalies trigger an AI-generated one-liner stored alongside the raw deviation data.

---

## Features

- **Pulse score** — 0–100 composite of events, crowd density, transit health, air quality, and time of day; updates every 5 minutes with a client-side fade transition
- **Six data panels** — Weather, Air Quality, Transit, Events, Anomaly, History — slide in from the edges of the screen; focus trapped when open
- **Five map layers** — AQ heatmap, event cluster markers, transit lines with delay indicators, crowd density, crime incident clusters
- **Streaming AI chat** — full real-time city context injected per message; suggestion chips for common queries
- **Daily city briefing** — AI-generated, cached per city per day, served instantly after first generation
- **Anomaly panel** — AI-described metric spikes with deviation percentage and historical context
- **Pulse history chart** — virtualised SVG polyline with 7 days of hourly data
- **Dark / light mode** — Mapbox style switches between `dark-v11` and `light-v11`; all panels adapt via CSS variables
- **Full keyboard navigation** — Tab through all orbital nodes, panels, nav, and chat; Escape closes in priority order
- **WCAG AA** — colour contrast verified, `aria-live` regions, `aria-modal`, focus rings visible on all interactive elements

---

## Getting Started

```bash
git clone https://github.com/ricky-antonio/citadel.git
cd citadel
cp .env.example .env.local
npm install
npm run dev
```

### Environment Variables

```env
NEXT_PUBLIC_MAPBOX_TOKEN=
ANTHROPIC_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAQ_API_KEY=
TICKETMASTER_API_KEY=
SF_511_API_KEY=
CTA_API_KEY=
WMATA_API_KEY=
KV_URL=
KV_REST_API_URL=
KV_REST_API_TOKEN=
KV_REST_API_READ_ONLY_TOKEN=
SENTRY_DSN=
NEXT_PUBLIC_SITE_URL=
```

### Scripts

```bash
npm run dev              # start dev server (Turbopack)
npm run build            # production build
npm run type-check       # tsc --noEmit (strict)
npm test                 # vitest run
npm run test:coverage    # coverage with enforced thresholds
npm run test:e2e         # playwright critical path tests
npm run lint             # eslint
```

---

## Project Structure

```
app/
  api/
    city/[id]/
      snapshot/     # cache-first orchestration of all 8 data sources
      briefing/     # AI daily briefing, cached per city per day
    chat/           # streaming AI assistant with city context injection
    pulse/[id]/     # pulse score history for the chart panel
    anomalies/[id]/ # anomaly log with AI descriptions
  city/[id]/        # dashboard page (CityMap dynamically imported, ssr: false)
  page.tsx          # redirects to /city/chicago

components/
  map/              # CityMap, MapLayers, AQLayer, EventLayer, TransitLayer, CrowdLayer, CrimeLayer
  orbital/          # OrbitalCore, OrbitalMetric, OrbitalLayout (custom SVG)
  panels/           # PanelBase + 6 data panels
  nav/              # NavBar, CitySelector, LayerToggle, ThemeToggle
  chat/             # ChatDrawer, StreamingText, ChatMessage, ChatSuggestions

lib/
  data/             # one fetcher per API — weather, airQuality, events, transit, crime
  ai/               # context builder, briefing cache, chat prompt builders
  cache.ts          # getCached / setCached — Supabase cache layer
  anomaly.ts        # detectAnomaly, logAnomaly, getAnomalyHistory
  pulse.ts          # composite pulse score algorithm
  types.ts          # all TypeScript interfaces — single source of truth

tests/
  api/              # route handler integration tests
  components/       # React Testing Library component tests
  lib/              # pure function unit tests
  e2e/              # Playwright critical path tests
```

---

Built by [Ricardo Monterrosa](https://github.com/ricky-antonio)
