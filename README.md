# CITADEL

**The city, decoded.**

A live city intelligence dashboard where the map is the entire interface. Four US cities, eight external APIs aggregated server-side, a custom orbital SVG pulse UI, and a streaming Anthropic AI assistant that answers questions about current city conditions.

> Status: In development &nbsp;·&nbsp; Stack: Next.js 15 · TypeScript · Mapbox GL JS · Anthropic Claude · Supabase

---

## Overview

Citadel is a read-only city intelligence platform that demonstrates full-stack integration at the data and UI layers simultaneously. The map is not a feature — it is the shell. All interaction happens through a custom SVG orbital UI floating over a full-viewport Mapbox map, with four glass panels that slide in from the edges of the screen.

The technical focus is on multi-source data aggregation (weather, air quality, transit, events, crime), a server-side cache layer that prevents rate-limit exhaustion across simultaneous city switches, and a streaming AI assistant with injected real-time city context.

---

## Tech Stack

### Frontend

| Technology                          | Usage                                                                        |
| ----------------------------------- | ---------------------------------------------------------------------------- |
| **Next.js 15** (App Router)         | File-based routing, server components, route handlers, dynamic imports       |
| **TypeScript** (strict mode)        | End-to-end type safety across all API shapes and component props             |
| **Tailwind CSS**                    | Utility-first styling with custom amber brand palette and CSS variable system |
| **Mapbox GL JS** + react-map-gl     | Full-viewport map, custom dark Studio style, GeoJSON data layers             |
| **Custom SVG orbital UI**           | Concentric-ring pulse display with cardinal metric nodes — built from scratch, no component library |
| **next-themes**                     | Dark/light mode; light mode switches Mapbox style to `light-v11`             |
| **@tanstack/react-virtual**         | Virtualised pulse history chart for long data series                         |
| **react-focus-trap**                | Focus management for panels and chat drawer                                  |

### Backend & Data

| Technology              | Usage                                                                          |
| ----------------------- | ------------------------------------------------------------------------------ |
| **Supabase** (Postgres) | API response cache, AI briefing cache, anomaly log, pulse history              |
| **Cache-first pattern** | All external API calls go through `/api/city/[id]/snapshot` — cache checked first, external call only on miss |
| **Upstash + Vercel KV** | Sliding-window rate limiting on chat (20 req/min) and snapshot (60 req/min) routes |
| **Typed fallbacks**     | Every data fetcher returns a typed fallback constant on failure — dashboard degrades gracefully, never blanks |

### AI

| Technology                      | Usage                                                                    |
| ------------------------------- | ------------------------------------------------------------------------ |
| **Anthropic Claude Sonnet 4.6** | Streaming city assistant with injected real-time snapshot context        |
| **Daily briefings**             | Cached-per-city AI summary generated once per day, served instantly      |
| **Anomaly detection**           | Statistical deviation from rolling baseline triggers AI-generated descriptions |

### External APIs (all server-side)

| API                      | Data                        | Cities        |
| ------------------------ | --------------------------- | ------------- |
| Open-Meteo               | Weather (free, no key)      | All           |
| OpenAQ v3                | Air quality (free key)      | All           |
| Ticketmaster Discovery   | Live events                 | All           |
| Eventbrite               | Supplementary events (restricted — falls back to empty) | All |
| MTA GTFS-RT              | Real-time transit            | New York      |
| 511 SF Bay               | Real-time transit            | San Francisco |
| CTA Train Tracker        | Real-time transit            | Chicago       |
| WMATA                    | Real-time transit            | Washington DC |
| NYC / SF / Chicago / DC Open Data | Crime incidents   | All (Phase 5) |

### Testing & Quality

| Technology                | Usage                                                              |
| ------------------------- | ------------------------------------------------------------------ |
| **Vitest**                | Unit, component, and integration tests                             |
| **React Testing Library** | Component tests from the user's perspective                        |
| **@vitest/coverage-v8**   | Coverage with enforced per-phase thresholds (target: 85/85/80)     |
| **Playwright**            | E2E critical path tests in Chromium; all API routes mocked via `page.route()` |

---

## Architecture Highlights

**Mapbox dynamic import with `ssr: false`**
`mapbox-gl` accesses `window` on module load and crashes Next.js's SSR build. The `CityMap` component is always loaded via `dynamic(() => import(...), { ssr: false })`. Map layer data updates use `source.setData()` rather than unmount/remount — `setData` updates in place with Mapbox's built-in 200ms transition, making data refreshes invisible.

**Cache-first snapshot pattern**
Every city data request hits Supabase first. On a cache miss, the route fetches from the external API, writes back with a typed TTL (weather: 10 min, transit: 5 min, events: 30 min), and returns the result. Simultaneous city switches by multiple users share the same cached response — external APIs are only called once per TTL window regardless of concurrent traffic.

**Orbital UI from scratch**
`OrbitalCore`, `OrbitalMetric`, and `OrbitalLayout` are custom SVG components. This pattern — concentric rings, cardinal metric nodes, float animation — doesn't exist in any component library. Raw SVG with CSS animations gives full control and keeps accessibility viable (each node has `role="button"`, `tabIndex`, and `aria-label`; panels trap focus via `react-focus-trap`).

**Anomaly detection**
Each snapshot records a pulse history row. The anomaly detector computes rolling baselines and flags deviations beyond configurable thresholds. Detected anomalies are logged with an AI-generated description of the likely cause. The `AnomalyPanel` surfaces these to the user with contextual AI language.

**Streaming AI chat with city context**
The chat route injects the current city snapshot into the system prompt — current weather, AQI, active transit delays, events tonight, any anomalies — before streaming the response. `buildCityContext` is budget-constrained to ~3200 characters to stay within practical context windows.

---

## Features

### City Intelligence Dashboard
- Four cities: New York · San Francisco · Chicago · Washington DC
- Live pulse score (0–100) composite of events, crowd density, transit health, air quality, and time of day
- 5-minute polling interval with client-side fade transition — never a blank map flash

### Data Panels
- **Weather** — temperature, feels-like, humidity, wind, condition icon
- **Air Quality** — AQI with category label, dominant pollutant, station map
- **Transit** — real-time delay count, affected lines, status descriptions
- **Events** — tonight's events with venue, time, and category
- **Anomaly** — AI-described deviations from city baseline
- **History** — virtualised hourly pulse score chart

### AI Assistant
- Streaming chat with full real-time city context injected per message
- Daily briefing cached per city and served without an API call after first generation
- Suggestion chips for common queries

### Map Layers (Phase 5)
- Air quality heatmap (OpenAQ station data)
- Event cluster markers (Ticketmaster + Eventbrite)
- Transit line overlays with delay indicators
- Crowd density estimation layer
- Crime incident markers (open data — NYC, SF, Chicago, DC)

### Keyboard & Accessibility
- Full keyboard navigation — Tab through all orbital nodes, panels, nav, chat
- Escape priority order: open panel → city dropdown → layer dropdown → chat drawer
- Focus trapped in open panels, returned to trigger on close
- `aria-live="polite"` on pulse score — screen readers announce score changes

---

## Getting Started

```bash
git clone https://github.com/ricky-antonio/citadel.git
cd citadel
cp .env.example .env.local   # fill in API keys — see .claude/setup.md
npm install
npm run dev                  # http://localhost:3000
```

### Environment Variables

```env
NEXT_PUBLIC_MAPBOX_TOKEN=          # client-side — Mapbox GL JS requires it
ANTHROPIC_API_KEY=                 # server-only
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=         # server-only — never client-side
OPENAQ_API_KEY=
TICKETMASTER_API_KEY=
EVENTBRITE_API_KEY=
MTA_API_KEY=
SF_511_API_KEY=
CTA_API_KEY=
WMATA_API_KEY=
KV_URL=                            # Vercel KV — rate limiting (fails open locally)
KV_REST_API_URL=
KV_REST_API_TOKEN=
KV_REST_API_READ_ONLY_TOKEN=
SENTRY_DSN=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Full setup (Supabase schema, Mapbox Studio style, API key registration): see [.claude/setup.md](.claude/setup.md)

### Scripts

```bash
npm run dev              # start dev server (Turbopack)
npm run build            # production build
npm run type-check       # tsc --noEmit (strict mode)
npm test                 # vitest run
npm run test:watch       # vitest watch mode
npm run test:coverage    # coverage report with enforced thresholds
npm run test:e2e         # playwright critical path tests
npm run test:e2e:ui      # playwright interactive UI
npm run lint             # eslint
```

---

## Project Structure

```
app/
  api/
    city/[id]/
      snapshot/     # aggregates all 8 data sources, cache-first
      briefing/     # AI daily briefing, cached per city per day
    chat/           # streaming AI assistant with city context injection
    pulse/[id]/     # pulse score history
    anomalies/[id]/ # anomaly log with AI descriptions
  city/[id]/        # main dashboard page (dynamic import of CityMap)
  page.tsx          # redirects to /city/chicago

components/
  map/              # CityMap (ssr: false), all Mapbox layer components
  orbital/          # OrbitalCore, OrbitalMetric, OrbitalLayout (custom SVG)
  panels/           # PanelBase + 6 data panels (Weather, AQ, Transit, Events, Anomaly, History)
  nav/              # NavBar, city selector, layer toggle, ThemeToggle
  chat/             # ChatDrawer, StreamingText, ChatMessage, suggestion chips
  shared/           # LiveDot, ErrorBanner

lib/
  data/             # one fetcher per API (weather, airQuality, events, transit, crime)
  ai/               # context builder, briefing cache
  cache.ts          # Supabase getCached / setCached
  anomaly.ts        # deviation detection and logging
  pulse.ts          # composite pulse score algorithm
  cities.ts         # city config (id, lat, lng, zoom, mapStyle, transit adapter)
  types.ts          # all TypeScript interfaces

tests/
  api/              # route handler integration tests (mocked Supabase + Anthropic)
  components/       # RTL component tests (mocked Mapbox, mocked next/navigation)
  lib/              # pure function unit tests
  mocks/            # shared supabase.ts and anthropic.ts — never duplicated inline
  e2e/              # Playwright critical path tests with page.route() API mocks
```

---

## Build Phases

| Phase | Description | Status |
|-------|-------------|--------|
| 1 — Foundation | Types, lib functions, all data fetchers, API routes, Supabase cache | In progress |
| 2 — Shell & Map | Next.js app, full-viewport Mapbox map, city routing, dark/light mode | Not started |
| 3 — Orbital & Panels | Custom SVG orbital UI, all 6 data panels, nav | Not started |
| 4 — AI & Chat | Streaming chat, city briefings, anomaly AI descriptions | Not started |
| 5 — Map Layers | GeoJSON layers (AQ, events, transit, crowd, crime) | Not started |
| 6 — Polish & Deploy | Accessibility audit, performance, E2E tests, Vercel deploy | Not started |

---

Built by [Ricardo Monterrosa](https://github.com/ricky-antonio)
