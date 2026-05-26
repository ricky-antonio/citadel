import type { Map as MapboxMap, GeoJSONSource } from 'mapbox-gl'
import type { TransitData } from '@/lib/types'

const SOURCE_ID = 'transit-lines'
const LAYER_ID = 'transit-lines'

const geoJsonCache = new Map<string, GeoJSON.FeatureCollection>()
const registeredMaps = new WeakSet<MapboxMap>()
// Per-map hover tracking — avoids module-level state when multiple maps exist
const hoveredIds = new WeakMap<MapboxMap, string | number | undefined>()

function getLineStatus(
  lineId: string,
  transit: TransitData | null
): 'normal' | 'delayed' | 'suspended' {
  if (!transit) return 'normal'
  // WMATA uses "RD, BL" (comma-separated); MTA/SF use "A" or "A, C"; CTA uses "Red Line"
  const alerts = transit.alerts.filter(a =>
    a.line === lineId ||
    a.line.split(',').map(s => s.trim()).includes(lineId)
  )
  if (!alerts.length) return 'normal'
  return alerts.some(a => a.severity === 'major') ? 'suspended' : 'delayed'
}

function applyGeojson(
  map: MapboxMap,
  base: GeoJSON.FeatureCollection,
  transit: TransitData | null,
  visible: boolean
): void {
  const geojson: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: base.features.map(f => ({
      type: 'Feature' as const,
      geometry: f.geometry,
      properties: {
        ...(f.properties ?? {}),
        status: getLineStatus((f.properties?.line_id as string | undefined) ?? '', transit),
      },
    })),
  }

  if (map.getSource(SOURCE_ID)) {
    ;(map.getSource(SOURCE_ID) as GeoJSONSource).setData(geojson)
  } else {
    map.addSource(SOURCE_ID, { type: 'geojson', data: geojson, generateId: true })
    map.addLayer({
      id: LAYER_ID,
      type: 'line',
      source: SOURCE_ID,
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': [
          'match',
          ['get', 'status'],
          'normal', '#4ADE80',
          'delayed', '#E8A020',
          'suspended', '#EF4444',
          '#4ADE80',
        ],
        'line-width': [
          'case',
          ['boolean', ['feature-state', 'hover'], false],
          3,
          2,
        ],
      },
    })
  }

  if (!registeredMaps.has(map)) {
    registeredMaps.add(map)
    hoveredIds.set(map, undefined)

    map.on('mouseenter', LAYER_ID, () => {
      map.getCanvas().style.cursor = 'pointer'
    })

    map.on('mousemove', LAYER_ID, e => {
      const prev = hoveredIds.get(map)
      if (prev !== undefined) {
        map.setFeatureState({ source: SOURCE_ID, id: prev }, { hover: false })
      }
      const id = e.features?.[0]?.id
      hoveredIds.set(map, id)
      if (id !== undefined) {
        map.setFeatureState({ source: SOURCE_ID, id }, { hover: true })
      }
    })

    map.on('mouseleave', LAYER_ID, () => {
      const prev = hoveredIds.get(map)
      if (prev !== undefined) {
        map.setFeatureState({ source: SOURCE_ID, id: prev }, { hover: false })
      }
      hoveredIds.set(map, undefined)
      map.getCanvas().style.cursor = ''
    })
  }

  map.setLayoutProperty(LAYER_ID, 'visibility', visible ? 'visible' : 'none')
}

export function updateTransitLayer(
  map: MapboxMap,
  transit: TransitData | null,
  cityId: string,
  visible: boolean
): void {
  const cached = geoJsonCache.get(cityId)
  if (cached) {
    applyGeojson(map, cached, transit, visible)
    return
  }
  if (!cityId) return
  fetch(`/geojson/transit/${cityId}.json`)
    .then(res => (res.ok ? (res.json() as Promise<GeoJSON.FeatureCollection>) : null))
    .then(data => {
      if (!data) return
      geoJsonCache.set(cityId, data)
      if (map.isStyleLoaded()) {
        applyGeojson(map, data, transit, visible)
      }
    })
    .catch(() => {})
}
