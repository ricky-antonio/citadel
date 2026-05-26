import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import type { MutableRefObject } from 'react'
import type { MapRef } from 'react-map-gl/mapbox'
import MapLayers from '@/components/map/MapLayers'
import type { CitySnapshot } from '@/lib/types'
import { CITIES } from '@/lib/cities'
import { updateAQLayer } from '@/components/map/AQLayer'

vi.mock('@/components/map/AQLayer', () => ({
  updateAQLayer: vi.fn(),
}))

const mockMap = {
  isStyleLoaded: vi.fn().mockReturnValue(true),
  getSource: vi.fn().mockReturnValue(null),
  addSource: vi.fn(),
  addLayer: vi.fn(),
  setLayoutProperty: vi.fn(),
  once: vi.fn(),
}

function makeMapRef(): MutableRefObject<MapRef | null> {
  return { current: { getMap: () => mockMap } as unknown as MapRef }
}

const mockSnapshot: CitySnapshot = {
  city: CITIES[0],
  weather: {
    temperature: 72,
    feelsLike: 70,
    condition: 'Clear',
    humidity: 50,
    windSpeed: 10,
    hourlyForecast: [],
  },
  airQuality: {
    aqi: 42,
    category: 'Good',
    dominantPollutant: 'PM2.5',
    stations: [{ lat: 40.71, lng: -74.01, aqi: 42 }],
  },
  events: { count: 3, totalCapacity: 5000, tonight: [] },
  transit: { provider: 'mta', alerts: [], delayCount: 0, status: 'normal' },
  pulseScore: 55,
  pulseLabel: 'Active',
  pulseColor: '#E8A020',
  pulseComponents: { eventScore: 10, crowdScore: 10, transitScore: 15, aqScore: 10, timeScore: 10 },
  timestamp: new Date().toISOString(),
  anomalies: [],
}

beforeEach(() => {
  mockMap.isStyleLoaded.mockReturnValue(true)
})

describe('MapLayers', () => {
  it('renders null to the DOM (no visual output)', () => {
    const { container } = render(
      <MapLayers snapshot={null} activeLayers={[]} mapRef={makeMapRef()} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('calls updateAQLayer when snapshot has air quality stations', () => {
    render(
      <MapLayers
        snapshot={mockSnapshot}
        activeLayers={['air-quality']}
        mapRef={makeMapRef()}
      />
    )
    expect(updateAQLayer).toHaveBeenCalledWith(mockMap, mockSnapshot.airQuality, true)
  })

  it('does not throw when snapshot is null', () => {
    expect(() =>
      render(<MapLayers snapshot={null} activeLayers={[]} mapRef={makeMapRef()} />)
    ).not.toThrow()
    expect(updateAQLayer).toHaveBeenCalledWith(mockMap, null, false)
  })
})
