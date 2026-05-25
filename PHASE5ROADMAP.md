# Phase 5 Roadmap — Map Layers

All prompts below are self-contained. Clear context between sessions and paste the next prompt fresh. Do not skip a prompt or combine two into one session.

---

## Status

```
P5.1  MapLayers manager + AQ heatmap     ○ Not started
P5.2  Event pins layer                   ○ Not started
P5.3  Transit lines + crowd density      ○ Not started
P5.4  Crime data real implementations    ○ Not started
P5.5  Wire layers into CityMap + toggle  ○ Not started
P5.6  Phase 5 final checklist            ○ Not started
```

---

## PROMPT P5.1 — MapLayers manager + AQ heatmap

```
Read CLAUDE.md, .claude/rules/testing.md, .claude/phases/5-map-layers.md, and
PROGRESS.md in that order. Confirm: current phase, last completed task, next task.
Do not write any code until you have confirmed.

---

You are building the Mapbox data layer system. MapLayers is the manager that adds
and updates layers on the map without unmounting them (using setData, not remount).
The AQ heatmap is the first layer — it renders OpenAQ station readings as an
interpolated heatmap with a green → amber → red color ramp.

Describe what you are about to create before writing any code:
- components/map/MapLayers.tsx — layer manager using Mapbox setData pattern
- components/map/AQLayer.tsx — heatmap layer from OpenAQ station readings

Wait for confirmation before writing.

---

KEY PRINCIPLE — never unmount/remount layers:
Mapbox layers must be added once and updated via getSource().setData(). Unmounting
causes a visible flash. The pattern for every layer is:
  if (map.getSource('source-id')) {
    (map.getSource('source-id') as GeoJSONSource).setData(newGeoJSON)
  } else {
    map.addSource('source-id', { type: 'geojson', data: newGeoJSON })
    map.addLayer(LAYER_CONFIG)
  }

FILES TO CREATE:

components/map/MapLayers.tsx ('use client'):
  Props:
    snapshot: CitySnapshot | null
    activeLayers: string[]
    mapRef: React.MutableRefObject<MapRef | null>

  This component renders nothing to the DOM. It uses the Mapbox map reference
  directly to add and update layers.

  useEffect([snapshot, activeLayers]):
    if (!mapRef.current) return
    const map = mapRef.current.getMap()
    
    Wait for map style to load if not already:
      if (!map.isStyleLoaded()) {
        map.once('style.load', () => updateLayers(map))
        return
      }
    updateLayers(map)
  
  updateLayers(map):
    Pass map to each sub-layer handler:
      updateAQLayer(map, snapshot?.airQuality ?? null, activeLayers.includes('air-quality'))
      (EventLayer, TransitLayer, CrowdLayer handlers added in subsequent prompts)
    
    For each layer: set visibility based on activeLayers:
      map.setLayoutProperty(layerId, 'visibility',
        activeLayers.includes(layerKey) ? 'visible' : 'none')

  Return null (renders nothing to DOM).

components/map/AQLayer.tsx — NOT a React component. Export a function:
  updateAQLayer(map: Map, airQuality: AirQualityData | null, visible: boolean): void
  
  Source ID: 'aq-stations'
  Layer ID: 'aq-heatmap'
  
  If airQuality is null or stations is empty:
    If source exists: update with empty FeatureCollection.
    Return.
  
  GeoJSON FeatureCollection:
    features = airQuality.stations.map(station => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [station.lng, station.lat] },
      properties: { aqi: station.aqi }
    }))
  
  Heatmap layer config:
    type: 'heatmap'
    paint:
      'heatmap-weight': ['interpolate', ['linear'], ['get', 'aqi'], 0, 0, 150, 1]
      'heatmap-intensity': 1
      'heatmap-radius': 40
      'heatmap-opacity': 0.4
      'heatmap-color': [
        'interpolate', ['linear'], ['heatmap-density'],
        0,   'rgba(74, 222, 128, 0)',   // transparent (no data)
        0.1, '#4ADE80',                  // green (AQI 0-50)
        0.5, '#E8A020',                  // amber (AQI 51-100)
        1.0, '#EF4444'                   // red (AQI 101+)
      ]
  
  Apply setData or addSource/addLayer pattern.
  Apply visibility: map.setLayoutProperty('aq-heatmap', 'visibility', visible ? 'visible' : 'none')

tests/components/MapLayers.test.tsx:
  Mock react-map-gl and the Mapbox map reference.
  it('renders null to the DOM (no visual output)')
  it('calls updateAQLayer when snapshot has air quality stations')
  it('does not throw when snapshot is null')

After writing, run:
  npm test
  npm run type-check

Update PROGRESS.md: mark P5.1 complete, next = P5.2 Event pins layer.
```

---

## PROMPT P5.2 — Event pins layer

```
Read CLAUDE.md, .claude/rules/testing.md, .claude/phases/5-map-layers.md, and
PROGRESS.md in that order. Confirm: current phase, last completed task, next task.
Do not write any code until you have confirmed.

---

You are building the event pins map layer. Events are shown as amber markers on the
map with clustering (nearby events group into a numbered circle at low zoom levels).
Clicking a cluster zooms to reveal individual pins. Clicking a pin shows a popup
with event details.

Describe what you are about to create before writing any code:
- components/map/EventLayer.tsx — event pins with clustering and popups

Wait for confirmation before writing.

---

FILES TO CREATE:

components/map/EventLayer.tsx — export function:
  updateEventLayer(map: Map, events: EventsData | null, visible: boolean): void
  
  Source ID: 'events'
  Layer IDs: 'event-clusters', 'event-cluster-count', 'event-points'
  
  GeoJSON from events.locations:
    features = events.locations.map(loc => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [loc.lng, loc.lat] },
      properties: { name: loc.name, time: loc.time, attendance: loc.attendance }
    }))
  
  Source config (add once):
    type: 'geojson', data: geojson,
    cluster: true, clusterMaxZoom: 14, clusterRadius: 50
  
  Three layers (add once, update data only):
  
  Layer 1 — clusters (circle for grouped events):
    id: 'event-clusters', type: 'circle', filter: ['has', 'point_count']
    paint:
      'circle-color': '#E8A020'
      'circle-radius': ['step', ['get', 'point_count'], 16, 5, 20, 20, 24]
      'circle-stroke-width': 2, 'circle-stroke-color': '#1A1200'
  
  Layer 2 — cluster count (number label on cluster):
    id: 'event-cluster-count', type: 'symbol', filter: ['has', 'point_count']
    layout:
      'text-field': '{point_count_abbreviated}'
      'text-size': 11
    paint: { 'text-color': '#1A1200' }
  
  Layer 3 — individual pins:
    id: 'event-points', type: 'circle', filter: ['!', ['has', 'point_count']]
    paint:
      'circle-color': '#E8A020', 'circle-radius': 6
      'circle-stroke-width': 2, 'circle-stroke-color': '#1A1200'
  
  Event handlers (add once, check for duplicate registration):
  
  Cluster click → zoom in:
    map.on('click', 'event-clusters', (e) => {
      const features = map.queryRenderedFeatures(e.point, { layers: ['event-clusters'] })
      const clusterId = features[0].properties?.cluster_id
      const source = map.getSource('events') as GeoJSONSource
      source.getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (!err) map.easeTo({ center: (features[0].geometry as Point).coordinates as LngLatLike, zoom })
      })
    })
  
  Pin click → popup:
    map.on('click', 'event-points', (e) => {
      const props = e.features?.[0]?.properties
      if (!props) return
      new Popup()
        .setLngLat((e.features![0].geometry as Point).coordinates as LngLatLike)
        .setHTML(`
          <div style="font-family:var(--font-inter);color:#F0EDE8;background:#141820;
                      padding:8px 12px;border-radius:8px;font-size:12px;">
            <strong>${props.name}</strong><br/>
            ${props.time}<br/>
            ${props.attendance > 0 ? `~${props.attendance.toLocaleString()} attendees` : ''}
          </div>
        `)
        .addTo(map)
    })
  
  Cursor change:
    map.on('mouseenter', 'event-clusters', () => { map.getCanvas().style.cursor = 'pointer' })
    map.on('mouseleave', 'event-clusters', () => { map.getCanvas().style.cursor = '' })
    map.on('mouseenter', 'event-points', () => { map.getCanvas().style.cursor = 'pointer' })
    map.on('mouseleave', 'event-points', () => { map.getCanvas().style.cursor = '' })
  
  Visibility:
    ['event-clusters', 'event-cluster-count', 'event-points'].forEach(id =>
      map.setLayoutProperty(id, 'visibility', visible ? 'visible' : 'none')
    )
  
  Add updateEventLayer to MapLayers.tsx's updateLayers function.

After writing, run:
  npm run type-check
  npm test
  npm run dev — manually verify event pins appear on the map for New York.
    (May need real data — Ticketmaster events in NYC are plentiful.)

Update PROGRESS.md: mark P5.2 complete, next = P5.3 Transit lines + crowd density.
```

---

## PROMPT P5.3 — Transit lines + crowd density

```
Read CLAUDE.md, .claude/rules/testing.md, .claude/phases/5-map-layers.md, and
PROGRESS.md in that order. Confirm: current phase, last completed task, next task.
Do not write any code until you have confirmed.

---

You are building the transit status layer (colored lines per delay status) and the
crowd density layer (semi-transparent fill on neighbourhood polygons). Both need
static GeoJSON geometry files stored in public/geojson/. The transit layer joins
live delay status to static line geometries.

Describe what you are about to create before writing any code:
- public/geojson/transit/new-york.json — NYC subway line geometries (simplified)
- public/geojson/transit/san-francisco.json, chicago.json, washington-dc.json
- public/geojson/neighbourhoods/ — one polygon file per city for crowd density
- components/map/TransitLayer.tsx — line layer with status-based colors
- components/map/CrowdLayer.tsx — fill layer on neighbourhood polygons

Wait for confirmation before writing.

---

ABOUT THE GEOJSON FILES:

Transit line geometries: These are simplified LineString features representing the
main transit corridors for each city. Create minimal but realistic GeoJSON with
at least 5 line features per city. Each feature needs properties:
  { "line_id": "1", "line_name": "1 Train", "color": "#EE352E" }

For NYC: include at least lines 1/2/3, 4/5/6, A/C/E, B/D/F/M, L, N/Q/R/W
  Use approximate coordinates along the actual corridors.
For SF: include at least lines N-Judah, K/L/M, T-Third, J-Church, and BART
For Chicago: include at least Red, Blue, Brown, Green, Orange, Purple lines
For DC: include at least Red, Blue, Orange, Silver, Green, Yellow lines

Neighbourhood polygons: Simplified polygon GeoJSON for 8-12 major neighbourhoods
per city. Each feature: { "name": "Lower East Side", "city": "new-york" }
Use approximate bounding polygons — they don't need to be precise.

FILES TO CREATE:

public/geojson/transit/new-york.json — GeoJSON FeatureCollection (LineStrings)
public/geojson/transit/san-francisco.json
public/geojson/transit/chicago.json
public/geojson/transit/washington-dc.json
public/geojson/neighbourhoods/new-york.json — GeoJSON FeatureCollection (Polygons)
public/geojson/neighbourhoods/san-francisco.json
public/geojson/neighbourhoods/chicago.json
public/geojson/neighbourhoods/washington-dc.json

components/map/TransitLayer.tsx — export function:
  updateTransitLayer(map: Map, transit: TransitData | null, cityId: string, visible: boolean): void
  
  Fetch transit GeoJSON from /geojson/transit/{cityId}.json (fetch once, cache in module scope).
  Join delay status to features:
    For each feature, check if feature.properties.line_id is in transit.delays.
    Add property 'status': 'delayed' | 'suspended' | 'normal'
  
  Line layer config:
    type: 'line'
    paint:
      'line-color': ['match', ['get', 'status'],
        'normal', '#4ADE80',
        'delayed', '#E8A020',
        'suspended', '#EF4444',
        '#4ADE80'
      ]
      'line-width': 2
    
    Hover state (use feature state, not separate layer):
      map.on('mouseenter', 'transit-lines', () => { map.getCanvas().style.cursor = 'pointer' })
      On hover: increase line width to 3px via setPaintProperty or feature state.

components/map/CrowdLayer.tsx — export function:
  updateCrowdLayer(map: Map, events: EventsData | null, cityId: string, visible: boolean): void
  
  Fetch neighbourhood GeoJSON from /geojson/neighbourhoods/{cityId}.json.
  Compute crowd score per neighbourhood:
    For each neighbourhood polygon, count events within 500m (approximate with bounding box).
    crowdScore = eventCount / maxPossibleEvents (clamped 0-1)
    Add property 'crowd_score': crowdScore to each feature.
  
  Fill layer config:
    type: 'fill'
    paint:
      'fill-color': '#E8A020'
      'fill-opacity': ['interpolate', ['linear'], ['get', 'crowd_score'], 0, 0, 1, 0.4]
  
  Add a legend label visible in the UI:
    In MapLayers.tsx (or in the LayerToggle) when crowd layer is active, show
    a small "Crowd density (estimated)" label at the bottom of the map.
    position: absolute, bottom: 40px, right: 16px, fontSize: 9px, color: var(--tx-3)
  
  Add updateTransitLayer and updateCrowdLayer to MapLayers.tsx's updateLayers function.

After writing, run:
  npm run type-check
  npm test
  npm run dev — verify transit lines appear on the NYC map in their correct colors.

Update PROGRESS.md: mark P5.3 complete, next = P5.4 Crime data real implementations.
```

---

## PROMPT P5.4 — Crime data real implementations

```
Read CLAUDE.md, .claude/rules/testing.md, .claude/phases/5-map-layers.md, and
PROGRESS.md in that order. Confirm: current phase, last completed task, next task.
Do not write any code until you have confirmed.

---

You are replacing the Phase 1 crime data stub with real implementations. All four
cities use Socrata open-data APIs (no API key required). The data is used to
compute a neighbourhood crime index that feeds into the crowd density and risk
context. The CitySnapshot type needs a crime field added.

Describe what you are about to create before writing any code:
- lib/types.ts update — add CrimeData interface and crime field to CitySnapshot
- lib/data/crime.ts — real per-city Socrata API implementations
- lib/data/fallbacks.ts update — CRIME_FALLBACK now typed
- tests/lib/data/crime.test.ts — 3 tests

Wait for confirmation before writing.

---

FILES TO UPDATE/CREATE:

lib/types.ts — add:
  interface CrimeData {
    totalIncidents: number
    recentIncidents: {
      lat: number
      lng: number
      category: string
      date: string
    }[]
    safetyScore: number  // 0-100, higher is safer (inverted from crime rate)
  }

  Add to CitySnapshot:
    crime: CrimeData

  Update CrimeProvider type if needed.

lib/data/fallbacks.ts — update CRIME_FALLBACK to typed CrimeData:
  CRIME_FALLBACK: CrimeData = {
    totalIncidents: 0, recentIncidents: [], safetyScore: 50
  }

lib/data/crime.ts — replace the stub with real implementations:

  Socrata API base URLs:
    NYC:   https://data.cityofnewyork.us/resource/5uac-w243.json  (NYPD Complaint Data Current)
    SF:    https://data.sfgov.org/resource/wg3w-h783.json         (SF Police Incident Reports)
    Chicago: https://data.cityofchicago.org/resource/ijzp-q8t2.json (Chicago Crimes)
    DC:    https://opendata.dc.gov/datasets/dc-crimes-data/explore (DC Crime incidents)

  Query for each: incidents from last 30 days, limit 500, select lat, lng, category, date.
  Use $where clause for date filtering and $limit=500.
  No API key needed — Socrata allows anonymous read up to ~1000 req/day.

  fetchCrimeData(city: City): Promise<CrimeData>
    Route by city.crime.provider:
      'nyc-open-data' → fetchNycCrime()
      'datasf'        → fetchSfCrime()
      'chicago-data-portal' → fetchChicagoCrime()
      'dc-open-data'  → fetchDcCrime()
    
    Each fetcher:
      Fetch the Socrata endpoint with 30-day filter.
      Parse to CrimeData: count incidents, build recentIncidents array.
      Compute safetyScore: 100 - Math.min(100, (totalIncidents / 500) * 100)
        (500 incidents in 30 days = safety score 0 — adjust scale per city if needed)
      Return CRIME_FALLBACK on any error.

  Update the snapshot route (app/api/city/[id]/snapshot/route.ts) to include
  crime data in the assembled CitySnapshot.

tests/lib/data/crime.test.ts — 3 tests:
  it('routes to NYC Open Data for city new-york')
  it('parses Socrata response into CrimeData shape with correct safetyScore')
  it('returns CRIME_FALLBACK on fetch failure')

After writing, run:
  npm test
  npm run type-check

Update PROGRESS.md: mark P5.4 complete, next = P5.5 Wire layers into CityMap + toggle.
```

---

## PROMPT P5.5 — Wire layers into CityMap + layer toggle integration

```
Read CLAUDE.md, .claude/rules/testing.md, .claude/phases/5-map-layers.md, and
PROGRESS.md in that order. Confirm: current phase, last completed task, next task.
Do not write any code until you have confirmed.

---

You are wiring the MapLayers component into CityMap so that all four data layers
render on the live map. You also ensure the LayerToggle correctly hides and shows
each layer. This is the final integration step that makes the map fully alive.

Describe what you are about to change before writing any code:
- Update components/map/CityMap.tsx to render MapLayers and expose mapRef
- Verify LayerToggle → activeLayers → CityMap → MapLayers pipeline

Wait for confirmation before writing.

---

UPDATE components/map/CityMap.tsx:

  Add mapRef to the component (already exists from P2.4). Pass it to Map:
    <Map ref={mapRef} ...>

  Import and render MapLayers inside the Map:
    <Map ...>
      <MapLayers
        snapshot={snapshot}
        activeLayers={activeLayers}
        mapRef={mapRef}
      />
    </Map>
  
  When city changes (different city.id), the map should fly to the new location:
    useEffect([city.id]):
      if (mapRef.current) {
        mapRef.current.flyTo({
          center: [city.lng, city.lat],
          zoom: city.mapZoom,
          duration: 1500,
          essential: true
        })
      }
  
  When theme changes between dark/light, swap the map style:
    import { useTheme } from 'next-themes'
    const { theme } = useTheme()
    useEffect([theme]):
      if (mapRef.current) {
        const map = mapRef.current.getMap()
        const newStyle = theme === 'dark' ? city.mapStyle : 'mapbox://styles/mapbox/light-v11'
        map.setStyle(newStyle)
      }

VERIFY the full data flow pipeline:
  User clicks LayerToggle checkbox for "Air Quality"
    → onLayerChange called → setActiveLayers in page.tsx updated
    → activeLayers prop flows to CityMap → to MapLayers
    → MapLayers calls map.setLayoutProperty('aq-heatmap', 'visibility', 'none')
    → heatmap disappears from map

  Confirm this works for all four layers by testing manually in browser.

After writing, run:
  npm run dev and verify:
    - AQ heatmap visible on the map (faint colored areas)
    - Event pins visible as amber dots
    - Transit lines visible (colored by status)
    - Crowd density fill visible on neighbourhood areas
    - Each layer toggles off/on cleanly via LayerToggle
    - Map style switches when dark/light mode toggled
    - City switch re-centres map with flyTo animation
    - Data refresh (after 5 min) updates layers without map flash
  npm test
  npm run type-check

Update PROGRESS.md: mark P5.5 complete, next = P5.6 Phase 5 final checklist.
```

---

## PROMPT P5.6 — Phase 5 final checklist

```
Read CLAUDE.md, .claude/rules/testing.md, .claude/phases/5-map-layers.md, and
PROGRESS.md in that order. Confirm: current phase, last completed task, next task.
Do not write any code unless fixing a failing check.

---

This is the final checklist for Phase 5. Run each check and report the result.

---

1. npm run type-check — zero errors.

2. npm test — all tests pass.

3. npm run test:coverage — lines ≥ 82%, functions ≥ 82%, branches ≥ 77%.
   Update vitest.config.ts thresholds to these values.

4. npm run build — production build succeeds.

5. npm run dev — manual browser verification for all four layers:
   - AQ heatmap: colored areas visible over the city at 0.4 opacity
   - AQ heatmap: color ramp correct (green → amber → red by AQI)
   - Event pins: amber markers at correct locations
   - Event pins: cluster circles appear when multiple events are nearby at low zoom
   - Event pins: clicking a cluster zooms to reveal individual pins
   - Event pins: clicking a pin shows popup with name, time, venue, attendance
   - Transit lines: visible on the map as colored corridors
   - Transit lines: delayed lines are amber, suspended are red, normal are green
   - Crowd density: neighbourhood fill visible at appropriate opacity (0-0.4)
   - "Crowd density (estimated)" label visible when crowd layer is active
   - Layer toggle: each checkbox correctly hides/shows its layer
   - Map style switch: dark mode → light mode → map tiles change style
   - City switch: flyTo animation re-centres the map smoothly
   - Data poll: after 5 minutes, map layer data updates without map remount

6. Crime data verification:
   curl http://localhost:3000/api/city/new-york/snapshot | jq '.crime'
   Expected: { totalIncidents: N, safetyScore: N, recentIncidents: [...] }
   Not the fallback { totalIncidents: 0, safetyScore: 50, recentIncidents: [] }

7. npm audit — no high or critical vulnerabilities.

After all checks pass:
  Update PROGRESS.md:
    - Mark P5.6 complete
    - Change current phase to "Phase 6 — Polish & Deploy (not started)"

Proceed to PHASE6ROADMAP.md when ready.
```
