import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import type { MutableRefObject } from 'react'
import type { MapRef } from 'react-map-gl/mapbox'
import MapLayers from '@/components/map/MapLayers'
import type { CitySnapshot } from '@/lib/types'
import { CITIES } from '@/lib/cities'
import { updateAQLayer } from '@/components/map/AQLayer'
import { updateEventLayer } from '@/components/map/EventLayer'
import { updateTransitLayer } from '@/components/map/TransitLayer'
import { updateCrowdLayer } from '@/components/map/CrowdLayer'

vi.mock('@/components/map/AQLayer', () => ({
  updateAQLayer: vi.fn(),
}))

vi.mock('@/components/map/EventLayer', () => ({
  updateEventLayer: vi.fn(),
}))

vi.mock('@/components/map/TransitLayer', () => ({
  updateTransitLayer: vi.fn(),
}))

vi.mock('@/components/map/CrowdLayer', () => ({
  updateCrowdLayer: vi.fn(),
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
  it('renders null to the DOM when crowd layer is inactive', () => {
    const { container } = render(
      <MapLayers snapshot={null} activeLayers={[]} mapRef={makeMapRef()} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders crowd density label when crowd layer is active', () => {
    const { getByText } = render(
      <MapLayers snapshot={mockSnapshot} activeLayers={['crowd']} mapRef={makeMapRef()} />
    )
    expect(getByText('Crowd density (estimated)')).toBeTruthy()
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

  it('calls updateEventLayer with events data and visibility flag', () => {
    render(
      <MapLayers
        snapshot={mockSnapshot}
        activeLayers={['events']}
        mapRef={makeMapRef()}
      />
    )
    expect(updateEventLayer).toHaveBeenCalledWith(mockMap, mockSnapshot.events, true)
  })

  it('calls updateTransitLayer with transit data, cityId, and visibility flag', () => {
    render(
      <MapLayers
        snapshot={mockSnapshot}
        activeLayers={['transit']}
        mapRef={makeMapRef()}
      />
    )
    expect(updateTransitLayer).toHaveBeenCalledWith(
      mockMap,
      mockSnapshot.transit,
      mockSnapshot.city.id,
      true
    )
  })

  it('calls updateCrowdLayer with events data, cityId, and visibility flag', () => {
    render(
      <MapLayers
        snapshot={mockSnapshot}
        activeLayers={['crowd']}
        mapRef={makeMapRef()}
      />
    )
    expect(updateCrowdLayer).toHaveBeenCalledWith(
      mockMap,
      mockSnapshot.events,
      mockSnapshot.city.id,
      true
    )
  })

  it('does not throw when snapshot is null', () => {
    expect(() =>
      render(<MapLayers snapshot={null} activeLayers={[]} mapRef={makeMapRef()} />)
    ).not.toThrow()
    expect(updateAQLayer).toHaveBeenCalledWith(mockMap, null, false)
    expect(updateEventLayer).toHaveBeenCalledWith(mockMap, null, false)
    expect(updateTransitLayer).toHaveBeenCalledWith(mockMap, null, '', false)
    expect(updateCrowdLayer).toHaveBeenCalledWith(mockMap, null, '', false)
  })

  it('passes transit visibility as false when transit layer not in activeLayers', () => {
    render(
      <MapLayers snapshot={mockSnapshot} activeLayers={[]} mapRef={makeMapRef()} />
    )
    expect(updateTransitLayer).toHaveBeenCalledWith(
      mockMap,
      mockSnapshot.transit,
      mockSnapshot.city.id,
      false
    )
  })
})
