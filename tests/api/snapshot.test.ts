import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@/tests/mocks/supabase'

vi.mock('@/lib/data/weather', () => ({
  fetchWeather: vi.fn().mockResolvedValue({
    temperature: 72,
    feelsLike: 70,
    condition: 'Clear',
    humidity: 45,
    windSpeed: 5,
    hourlyForecast: [],
  }),
}))

vi.mock('@/lib/data/airQuality', () => ({
  fetchAirQuality: vi.fn().mockResolvedValue({
    aqi: 25,
    category: 'Good',
    dominantPollutant: 'PM2.5',
  }),
}))

vi.mock('@/lib/data/events', () => ({
  fetchEvents: vi.fn().mockResolvedValue({
    count: 10,
    totalCapacity: 50000,
    tonight: [],
  }),
}))

vi.mock('@/lib/data/transit', () => ({
  fetchTransitStatus: vi.fn().mockResolvedValue({
    provider: 'mta',
    alerts: [],
    delayCount: 0,
    status: 'normal',
  }),
}))

vi.mock('@/lib/data/crime', () => ({
  fetchCrimeData: vi.fn().mockResolvedValue({}),
}))

vi.mock('@/lib/cache', () => ({
  getCached: vi.fn().mockResolvedValue(null),
  setCached: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/anomaly', () => ({
  detectAnomaly: vi.fn().mockReturnValue(null),
  logAnomaly: vi.fn().mockResolvedValue(undefined),
  getAnomalyHistory: vi.fn().mockResolvedValue([]),
}))

vi.mock('@/lib/pulse-history', () => ({
  getPulseHistory: vi.fn().mockResolvedValue([]),
  writePulseScore: vi.fn().mockResolvedValue(undefined),
}))

import { GET } from '@/app/api/city/[id]/snapshot/route'
import { getCached } from '@/lib/cache'
import { fetchWeather } from '@/lib/data/weather'

function makeContext(id: string) {
  return { params: Promise.resolve({ id }) }
}

describe('GET /api/city/[id]/snapshot', () => {
  beforeEach(() => {
    vi.mocked(getCached).mockResolvedValue(null)
  })

  it('returns 404 for unknown city ID xyz', async () => {
    const res = await GET(
      new Request('http://localhost/api/city/xyz/snapshot'),
      makeContext('xyz')
    )
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.code).toBe('CITY_NOT_FOUND')
    expect(body.error).toBeDefined()
  })

  it('returns 200 with correct CitySnapshot shape for city new-york', async () => {
    const res = await GET(
      new Request('http://localhost/api/city/new-york/snapshot'),
      makeContext('new-york')
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.city.id).toBe('new-york')
    expect(body.city.name).toBe('New York')
    expect(typeof body.pulseScore).toBe('number')
    expect(body.pulseLabel).toBeDefined()
    expect(body.pulseColor).toBeDefined()
    expect(body.pulseComponents).toBeDefined()
    expect(body.weather).toBeDefined()
    expect(body.airQuality).toBeDefined()
    expect(body.events).toBeDefined()
    expect(body.transit).toBeDefined()
    expect(body.timestamp).toBeDefined()
    expect(Array.isArray(body.anomalies)).toBe(true)
  })

  it('uses cached data when getCached returns a value — no external fetch called', async () => {
    const cachedData = {
      temperature: 65,
      feelsLike: 63,
      condition: 'Cloudy',
      humidity: 60,
      windSpeed: 10,
      hourlyForecast: [],
    }
    vi.mocked(getCached).mockResolvedValue(cachedData)

    await GET(
      new Request('http://localhost/api/city/new-york/snapshot'),
      makeContext('new-york')
    )

    expect(fetchWeather).not.toHaveBeenCalled()
  })

  it('calls fetchWeather when getCached returns null for weather', async () => {
    vi.mocked(getCached).mockResolvedValue(null)

    await GET(
      new Request('http://localhost/api/city/new-york/snapshot'),
      makeContext('new-york')
    )

    expect(fetchWeather).toHaveBeenCalledWith(
      expect.any(Number),
      expect.any(Number)
    )
  })

  it('includes computed pulseScore in the response', async () => {
    const res = await GET(
      new Request('http://localhost/api/city/new-york/snapshot'),
      makeContext('new-york')
    )
    const body = await res.json()

    expect(typeof body.pulseScore).toBe('number')
    expect(body.pulseScore).toBeGreaterThanOrEqual(0)
    expect(body.pulseScore).toBeLessThanOrEqual(100)
  })
})
