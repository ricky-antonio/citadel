import { describe, it, expect } from 'vitest'
import { buildCityContext, formatLocalTime } from '@/lib/ai/context'
import type { CitySnapshot } from '@/lib/types'

function makeMockSnapshot(overrides: Partial<CitySnapshot> = {}): CitySnapshot {
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
      condition: 'Partly cloudy',
      humidity: 55,
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
      count: 12,
      totalCapacity: 45000,
      tonight: [
        { id: '1', name: 'Jazz Night', venue: 'Blue Note', time: '8:00 PM', capacity: 200, source: 'ticketmaster' },
        { id: '2', name: 'Comedy Show', venue: 'Comedy Cellar', time: '9:00 PM', capacity: 150, source: 'ticketmaster' },
        { id: '3', name: 'Rock Concert', venue: 'Madison Square Garden', time: '7:30 PM', capacity: 20000, source: 'ticketmaster' },
      ],
    },
    transit: {
      provider: 'mta',
      alerts: [
        { line: 'A', message: 'Delays due to signal work', severity: 'minor' },
        { line: '6', message: 'Service suspended', severity: 'major' },
      ],
      delayCount: 2,
      status: 'disrupted',
    },
    pulseScore: 63,
    pulseLabel: 'Buzzing',
    pulseColor: '#F97316',
    pulseComponents: {
      eventScore: 6,
      crowdScore: 9,
      transitScore: 17,
      aqScore: 10,
      timeScore: 20,
    },
    timestamp: '2024-06-15T20:00:00.000Z',
    anomalies: [],
    ...overrides,
  }
}

describe('buildCityContext', () => {
  it('includes city name and state', () => {
    const result = buildCityContext(makeMockSnapshot())
    expect(result).toContain('New York')
    expect(result).toContain('NY')
  })

  it('includes pulse score and label', () => {
    const result = buildCityContext(makeMockSnapshot())
    expect(result).toContain('63/100')
    expect(result).toContain('Buzzing')
  })

  it('includes weather temp and condition', () => {
    const result = buildCityContext(makeMockSnapshot())
    expect(result).toContain('72°F')
    expect(result).toContain('Partly cloudy')
  })

  it('includes AQI value', () => {
    const result = buildCityContext(makeMockSnapshot())
    expect(result).toContain('AQI 42')
  })

  it('renders "None" when events.tonight is empty', () => {
    const snapshot = makeMockSnapshot({
      events: { count: 0, totalCapacity: 0, tonight: [] },
    })
    const result = buildCityContext(snapshot)
    expect(result).toContain('None')
  })

  it('renders "None" when transit.delays is empty', () => {
    const snapshot = makeMockSnapshot({
      transit: { provider: 'mta', alerts: [], delayCount: 0, status: 'normal' },
    })
    const result = buildCityContext(snapshot)
    expect(result).toContain('None')
  })

  it('output is under 3200 characters for a typical realistic snapshot', () => {
    const result = buildCityContext(makeMockSnapshot())
    expect(result.length).toBeLessThan(3200)
  })
})
