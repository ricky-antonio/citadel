import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchCrimeData } from '@/lib/data/crime'
import { CRIME_FALLBACK } from '@/lib/data/fallbacks'
import { CITIES } from '@/lib/cities'

const nyc = CITIES.find((c) => c.id === 'new-york')!

function makeSocrataRow(lat: string, lng: string, category: string, date: string) {
  return { latitude: lat, longitude: lng, ofns_desc: category, cmplnt_fr_dt: date }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('fetchCrimeData', () => {
  it('routes to NYC Open Data for city new-york', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify([makeSocrataRow('40.71', '-74.00', 'ROBBERY', '2025-05-01')]), {
        status: 200,
      })
    )

    await fetchCrimeData(nyc)

    expect(fetch).toHaveBeenCalledOnce()
    const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string
    expect(calledUrl).toContain('data.cityofnewyork.us')
    expect(calledUrl).toContain('5uac-w243.json')
  })

  it('parses Socrata response into CrimeData shape with correct safetyScore', async () => {
    const rows = [
      makeSocrataRow('40.71', '-74.00', 'ROBBERY', '2025-05-01'),
      makeSocrataRow('40.72', '-73.99', 'ASSAULT', '2025-05-02'),
      makeSocrataRow('40.73', '-73.98', 'GRAND LARCENY', '2025-05-03'),
    ]
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify(rows), { status: 200 }))

    const result = await fetchCrimeData(nyc)

    expect(result.totalIncidents).toBe(3)
    expect(result.recentIncidents).toHaveLength(3)
    expect(result.recentIncidents[0]).toEqual({
      lat: 40.71,
      lng: -74.0,
      category: 'ROBBERY',
      date: '2025-05-01',
    })
    // 3 incidents / 500 * 100 = 0.6 → safetyScore = 100 - 1 = 99
    expect(result.safetyScore).toBe(Math.round(100 - (3 / 500) * 100))
  })

  it('returns CRIME_FALLBACK on fetch failure', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

    const result = await fetchCrimeData(nyc)

    expect(result).toEqual(CRIME_FALLBACK)
  })
})
