import type { CitySnapshot } from '@/lib/types'
import { getCityById } from '@/lib/cities'

export function buildMockSnapshot(cityId: string, overrides: Partial<CitySnapshot> = {}): CitySnapshot {
  const city = getCityById(cityId)
  if (!city) throw new Error(`buildMockSnapshot: unknown cityId "${cityId}"`)

  return {
    city,
    pulseScore: 72,
    pulseLabel: 'Active',
    pulseColor: '#E8A020',
    pulseComponents: {
      eventScore: 20,
      crowdScore: 15,
      transitScore: 18,
      aqScore: 12,
      timeScore: 7,
    },
    weather: {
      temperature: 68,
      feelsLike: 65,
      humidity: 55,
      windSpeed: 8,
      condition: 'Clear',
      hourlyForecast: [],
    },
    airQuality: {
      aqi: 42,
      category: 'Good',
      dominantPollutant: 'PM2.5',
      stations: [{ lat: 40.71, lng: -74.01, aqi: 42 }],
    },
    events: {
      count: 3,
      totalCapacity: 5000,
      tonight: [
        {
          id: '1',
          name: 'Jazz at the Park',
          venue: 'Central Park',
          time: '8:00 PM',
          capacity: 0,
          source: 'ticketmaster',
          lat: 40.785,
          lng: -73.968,
        },
      ],
    },
    transit: {
      provider: 'mta',
      delayCount: 1,
      status: 'disrupted',
      alerts: [
        { line: 'A', message: 'Minor delays due to signal work', severity: 'minor' },
      ],
    },
    crime: { totalIncidents: 0, recentIncidents: [], safetyScore: 50 },
    anomalies: [],
    timestamp: new Date().toISOString(),
    ...overrides,
  }
}
