'use client'

import { useRef, useEffect } from 'react'
import { Map, type MapRef } from 'react-map-gl/mapbox'
import { useTheme } from 'next-themes'
import type { City, CitySnapshot } from '@/lib/types'
import MapLayers from './MapLayers'

interface CityMapProps {
  city: City
  snapshot: CitySnapshot | null
  activeLayers: string[]
}

export default function CityMap({ city, snapshot, activeLayers }: CityMapProps) {
  const mapRef = useRef<MapRef>(null)
  const { theme } = useTheme()
  const prevCityIdRef = useRef(city.id)
  const prevThemeRef = useRef(theme)

  useEffect(() => {
    if (prevCityIdRef.current === city.id) return
    prevCityIdRef.current = city.id
    if (!mapRef.current) return
    mapRef.current.flyTo({
      center: [city.lng, city.lat],
      zoom: city.zoom,
      duration: 1500,
      essential: true,
    })
  }, [city.id, city.lng, city.lat, city.zoom])

  useEffect(() => {
    if (prevThemeRef.current === theme) return
    prevThemeRef.current = theme
    if (!mapRef.current) return
    const map = mapRef.current.getMap()
    const newStyle = theme === 'dark' ? city.mapStyle : 'mapbox://styles/mapbox/light-v11'
    map.setStyle(newStyle)
  }, [theme, city.mapStyle])

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
      <MapLayers snapshot={snapshot} activeLayers={activeLayers} mapRef={mapRef} />
    </Map>
  )
}
