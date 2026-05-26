import type { Map as MapboxMap, GeoJSONSource } from 'mapbox-gl'
import type { AirQualityData } from '@/lib/types'

const SOURCE_ID = 'aq-stations'
const LAYER_ID = 'aq-heatmap'

export function updateAQLayer(
  map: MapboxMap,
  airQuality: AirQualityData | null,
  visible: boolean
): void {
  const geojson: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features:
      airQuality && airQuality.stations.length > 0
        ? airQuality.stations.map(station => ({
            type: 'Feature' as const,
            geometry: { type: 'Point' as const, coordinates: [station.lng, station.lat] },
            properties: { aqi: station.aqi },
          }))
        : [],
  }

  if (map.getSource(SOURCE_ID)) {
    ;(map.getSource(SOURCE_ID) as GeoJSONSource).setData(geojson)
  } else {
    map.addSource(SOURCE_ID, { type: 'geojson', data: geojson })
    map.addLayer({
      id: LAYER_ID,
      type: 'heatmap',
      source: SOURCE_ID,
      paint: {
        'heatmap-weight': ['interpolate', ['linear'], ['get', 'aqi'], 0, 0, 150, 1],
        'heatmap-intensity': 1,
        'heatmap-radius': 40,
        'heatmap-opacity': 0.4,
        'heatmap-color': [
          'interpolate',
          ['linear'],
          ['heatmap-density'],
          0,
          'rgba(74, 222, 128, 0)',
          0.1,
          '#4ADE80',
          0.5,
          '#E8A020',
          1.0,
          '#EF4444',
        ],
      },
    })
  }

  map.setLayoutProperty(LAYER_ID, 'visibility', visible ? 'visible' : 'none')
}
