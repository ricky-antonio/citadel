import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import CityMap from '@/components/map/CityMap'
import { CITIES } from '@/lib/cities'
import type { CitySnapshot } from '@/lib/types'

const mockCity = CITIES[0] // New York

const mockSnapshot: CitySnapshot = {
  city: mockCity,
  pulseScore: 55,
  pulseLabel: 'Active',
  pulseColor: '#E8A020',
  pulseComponents: {
    eventScore: 20,
    crowdScore: 15,
    transitScore: 10,
    aqScore: 5,
    timeScore: 5,
  },
  weather: {
    temperature: 72,
    feelsLike: 70,
    condition: 'Clear',
    humidity: 50,
    windSpeed: 8,
    hourlyForecast: [],
  },
  airQuality: {
    aqi: 42,
    category: 'Good',
    dominantPollutant: 'PM2.5',
    stations: [],
  },
  events: {
    count: 3,
    totalCapacity: 5000,
    tonight: [],
  },
  transit: {
    provider: 'mta',
    alerts: [],
    delayCount: 0,
    status: 'normal',
  },
  timestamp: new Date().toISOString(),
  anomalies: [],
  crime: { totalIncidents: 0, recentIncidents: [], safetyScore: 50 },
}

describe('CityMap', () => {
  it('renders without crashing with valid city and null snapshot', () => {
    render(<CityMap city={mockCity} snapshot={null} activeLayers={[]} />)
    expect(screen.getByTestId('mock-map')).toBeInTheDocument()
  })

  it('renders without crashing with valid city and a full mock snapshot', () => {
    render(<CityMap city={mockCity} snapshot={mockSnapshot} activeLayers={['air-quality', 'transit']} />)
    expect(screen.getByTestId('mock-map')).toBeInTheDocument()
  })

  it('passes correct initialViewState zoom from city.zoom', () => {
    render(<CityMap city={mockCity} snapshot={null} activeLayers={[]} />)
    const map = screen.getByTestId('mock-map')
    expect(map).toHaveAttribute('data-zoom', String(mockCity.zoom))
  })
})
