'use client'

import { useRef } from 'react'
import { Map, type MapRef } from 'react-map-gl/mapbox'
import type { City, CitySnapshot } from '@/lib/types'

interface CityMapProps {
  city: City
  snapshot: CitySnapshot | null
  activeLayers: string[]
}

export default function CityMap({ city, snapshot: _snapshot, activeLayers: _activeLayers }: CityMapProps) {
  const mapRef = useRef<MapRef>(null)

  return (
    <Map
      ref={mapRef}
      mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
      initialViewState={{
        longitude: city.lng,
        latitude: city.lat,
        zoom: city.zoom,
      }}
      style={{ width: '100vw', height: '100vh' }}
      mapStyle={city.mapStyle}
      attributionControl={false}
    >
      {/* MapLayers component added in Phase 5 */}
    </Map>
  )
}
