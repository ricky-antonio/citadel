# Phase 5 — Map Layers

**Complete this phase entirely before starting Phase 6.**

Phase 4 completed the AI layer. Phase 5 brings the map alive: data layers render over the city, each reflecting live conditions. The air quality heatmap, event pins with clustering, transit line status, and crowd density fill all render as Mapbox layers that update without unmounting.

Also in this phase: the real crime data fetchers (replacing the Phase 1 stubs), and any additional map-layer related API routes.

---

## What to build

### Map layer components
- [ ] `components/map/MapLayers.tsx` — layer manager: renders all active layers based on `activeLayers[]` prop, handles `getSource().setData()` updates
- [ ] `components/map/AQLayer.tsx` — Mapbox `heatmap` layer from OpenAQ station readings, color ramp green→amber→red, 0.4 opacity
- [ ] `components/map/EventLayer.tsx` — Mapbox `symbol` layer with amber markers, 50px clustering, click cluster to zoom, click pin for popup
- [ ] `components/map/TransitLayer.tsx` — Mapbox `line` layer, color by status (green/amber/red), 2px normal / 3px hover
- [ ] `components/map/CrowdLayer.tsx` — Mapbox `fill` layer on neighbourhood polygons, derived from event proximity + time + capacity, amber fill at 0-0.4 opacity, labeled "estimated"

### Crime data (real implementation)
- [ ] `lib/data/crime.ts` — replace the Phase 1 stub with real open-data API implementations:
  - New York: NYC Open Data (Socrata API, no key)
  - San Francisco: DataSF (Socrata API, no key)
  - Chicago: Chicago Data Portal (Socrata API, no key)
  - Washington DC: DC Open Data (Socrata API, no key)
- [ ] `tests/lib/data/crime.test.ts`

### GeoJSON data files
- [ ] `public/geojson/` — neighbourhood polygon GeoJSON files for the crowd density layer (one per city)
- [ ] `public/geojson/transit/` — transit line geometry GeoJSON files (one per city) for the `TransitLayer`

Note: GeoJSON files are static data that do not change often. They can be sourced from OpenStreetMap, city open-data portals, or Mapbox datasets. The transit line geometries for the layer should match the transit providers' line IDs so that delay status can be joined.

---

## Key flows to implement

### Air quality heatmap
```
AQLayer receives snapshot.airQuality.stations: [{lat, lng, aqi}]
  → Convert to GeoJSON FeatureCollection:
    {
      type: 'FeatureCollection',
      features: stations.map(s => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [s.lng, s.lat] },
        properties: { aqi: s.aqi }
      }))
    }
  → if source 'aq-heat' exists: getSource('aq-heat').setData(geojson)
  → else: addSource + addLayer with heatmap config
  → Color ramp using 'heatmap-color' expression:
      AQI 0-50:   #4ADE80 (green)
      AQI 51-100: #E8A020 (amber)
      AQI 101+:   #EF4444 (red)
```

### Event pins with clustering
```
EventLayer receives snapshot.events.locations: [{lat, lng, name, time, attendance}]
  → GeoJSON FeatureCollection with event properties
  → Source: cluster: true, clusterMaxZoom: 14, clusterRadius: 50
  → Layer 1: 'clusters' — circle layer for cluster counts
  → Layer 2: 'cluster-count' — symbol layer with count label
  → Layer 3: 'unclustered-point' — amber marker for individual events
  → map.on('click', 'clusters', ...) — zoom in to cluster bbox
  → map.on('click', 'unclustered-point', ...) — show popup with event details
```

### Transit lines
```
TransitLayer receives snapshot.transit.lines: [{id, name, status, color}]
  → GeoJSON lines from public/geojson/transit/new-york.json
  → Join status to each line feature by line.id
  → setData on update (no remount)
  → Line paint:
      'line-color': ['match', ['get', 'status'],
        'normal', '#4ADE80',
        'delayed', '#E8A020',
        'suspended', '#EF4444',
        '#4ADE80'
      ]
  → 'line-width': 2, hover: 3 via feature state
```

### Layer visibility toggle
```
LayerToggle checkbox for 'air-quality':
  → setActiveLayers(prev => prev.includes('air-quality')
      ? prev.filter(l => l !== 'air-quality')
      : [...prev, 'air-quality'])
  → page.tsx passes activeLayers to CityMap
  → CityMap passes to MapLayers
  → MapLayers: map.setLayoutProperty(layerId, 'visibility',
      activeLayers.includes('air-quality') ? 'visible' : 'none')
```

---

## Tests to write

### `tests/lib/data/crime.test.ts`
```
it('fetchCrimeData for new-york calls NYC Open Data Socrata API')
it('parses response into correct shape')
it('returns CRIME_FALLBACK on fetch failure')
it('fetchCrimeData routes to correct provider per city')
```

### `tests/components/MapLayers.test.tsx`
Note: These test the data transformation logic, not the Mapbox rendering (which is mocked).
```
it('renders without error when snapshot has no event locations')
it('renders without error when transit.lines is empty')
it('renders without error when airQuality.stations is empty')
```

---

## Manual verification checklist

Before marking Phase 5 complete:

- [ ] Air quality heatmap is visible on the map (faint green/amber areas over the city)
- [ ] Heatmap opacity is 0.4 — visible but not dominating the map
- [ ] Event pins appear as amber markers at correct locations
- [ ] Multiple nearby events are clustered into a numbered circle
- [ ] Clicking a cluster zooms into it to reveal individual pins
- [ ] Clicking an event pin shows a popup with name, time, venue, expected attendance
- [ ] Transit lines are visible on the map as coloured lines
- [ ] Delayed lines render in amber, suspended lines in red, normal in green
- [ ] Crowd density fill is visible over neighbourhood polygons at appropriate opacity
- [ ] "Estimated" label/legend is present for the crowd layer
- [ ] Layer toggle correctly hides/shows each layer (AQ, Events, Transit, Crowd)
- [ ] Data layers update on the 5-minute poll without any map remount or flash
- [ ] Crime data `fetchCrimeData` returns real data for New York (not the fallback stub)
- [ ] `npm run type-check` — zero errors
- [ ] `npm test` — all tests pass
- [ ] `npm run test:coverage` — lines ≥ 82%, functions ≥ 82%, branches ≥ 77%
- [ ] `npm run build` — production build succeeds
- [ ] `npm audit` — no high or critical vulnerabilities

---

## Coverage target after this phase
Lines ≥ 82% · Functions ≥ 82% · Branches ≥ 77%
