import type { Map as MapboxMap, GeoJSONSource, LngLatLike } from 'mapbox-gl'
import { Popup } from 'mapbox-gl'
import type { CrimeData } from '@/lib/types'

const SOURCE_ID = 'crime-incidents'
const LAYER_CLUSTERS = 'crime-clusters'
const LAYER_CLUSTER_COUNT = 'crime-cluster-count'
const LAYER_POINTS = 'crime-points'

const registeredMaps = new WeakSet<MapboxMap>()

export function updateCrimeLayer(
  map: MapboxMap,
  crime: CrimeData | null,
  visible: boolean
): void {
  const incidents = crime?.recentIncidents ?? []

  const geojson: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: incidents.map(inc => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [inc.lng, inc.lat] },
      properties: { category: inc.category, date: inc.date },
    })),
  }

  if (map.getSource(SOURCE_ID)) {
    ;(map.getSource(SOURCE_ID) as GeoJSONSource).setData(geojson)
  } else {
    map.addSource(SOURCE_ID, {
      type: 'geojson',
      data: geojson,
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 40,
    })

    map.addLayer({
      id: LAYER_CLUSTERS,
      type: 'circle',
      source: SOURCE_ID,
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': '#EF4444',
        'circle-radius': ['step', ['get', 'point_count'], 12, 10, 16, 50, 20],
        'circle-stroke-width': 1,
        'circle-stroke-color': '#1A1200',
        'circle-opacity': 0.75,
      },
    })

    map.addLayer({
      id: LAYER_CLUSTER_COUNT,
      type: 'symbol',
      source: SOURCE_ID,
      filter: ['has', 'point_count'],
      layout: {
        'text-field': '{point_count_abbreviated}',
        'text-size': 10,
      },
      paint: {
        'text-color': '#ffffff',
      },
    })

    map.addLayer({
      id: LAYER_POINTS,
      type: 'circle',
      source: SOURCE_ID,
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': '#EF4444',
        'circle-radius': 4,
        'circle-stroke-width': 1,
        'circle-stroke-color': '#1A1200',
        'circle-opacity': 0.65,
      },
    })
  }

  if (!registeredMaps.has(map)) {
    registeredMaps.add(map)

    map.on('click', LAYER_CLUSTERS, e => {
      const features = map.queryRenderedFeatures(e.point, { layers: [LAYER_CLUSTERS] })
      if (!features.length) return
      const clusterId = features[0].properties?.cluster_id as number | undefined
      if (clusterId === undefined) return
      const source = map.getSource(SOURCE_ID) as GeoJSONSource
      source.getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (err || zoom === null || zoom === undefined) return
        map.easeTo({
          center: (features[0].geometry as unknown as GeoJSON.Point).coordinates as LngLatLike,
          zoom,
        })
      })
    })

    map.on('click', LAYER_POINTS, e => {
      const props = e.features?.[0]?.properties
      if (!props) return
      const coords = (e.features![0].geometry as unknown as GeoJSON.Point).coordinates as LngLatLike
      new Popup()
        .setLngLat(coords)
        .setHTML(
          `<div style="font-family:var(--font-inter);color:#F0EDE8;background:#141820;` +
            `padding:8px 12px;border-radius:8px;font-size:12px;">` +
            `<strong style="text-transform:capitalize">${(props.category as string).toLowerCase()}</strong>` +
            `<br/><span style="color:#9CA3AF">${props.date as string}</span>` +
            `</div>`
        )
        .addTo(map)
    })

    map.on('mouseenter', LAYER_CLUSTERS, () => { map.getCanvas().style.cursor = 'pointer' })
    map.on('mouseleave', LAYER_CLUSTERS, () => { map.getCanvas().style.cursor = '' })
    map.on('mouseenter', LAYER_POINTS,   () => { map.getCanvas().style.cursor = 'pointer' })
    map.on('mouseleave', LAYER_POINTS,   () => { map.getCanvas().style.cursor = '' })
  }

  ;[LAYER_CLUSTERS, LAYER_CLUSTER_COUNT, LAYER_POINTS].forEach(id =>
    map.setLayoutProperty(id, 'visibility', visible ? 'visible' : 'none')
  )
}
