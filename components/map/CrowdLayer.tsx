import type { Map as MapboxMap, GeoJSONSource } from 'mapbox-gl'
import type { EventsData } from '@/lib/types'

const SOURCE_ID = 'crowd-density'
const LAYER_ID = 'crowd-fill'

const geoJsonCache = new Map<string, GeoJSON.FeatureCollection>()

function getBBox(feature: GeoJSON.Feature): [number, number, number, number] | null {
  if (!feature.geometry || feature.geometry.type !== 'Polygon') return null
  const coords = (feature.geometry as GeoJSON.Polygon).coordinates
  let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity
  for (const ring of coords) {
    for (const pos of ring) {
      const lng = pos[0]
      const lat = pos[1]
      if (lng < minLng) minLng = lng
      if (lat < minLat) minLat = lat
      if (lng > maxLng) maxLng = lng
      if (lat > maxLat) maxLat = lat
    }
  }
  return [minLng, minLat, maxLng, maxLat]
}

function computeCrowdScore(feature: GeoJSON.Feature, events: EventsData | null): number {
  if (!events || !events.tonight.length) return 0
  const bbox = getBBox(feature)
  if (!bbox) return 0
  const [minLng, minLat, maxLng, maxLat] = bbox
  const count = events.tonight.filter(
    e =>
      e.lat !== undefined &&
      e.lng !== undefined &&
      e.lat >= minLat &&
      e.lat <= maxLat &&
      e.lng !== undefined &&
      e.lng >= minLng &&
      e.lng <= maxLng
  ).length
  // Normalise to 0–1, treating 5+ events in a neighbourhood as maximum density
  return Math.min(count / 5, 1)
}

function applyGeojson(
  map: MapboxMap,
  base: GeoJSON.FeatureCollection,
  events: EventsData | null,
  visible: boolean
): void {
  const geojson: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: base.features.map(f => ({
      type: 'Feature' as const,
      geometry: f.geometry,
      properties: {
        ...(f.properties ?? {}),
        crowd_score: computeCrowdScore(f, events),
      },
    })),
  }

  if (map.getSource(SOURCE_ID)) {
    ;(map.getSource(SOURCE_ID) as GeoJSONSource).setData(geojson)
  } else {
    map.addSource(SOURCE_ID, { type: 'geojson', data: geojson })
    map.addLayer({
      id: LAYER_ID,
      type: 'fill',
      source: SOURCE_ID,
      paint: {
        'fill-color': '#E8A020',
        'fill-opacity': ['interpolate', ['linear'], ['get', 'crowd_score'], 0, 0, 1, 0.4],
      },
    })
  }

  map.setLayoutProperty(LAYER_ID, 'visibility', visible ? 'visible' : 'none')
}

export function updateCrowdLayer(
  map: MapboxMap,
  events: EventsData | null,
  cityId: string,
  visible: boolean
): void {
  const cached = geoJsonCache.get(cityId)
  if (cached) {
    applyGeojson(map, cached, events, visible)
    return
  }
  if (!cityId) return
  fetch(`/geojson/neighbourhoods/${cityId}.json`)
    .then(res => (res.ok ? (res.json() as Promise<GeoJSON.FeatureCollection>) : null))
    .then(data => {
      if (!data) return
      geoJsonCache.set(cityId, data)
      if (map.isStyleLoaded()) {
        applyGeojson(map, data, events, visible)
      }
    })
    .catch(() => {})
}
