# Phase 3 — Orbital & Panels

**Complete this phase entirely before starting Phase 4.**

Phase 2 produced a working map. Phase 3 builds everything that floats over the map: the orbital SVG pulse UI at the centre, the floating glass data panels, and the navigation pill. By the end of this phase the app looks like Citadel — data is visible, panels open and close, the city selector works.

---

## What to build

### Orbital system
- [ ] `components/orbital/OrbitalCore.tsx` — SVG: three concentric rings, 72px core circle with pulse score and label
- [ ] `components/orbital/OrbitalMetric.tsx` — single metric node: coloured dot + value + label, float animation, keyboard-focusable
- [ ] `components/orbital/OrbitalLayout.tsx` — positions four `OrbitalMetric` nodes at N/E/S/W of the core, absolutely positioned over the map centre
- [ ] `tests/components/OrbitalCore.test.tsx`
- [ ] `tests/components/OrbitalLayout.test.tsx`

### Floating panels
- [ ] `components/panels/PanelBase.tsx` — glass panel base: blur, border, border-radius, slide-in animation, close on Escape and outside click
- [ ] `components/panels/WeatherPanel.tsx` — temp, condition, wind, humidity, UV, hourly forecast strip
- [ ] `components/panels/AQPanel.tsx` — AQI value and category, PM2.5, NO2, ozone breakdown
- [ ] `components/panels/TransitPanel.tsx` — delay count, affected lines with severity badges
- [ ] `components/panels/EventsPanel.tsx` — tonight's major events list (name, time, venue, attendance)
- [ ] `components/panels/AnomalyPanel.tsx` — recent anomaly log with metric, deviation, AI description
- [ ] `components/panels/HistoryPanel.tsx` — pulse score line chart for last 7 days (virtualized if > 168 points)
- [ ] `tests/components/PanelBase.test.tsx`

### Navigation pill
- [ ] `components/nav/CitySelector.tsx` — dropdown showing all four cities with live pulse scores, closes on outside click and Escape
- [ ] `components/nav/LayerToggle.tsx` — checkboxes for AQ/Events/Transit/Crowd layers
- [ ] `components/shared/PulseScore.tsx` — pulse score badge (number + label + semantic color)
- [ ] `components/shared/MetricBadge.tsx` — generic metric pill (label + value + unit)

### Wire into page
- [ ] Update `app/city/[id]/page.tsx`:
  - Render `<OrbitalLayout>` over the map
  - Track `activePanel` state
  - Render the active panel (switch on `activePanel`)
  - Render the nav pill (absolute, top 16px, centred)
  - Pass `onLayerChange` to `LayerToggle` and `activeLayers` to `CityMap`

---

## Key flows to implement

### Orbital → panel open
```
User clicks/activates OrbitalMetric for 'weather'
  → OrbitalMetric calls onOpen('weather')
  → page.tsx setActivePanel('weather')
  → WeatherPanel renders with slide-in animation
  → Focus trapped inside panel (react-focus-trap)
  → Escape or outside click → setActivePanel(null) → panel slides out
```

### City selector
```
User clicks city selector in nav pill
  → dropdown opens, showing all four cities
  → each city shows name + current pulse score (from snapshot or 'loading')
  → user clicks a city
  → setFading(true) → 300ms opacity fade
  → router.push('/city/new-city-id')
  → new page mounts, fetches new snapshot
```

### Orbital ring layout (SVG)
The orbital is absolutely positioned at the centre of the viewport:
```tsx
<div style={{
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  zIndex: 'var(--z-orbital)',
}}>
  <svg width="280" height="280" viewBox="0 0 280 280">
    {/* Outer ring 280px */}
    <circle cx="140" cy="140" r="139" fill="none" stroke="rgba(232,160,32,0.12)" strokeWidth="1" />
    {/* Middle ring 200px */}
    <circle cx="140" cy="140" r="99" fill="none" stroke="rgba(232,160,32,0.18)" strokeWidth="1" />
    {/* Inner ring 120px */}
    <circle cx="140" cy="140" r="59" fill="none" stroke="rgba(232,160,32,0.25)" strokeWidth="1" />
    {/* Core */}
    <circle cx="140" cy="140" r="36" fill="#1A1200" stroke="#E8A020" strokeWidth="2" />
    <text x="140" y="136" textAnchor="middle" fontSize="22" fontWeight="800" fill="#E8A020">
      {pulseScore}
    </text>
    <text x="140" y="148" textAnchor="middle" fontSize="9" fontWeight="700" fill="#7A4400" letterSpacing="1">
      {pulseLabel.toUpperCase()}
    </text>
  </svg>
  {/* Metric nodes positioned at cardinal points */}
  <OrbitalMetric metric="weather" ... style={{ position: 'absolute', top: '-24px', left: '50%', transform: 'translateX(-50%)' }} />
  <OrbitalMetric metric="aq"      ... style={{ position: 'absolute', top: '50%', right: '-80px', transform: 'translateY(-50%)' }} />
  <OrbitalMetric metric="transit" ... style={{ position: 'absolute', bottom: '-24px', left: '50%', transform: 'translateX(-50%)' }} />
  <OrbitalMetric metric="events"  ... style={{ position: 'absolute', top: '50%', left: '-80px', transform: 'translateY(-50%)' }} />
</div>
```

### Orbital node float animation (CSS)
```css
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-3px); }
}

.node-weather { animation: float 4s ease-in-out infinite; animation-delay: 0s; }
.node-aq      { animation: float 4s ease-in-out infinite; animation-delay: 1s; }
.node-transit { animation: float 4s ease-in-out infinite; animation-delay: 2s; }
.node-events  { animation: float 4s ease-in-out infinite; animation-delay: 3s; }
```

---

## Tests to write

### `tests/components/OrbitalCore.test.tsx`
```
it('renders the pulse score number')
it('renders the pulse label text')
it('applies correct aria-label to the pulse region')
it('renders three SVG ring circles')
```

### `tests/components/OrbitalLayout.test.tsx`
```
it('renders a weather metric node')
it('renders an AQI metric node')
it('renders a transit metric node')
it('renders an events metric node')
it('calls onOpen with correct panel ID when weather node is activated')
it('calls onOpen with correct panel ID when AQI node is activated')
it('metric nodes are keyboard focusable (tabIndex=0)')
it('Enter key on a node calls onOpen')
```

### `tests/components/PanelBase.test.tsx`
```
it('renders children inside the panel')
it('calls onClose when Escape key is pressed')
it('has role="dialog" and aria-label')
it('applies slide-in animation class on mount')
```

---

## Manual verification checklist

Before marking Phase 3 complete:

- [ ] Orbital rings and core are visible centred over the map
- [ ] Pulse score number and label display correctly for New York (initial load)
- [ ] Clicking each orbital metric node opens the correct panel
- [ ] Each panel slides in from the correct edge (weather from top-left, AQI from top-right, etc.)
- [ ] Escape closes any open panel
- [ ] Clicking outside an open panel closes it
- [ ] Focus is trapped inside each open panel (Tab cycles through panel controls only)
- [ ] Orbital metric nodes are focusable with Tab and activatable with Enter
- [ ] Nav pill is visible at the top, pill-shaped, glassmorphism style
- [ ] City selector dropdown opens and shows all four cities with pulse scores
- [ ] City selector closes on Escape and outside click
- [ ] Layer toggle shows checkboxes for AQ, Events, Transit, Crowd
- [ ] Orbital node float animation is visible and staggered (nodes don't move in sync)
- [ ] City switch (New York → Chicago) fades out and in over ~600ms total
- [ ] `npm run type-check` — zero errors
- [ ] `npm test` — all tests pass
- [ ] `npm run build` — production build succeeds

---

## Coverage target after this phase
Lines ≥ 78% · Functions ≥ 78% · Branches ≥ 72%
