# Phase 6 Roadmap — Polish & Deploy

All prompts below are self-contained. Clear context between sessions and paste the next prompt fresh. Do not skip a prompt or combine two into one session.

---

## Status

```
P6.1  Empty states + error recovery      ○ Not started
P6.2  Keyboard completeness              ○ Not started
P6.3  Accessibility audit + fixes        ○ Not started
P6.4  Light mode polish + responsive     ○ Not started
P6.5  Performance audit                  ○ Not started
P6.6  Playwright E2E setup + tests       ○ Not started
P6.7  Pre-deploy + production launch     ○ Not started
```

---

## PROMPT P6.1 — Empty states + error recovery

```
Read CLAUDE.md, .claude/rules/testing.md, .claude/phases/6-polish-and-deploy.md,
and PROGRESS.md in that order. Confirm: current phase, last completed task, next task.
Do not write any code until you have confirmed.

---

You are adding empty states to every panel that can have no data, and a graceful
error recovery message to the chat drawer when the AI stream fails mid-response.
Empty states prevent the app from showing a blank panel with no explanation.

Describe what you are about to change before writing any code:
- All six panels — add empty state rendering when data arrays are empty
- ChatDrawer — ensure stream failure shows inline error message (not silence)
- Add tests for empty state rendering

Wait for confirmation before writing.

---

EMPTY STATES TO ADD:

For each panel, add a conditional block that renders when the data is empty:

TransitPanel — when transit.delayCount === 0 AND transit.lines.length === 0:
  Already handled (shows "All lines running normally"). Verify this is implemented.
  If transit.lines is empty too: show "Transit data temporarily unavailable."

EventsPanel — when events.count === 0 AND events.tonight.length === 0:
  Show: amber calendar icon (text "📅" or SVG) + "No major events tonight."
  Sub-text: "Check back this afternoon for evening event listings."

AnomalyPanel — when anomalies.length === 0:
  Show: "No anomalies detected in the last 7 days. City metrics are within normal range."

HistoryPanel — when history fetch returns empty or fewer than 2 points:
  Show: "Not enough data yet." + "Check back after the first hour of data collection."
  Sub-text: "History builds up as the app runs — typically 2+ hours for a visible chart."

WeatherPanel — when weather is WEATHER_FALLBACK (condition === 'Unavailable'):
  Show ErrorBanner with "Weather data temporarily unavailable."
  Still render temp: "–°F" and condition: "–" rather than hiding the panel.

AQPanel — when airQuality is AIR_QUALITY_FALLBACK (stations.length === 0):
  Show ErrorBanner with "Air quality data temporarily unavailable."

FULL SNAPSHOT FALLBACK:

In app/city/[id]/page.tsx, handle the case where the snapshot fetch fails entirely:
  In the refetch function, if response is not ok:
    setSnapshot(null) — do NOT leave stale snapshot showing
    setLoading(false)
    Show an error overlay:
      position: absolute, top: 50%, left: 50%, transform: translate(-50%, -50%)
      background: var(--panel-bg), backdropFilter: blur(12px)
      border: 1px solid var(--panel-border), borderRadius: var(--radius-lg)
      padding: 24px, textAlign: center
      Title: "City data unavailable"
      Message: "Some data sources are temporarily unreachable. Retrying..."
      The polling interval will retry automatically — no manual action needed.

CHAT ERROR RECOVERY:

Verify that ChatDrawer.tsx handles the stream failure case:
  If the fetch() itself throws (network error):
    The catch block should append: "[Connection interrupted. Please try again.]"
  If the stream starts but then breaks mid-way:
    The same catch block handles it (ReadableStream reader.read() throws).
  These should already be implemented from P4.4 — verify they work manually.

TESTS TO ADD:

tests/components/EventsPanel.test.tsx — add if not present:
  it('renders empty state when events.count is 0 and tonight is empty')

tests/components/AnomalyPanel.test.tsx — add if not present:
  it('renders empty state when anomalies array is empty')

After writing, run:
  npm test
  npm run type-check

Update PROGRESS.md: mark P6.1 complete, next = P6.2 Keyboard completeness.
```

---

## PROMPT P6.2 — Keyboard completeness

```
Read CLAUDE.md, .claude/rules/testing.md, .claude/phases/6-polish-and-deploy.md,
and PROGRESS.md in that order. Confirm: current phase, last completed task, next task.
Do not write any code until you have confirmed.

---

You are doing a full keyboard navigation audit and fixing any gaps. The goal: a user
should be able to use the entire app — including opening panels, switching cities,
toggling layers, and chatting — without ever touching the mouse. Every interactive
element must be reachable via Tab and activatable via Enter or Space.

Describe what you are about to audit and fix before starting:
- Nav pill keyboard navigation
- Escape key priority ordering
- City selector arrow key navigation
- Suggestion chip keyboard activation

Wait for confirmation before starting.

---

AUDIT AND FIX:

1. Tab order in the nav pill (left to right):
   CITADEL wordmark → not focusable (decorative)
   City selector trigger → focusable, Enter opens dropdown
   Layer toggle trigger → focusable, Enter opens dropdown
   "Ask" button → focusable, Enter opens chat drawer
   Theme toggle → focusable, Enter toggles theme

   Verify by tabbing through the nav pill with the keyboard only.
   Fix any element that is not reachable or not activatable.

2. City selector dropdown keyboard navigation:
   When open:
     Down arrow → move focus to next city option
     Up arrow → move focus to previous city option
     Enter → select focused city, close dropdown
     Escape → close dropdown, return focus to trigger button
   
   Implement with useRef to track focused option index and update on arrow keys.
   aria-activedescendant on the trigger, role="option" on each city item.

3. Layer toggle dropdown:
   Tab moves between checkboxes when open.
   Space toggles the focused checkbox.
   Escape closes.
   (Native checkbox keyboard behaviour should handle most of this — verify.)

4. Orbital metric nodes (already implemented in P3.2 — verify):
   Tab reaches each node.
   Enter opens the node's panel.
   After panel opens, Tab moves within the panel (focus trap).
   Escape closes the panel, returns focus to the orbital node that opened it.
   
   For focus return: in PanelBase.tsx, track the previously focused element:
     const previousFocus = useRef<HTMLElement | null>(null)
     On mount: previousFocus.current = document.activeElement as HTMLElement
     On close (Escape or outside click): previousFocus.current?.focus()

5. Panel focus trap — verify:
   When a panel is open, Tab should NOT reach the orbital nodes or nav pill.
   Only elements inside the open panel are reachable.
   This should be handled by react-focus-trap — verify it is working.

6. Chat drawer keyboard:
   Enter submits message (Shift+Enter adds newline — NOT supported, just Enter submits).
   Escape closes the drawer.
   Tab moves: input → send button → suggestion chips → back to input.
   
   Verify suggestion chips are reachable via Tab when the drawer is open.

7. Escape key priority (in page.tsx useEffect):
   Priority order — fix if not already correct:
     1. If a panel is open → close panel, return focus to orbital node
     2. Else if city dropdown is open → close dropdown, return focus to trigger
     3. Else if layer dropdown is open → close dropdown, return focus to trigger
     4. Else if chat drawer is open → close drawer

8. Focus ring visibility:
   Ensure every focusable element has a visible focus ring.
   Add to globals.css if not present:
     :focus-visible {
       outline: 2px solid var(--amber);
       outline-offset: 2px;
     }
   :focus (without :focus-visible) should NOT show the ring (prevents ring on click).

After all fixes, do a full manual keyboard-only test:
  Tab to city selector → open dropdown → arrow to SF → Enter → city switches
  Tab to orbital weather node → Enter → weather panel opens
  Tab within panel → Escape → panel closes → focus returns to orbital node
  Tab to Ask button → Enter → chat opens → type message → Enter → response streams
  Escape → chat closes

Run:
  npm run type-check
  npm test

Update PROGRESS.md: mark P6.2 complete, next = P6.3 Accessibility audit + fixes.
```

---

## PROMPT P6.3 — Accessibility audit + fixes

```
Read CLAUDE.md, .claude/rules/testing.md, .claude/phases/6-polish-and-deploy.md,
and PROGRESS.md in that order. Confirm: current phase, last completed task, next task.
Do not write any code until you have confirmed.

---

You are running an accessibility audit and fixing the findings. The goal is zero
critical violations from automated tooling, and correct screen reader behaviour for
live data updates. This prompt does not require a browser tool — audit the code
directly for the items listed.

Describe what you are about to audit before starting:
- aria attributes across all interactive components
- aria-live regions for live data updates
- Color contrast checks
- Screen reader text for visual-only elements

Wait for confirmation before starting.

---

AUDIT CHECKLIST — fix each item found:

1. ARIA labels on icon-only buttons:
   - ThemeToggle: ✓ already has aria-label (verify)
   - Chat drawer close button (×): must have aria-label="Close chat"
   - Layer toggle trigger: must have aria-label="Toggle map layers"
   - City selector trigger: must have aria-label="Select city"
   
   Search components/ for buttons with no visible text label and add aria-label.

2. Orbital metric nodes:
   - role="button" on each OrbitalMetric (verify from P3.2)
   - tabIndex={0} on each (verify)
   - aria-label: "${label}: ${value}. Press Enter to expand." (update if different)
   - aria-expanded on the metric that has an open panel: aria-expanded={activePanel === metric}

3. Panel dialog attributes:
   - role="dialog" on PanelBase outer div (verify)
   - aria-label={title} on PanelBase outer div (verify)
   - aria-modal="true" on PanelBase (add if missing)

4. aria-live regions:
   - Pulse score in OrbitalCore: add aria-live="polite" aria-atomic="true"
     So screen readers announce when the score changes.
   - Chat messages container in ChatDrawer: add aria-live="polite" aria-atomic="false"
     So each new message is announced.
   - City switch: add aria-live="polite" on a visually-hidden span that announces
     "Now showing [City Name]" when the city changes.

5. Color contrast check (manual, using browser DevTools):
   - Body text (var(--tx-1) = #F0EDE8) on panel background (rgba 10,13,18,0.85):
     Approximate contrast ≈ 14:1 — passes AA.
   - Secondary text (var(--tx-2) = #8A9BAA) on panel background:
     Compute contrast. If below 4.5:1, lighten --tx-2 slightly.
   - Amber text (#E8A020) on dark background (#060A0F):
     Compute contrast ≈ 6:1 — passes AA.
   - Report contrast ratios for each combination.

6. Visually hidden helper class:
   If not already in globals.css, add:
     .sr-only {
       position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
       overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0;
     }
   Use this for screen-reader-only text (e.g. the city switch announcement).

7. Map accessibility:
   The Mapbox map itself is not keyboard accessible — this is acceptable given the
   nature of the interface. Add to the map container:
     aria-label="Interactive city map. Use the orbital controls above to view data."
     aria-hidden on map layers (they are decorative — data is in the panels)

8. Image alt text:
   Any SVG icons used as images must have aria-label or be aria-hidden if decorative.
   The OrbitalCore SVG: role="img", aria-label already set (verify from P3.1).

After fixes, run:
  npm run type-check
  npm test

Also run manually: open Chrome DevTools → Accessibility panel → inspect the main
page for violations. Fix any critical or serious findings.

Update PROGRESS.md: mark P6.3 complete, next = P6.4 Light mode polish + responsive.
```

---

## PROMPT P6.4 — Light mode polish + responsive breakpoints

```
Read CLAUDE.md, .claude/rules/testing.md, .claude/phases/6-polish-and-deploy.md,
and PROGRESS.md in that order. Confirm: current phase, last completed task, next task.
Do not write any code until you have confirmed.

---

You are polishing the light mode experience and adding responsive breakpoints for
tablet screens. Light mode was wired in Phase 2 (theme toggle + CSS variables) but
may have visual issues at this point. The responsive breakpoints are nice-to-have
but the app should at least not be broken on tablets.

Describe what you are about to check and fix before starting:
- Light mode visual audit across all components
- Tablet breakpoint (768–1023px) — panel width reduction, orbital scale
- Mobile breakpoint (< 768px) — basic usability

Wait for confirmation before starting.

---

LIGHT MODE AUDIT:

Toggle to light mode (click the theme toggle) and check each component:

1. Map: should switch to mapbox://styles/mapbox/light-v11 (implemented in P5.5).
   Verify the map tiles change when theme changes.

2. Panels: background should be rgba(245,242,236,0.92) with dark text.
   Verify panel-bg, tx-1, tx-2 variables are applied correctly.
   Fix: if panel text is still light-colored, check that [data-theme='light'] overrides
   are being applied to the CSS variables.

3. Nav pill: should use light panel surface with dark text.
   "CITADEL" wordmark: should use --tx-1 (dark amber #1A1200) in light mode.

4. Orbital: amber color stays the same (#E8A020) in both modes.
   Core background (#1A1200) should stay dark in light mode — the orbital is a
   design constant, not a mode-sensitive element.

5. Chat drawer: light background with dark text. Input field: light surface.

6. Fix any components where hardcoded color values (hex strings) are used instead
   of CSS variables. Replace hardcoded colors with the appropriate variable.

RESPONSIVE BREAKPOINTS:

Add to globals.css (or tailwind.config.ts media queries):

Tablet (768px–1023px):
  - Panels: width 240px (instead of 280px)
    @media (max-width: 1023px) {
      /* target panel containers */
      [data-panel] { width: 240px; }
    }
  
  - Orbital: scale to 80%
    @media (max-width: 1023px) {
      [data-orbital] { transform: translate(-50%, -50%) scale(0.8); }
    }
  
  - Nav pill: reduce gap between items, allow items to compress
    @media (max-width: 1023px) {
      [data-nav] { gap: 8px; padding: 0 10px; }
    }

Mobile (< 768px) — basic usability only:
  - Orbital: scale to 60%, move to lower-center (bottom: 25%, centered)
    @media (max-width: 767px) {
      [data-orbital] {
        top: auto; bottom: 25%;
        transform: translateX(-50%) scale(0.6);
        left: 50%;
      }
    }
  
  - Panels: full-width bottom sheets
    @media (max-width: 767px) {
      [data-panel] {
        width: 100% !important; left: 0 !important; right: 0 !important;
        bottom: 0 !important; top: auto !important; transform: none !important;
        border-radius: var(--radius-lg) var(--radius-lg) 0 0;
        max-height: 70vh;
      }
    }
  
  - Chat drawer: full height on mobile
    @media (max-width: 767px) { [data-chat-drawer] { height: 85vh; } }
  
  - Minimum touch targets: all buttons and interactive elements ≥ 44px height/width
    Verify using browser mobile emulation.

Add data-* attributes to the affected containers in the components:
  PanelBase: add data-panel to the outer div
  OrbitalLayout: add data-orbital to the container
  NavBar: add data-nav to the pill container
  ChatDrawer: add data-chat-drawer to the outer div

After fixes, test:
  - Light mode in browser: panels are light, map switches style, text is readable
  - Tablet emulation (Chrome DevTools → device toolbar → 900px): orbital is smaller,
    panels are narrower, nothing overflows
  - Mobile emulation (375px): orbital repositioned, panels are full-width sheets

Run:
  npm run type-check
  npm test

Update PROGRESS.md: mark P6.4 complete, next = P6.5 Performance audit.
```

---

## PROMPT P6.5 — Performance audit

```
Read CLAUDE.md, .claude/rules/testing.md, .claude/phases/6-polish-and-deploy.md,
and PROGRESS.md in that order. Confirm: current phase, last completed task, next task.
Do not write any code unless fixing a failing check.

---

You are running a performance audit. The goal is Lighthouse Performance ≥ 85, with
specific verification that Mapbox is not in the initial JS bundle and that map layer
data updates without causing a map remount.

Describe what you are about to audit before starting:
- Bundle analysis (Mapbox not in initial chunk)
- Lighthouse Performance score
- Virtual list verification for HistoryPanel
- Chat context token budget

Wait for confirmation before starting.

---

PERFORMANCE CHECKS:

1. Bundle analysis — verify Mapbox is NOT in the initial JS bundle:
   npm run build
   After build, inspect .next/static/chunks/ directory:
   ls -la .next/static/chunks/ | sort -k5 -rn | head -20
   (Shows largest chunks first)
   
   The initial page bundle should NOT contain mapbox-gl (it's dynamically imported).
   If mapbox-gl appears in the initial bundle, the dynamic import is broken — fix it.
   
   Expected: mapbox-gl appears in a separate chunk (named something like
   chunks/[hash].js that is NOT listed in the _app or page initial chunks).

2. Lighthouse Performance score:
   Build and start: npm run build && npm start
   Open Chrome → DevTools → Lighthouse → Navigation → Desktop → Analyze page load
   on http://localhost:3000/city/new-york
   
   Target scores:
     Performance: ≥ 85
     Accessibility: ≥ 90
     Best Practices: ≥ 90
   
   Common issues to fix if Performance < 85:
     - Large layout shifts (CLS): ensure the map skeleton has the same dimensions as
       the loaded map (100vw × 100vh) — no layout shift when map loads.
     - Render-blocking resources: check if any CSS or fonts block rendering.
     - Unused JavaScript: check if any large library is imported but not tree-shaken.

3. Virtual list verification for HistoryPanel:
   The pulse history chart uses @tanstack/react-virtual when showing > 20 data points.
   To test: seed the pulse_history table with 200+ rows for new-york.
   Open HistoryPanel → open DevTools → Elements → count rendered SVG points.
   If > 20 data points exist but only ~20 SVG points are in the DOM, virtualization
   is working. If all 200+ are in the DOM, virtualization is broken — fix it.

4. Chat context token budget:
   buildCityContext must stay under 3200 characters.
   Test manually: fetch a snapshot and pass it to buildCityContext.
   Add a check in app/api/chat/route.ts (development only):
   
     if (process.env.NODE_ENV === 'development') {
       const contextStr = buildUserMessage(message, snapshot)
       if (contextStr.length > 3200) {
         console.warn('Context budget exceeded:', contextStr.length, 'chars')
       }
     }
   
   If context exceeds 3200 chars: truncate events.tonight to 3 items and
   anomalies descriptions to 50 chars each in buildCityContext.

5. Map layer update without remount:
   Open DevTools → Performance tab → Start recording.
   Wait for the 5-minute data poll to trigger (or manually call the refetch function).
   Stop recording. Inspect the flame chart.
   Confirm: no "Mount" event for CityMap during the poll.
   The only activity should be setData() calls on existing sources.
   If CityMap remounts on poll: the issue is in the key prop or snapshot reference
   in page.tsx — ensure the map is not given a changing key prop.

After all checks and fixes, run:
  npm run type-check
  npm test
  npm run test:coverage — must reach lines ≥ 85%, functions ≥ 85%, branches ≥ 80%.
  Update vitest.config.ts thresholds to these final values.
  npm run build — must succeed.

Update PROGRESS.md: mark P6.5 complete, next = P6.6 Playwright E2E setup + tests.
```

---

## PROMPT P6.6 — Playwright E2E setup + tests

```
Read CLAUDE.md, .claude/rules/testing.md, .claude/phases/6-polish-and-deploy.md,
and PROGRESS.md in that order. Confirm: current phase, last completed task, next task.
Do not write any code until you have confirmed.

---

You are adding Playwright E2E tests to the project. The goal is a suite of 5
critical path tests that run in Chromium against the dev server. Every external API
call (snapshot, chat) is mocked via page.route() — no real Anthropic or transit API
calls are made during tests.

Describe what you are about to create before writing any code:
- playwright.config.ts
- tests/e2e/fixtures/snapshot.ts
- tests/e2e/city-dashboard.spec.ts (5 tests)
- package.json script additions
- CI workflow update

Wait for confirmation before writing.

---

INSTALL:

  npm install -D @playwright/test
  npx playwright install chromium

---

playwright.config.ts (root — create this file):

  import { defineConfig, devices } from '@playwright/test'

  export default defineConfig({
    testDir: './tests/e2e',
    fullyParallel: false,
    retries: 0,
    use: {
      baseURL: 'http://localhost:3000',
      trace: 'on-first-retry',
    },
    projects: [
      { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    ],
    webServer: {
      command: 'npm run dev',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
    },
  })

---

tests/e2e/fixtures/snapshot.ts:

  import type { CitySnapshot } from '@/lib/types'

  export function buildMockSnapshot(cityId: string, overrides: Partial<CitySnapshot> = {}): CitySnapshot {
    return {
      cityId,
      pulseScore: 72,
      pulseComponents: { eventScore: 20, crowdScore: 15, transitScore: 18, aqScore: 12, timeScore: 7 },
      weather: {
        temp: 68, feelsLike: 65, humidity: 55, windSpeed: 8,
        condition: 'Clear', icon: '01d', updatedAt: new Date().toISOString(),
      },
      airQuality: {
        aqi: 42, category: 'Good', dominantPollutant: 'pm25',
        stations: [{ name: 'Downtown', aqi: 42, lat: 40.71, lng: -74.01 }],
        updatedAt: new Date().toISOString(),
      },
      events: {
        count: 3, tonight: [
          { id: '1', name: 'Jazz at the Park', venue: 'Central Park', time: '8:00 PM', category: 'music', lat: 40.785, lng: -73.968, ticketUrl: null },
        ],
        updatedAt: new Date().toISOString(),
      },
      transit: {
        delayCount: 1, lines: [
          { id: 'A', name: 'A Train', status: 'Delays', statusDetail: 'Minor delays due to signal work', affectedCount: 1200 },
        ],
        updatedAt: new Date().toISOString(),
      },
      crime: { incidents: [], updatedAt: new Date().toISOString() },
      anomalies: [],
      fetchedAt: new Date().toISOString(),
      ...overrides,
    }
  }

---

tests/e2e/city-dashboard.spec.ts:

  The test file must set up page.route() mocks BEFORE navigating. Use beforeEach for
  the snapshot mock (it applies to every test). Set up the chat mock inside the
  specific test that uses it.

  CRITICAL: The mock snapshot must have pulseScore > 0 so test 1 passes.

  TEST 1 — page loads with pulse score:
    Mock: GET /api/city/*/snapshot → buildMockSnapshot('new-york')
    Navigate to /city/new-york
    Wait for '[data-testid="pulse-score"]' to be visible
    Expect text to match /[1-9]\d*/ (not "0")
    
    Note: OrbitalCore must render the pulse number with data-testid="pulse-score".
    If this attribute is not present from Phase 3, add it now to OrbitalCore.tsx.

  TEST 2 — click weather node opens WeatherPanel:
    Mock: same snapshot mock
    Navigate to /city/new-york
    Wait for '[data-testid="orbital-node-weather"]' to be visible
    Click '[data-testid="orbital-node-weather"]'
    Expect '[data-testid="panel-weather"]' to be visible
    
    Note: Add data-testid="orbital-node-weather" to the weather OrbitalMetric if not
    present. Add data-testid="panel-weather" to the WeatherPanel root div.

  TEST 3 — chat submit shows streaming response:
    Mock: snapshot mock + chat mock (text/event-stream)
    Chat mock response body:
      'data: {"type":"delta","delta":{"type":"text_delta","text":"Clear skies in New York."}}\n\ndata: {"type":"message_stop"}\n\n'
    Navigate to /city/new-york
    Click '[data-testid="chat-open-button"]'
    Wait for '[data-testid="chat-input"]' to be visible
    Fill '[data-testid="chat-input"]' with 'What is the weather?'
    Press 'Enter'
    Expect '[data-testid="chat-messages"]' to contain text 'Clear skies'

    Note: Add the data-testid attributes to the Ask button, chat input, and messages
    container in ChatDrawer.tsx if not present from Phase 4.

  TEST 4 — city switch re-centres map:
    Mock: /api/city/*/snapshot → buildMockSnapshot using cityId from the URL match
    Navigate to /city/new-york
    Wait for page to load (wait for '[data-testid="pulse-score"]')
    Click '[data-testid="city-selector"]'
    Click '[data-testid="city-option-chicago"]'
    Expect URL to contain '/city/chicago'
    Expect '[data-testid="pulse-score"]' to be visible (map re-rendered for Chicago)

    Note: Add data-testid="city-selector" to the city selector trigger.
    Add data-testid="city-option-{cityId}" to each city option.

  TEST 5 — Escape closes open panel:
    Mock: snapshot mock
    Navigate to /city/new-york
    Click '[data-testid="orbital-node-weather"]'
    Expect '[data-testid="panel-weather"]' to be visible
    Press 'Escape'
    Expect '[data-testid="panel-weather"]' not to be visible

---

data-testid ATTRIBUTES REQUIRED:

  If any of these are missing from the Phase 3/4 components, add them now:
    OrbitalCore.tsx:      data-testid="pulse-score" on the score text element
    OrbitalMetric.tsx:    data-testid={`orbital-node-${metric.toLowerCase()}`} (weather, aq, events, transit)
    WeatherPanel.tsx:     data-testid="panel-weather" on the root element
    ChatDrawer.tsx:       data-testid="chat-open-button" on Ask button
                          data-testid="chat-input" on the textarea
                          data-testid="chat-messages" on the messages container
    NavBar.tsx:           data-testid="city-selector" on the selector trigger
                          data-testid={`city-option-${city.id}`} on each option

---

PACKAGE.JSON — add scripts:

  "test:e2e": "playwright test",
  "test:e2e:ui": "playwright test --ui"

---

CI — update .github/workflows/ci.yml:

  Add before the test step:
    - name: Install Playwright browsers
      run: npx playwright install --with-deps chromium

  Add after npm test:
    - name: Run E2E tests
      run: npm run test:e2e

---

After writing everything, run:
  npm run type-check
  npm run test:e2e

All 5 tests must pass. Fix any data-testid gaps found.

Update PROGRESS.md: mark P6.6 complete, next = P6.7 Pre-deploy + production launch.
```

---

## PROMPT P6.7 — Pre-deploy + production launch

```
Read CLAUDE.md, .claude/rules/testing.md, .claude/phases/6-polish-and-deploy.md,
and PROGRESS.md in that order. Confirm: current phase, last completed task, next task.
Do not write any code unless fixing a failing check.

---

This is the final prompt. You are running the complete pre-deploy checklist and
launching to Vercel. After this prompt, the app is live.

---

PRE-DEPLOY CHECKLIST — complete each item and confirm:

ENVIRONMENT:
- [ ] All env vars are set in Vercel dashboard for Production environment:
  NEXT_PUBLIC_MAPBOX_TOKEN, ANTHROPIC_API_KEY,
  NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY,
  TICKETMASTER_API_KEY, EVENTBRITE_API_KEY,
  MTA_API_KEY, SF_511_API_KEY, CTA_API_KEY, WMATA_API_KEY,
  KV_URL, KV_REST_API_URL, KV_REST_API_TOKEN, KV_REST_API_READ_ONLY_TOKEN,
  SENTRY_DSN, NEXT_PUBLIC_SITE_URL

- [ ] Production Supabase project: schema deployed (all 5 tables + indexes)
- [ ] Preview Supabase project: schema deployed separately from production
- [ ] Vercel KV created and linked to the Vercel project (Storage → KV)

SECURITY:
- [ ] Mapbox token restricted to production domain in Mapbox account → Tokens → Allowed URLs
  Add: https://your-production-domain.com
- [ ] SUPABASE_SERVICE_ROLE_KEY is NOT a NEXT_PUBLIC_ variable (verify in .env.example)
- [ ] No real values committed to git (verify .env.local is in .gitignore)

CODE:
- [ ] npm run type-check — zero TypeScript errors
- [ ] npm test — all tests pass
- [ ] npm run test:coverage — lines ≥ 85%, functions ≥ 85%, branches ≥ 80%
- [ ] npm run build — production build succeeds locally with zero errors
- [ ] npm audit — no high or critical vulnerabilities

DEPLOYMENT:
Deploy to Vercel:
  If not already connected: vercel link (or connect via Vercel dashboard → GitHub)
  Push to main branch: git push origin main
  Vercel automatically deploys. Monitor the build log in the Vercel dashboard.

POST-DEPLOY VERIFICATION (on the live production URL):
- [ ] https://your-domain.com → redirects to /city/new-york
- [ ] The Mapbox dark map fills the viewport (no blank screen — token is working)
- [ ] Orbital pulse score shows a real number (not 0 — API data is flowing)
- [ ] Click Weather orbital node → WeatherPanel opens with real weather data for NYC
- [ ] Click Ask → type "What's the weather?" → AI streams a relevant response
- [ ] Switch city to San Francisco → map re-centres correctly
- [ ] GET https://your-domain.com/api/city/new-york/snapshot → valid CitySnapshot JSON
- [ ] GET https://your-domain.com/api/city/new-york/briefing → briefing text

AI USAGE LOGGING (deferred from Phase 4):
Implement `ai_usage` row insertion for `/api/chat` streaming responses. Briefing logging works
(non-streaming). Chat logging was deferred because `stream.on('finalMessage', ...)` and
`pipeTo().then()` both proved unreliable in local dev Next.js route handlers with streaming
responses. In production on Vercel, the streaming lifecycle may behave differently — test by
sending a chat message and checking the `ai_usage` table in Supabase. If it still doesn't log,
consider wrapping `stream.toReadableStream()` in a custom TransformStream with a `flush()` callback,
or logging without token counts via a fire-and-forget `fetch` to an internal logging endpoint.
- [ ] `ai_usage` table has a row with `route: /api/chat` after sending a message in production

RATE LIMITING (production):
Send 21 rapid chat requests to verify rate limiting is active:
  for(let i=0;i<21;i++) fetch('https://your-domain.com/api/chat', { method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({message:'test',cityId:'new-york',history:[]}) })
The 21st response should be 429. If all 21 succeed, KV is not configured — check env vars.

SENTRY:
- [ ] Trigger a test error (temporarily add 'throw new Error("test")' to a route handler,
  deploy, hit the route, then revert). Verify the error appears in Sentry dashboard.
  Remove the test error and redeploy.

CHANGELOG + README:
Update CHANGELOG.md:
  [YYYY-MM-DD] — Phase 6 — Polish, accessibility audit, performance audit, production launch

Update README.md:
  Replace "local only" with the live production URL.
  Update status badge to "Phase 6 — Complete".

Final PROGRESS.md update:
  Mark all Phase 6 items complete.
  Add to Completed section:
    [YYYY-MM-DD] — Phase 6 complete — app live at [URL]
  Set current phase: "Complete — all 6 phases shipped"

CITADEL IS LIVE.
```
