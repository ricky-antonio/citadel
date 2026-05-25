# Phase 2 — Shell & Map

**Complete this phase entirely before starting Phase 3.**

Phase 1 produced a tested data layer with working API routes. Phase 2 produces a running Next.js application: the dark Mapbox map fills the viewport, the city routing works, and dark/light mode is wired. No orbital UI yet — just the map surface.

---

## What to build

- [ ] `npx create-next-app@15` — bootstrap the project with TypeScript, Tailwind, App Router
- [ ] Install all dependencies (see scaffold command in CLAUDE.md)
- [ ] `app/globals.css` — CSS variables from `.claude/design.md`, Tailwind base, scrollbar styles
- [ ] `tailwind.config.ts` — extend with brand colors (amber palette, dark surfaces) and custom font family tokens
- [ ] `next.config.ts` — configure image domains, Sentry wrapper, transpile packages if needed
- [ ] `app/layout.tsx` — root layout: `ThemeProvider` (next-themes), `Inter` + `JetBrains Mono` fonts via `next/font/google`, Sentry init, `<html>` with `suppressHydrationWarning`
- [ ] `app/page.tsx` — redirect to `/city/new-york` (permanent redirect using `redirect()`)
- [ ] `app/error.tsx` — global error boundary (client component)
- [ ] `app/city/[id]/page.tsx` — main dashboard page: validate city ID, dynamic import `CityMap`, snapshot fetch on mount, 5-minute polling interval, loading skeleton while snapshot is null
- [ ] `components/map/CityMap.tsx` — full-viewport Mapbox map (`100vw × 100vh`), uses `react-map-gl`, accepts `city` and `snapshot` props, renders with correct initial view state
- [ ] `components/nav/ThemeToggle.tsx` — toggles dark/light mode via `useTheme`
- [ ] `components/shared/LiveDot.tsx` — animated green pulse indicator
- [ ] `components/shared/ErrorBanner.tsx` — in-panel error state component
- [ ] `.github/workflows/ci.yml` — finalize with actual install command

**Loading skeleton for the map page:**
```tsx
// While snapshot is null, show the dark map background with a subtle pulse
<div style={{ width: '100vw', height: '100vh', background: '#060A0F' }}>
  <div className="animate-pulse" style={{ /* centered loading indicator */ }} />
</div>
```

---

## Key flows to implement

### City routing and validation
```
GET /city/new-york    → valid → render dashboard
GET /city/xyz        → invalid city ID → redirect to /city/new-york
GET /               → redirect to /city/new-york
```

City ID validation in `app/city/[id]/page.tsx` (client component — use `useParams()`):
```tsx
import { useParams, useRouter } from 'next/navigation'
import { CITIES } from '@/lib/cities'

// Inside the component:
const rawParams = useParams()
const cityId = rawParams.id as string
const city = CITIES.find(c => c.id === cityId)
if (!city) router.replace('/city/new-york')
```

### Map renders on page load
```
page.tsx mounts
  → dynamic import resolves CityMap (ssr: false)
  → dark background shows while Mapbox tiles load
  → Mapbox map fills 100vw × 100vh
  → map style: custom dark style URL from city.mapStyle
  → initial view: city.lat, city.lng, city.mapZoom
  → snapshot fetch begins (useEffect)
```

### Snapshot polling
```
useEffect([cityId]):
  refetch()  ← immediate on mount
  interval = setInterval(refetch, 5 * 60 * 1000)
  return () => clearInterval(interval)
```

---

## Tests to write

### `tests/components/CityMap.test.tsx`
```
it('renders without crashing with valid city and null snapshot')
it('renders without crashing with valid city and full snapshot')
it('uses correct initialViewState from city config')
```

Note: Mapbox must be mocked in tests — never render a real map in a test environment.

```ts
// In tests/setup.ts, add:
vi.mock('react-map-gl', () => ({
  Map: ({ children }: { children: React.ReactNode }) => <div data-testid="mock-map">{children}</div>,
  Source: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Layer: () => null,
}))
```

### `tests/components/ThemeToggle.test.tsx`
```
it('renders a toggle button')
it('calls setTheme with light when current theme is dark')
it('calls setTheme with dark when current theme is light')
```

### `tests/components/LiveDot.test.tsx`
```
it('renders with the live animation class')
it('renders green color indicator')
```

---

## Manual verification checklist

Before marking Phase 2 complete:

- [ ] `npm run dev` starts with zero errors in the terminal
- [ ] `http://localhost:3000` redirects to `/city/new-york`
- [ ] `/city/new-york` renders the Mapbox dark map filling the full viewport (no scrollbar, no white edges)
- [ ] `/city/san-francisco` renders centred on SF at the correct zoom
- [ ] `/city/chicago` renders centred on Chicago
- [ ] `/city/washington-dc` renders centred on DC
- [ ] `/city/xyz` redirects to `/city/new-york`
- [ ] Dark/light mode toggle changes the page theme — panel surfaces change, map style does not yet switch (map layer switching is Phase 2 nice-to-have)
- [ ] Browser DevTools → Network — no direct calls to external APIs from the client
- [ ] Loading skeleton appears briefly before the map tiles render (may be very fast locally)
- [ ] `npm run type-check` — zero errors
- [ ] `npm test` — all tests pass
- [ ] `npm run build` — production build succeeds

---

## Coverage target after this phase
Lines ≥ 75% · Functions ≥ 75% · Branches ≥ 70%
