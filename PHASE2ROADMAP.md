# Phase 2 Roadmap — Shell & Map

All prompts below are self-contained. Clear context between sessions and paste the next prompt fresh. Do not skip a prompt or combine two into one session.

---

## Status

```
P2.1  Project bootstrap                  ○ Not started
P2.2  Global CSS + root layout           ○ Not started
P2.3  Routing + error boundary           ○ Not started
P2.4  CityMap component                  ○ Not started
P2.5  Shared UI atoms                    ○ Not started
P2.6  Phase 2 final checklist            ○ Not started
```

---

## PROMPT P2.1 — Project bootstrap

```
Read CLAUDE.md, .claude/rules/testing.md, .claude/phases/2-shell-and-map.md, and
PROGRESS.md in that order. Confirm: current phase, last completed task, next task.
Do not write any code until you have confirmed.

---

You are bootstrapping the Next.js application for Citadel. Phase 1 built the data
and logic layer. Now we create the Next.js project that will host it. This prompt
sets up the project skeleton, installs all dependencies, and configures Tailwind
and Next.js. No UI yet.

Describe what you are about to do before starting:
- Run npx create-next-app to bootstrap the project
- Install all production and dev dependencies
- Configure tailwind.config.ts with brand tokens
- Configure next.config.ts

Wait for confirmation before starting.

---

STEPS:

1. The project already has CLAUDE.md, lib/, tests/, and .github/ from Phase 1.
   Do NOT run create-next-app (it would overwrite existing files).
   Instead, manually create the Next.js skeleton files:
   - package.json (if not already present from Phase 1) with all dependencies
   - tsconfig.json — Next.js default with strict: true and @ path alias to "."
   - next.config.ts — basic config (see below)
   - tailwind.config.ts — extended with brand colors (see below)
   - postcss.config.mjs — standard Tailwind PostCSS config

   If package.json already exists from Phase 1, just add the missing dependencies.

2. Install production dependencies:
   npm install next@15 react react-dom
   npm install mapbox-gl react-map-gl
   npm install @anthropic-ai/sdk
   npm install @supabase/supabase-js @supabase/ssr
   npm install next-themes
   npm install @tanstack/react-virtual
   npm install @upstash/ratelimit @vercel/kv
   npm install react-focus-trap

3. Install dev dependencies:
   npm install -D typescript @types/node @types/react @types/react-dom
   npm install -D @types/mapbox-gl
   npm install -D tailwindcss postcss autoprefixer
   npm install -D eslint eslint-config-next

next.config.ts:
  import type { NextConfig } from 'next'
  const config: NextConfig = {
    reactStrictMode: true,
    // Mapbox GL JS requires this to avoid SSR issues with 'mapbox-gl'
    webpack: (config) => {
      config.resolve.alias = {
        ...config.resolve.alias,
        'mapbox-gl': 'mapbox-gl',
      }
      return config
    },
  }
  export default config

tailwind.config.ts — extend with:
  colors:
    amber: {
      50: '#FFFBF0', 100: '#FFF0C2', 200: '#FFD97A', 300: '#F5B731',
      400: '#E8A020', 500: '#C47D0A', 600: '#9A5E00', 700: '#7A4400',
      dark: '#1A1200'
    }
    dark: {
      900: '#060A0F', 800: '#0A0D12', 700: '#0F1318',
      600: '#141820', 500: '#1C2230'
    }
  fontFamily:
    sans: ['var(--font-inter)', 'system-ui', 'sans-serif']
    mono: ['var(--font-jetbrains-mono)', 'monospace']
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}']

After installing, verify:
  npx tsc --noEmit (may fail if app/ files are missing — that is fine)
  Check node_modules/ contains next, mapbox-gl, react-map-gl, @anthropic-ai/sdk

Update PROGRESS.md: mark P2.1 complete, next = P2.2 Global CSS + root layout.
```

---

## PROMPT P2.2 — Global CSS + root layout

```
Read CLAUDE.md, .claude/rules/testing.md, .claude/phases/2-shell-and-map.md, and
PROGRESS.md in that order. Confirm: current phase, last completed task, next task.
Do not write any code until you have confirmed.

---

You are creating the global CSS file with all design tokens and the root layout
that wraps every page. This is where the brand color system, CSS variables, fonts,
and the theme provider live. Everything visual in the app references these tokens.

Describe what you are about to create before writing any code:
- app/globals.css — CSS variables (dark + light), Tailwind base, scrollbar styles
- app/layout.tsx — root layout with ThemeProvider, fonts, html attributes

Wait for confirmation before writing.

---

FILES TO CREATE:

app/globals.css:
  @tailwind base;
  @tailwind components;
  @tailwind utilities;

  :root (dark mode values — default):
    Use the full CSS variable set from .claude/design.md exactly.
    Include all --amber-*, --panel-*, --nav-*, --chat-*, --bg-*, --border-*, --tx-*
    variables, --radius, --radius-lg, --radius-pill, and all --z-* z-index values.

  [data-theme='light'] block:
    Override the variables that change in light mode (from .claude/design.md).

  Base styles:
    html, body: margin: 0; padding: 0; overflow: hidden; background: var(--bg-base);
    * { box-sizing: border-box; }
    Custom scrollbar (for panels):
      ::-webkit-scrollbar { width: 4px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: var(--border-subtle); border-radius: 2px; }

  Keyframe animations:
    @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
    @keyframes pulse-dot { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
    @keyframes blink-cursor { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }

app/layout.tsx (Server Component):
  import { Inter, JetBrains_Mono } from 'next/font/google'
  import { ThemeProvider } from 'next-themes'
  import './globals.css'

  const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
  const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains-mono' })

  export const metadata = {
    title: 'Citadel — The city, decoded.',
    description: 'Live city intelligence for New York, San Francisco, Chicago, and Washington DC.',
  }

  export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
      <html lang="en" suppressHydrationWarning>
        <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans`}>
          <ThemeProvider attribute="data-theme" defaultTheme="dark" enableSystem={false}>
            {children}
          </ThemeProvider>
        </body>
      </html>
    )
  }

After writing, run:
  npm run type-check
  (Expected: no errors in these files specifically)

Update PROGRESS.md: mark P2.2 complete, next = P2.3 Routing + error boundary.
```

---

## PROMPT P2.3 — Routing + error boundary

```
Read CLAUDE.md, .claude/rules/testing.md, .claude/phases/2-shell-and-map.md, and
PROGRESS.md in that order. Confirm: current phase, last completed task, next task.
Do not write any code until you have confirmed.

---

You are creating the app routing: the root redirect, the global error boundary,
and the main city dashboard page. The dashboard page is the most important file
in the app — it owns all top-level state and wires everything together. In this
prompt it renders a loading skeleton and fetches the snapshot; the visual overlays
come in Phase 3.

Describe what you are about to create before writing any code:
- app/page.tsx — permanent redirect to /city/new-york
- app/error.tsx — global error boundary (client component)
- app/city/[id]/page.tsx — dashboard page with snapshot fetch and polling

Wait for confirmation before writing.

---

FILES TO CREATE:

app/page.tsx (Server Component):
  import { redirect } from 'next/navigation'
  export default function Home() { redirect('/city/new-york') }

app/error.tsx ('use client'):
  Receives { error: Error, reset: () => void } props.
  Renders centred over the full viewport:
    background: var(--bg-base), color: var(--amber), text-align: center
    "Something went wrong." message
    "Try again" button calling reset()
  No console.log — use Sentry in production.

app/city/[id]/page.tsx ('use client'):
  Next.js 15: client components use useParams() to read dynamic segments —
  do NOT destructure params from props (that requires awaiting in server components).
  
  import { useParams, useRouter } from 'next/navigation'
  
  export default function CityPage() {
    const rawParams = useParams()
    const cityId = rawParams.id as string   // useParams() returns synchronously in client components
  
  State it owns:
    snapshot: CitySnapshot | null = null
    loading: boolean = true
    activePanel: 'weather' | 'aq' | 'transit' | 'events' | 'anomaly' | 'history' | null = null
    chatOpen: boolean = false
    activeLayers: string[] = ['air-quality', 'events', 'transit', 'crowd']
    fading: boolean = false

  On mount (useEffect with cityId dependency):
    1. Validate city: const city = getCityById(cityId)
       If not found: use router.replace('/city/new-york') and return.
    2. Fetch snapshot:
       async function refetch() {
         setLoading(true)
         const res = await fetch(`/api/city/${cityId}/snapshot`)
         if (res.ok) { const data = await res.json(); setSnapshot(data) }
         setLoading(false)
       }
       refetch()
    3. Set polling interval: setInterval(refetch, 5 * 60 * 1000)
    4. Return cleanup: clearInterval

  Escape key handler (useEffect):
    document.addEventListener('keydown', handler)
    In handler: if key === 'Escape':
      if activePanel → setActivePanel(null)
      else if chatOpen → setChatOpen(false)
    Cleanup: removeEventListener

  Render:
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      
      {/* Loading skeleton shown before first snapshot */}
      {loading && !snapshot && (
        <div style={{ width: '100vw', height: '100vh', background: '#060A0F',
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: 'var(--amber)', fontFamily: 'var(--font-inter)' }}>
            Loading...
          </div>
        </div>
      )}

      {/* Map and overlays — rendered when CityMap dynamic import is ready */}
      {/* CityMap added in P2.4, overlays added in Phase 3 */}
      {snapshot && (
        <div>City: {snapshot.city.name} — Pulse: {snapshot.pulseScore}</div>
      )}
    </div>

  Note: CityMap will replace the placeholder div in P2.4. Keep the structure ready.

After writing, run:
  npm run dev
  (Expected: starts without errors, http://localhost:3000 → redirects to /city/new-york)
  npm run type-check

Update PROGRESS.md: mark P2.3 complete, next = P2.4 CityMap component.
```

---

## PROMPT P2.4 — CityMap component

```
Read CLAUDE.md, .claude/rules/testing.md, .claude/phases/2-shell-and-map.md, and
PROGRESS.md in that order. Confirm: current phase, last completed task, next task.
Do not write any code until you have confirmed.

---

You are building the full-viewport Mapbox map component — the visual foundation of
the entire app. This component fills 100vw × 100vh and accepts city config + snapshot
as props. It must be dynamically imported in page.tsx with ssr: false, because
Mapbox GL JS accesses window on load and crashes Next.js SSR.

Describe what you are about to create before writing any code:
- components/map/CityMap.tsx — full-viewport react-map-gl Map component
- Update app/city/[id]/page.tsx — swap placeholder div for dynamic CityMap import
- tests/components/CityMap.test.tsx — 3 tests with Mapbox mocked

Wait for confirmation before writing.

---

FILES TO CREATE:

components/map/CityMap.tsx ('use client'):
  Props: { city: City; snapshot: CitySnapshot | null; activeLayers: string[] }
  
  Use Map from 'react-map-gl' (not next/dynamic — the dynamic import happens in page.tsx).
  
  const CityMap = ({ city, snapshot, activeLayers }: CityMapProps) => {
    const mapRef = useRef<MapRef>(null)
    
    return (
      <Map
        ref={mapRef}
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        initialViewState={{
          longitude: city.lng,
          latitude: city.lat,
          zoom: city.mapZoom,
        }}
        style={{ width: '100vw', height: '100vh' }}
        mapStyle={city.mapStyle}
        attributionControl={false}
      >
        {/* MapLayers component added in Phase 5 */}
      </Map>
    )
  }
  
  export default CityMap

Update app/city/[id]/page.tsx:
  Add at the top of the file (outside the component, after imports):
    const CityMap = dynamic(() => import('@/components/map/CityMap'), {
      ssr: false,
      loading: () => (
        <div style={{ width: '100vw', height: '100vh', background: '#060A0F' }} />
      ),
    })
  
  In the render: replace the placeholder div with:
    {snapshot && (
      <CityMap city={snapshot.city} snapshot={snapshot} activeLayers={activeLayers} />
    )}
  
  The loading skeleton (before first snapshot) remains as-is.

tests/components/CityMap.test.tsx:
  Add the Mapbox mock to tests/setup.ts:
    vi.mock('react-map-gl', () => ({
      Map: ({ children, style, initialViewState, ...props }: any) => (
        <div data-testid="mock-map" data-zoom={initialViewState?.zoom}
             style={style} {...props}>{children}</div>
      ),
      useMap: () => ({ current: null }),
    }))
  
  Write 3 tests:
    it('renders without crashing with valid city and null snapshot')
    it('renders without crashing with valid city and a full mock snapshot')
    it('passes correct initialViewState zoom from city.mapZoom')
  
  Use a fixture: const mockCity = CITIES[0] (import CITIES from @/lib/cities)

After writing, run:
  npm run dev
  Open http://localhost:3000/city/new-york
  The Mapbox dark map should fill the entire viewport.
  If you see a blank dark screen (not the map tiles), check NEXT_PUBLIC_MAPBOX_TOKEN.
  npm test
  npm run type-check

Update PROGRESS.md: mark P2.4 complete, next = P2.5 Shared UI atoms.
```

---

## PROMPT P2.5 — Shared UI atoms

```
Read CLAUDE.md, .claude/rules/testing.md, .claude/phases/2-shell-and-map.md, and
PROGRESS.md in that order. Confirm: current phase, last completed task, next task.
Do not write any code until you have confirmed.

---

You are building three small shared UI components: the theme toggle, the live dot
animation, and the error banner. These are used in the nav pill and inside panels.
They are small and isolated — each gets a test.

Describe what you are about to create before writing any code:
- components/nav/ThemeToggle.tsx — dark/light switch using next-themes
- components/shared/LiveDot.tsx — pulsing green dot
- components/shared/ErrorBanner.tsx — error state for inside panels
- tests for all three

Wait for confirmation before writing.

---

FILES TO CREATE:

components/nav/ThemeToggle.tsx ('use client'):
  import { useTheme } from 'next-themes'
  
  const ThemeToggle = () => {
    const { theme, setTheme } = useTheme()
    return (
      <button
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        style={{ background: 'none', border: 'none', cursor: 'pointer',
                 color: 'var(--tx-2)', fontSize: '16px', padding: '8px',
                 minWidth: '44px', minHeight: '44px' }}
      >
        {theme === 'dark' ? '☀' : '◑'}
      </button>
    )
  }
  export default ThemeToggle

components/shared/LiveDot.tsx:
  A green circle that pulses opacity. No props.
  
  const LiveDot = () => (
    <span
      aria-label="Live data"
      style={{
        display: 'inline-block',
        width: '6px', height: '6px',
        borderRadius: '50%',
        background: '#4ADE80',
        animation: 'pulse-dot 1.5s ease-in-out infinite',
      }}
    />
  )
  export default LiveDot

components/shared/ErrorBanner.tsx:
  Props: { message?: string }
  Default message: 'Data temporarily unavailable'
  
  const ErrorBanner = ({ message = 'Data temporarily unavailable' }: ErrorBannerProps) => (
    <div style={{
      padding: '8px 12px',
      background: 'rgba(239, 68, 68, 0.1)',
      border: '1px solid rgba(239, 68, 68, 0.3)',
      borderRadius: 'var(--radius)',
      color: '#EF4444',
      fontSize: '12px',
    }}>
      {message}
    </div>
  )
  export default ErrorBanner

tests/components/ThemeToggle.test.tsx:
  it('renders a button with aria-label')
  it('calls setTheme with "light" when current theme is "dark"')
  it('calls setTheme with "dark" when current theme is "light"')
  The next-themes mock in tests/setup.ts already mocks useTheme — use it.

tests/components/LiveDot.test.tsx:
  it('renders with aria-label "Live data"')
  it('has the green background color in its style')

tests/components/ErrorBanner.test.tsx:
  it('renders the default message when no prop is passed')
  it('renders a custom message when passed')

After writing, run:
  npm test
  npm run type-check

Update PROGRESS.md: mark P2.5 complete, next = P2.6 Phase 2 final checklist.
```

---

## PROMPT P2.6 — Phase 2 final checklist

```
Read CLAUDE.md, .claude/rules/testing.md, .claude/phases/2-shell-and-map.md, and
PROGRESS.md in that order. Confirm: current phase, last completed task, next task.
Do not write any code unless fixing a failing check.

---

This is the final checklist for Phase 2. Run each check and report the result.

---

1. npm run type-check — zero errors required.

2. npm test — all tests pass.

3. npm run test:coverage — lines ≥ 75%, functions ≥ 75%, branches ≥ 70%.

4. npm run build — production build must succeed with zero errors.

5. npm run dev — then manually verify in browser:
   - http://localhost:3000 → redirects to /city/new-york
   - /city/new-york → Mapbox dark map fills the full viewport (no white edges,
     no scrollbar visible on body)
   - /city/san-francisco → map re-centres on San Francisco at zoom 12
   - /city/chicago → map re-centres on Chicago
   - /city/washington-dc → map re-centres on DC
   - /city/xyz → redirects to /city/new-york
   - Dark/light mode toggle appears and switches the page theme
   - Browser DevTools → Network: no direct calls to external APIs from the client
     (only /api/* and api.mapbox.com)
   - Loading state (brief dark screen with "Loading..." text) appears before map tiles

6. npm audit — no high or critical vulnerabilities.

After all checks pass:
  Update PROGRESS.md:
    - Mark P2.6 complete
    - Change current phase to "Phase 3 — Orbital & Panels (not started)"
    - Update "In progress" to first item of Phase 3

Proceed to PHASE3ROADMAP.md when ready.
```
