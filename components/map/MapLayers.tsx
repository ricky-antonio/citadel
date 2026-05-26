'use client'

import { useEffect } from 'react'
import type { MapRef } from 'react-map-gl/mapbox'
import type { Map as MapboxMap } from 'mapbox-gl'
import type { CitySnapshot } from '@/lib/types'
import { updateAQLayer } from './AQLayer'
import { updateEventLayer } from './EventLayer'

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
    }

    if (!map.isStyleLoaded()) {
      map.once('style.load', doUpdate)
      return
    }
    doUpdate()
  }, [snapshot, activeLayers, mapRef])

  return null
}
