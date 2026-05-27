'use client'

import { useEffect } from 'react'
import type { MapRef } from 'react-map-gl/mapbox'
import type { Map as MapboxMap } from 'mapbox-gl'
import type { CitySnapshot } from '@/lib/types'
import { updateAQLayer } from './AQLayer'
import { updateEventLayer } from './EventLayer'
import { updateTransitLayer } from './TransitLayer'
import { updateCrowdLayer } from './CrowdLayer'
import { updateCrimeLayer } from './CrimeLayer'

interface MapLayersProps {
  snapshot: CitySnapshot | null
  activeLayers: string[]
  mapRef: React.MutableRefObject<MapRef | null>
}

export default function MapLayers({ snapshot, activeLayers, mapRef }: MapLayersProps) {
  useEffect(() => {
    if (!mapRef.current || typeof mapRef.current.getMap !== 'function') return
    const map = mapRef.current.getMap() as MapboxMap

    const doUpdate = () => {
      updateAQLayer(map, snapshot?.airQuality ?? null, activeLayers.includes('air-quality'))
      updateEventLayer(map, snapshot?.events ?? null, activeLayers.includes('events'))
      updateTransitLayer(
        map,
        snapshot?.transit ?? null,
        snapshot?.city.id ?? '',
        activeLayers.includes('transit')
      )
      updateCrowdLayer(
        map,
        snapshot?.events ?? null,
        snapshot?.city.id ?? '',
        activeLayers.includes('crowd')
      )
      updateCrimeLayer(map, snapshot?.crime ?? null, activeLayers.includes('crime'))
    }

    map.on('style.load', doUpdate)
    if (map.isStyleLoaded()) {
      doUpdate()
    }
    return () => {
      map.off('style.load', doUpdate)
    }
  }, [snapshot, activeLayers, mapRef])

  if (!activeLayers.includes('crowd')) return null

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '40px',
        right: '16px',
        fontSize: '9px',
        color: 'var(--tx-3)',
        pointerEvents: 'none',
      }}
    >
      Crowd density (estimated)
    </div>
  )
}
