import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { OrbitalLayout } from '@/components/orbital/OrbitalLayout'
import type { CitySnapshot } from '@/lib/types'

function makeMockSnapshot(): CitySnapshot {
  return {
    city: {
      id: 'new-york',
      name: 'New York',
      state: 'NY',
      lat: 40.7128,
      lng: -74.006,
      zoom: 12,
      timezone: 'America/New_York',
      mapStyle: 'mapbox://styles/mapbox/dark-v11',
      transitProvider: 'mta',
      crimeProvider: 'nyc-open-data',
    },
    weather: {
      temperature: 72,
      feelsLike: 70,
      condition: 'Clear',
      humidity: 50,
      windSpeed: 10,
      hourlyForecast: [],
    },
    airQuality: {
      aqi: 45,
      category: 'Good',
      dominantPollutant: 'PM2.5',
      stations: [],
    },
    events: {
      tonight: [],
      count: 8,
      totalCapacity: 5000,
    },
    transit: {
      provider: 'mta',
      alerts: [],
      delayCount: 3,
      status: 'disrupted',
    },
    pulseScore: 55,
    pulseLabel: 'Active',
    pulseColor: '#E8A020',
    pulseComponents: {
      eventScore: 10,
      crowdScore: 10,
      transitScore: 10,
      aqScore: 10,
      timeScore: 15,
    },
    timestamp: '2024-01-01T00:00:00Z',
    anomalies: [],
    crime: { totalIncidents: 0, recentIncidents: [], safetyScore: 50 },
  }
}

describe('OrbitalLayout', () => {
  it('renders a weather metric node with temperature value', () => {
    render(<OrbitalLayout snapshot={makeMockSnapshot()} onOpenPanel={vi.fn()} />)
    expect(screen.getByText('72°F')).toBeInTheDocument()
  })

  it('renders an AQI metric node with AQI value', () => {
    render(<OrbitalLayout snapshot={makeMockSnapshot()} onOpenPanel={vi.fn()} />)
    expect(screen.getByText('AQI 45')).toBeInTheDocument()
  })

  it('renders a transit metric node with delay count', () => {
    render(<OrbitalLayout snapshot={makeMockSnapshot()} onOpenPanel={vi.fn()} />)
    expect(screen.getByText('3 delays')).toBeInTheDocument()
  })

  it('renders an events metric node with event count', () => {
    render(<OrbitalLayout snapshot={makeMockSnapshot()} onOpenPanel={vi.fn()} />)
    expect(screen.getByText('8 events')).toBeInTheDocument()
  })

  it('calls onOpenPanel with "weather" when weather node is clicked', () => {
    const onOpenPanel = vi.fn()
    render(<OrbitalLayout snapshot={makeMockSnapshot()} onOpenPanel={onOpenPanel} />)
    fireEvent.click(screen.getByTestId('orbital-metric-weather'))
    expect(onOpenPanel).toHaveBeenCalledWith('weather')
  })

  it('calls onOpenPanel with "aq" when AQI node is clicked', () => {
    const onOpenPanel = vi.fn()
    render(<OrbitalLayout snapshot={makeMockSnapshot()} onOpenPanel={onOpenPanel} />)
    fireEvent.click(screen.getByTestId('orbital-metric-aq'))
    expect(onOpenPanel).toHaveBeenCalledWith('aq')
  })

  it('all four metric nodes have tabIndex={0}', () => {
    render(<OrbitalLayout snapshot={makeMockSnapshot()} onOpenPanel={vi.fn()} />)
    const metrics = ['weather', 'aq', 'transit', 'events']
    for (const metric of metrics) {
      expect(screen.getByTestId(`orbital-metric-${metric}`)).toHaveAttribute('tabindex', '0')
    }
  })

  it('Enter key on weather node triggers onOpenPanel("weather")', () => {
    const onOpenPanel = vi.fn()
    render(<OrbitalLayout snapshot={makeMockSnapshot()} onOpenPanel={onOpenPanel} />)
    fireEvent.keyDown(screen.getByTestId('orbital-metric-weather'), { key: 'Enter' })
    expect(onOpenPanel).toHaveBeenCalledWith('weather')
  })

  it('Space key on weather node triggers onOpenPanel("weather")', () => {
    const onOpenPanel = vi.fn()
    render(<OrbitalLayout snapshot={makeMockSnapshot()} onOpenPanel={onOpenPanel} />)
    fireEvent.keyDown(screen.getByTestId('orbital-metric-weather'), { key: ' ' })
    expect(onOpenPanel).toHaveBeenCalledWith('weather')
  })

  it('calls onOpenPanel with "transit" when transit node is clicked', () => {
    const onOpenPanel = vi.fn()
    render(<OrbitalLayout snapshot={makeMockSnapshot()} onOpenPanel={onOpenPanel} />)
    fireEvent.click(screen.getByTestId('orbital-metric-transit'))
    expect(onOpenPanel).toHaveBeenCalledWith('transit')
  })

  it('calls onOpenPanel with "events" when events node is clicked', () => {
    const onOpenPanel = vi.fn()
    render(<OrbitalLayout snapshot={makeMockSnapshot()} onOpenPanel={onOpenPanel} />)
    fireEvent.click(screen.getByTestId('orbital-metric-events'))
    expect(onOpenPanel).toHaveBeenCalledWith('events')
  })

  it('renders "On time" when transit delayCount is 0', () => {
    const snapshot = makeMockSnapshot()
    snapshot.transit.delayCount = 0
    render(<OrbitalLayout snapshot={snapshot} onOpenPanel={vi.fn()} />)
    expect(screen.getByText('On time')).toBeInTheDocument()
  })

  it('renders AQI amber color when aqi is between 51 and 100', () => {
    const snapshot = makeMockSnapshot()
    snapshot.airQuality.aqi = 75
    render(<OrbitalLayout snapshot={snapshot} onOpenPanel={vi.fn()} />)
    expect(screen.getByText('AQI 75')).toBeInTheDocument()
  })

  it('renders AQI red color when aqi is above 100', () => {
    const snapshot = makeMockSnapshot()
    snapshot.airQuality.aqi = 150
    render(<OrbitalLayout snapshot={snapshot} onOpenPanel={vi.fn()} />)
    expect(screen.getByText('AQI 150')).toBeInTheDocument()
  })

  it('renders delay count when transit delayCount is above 5', () => {
    const snapshot = makeMockSnapshot()
    snapshot.transit.delayCount = 6
    render(<OrbitalLayout snapshot={snapshot} onOpenPanel={vi.fn()} />)
    expect(screen.getByText('6 delays')).toBeInTheDocument()
  })
})
