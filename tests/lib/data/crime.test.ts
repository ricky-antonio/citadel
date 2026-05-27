import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchCrimeData } from '@/lib/data/crime'
import { CRIME_FALLBACK } from '@/lib/data/fallbacks'
import { CITIES } from '@/lib/cities'

const nyc = CITIES.find((c) => c.id === 'new-york')!
const sf = CITIES.find((c) => c.id === 'san-francisco')!
const chicago = CITIES.find((c) => c.id === 'chicago')!
const dc = CITIES.find((c) => c.id === 'washington-dc')!

function nycRow(lat: string, lng: string, category: string, date: string) {
  return { latitude: lat, longitude: lng, ofns_desc: category, cmplnt_fr_dt: date }
}

function sfRow(lat: string, lng: string, category: string, date: string) {
  return { latitude: lat, longitude: lng, incident_category: category, incident_date: date }
}

function chicagoRow(lat: string, lng: string, type: string, date: string) {
  return { latitude: lat, longitude: lng, primary_type: type, date }
}

function dcFeature(lat: number | null, lng: number | null, offense: string | null, reportDat: string | number | null) {
  return {
    attributes: { LATITUDE: lat, LONGITUDE: lng, OFFENSE: offense, REPORT_DAT: reportDat },
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('fetchCrimeData — NYC', () => {
  it('routes to NYC Open Data for city new-york', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify([nycRow('40.71', '-74.00', 'ROBBERY', '2025-05-01')]), { status: 200 })
    )

    await fetchCrimeData(nyc)

    const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string
    expect(calledUrl).toContain('data.cityofnewyork.us')
    expect(calledUrl).toContain('5uac-w243.json')
  })

  it('parses Socrata response into CrimeData shape with correct safetyScore', async () => {
    const rows = [
      nycRow('40.71', '-74.00', 'ROBBERY', '2025-05-01'),
      nycRow('40.72', '-73.99', 'ASSAULT', '2025-05-02'),
      nycRow('40.73', '-73.98', 'GRAND LARCENY', '2025-05-03'),
    ]
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify(rows), { status: 200 }))

    const result = await fetchCrimeData(nyc)

    expect(result.totalIncidents).toBe(3)
    expect(result.recentIncidents).toHaveLength(3)
    expect(result.recentIncidents[0]).toEqual({
      lat: 40.71, lng: -74.0, category: 'ROBBERY', date: '2025-05-01',
    })
    expect(result.safetyScore).toBe(Math.round(100 - (3 / 500) * 100))
  })

  it('filters out rows missing lat/lng', async () => {
    const rows = [
      nycRow('40.71', '-74.00', 'ROBBERY', '2025-05-01'),
      { ofns_desc: 'ASSAULT', cmplnt_fr_dt: '2025-05-02' }, // no lat/lng
    ]
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify(rows), { status: 200 }))

    const result = await fetchCrimeData(nyc)

    expect(result.totalIncidents).toBe(1)
    expect(result.recentIncidents).toHaveLength(1)
  })

  it('falls back to "Unknown" when ofns_desc is missing', async () => {
    const rows = [{ latitude: '40.71', longitude: '-74.00', cmplnt_fr_dt: '2025-05-01' }]
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify(rows), { status: 200 }))

    const result = await fetchCrimeData(nyc)

    expect(result.recentIncidents[0].category).toBe('Unknown')
  })

  it('returns CRIME_FALLBACK on non-ok HTTP response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response('', { status: 500 }))

    const result = await fetchCrimeData(nyc)

    expect(result).toEqual(CRIME_FALLBACK)
  })

  it('returns CRIME_FALLBACK on fetch failure', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

    const result = await fetchCrimeData(nyc)

    expect(result).toEqual(CRIME_FALLBACK)
  })
})

describe('fetchCrimeData — SF', () => {
  it('routes to DataSF for city san-francisco', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify([sfRow('37.77', '-122.41', 'Larceny Theft', '2025-05-01')]), { status: 200 })
    )

    await fetchCrimeData(sf)

    const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string
    expect(calledUrl).toContain('data.sfgov.org')
    expect(calledUrl).toContain('wg3w-h783.json')
  })

  it('parses SF rows into CrimeData shape', async () => {
    const rows = [sfRow('37.77', '-122.41', 'Larceny Theft', '2025-05-01')]
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify(rows), { status: 200 }))

    const result = await fetchCrimeData(sf)

    expect(result.totalIncidents).toBe(1)
    expect(result.recentIncidents[0].category).toBe('Larceny Theft')
  })

  it('falls back to "Unknown" when incident_category is missing', async () => {
    const rows = [{ latitude: '37.77', longitude: '-122.41', incident_date: '2025-05-01' }]
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify(rows), { status: 200 }))

    const result = await fetchCrimeData(sf)

    expect(result.recentIncidents[0].category).toBe('Unknown')
  })

  it('returns CRIME_FALLBACK on SF HTTP error', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response('', { status: 503 }))

    const result = await fetchCrimeData(sf)

    expect(result).toEqual(CRIME_FALLBACK)
  })
})

describe('fetchCrimeData — Chicago', () => {
  it('routes to Chicago Data Portal for city chicago', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify([chicagoRow('41.87', '-87.62', 'THEFT', '2025-05-01')]), { status: 200 })
    )

    await fetchCrimeData(chicago)

    const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string
    expect(calledUrl).toContain('data.cityofchicago.org')
    expect(calledUrl).toContain('ijzp-q8t2.json')
  })

  it('parses Chicago rows into CrimeData shape', async () => {
    const rows = [chicagoRow('41.87', '-87.62', 'THEFT', '2025-05-01')]
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify(rows), { status: 200 }))

    const result = await fetchCrimeData(chicago)

    expect(result.totalIncidents).toBe(1)
    expect(result.recentIncidents[0].category).toBe('THEFT')
  })

  it('falls back to "Unknown" when primary_type is missing', async () => {
    const rows = [{ latitude: '41.87', longitude: '-87.62', date: '2025-05-01' }]
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify(rows), { status: 200 }))

    const result = await fetchCrimeData(chicago)

    expect(result.recentIncidents[0].category).toBe('Unknown')
  })

  it('returns CRIME_FALLBACK on Chicago HTTP error', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response('', { status: 500 }))

    const result = await fetchCrimeData(chicago)

    expect(result).toEqual(CRIME_FALLBACK)
  })
})

describe('fetchCrimeData — DC', () => {
  it('routes to DC DCGIS endpoint for city washington-dc', async () => {
    const body = { features: [dcFeature(38.90, -77.03, 'THEFT/OTHER', 1746057600000)] }
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify(body), { status: 200 }))

    await fetchCrimeData(dc)

    const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string
    expect(calledUrl).toContain('maps2.dcgis.dc.gov')
    expect(calledUrl).toContain('MapServer/6/query')
  })

  it('parses DC ArcGIS features into CrimeData shape', async () => {
    const body = {
      features: [
        dcFeature(38.90, -77.03, 'THEFT/OTHER', '2025-05-01T00:00:00Z'),
        dcFeature(38.91, -77.02, 'ROBBERY', 1746057600000),
      ],
    }
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify(body), { status: 200 }))

    const result = await fetchCrimeData(dc)

    expect(result.totalIncidents).toBe(2)
    expect(result.recentIncidents[0].category).toBe('THEFT/OTHER')
    expect(result.recentIncidents[1].date).toBe('1746057600000')
  })

  it('filters out DC features with null lat/lng', async () => {
    const body = {
      features: [
        dcFeature(38.90, -77.03, 'THEFT/OTHER', '2025-05-01'),
        dcFeature(null, null, 'ASSAULT', '2025-05-01'),
      ],
    }
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify(body), { status: 200 }))

    const result = await fetchCrimeData(dc)

    expect(result.totalIncidents).toBe(1)
  })

  it('falls back to "Unknown" and empty date when DC fields are null', async () => {
    const body = { features: [dcFeature(38.90, -77.03, null, null)] }
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify(body), { status: 200 }))

    const result = await fetchCrimeData(dc)

    expect(result.recentIncidents[0].category).toBe('Unknown')
    expect(result.recentIncidents[0].date).toBe('')
  })

  it('returns empty incidents when features array is missing', async () => {
    const body = {}
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify(body), { status: 200 }))

    const result = await fetchCrimeData(dc)

    expect(result.totalIncidents).toBe(0)
    expect(result.recentIncidents).toHaveLength(0)
  })

  it('returns CRIME_FALLBACK on DC HTTP error', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response('', { status: 404 }))

    const result = await fetchCrimeData(dc)

    expect(result).toEqual(CRIME_FALLBACK)
  })
})
