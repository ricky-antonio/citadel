import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchAirQuality } from '@/lib/data/airQuality'
import { AIR_QUALITY_FALLBACK } from '@/lib/data/fallbacks'

// PM2.5 = 8.5 → AQI ≈ 35 (Good range: 0–50)
const PM25_VALUE = 8.5

const recentTimestamp = new Date(Date.now() - 60 * 60 * 1000).toISOString() // 1 hour ago

const mockLocationsResponse = {
  results: [
    {
      id: 12345,
      name: 'Manhattan Station',
      coordinates: { latitude: 40.71, longitude: -74.01 },
      sensors: [{ id: 999, parameter: { name: 'pm25' } }],
      datetimeLast: { utc: recentTimestamp },
    },
  ],
}

const mockLatestResponse = {
  results: [
    {
      value: PM25_VALUE,
      sensorsId: 999,
      locationsId: 12345,
      datetime: { utc: recentTimestamp, local: recentTimestamp },
    },
  ],
}

beforeEach(() => {
  process.env.OPENAQ_API_KEY = 'test-key'
})

describe('fetchAirQuality', () => {
  it('parses OpenAQ response into AirQualityData shape with correct AQI category', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: true, json: async () => mockLocationsResponse } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => mockLatestResponse } as Response)

    const result = await fetchAirQuality(40.71, -74.01)

    expect(result.aqi).toBeGreaterThan(0)
    expect(result.aqi).toBeLessThanOrEqual(50)
    expect(result.category).toBe('Good')
    expect(result.dominantPollutant).toBe('pm25')
    expect(result.stations).toHaveLength(1)
    expect(result.stations[0]).toMatchObject({ lat: 40.71, lng: -74.01 })
    expect(result.stations[0].aqi).toBeGreaterThan(0)
  })

  it('returns AIR_QUALITY_FALLBACK when all location fetches fail', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: true, json: async () => mockLocationsResponse } as Response)
      .mockRejectedValueOnce(new Error('Network failure'))

    const result = await fetchAirQuality(40.71, -74.01)
    expect(result).toEqual(AIR_QUALITY_FALLBACK)
  })

  it('returns AIR_QUALITY_FALLBACK when locationIds array is empty', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: [] }),
    } as Response)

    const result = await fetchAirQuality(40.71, -74.01)
    expect(result).toEqual(AIR_QUALITY_FALLBACK)
  })
})
