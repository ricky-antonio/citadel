import { describe, it, expect, vi } from 'vitest'
import { fetchMtaStatus } from '@/lib/data/transit/mta'
import { TRANSIT_FALLBACK } from '@/lib/data/fallbacks'

const mockDecode = vi.hoisted(() => vi.fn())

vi.mock('gtfs-realtime-bindings', () => ({
  transit_realtime: {
    FeedMessage: {
      decode: mockDecode,
    },
  },
}))

function makeResponse(ok = true) {
  return {
    ok,
    status: ok ? 200 : 500,
    arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
  } as unknown as Response
}

function buildFeed(alerts: Array<{ routeId?: string; text?: string }>) {
  return {
    entity: alerts.map((a, i) => ({
      id: String(i),
      alert: {
        informedEntity: a.routeId ? [{ routeId: a.routeId }] : [],
        headerText: {
          translation: a.text ? [{ text: a.text }] : [],
        },
      },
    })),
  }
}

describe('fetchMtaStatus', () => {
  it('parses MTA response into TransitData shape with correct fields', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(makeResponse())
    mockDecode.mockReturnValueOnce(
      buildFeed([{ routeId: 'A', text: 'Service change on the A train' }])
    )

    const result = await fetchMtaStatus()

    expect(result.provider).toBe('mta')
    expect(result.alerts).toHaveLength(1)
    expect(result.alerts[0].line).toBe('A')
    expect(result.alerts[0].message).toBe('Service change on the A train')
    expect(result.delayCount).toBe(1)
    expect(result.status).toBe('disrupted')
  })

  it('maps delay described as minor to severity minor', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(makeResponse())
    mockDecode.mockReturnValueOnce(
      buildFeed([{ routeId: '4', text: 'Minor delays on the 4 train due to signal problems' }])
    )

    const result = await fetchMtaStatus()

    expect(result.alerts[0].severity).toBe('minor')
  })

  it('maps delay described as major or > 5 min to severity major', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(makeResponse())
    mockDecode.mockReturnValueOnce(
      buildFeed([
        { routeId: 'L', text: 'Major delays on the L train' },
        { routeId: '1', text: 'No service on the 1 train between stations' },
      ])
    )

    const result = await fetchMtaStatus()

    expect(result.alerts[0].severity).toBe('major')
    expect(result.alerts[1].severity).toBe('major')
  })

  it('returns TRANSIT_FALLBACK when feed is empty (no active alerts)', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(makeResponse())
    mockDecode.mockReturnValueOnce(buildFeed([]))

    const result = await fetchMtaStatus()

    expect(result).toEqual(TRANSIT_FALLBACK)
  })

  it('returns TRANSIT_FALLBACK on fetch failure', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

    const result = await fetchMtaStatus()

    expect(result).toEqual(TRANSIT_FALLBACK)
  })
})
