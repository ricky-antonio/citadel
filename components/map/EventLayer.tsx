import type { Map as MapboxMap, GeoJSONSource, LngLatLike } from 'mapbox-gl'
import { Popup } from 'mapbox-gl'
import type { EventsData } from '@/lib/types'

function formatEventTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  } catch {
    return iso
  }
}

const SOURCE_ID = 'events'
const LAYER_CLUSTERS = 'event-clusters'
const LAYER_CLUSTER_COUNT = 'event-cluster-count'
const LAYER_POINTS = 'event-points'

// Tracks which maps have had event handlers registered to prevent duplicates
const registeredMaps = new WeakSet<MapboxMap>()

export function updateEventLayer(
  map: MapboxMap,
  events: EventsData | null,
  visible: boolean
): void {
  // Only tonight events that have venue coordinates get pins — panel and map share the same source
  const geocoded = (events?.tonight ?? []).filter(
    e => e.lat !== undefined && e.lng !== undefined
  )

  const geojson: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: geocoded.map(e => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [e.lng!, e.lat!] },
      properties: { name: e.name, time: e.time, capacity: e.capacity },
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
      clusterRadius: 50,
    })

    map.addLayer({
      id: LAYER_CLUSTERS,
      type: 'circle',
      source: SOURCE_ID,
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': '#E8A020',
        'circle-radius': ['step', ['get', 'point_count'], 16, 5, 20, 20, 24],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#1A1200',
      },
    })

    map.addLayer({
      id: LAYER_CLUSTER_COUNT,
      type: 'symbol',
      source: SOURCE_ID,
      filter: ['has', 'point_count'],
      layout: {
        'text-field': '{point_count_abbreviated}',
        'text-size': 11,
      },
      paint: {
        'text-color': '#1A1200',
      },
    })

    map.addLayer({
      id: LAYER_POINTS,
      type: 'circle',
      source: SOURCE_ID,
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': '#E8A020',
        'circle-radius': 6,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#1A1200',
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
      const capacityLine =
        (props.capacity as number) > 0
          ? `<br/>~${(props.capacity as number).toLocaleString()} capacity`
          : ''
      new Popup()
        .setLngLat(coords)
        .setHTML(
          `<div style="font-family:var(--font-inter);color:#F0EDE8;background:#141820;` +
            `padding:8px 12px;border-radius:8px;font-size:12px;">` +
            `<strong>${props.name as string}</strong><br/>` +
            `${formatEventTime(props.time as string)}` +
            `${capacityLine}` +
            `</div>`
        )
        .addTo(map)
    })

    map.on('mouseenter', LAYER_CLUSTERS, () => {
      map.getCanvas().style.cursor = 'pointer'
    })
    map.on('mouseleave', LAYER_CLUSTERS, () => {
      map.getCanvas().style.cursor = ''
    })
    map.on('mouseenter', LAYER_POINTS, () => {
      map.getCanvas().style.cursor = 'pointer'
    })
    map.on('mouseleave', LAYER_POINTS, () => {
      map.getCanvas().style.cursor = ''
    })
  }

  ;[LAYER_CLUSTERS, LAYER_CLUSTER_COUNT, LAYER_POINTS].forEach(id =>
    map.setLayoutProperty(id, 'visibility', visible ? 'visible' : 'none')
  )
}
