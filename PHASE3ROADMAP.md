# Phase 3 Roadmap — Orbital & Panels

All prompts below are self-contained. Clear context between sessions and paste the next prompt fresh. Do not skip a prompt or combine two into one session.

---

## Status

```
P3.1  OrbitalCore SVG component          ○ Not started
P3.2  OrbitalMetric + OrbitalLayout      ○ Not started
P3.3  PanelBase + WeatherPanel + AQPanel ○ Not started
P3.4  TransitPanel + EventsPanel +
      AnomalyPanel + HistoryPanel        ○ Not started
P3.5  Nav components + shared badges     ○ Not started
P3.6  Wire all overlays into page.tsx    ○ Not started
P3.7  Phase 3 final checklist            ○ Not started
```

---

## PROMPT P3.1 — OrbitalCore SVG component

```
Read CLAUDE.md, .claude/rules/testing.md, .claude/phases/3-orbital-and-panels.md,
and PROGRESS.md in that order. Confirm: current phase, last completed task, next task.
Do not write any code until you have confirmed.

---

You are building the centrepiece of the Citadel UI: the orbital SVG core. This is
three concentric rings with a central circle that displays the live pulse score and
label. It is a custom SVG component — no charting library. The rings are barely
visible amber lines that suggest orbital paths.

Describe what you are about to create before writing any code:
- components/orbital/OrbitalCore.tsx — SVG with three rings and animated core

Wait for confirmation before writing.

---

FILES TO CREATE:

components/orbital/OrbitalCore.tsx:
  Props: { pulseScore: number; pulseLabel: string; pulseColor: string }
  
  Renders an SVG viewBox="0 0 280 280" with:
    Three concentric rings (no fill, amber stroke):
      Outer ring: cx=140, cy=140, r=139, stroke="rgba(232,160,32,0.12)", strokeWidth=1
      Middle ring: cx=140, cy=140, r=99, stroke="rgba(232,160,32,0.18)", strokeWidth=1
      Inner ring:  cx=140, cy=140, r=59, stroke="rgba(232,160,32,0.25)", strokeWidth=1
    
    Core circle:
      cx=140, cy=140, r=36, fill="#1A1200", stroke="#E8A020", strokeWidth=2
    
    Pulse number text:
      x=140, y=138, textAnchor="middle", fontSize=22, fontWeight=800, fill="#E8A020"
      fontFamily="var(--font-inter)"
      content: {pulseScore}
    
    Pulse label text:
      x=140, y=150, textAnchor="middle", fontSize=9, fontWeight=700, fill="#7A4400"
      letterSpacing=1, fontFamily="var(--font-inter)"
      content: {pulseLabel.toUpperCase()}
    
    aria-label on the SVG: `Pulse score ${pulseScore} — ${pulseLabel}`
    role="img" on the SVG
    
    Also add an invisible <text> for screen readers that repeats the label:
      aria-live="polite" on the SVG so screen readers announce changes

  The component is NOT a client component — it is pure rendering with no state.
  (Parent OrbitalLayout will handle click interactions.)

tests/components/OrbitalCore.test.tsx — 4 tests:
  it('renders the pulse score number as text content')
  it('renders the pulse label in uppercase')
  it('has aria-label containing the score and label')
  it('renders three circle elements for the SVG rings')
  
  Use render() from @testing-library/react. Query by role="img" for the SVG.
  Check text content with getByText() for score and label.

After writing, run:
  npm test
  npm run type-check

Update PROGRESS.md: mark P3.1 complete, next = P3.2 OrbitalMetric + OrbitalLayout.
```

---

## PROMPT P3.2 — OrbitalMetric + OrbitalLayout

```
Read CLAUDE.md, .claude/rules/testing.md, .claude/phases/3-orbital-and-panels.md,
and PROGRESS.md in that order. Confirm: current phase, last completed task, next task.
Do not write any code until you have confirmed.

---

You are building the two components that complete the orbital system: OrbitalMetric
(a single metric node with dot + value + label) and OrbitalLayout (positions four
metrics at cardinal points around the core, absolutely over the map). Each metric
node floats with a staggered sine animation and opens a panel when clicked.

Describe what you are about to create before writing any code:
- components/orbital/OrbitalMetric.tsx — one metric node, keyboard accessible
- components/orbital/OrbitalLayout.tsx — positions four nodes at N/E/S/W
- tests/components/OrbitalLayout.test.tsx — 8 tests

Wait for confirmation before writing.

---

FILES TO CREATE:

components/orbital/OrbitalMetric.tsx ('use client'):
  Props:
    metric: 'weather' | 'aq' | 'transit' | 'events'
    value: string        — formatted value to display (e.g. "72°F", "AQI 45", "3 delays")
    label: string        — uppercase label (e.g. "WEATHER", "AQI", "TRANSIT", "EVENTS")
    color: string        — hex color for the dot
    animationDelay: string  — CSS animation-delay (e.g. '0s', '1s', '2s', '3s')
    onOpen: () => void   — called when node is clicked or Enter/Space pressed

  Renders a div with:
    display: flex, flexDirection: column, alignItems: center, gap: 4px
    cursor: pointer, tabIndex={0}, role="button"
    aria-label: `${label}: ${value}. Click to expand.`
    onKeyDown: if key === 'Enter' or ' ' → onOpen()
    onClick: onOpen()
    
    animation: float 4s ease-in-out infinite, animationDelay
    (uses the @keyframes float defined in globals.css)

    Inside:
      Coloured dot: 8px circle, background: color
      Value text: 14px, fontWeight 700, color: color (semantic)
      Label text: 9px, fontWeight 700, color: var(--tx-2), letterSpacing 1, text-transform uppercase

components/orbital/OrbitalLayout.tsx:
  Props:
    snapshot: CitySnapshot
    onOpenPanel: (panel: 'weather' | 'aq' | 'transit' | 'events') => void

  Position: absolutely centred over the map.
    position: absolute, top: 50%, left: 50%,
    transform: translate(-50%, -50%)
    zIndex: var(--z-orbital)

  Renders:
    OrbitalCore (the SVG rings + pulse score/label)
    Four OrbitalMetric nodes at cardinal positions:
    
    Weather (top / North):
      value: `${snapshot.weather.temp}°F`
      color: '#60A5FA' (blue — weather)
      position: top: -48px, left: 50%, transform: translateX(-50%)
      animationDelay: '0s'
    
    AQI (right / East):
      value: `AQI ${snapshot.airQuality.aqi}`
      color: getPulseColor derived from AQI (or just use '#4ADE80' for AQI < 50, '#E8A020' for 51-100, '#EF4444' for 101+)
      position: top: 50%, right: -88px, transform: translateY(-50%)
      animationDelay: '1s'
    
    Transit (bottom / South):
      value: snapshot.transit.delayCount === 0 ? 'On time' : `${snapshot.transit.delayCount} delays`
      color: snapshot.transit.delayCount === 0 ? '#4ADE80' : snapshot.transit.delayCount > 5 ? '#EF4444' : '#E8A020'
      position: bottom: -48px, left: 50%, transform: translateX(-50%)
      animationDelay: '2s'
    
    Events (left / West):
      value: `${snapshot.events.count} events`
      color: '#E8A020'
      position: top: 50%, left: -88px, transform: translateY(-50%)
      animationDelay: '3s'

  The outer container must have position: relative so the absolutely-positioned
  nodes are relative to it.

tests/components/OrbitalLayout.test.tsx — 8 tests:
  Build a makeMockSnapshot() helper.
  it('renders a weather metric node with temperature value')
  it('renders an AQI metric node with AQI value')
  it('renders a transit metric node with delay count')
  it('renders an events metric node with event count')
  it('calls onOpenPanel with "weather" when weather node is clicked')
  it('calls onOpenPanel with "aq" when AQI node is clicked')
  it('all four metric nodes have tabIndex={0}')
  it('Enter key on weather node triggers onOpenPanel("weather")')

After writing, run:
  npm test
  npm run type-check

Update PROGRESS.md: mark P3.2 complete, next = P3.3 PanelBase + WeatherPanel + AQPanel.
```

---

## PROMPT P3.3 — PanelBase + WeatherPanel + AQPanel

```
Read CLAUDE.md, .claude/rules/testing.md, .claude/phases/3-orbital-and-panels.md,
and PROGRESS.md in that order. Confirm: current phase, last completed task, next task.
Do not write any code until you have confirmed.

---

You are building the floating glass panel system: the base component that handles
positioning, blur, and close behaviour, plus the first two data panels. Panels float
over the map, slide in from the nearest edge, and close on Escape or outside click.

Describe what you are about to create before writing any code:
- components/panels/PanelBase.tsx — glass panel shell with slide-in and keyboard close
- components/panels/WeatherPanel.tsx — weather data panel (top-left anchor)
- components/panels/AQPanel.tsx — air quality panel (top-right anchor)
- tests/components/PanelBase.test.tsx — 4 tests

Wait for confirmation before writing.

---

FILES TO CREATE:

components/panels/PanelBase.tsx ('use client'):
  Props:
    anchor: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'left-center' | 'right-center'
    onClose: () => void
    title: string         — uppercase amber label for the panel header
    children: React.ReactNode

  Behaviour:
    Close on Escape key: useEffect adds keydown listener, removes on cleanup.
    Close on outside click: useEffect adds mousedown listener on document.
      If click target is not inside the panel ref, call onClose().
    Focus trap: wrap children in FocusTrap from react-focus-trap.
    Slide-in animation: on mount, use a CSS class that transitions from the edge.

  Position constants (position: absolute):
    top-left:     { top: '80px', left: '16px' }
    top-right:    { top: '80px', right: '16px' }
    bottom-left:  { bottom: '16px', left: '16px' }
    bottom-right: { bottom: '16px', right: '16px' }
    left-center:  { top: '50%', left: '16px', transform: 'translateY(-50%)' }
    right-center: { top: '50%', right: '16px', transform: 'translateY(-50%)' }

  Styles (from .claude/design.md):
    position: absolute, width: 280px, maxHeight: '60vh', overflowY: 'auto'
    background: var(--panel-bg), backdropFilter: 'blur(12px)'
    border: '1px solid var(--panel-border)', borderRadius: 'var(--radius-lg)'
    padding: 16px, zIndex: 'var(--z-panels)'
    role="dialog", aria-label={title}

  Header (inside the panel, above children):
    display: flex, justifyContent: spaceBetween, alignItems: center, marginBottom: 12px
    Title: 9px, fontWeight 700, uppercase, letterSpacing 1, color: var(--amber)
    LiveDot on the right

  Slide-in animation: apply a CSS class that starts at translateY/X(±8px) opacity 0
  and transitions to 0/1 over 200ms ease. Use useEffect + setTimeout(1ms) to trigger
  the class after mount (avoids the initial flash).

components/panels/WeatherPanel.tsx:
  Props: { weather: WeatherData; onClose: () => void }
  Wraps PanelBase with anchor="top-left" title="WEATHER".
  Displays:
    Large temp: 32px/800, color: var(--tx-1) — e.g. "72°F"
    Condition below: 14px, var(--tx-2) — e.g. "Partly Cloudy"
    Row: wind icon + "${weather.windSpeed} mph ${weather.windDir}"
    Row: humidity + UV index
    Horizontal forecast strip: 6 items from weather.hourly, each showing hour + temp + condition

components/panels/AQPanel.tsx:
  Props: { airQuality: AirQualityData; onClose: () => void }
  Wraps PanelBase with anchor="top-right" title="AIR QUALITY".
  Displays:
    Large AQI number + category badge (colored by AQI range)
    Three metric rows: PM2.5, NO2, Ozone with values
    Color-coded status bar (green → amber → red gradient) with marker at current AQI position

tests/components/PanelBase.test.tsx — 4 tests:
  it('renders children inside the panel')
  it('renders the title in the header')
  it('calls onClose when Escape key is pressed')
  it('has role="dialog" and aria-label matching the title')
  
  Note: FocusTrap needs to be mocked in tests:
    vi.mock('react-focus-trap', () => ({
      FocusTrap: ({ children }: { children: React.ReactNode }) => <>{children}</>
    }))
  Add this to tests/setup.ts.

After writing, run:
  npm test
  npm run type-check

Update PROGRESS.md: mark P3.3 complete, next = P3.4 remaining panels.
```

---

## PROMPT P3.4 — TransitPanel + EventsPanel + AnomalyPanel + HistoryPanel

```
Read CLAUDE.md, .claude/rules/testing.md, .claude/phases/3-orbital-and-panels.md,
and PROGRESS.md in that order. Confirm: current phase, last completed task, next task.
Do not write any code until you have confirmed.

---

You are building the remaining four floating panels. These follow the same PanelBase
pattern established in P3.3. The history panel uses virtualization for the chart.
No new tests beyond what was already established — PanelBase behaviour is proven.

Describe what you are about to create before writing any code:
- components/panels/TransitPanel.tsx — transit delays, anchors bottom-right
- components/panels/EventsPanel.tsx — tonight's events list, anchors bottom-left
- components/panels/AnomalyPanel.tsx — anomaly log, anchors left-center
- components/panels/HistoryPanel.tsx — 7-day pulse history chart, anchors right-center

Wait for confirmation before writing.

---

FILES TO CREATE:

components/panels/TransitPanel.tsx:
  Props: { transit: TransitData; onClose: () => void }
  PanelBase anchor="bottom-right" title="TRANSIT".
  
  If transit.delayCount === 0:
    Green check + "All lines running normally" message.
  Else:
    "{transit.delayCount} active delay(s)" in amber
    List of transit.delays: each shows line name + severity badge
      (severity 'minor' → amber badge, 'major' → red badge) + description
  
  Below: transit.lines list (up to 8) — each line shows colored dot + name + status.
  Status colors: 'normal' → green, 'delayed' → amber, 'suspended' → red.

components/panels/EventsPanel.tsx:
  Props: { events: EventsData; onClose: () => void }
  PanelBase anchor="bottom-left" title="EVENTS".
  
  If events.tonight.length === 0:
    "No major events scheduled tonight" in muted text.
  Else:
    "{events.count} events today — {events.tonight.length} tonight" header
    List of events.tonight (up to 5): each shows name + time + venue + attendance badge
    Attendance: < 1000 → no badge, 1000-9999 → amber "~{k}K", 10000+ → red "~{k}K"

components/panels/AnomalyPanel.tsx:
  Props: { anomalies: Anomaly[]; onClose: () => void }
  PanelBase anchor="left-center" title="ANOMALIES".
  
  If anomalies.length === 0:
    "No anomalies detected in the last 7 days."
  Else:
    List of anomalies (up to 10): each shows:
      Metric name (uppercase badge) + deviation percentage
      AI description if present, else "Analyzing..." in muted text
      Time elapsed ("2 hours ago") using Intl.RelativeTimeFormat

components/panels/HistoryPanel.tsx ('use client'):
  Props: { cityId: string; onClose: () => void }
  PanelBase anchor="right-center" title="PULSE HISTORY".
  
  Fetches pulse history on mount:
    useEffect: fetch /api/pulse/{cityId} → setHistory(data.history)
  
  If history.length < 2:
    "Not enough data yet — check back after a few hours."
  Else:
    Render a simple SVG line chart of pulse history.
    Width: 248px (panel width 280 - 32px padding), Height: 100px.
    X axis: time (oldest left, newest right).
    Y axis: pulse score 0-100.
    Line: stroke="#E8A020", strokeWidth=2, no fill.
    Plot at most 168 points (7 days). If > 168 points, use @tanstack/react-virtual
    with virtualized rows to avoid rendering all points in the DOM.
    Below the chart: current pulse score in large amber text.

After writing, run:
  npm run type-check
  npm test

Update PROGRESS.md: mark P3.4 complete, next = P3.5 Nav components + shared badges.
```

---

## PROMPT P3.5 — Nav components + shared badges

```
Read CLAUDE.md, .claude/rules/testing.md, .claude/phases/3-orbital-and-panels.md,
and PROGRESS.md in that order. Confirm: current phase, last completed task, next task.
Do not write any code until you have confirmed.

---

You are building the navigation pill components and two small shared badge components.
The nav pill floats at the top of the map. The city selector dropdown shows all four
cities with their live pulse scores. The layer toggle controls which map layers are
visible.

Describe what you are about to create before writing any code:
- components/nav/CitySelector.tsx — dropdown with all four cities + pulse scores
- components/nav/LayerToggle.tsx — toggleable checkboxes for map layers
- components/shared/PulseScore.tsx — colored pulse score badge
- components/shared/MetricBadge.tsx — generic metric pill

Wait for confirmation before writing.

---

FILES TO CREATE:

components/nav/CitySelector.tsx ('use client'):
  Props:
    currentCityId: string
    onCityChange: (cityId: string) => void
    pulseScores: Record<string, number>  — populated when available, otherwise {}

  State: open: boolean
  
  Renders the current city name + "▾" arrow as a button.
  On click: toggle open state.
  
  Dropdown (when open):
    position: absolute, top: calc(100% + 8px), left: 0
    background: var(--panel-bg), backdropFilter: blur(12px)
    border: 1px solid var(--panel-border), borderRadius: var(--radius-lg)
    minWidth: 200px, zIndex: var(--z-nav)
    
    Four city options, each:
      City name + state abbreviation (left)
      Pulse score badge using PulseScore component (right) — shown if available
      Current city: highlighted with amber border-left
      onClick: onCityChange(city.id), close dropdown
    
    Keyboard: Escape closes the dropdown. Arrow keys navigate options.
    Close on outside click (same pattern as PanelBase).
    aria-expanded on the trigger button, aria-haspopup="listbox"

components/nav/LayerToggle.tsx ('use client'):
  Props:
    activeLayers: string[]
    onLayerChange: (layers: string[]) => void

  State: open: boolean
  
  Trigger button: "Layers ▾"
  Dropdown (when open): four checkboxes:
    □ Air Quality
    □ Events
    □ Transit
    □ Crowd
  Each checkbox toggles the layer ID ('air-quality', 'events', 'transit', 'crowd')
  in the activeLayers array.
  Close on outside click. Escape closes.

components/shared/PulseScore.tsx:
  Props: { score: number; label?: string; size?: 'sm' | 'md' }
  
  Renders a colored score badge.
  Uses getPulseColor(score) for the color.
  sm: 10px font, small dot + number inline
  md (default): 13px font, number + optional label below in 9px

components/shared/MetricBadge.tsx:
  Props: { label: string; value: string | number; unit?: string; color?: string }
  
  Renders: [label] [value][unit] in a small pill.
  Default color: var(--tx-2) for label, var(--tx-1) for value.

After writing, run:
  npm run type-check
  npm test

Update PROGRESS.md: mark P3.5 complete, next = P3.6 Wire all overlays into page.tsx.
```

---

## PROMPT P3.6 — Wire all overlays into page.tsx

```
Read CLAUDE.md, .claude/rules/testing.md, .claude/phases/3-orbital-and-panels.md,
and PROGRESS.md in that order. Confirm: current phase, last completed task, next task.
Do not write any code until you have confirmed.

---

You are wiring all the Phase 3 components into the main dashboard page. By the end
of this prompt, the app looks like Citadel: the orbital floats over the map, panels
open when metrics are clicked, the nav pill shows cities and layers, and the city
switch is animated.

Describe what you are about to change before writing any code:
- Update app/city/[id]/page.tsx to render all overlays over the Mapbox map

Wait for confirmation before writing.

---

UPDATE app/city/[id]/page.tsx:

The page already renders CityMap. Add the following overlays inside the outer div,
absolutely positioned over the map. All require snapshot to be non-null.

1. Navigation pill (always shown, snapshot optional for pulse scores):
   Create a NavBar component inline in page.tsx or in components/nav/NavBar.tsx.
   The pill is: position absolute, top: 16px, left: 50%, transform: translateX(-50%)
   Contents (left to right, gap: 16px):
     - "CITADEL" wordmark in Inter Black, amber, 14px, tracking-widest
     - <CitySelector currentCityId={cityId} onCityChange={handleCityChange} pulseScores={{}} />
     - <LayerToggle activeLayers={activeLayers} onLayerChange={setActiveLayers} />
     - <LiveDot /> + "Live" in 11px var(--tx-2)
     - "Ask" button: onClick={() => setChatOpen(true)}
     - <ThemeToggle />
   
   Pill styles: height 44px, borderRadius 22px, padding 0 16px
   background: var(--nav-bg), backdropFilter: blur(8px)
   border: 1px solid var(--panel-border)

2. Orbital overlay (only when snapshot is loaded):
   <OrbitalLayout snapshot={snapshot} onOpenPanel={setActivePanel} />

3. Active panel (switch on activePanel):
   {activePanel === 'weather' && (
     <WeatherPanel weather={snapshot.weather} onClose={() => setActivePanel(null)} />
   )}
   {activePanel === 'aq' && (
     <AQPanel airQuality={snapshot.airQuality} onClose={() => setActivePanel(null)} />
   )}
   {activePanel === 'transit' && (
     <TransitPanel transit={snapshot.transit} onClose={() => setActivePanel(null)} />
   )}
   {activePanel === 'events' && (
     <EventsPanel events={snapshot.events} onClose={() => setActivePanel(null)} />
   )}
   {activePanel === 'anomaly' && (
     <AnomalyPanel anomalies={snapshot.anomalies} onClose={() => setActivePanel(null)} />
   )}
   {activePanel === 'history' && (
     <HistoryPanel cityId={cityId} onClose={() => setActivePanel(null)} />
   )}

4. City switch animation:
   Add fading state (already defined).
   handleCityChange(newCityId):
     setFading(true)
     setTimeout(() => {
       router.push(`/city/${newCityId}`)
     }, 300)
   Apply to the orbital and panels container:
     opacity: fading ? 0 : 1, transition: 'opacity 300ms ease'

5. Escape handler (already partially there from P2.3 — update priority):
   if (activePanel) → setActivePanel(null)
   else if (chatOpen) → setChatOpen(false)

After writing, run:
  npm run dev
  Verify in browser:
    - Orbital rings and pulse score are visible over the map
    - Clicking each orbital node opens the correct panel from the correct edge
    - Escape closes the active panel
    - City selector dropdown opens with all four cities listed
    - City switch causes fade animation
  npm run type-check
  npm test

Update PROGRESS.md: mark P3.6 complete, next = P3.7 Phase 3 final checklist.
```

---

## PROMPT P3.7 — Phase 3 final checklist

```
Read CLAUDE.md, .claude/rules/testing.md, .claude/phases/3-orbital-and-panels.md,
and PROGRESS.md in that order. Confirm: current phase, last completed task, next task.
Do not write any code unless fixing a failing check.

---

This is the final checklist for Phase 3. Run each check and report the result.

---

1. npm run type-check — zero errors.

2. npm test — all tests pass.

3. npm run test:coverage — lines ≥ 78%, functions ≥ 78%, branches ≥ 72%.
   Update vitest.config.ts thresholds to these values for this phase.

4. npm run build — production build succeeds.

5. npm run dev — manual browser verification:
   - Orbital rings and core are visible centred over the map
   - Pulse score number and label display correctly
   - Click each orbital metric node → correct panel opens from the correct edge
   - Panels are glassy: dark, blurred background, amber border
   - Escape closes any open panel
   - Click outside an open panel closes it
   - Focus is trapped inside an open panel (Tab key cycles within the panel only)
   - Orbital metric nodes are keyboard focusable (Tab key reaches them)
   - Enter key on an orbital node opens its panel
   - Nav pill is visible at the top, pill-shaped, glassmorphism style
   - City selector dropdown shows all four cities
   - City selector closes on Escape and outside click
   - Layer toggle shows checkboxes for AQ, Events, Transit, Crowd
   - City switch (New York → Chicago): orbital fades out, map re-centres, orbital fades in
   - Orbital node float animation is visible and staggered (not synchronized)

6. npm audit — no high or critical vulnerabilities.

After all checks pass:
  Update PROGRESS.md:
    - Mark P3.7 complete
    - Change current phase to "Phase 4 — AI & Chat (not started)"

Proceed to PHASE4ROADMAP.md when ready.
```
