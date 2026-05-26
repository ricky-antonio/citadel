import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Map as MapboxMap } from 'mapbox-gl'
import { updateTransitLayer } from '@/components/map/TransitLayer'
import type { TransitData } from '@/lib/types'

// Fresh mock map per test — WeakSet/WeakMap state persists in the module,
// so using different object references avoids re-registration conflicts.
function makeMapMock() {
  const canvas = { style: { cursor: '' } }
  return {
    getSource: vi.fn().mockReturnValue(null),
    addSource: vi.fn(),
    addLayer: vi.fn(),
    setLayoutProperty: vi.fn(),
    setFeatureState: vi.fn(),
    isStyleLoaded: vi.fn().mockReturnValue(true),
    on: vi.fn(),
    getCanvas: vi.fn().mockReturnValue(canvas),
  }
}

const mockTransitGeojson: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: [[-73.99, 40.75], [-74.00, 40.74]] },
      properties: { line_id: '1', line_name: '1 Train', color: '#EE352E' },
    },
    {
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: [[-73.98, 40.76], [-73.97, 40.75]] },
      properties: { line_id: 'A', line_name: 'A Train', color: '#0039A6' },
    },
  ],
}

const normalTransit: TransitData = {
  provider: 'mta',
  alerts: [],
  delayCount: 0,
  status: 'normal',
}

const delayedTransit: TransitData = {
  provider: 'mta',
  alerts: [{ line: '1', message: 'Delays on 1 Train', severity: 'minor' }],
  delayCount: 1,
  status: 'disrupted',
}

const suspendedTransit: TransitData = {
  provider: 'mta',
  alerts: [{ line: 'A', message: 'No service on A Train', severity: 'major' }],
  delayCount: 1,
  status: 'disrupted',
}

// Use a unique prefix per test group to avoid module-level cache conflicts
let testId = 0
function nextCityId() {
  return `transit-test-city-${++testId}`
}

beforeEach(() => {
  vi.mocked(fetch).mockResolvedValue({
    ok: true,
    json: async () => mockTransitGeojson,
  } as Response)
})

describe('updateTransitLayer', () => {
  it('does not fetch when cityId is empty string', () => {
    const map = makeMapMock()
    updateTransitLayer(map as unknown as MapboxMap, null, '', true)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('fetches GeoJSON on first call and adds source and layer', async () => {
    const map = makeMapMock()
    updateTransitLayer(map as unknown as MapboxMap, normalTransit, nextCityId(), true)
    await vi.waitFor(() => expect(map.addSource).toHaveBeenCalled())
    expect(map.addLayer).toHaveBeenCalled()
    // Source must include generateId for feature-state hover
    expect(map.addSource.mock.calls[0][1]).toMatchObject({ type: 'geojson', generateId: true })
  })

  it('assigns delayed status for a matching minor alert', async () => {
    const map = makeMapMock()
    updateTransitLayer(map as unknown as MapboxMap, delayedTransit, nextCityId(), true)
    await vi.waitFor(() => expect(map.addSource).toHaveBeenCalled())
    const geojson = map.addSource.mock.calls[0][1].data as GeoJSON.FeatureCollection
    const line1 = geojson.features.find(f => (f.properties as { line_id: string }).line_id === '1')
    expect((line1?.properties as { status: string }).status).toBe('delayed')
  })

  it('assigns suspended status for a matching major alert', async () => {
    const map = makeMapMock()
    updateTransitLayer(map as unknown as MapboxMap, suspendedTransit, nextCityId(), true)
    await vi.waitFor(() => expect(map.addSource).toHaveBeenCalled())
    const geojson = map.addSource.mock.calls[0][1].data as GeoJSON.FeatureCollection
    const lineA = geojson.features.find(f => (f.properties as { line_id: string }).line_id === 'A')
    expect((lineA?.properties as { status: string }).status).toBe('suspended')
  })

  it('assigns normal status to lines with no matching alert', async () => {
    const map = makeMapMock()
    // delayedTransit only affects '1'; 'A' should remain normal
    updateTransitLayer(map as unknown as MapboxMap, delayedTransit, nextCityId(), true)
    await vi.waitFor(() => expect(map.addSource).toHaveBeenCalled())
    const geojson = map.addSource.mock.calls[0][1].data as GeoJSON.FeatureCollection
    const lineA = geojson.features.find(f => (f.properties as { line_id: string }).line_id === 'A')
    expect((lineA?.properties as { status: string }).status).toBe('normal')
  })

  it('assigns normal status when transit is null', async () => {
    const map = makeMapMock()
    updateTransitLayer(map as unknown as MapboxMap, null, nextCityId(), true)
    await vi.waitFor(() => expect(map.addSource).toHaveBeenCalled())
    const geojson = map.addSource.mock.calls[0][1].data as GeoJSON.FeatureCollection
    geojson.features.forEach(f => {
      expect((f.properties as { status: string }).status).toBe('normal')
    })
  })

  it('sets visibility to none when visible is false', async () => {
    const map = makeMapMock()
    updateTransitLayer(map as unknown as MapboxMap, normalTransit, nextCityId(), false)
    await vi.waitFor(() => expect(map.setLayoutProperty).toHaveBeenCalled())
    expect(map.setLayoutProperty).toHaveBeenCalledWith('transit-lines', 'visibility', 'none')
  })

  it('sets visibility to visible when visible is true', async () => {
    const map = makeMapMock()
    updateTransitLayer(map as unknown as MapboxMap, normalTransit, nextCityId(), true)
    await vi.waitFor(() => expect(map.setLayoutProperty).toHaveBeenCalled())
    expect(map.setLayoutProperty).toHaveBeenCalledWith('transit-lines', 'visibility', 'visible')
  })

  it('matches comma-separated line IDs (WMATA format "RD, BL")', async () => {
    const wmataGeojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: [[-77.0, 38.9]] },
          properties: { line_id: 'RD', line_name: 'Red Line', color: '#BF0D3E' },
        },
      ],
    }
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => wmataGeojson,
    } as Response)

    const wmataTransit: TransitData = {
      provider: 'wmata',
      alerts: [{ line: 'RD, BL', message: 'Delays', severity: 'minor' }],
      delayCount: 1,
      status: 'disrupted',
    }
    const map = makeMapMock()
    updateTransitLayer(map as unknown as MapboxMap, wmataTransit, nextCityId(), true)
    await vi.waitFor(() => expect(map.addSource).toHaveBeenCalled())
    const geojson = map.addSource.mock.calls[0][1].data as GeoJSON.FeatureCollection
    const rdFeature = geojson.features.find(f => (f.properties as { line_id: string }).line_id === 'RD')
    expect((rdFeature?.properties as { status: string }).status).toBe('delayed')
  })

  it('calls setData when source already exists (cache hit, subsequent update)', async () => {
    const cityId = nextCityId()
    const mockSetData = vi.fn()

    // First call: source does not exist → addSource
    const map1 = makeMapMock()
    updateTransitLayer(map1 as unknown as MapboxMap, normalTransit, cityId, true)
    await vi.waitFor(() => expect(map1.addSource).toHaveBeenCalled())

    // Second call: source exists → setData
    const map2 = makeMapMock()
    map2.getSource.mockReturnValue({ setData: mockSetData })
    updateTransitLayer(map2 as unknown as MapboxMap, normalTransit, cityId, true)
    // Cache is warm — synchronous execution
    expect(mockSetData).toHaveBeenCalled()
  })

  it('does nothing when fetch fails (network error)', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))
    const map = makeMapMock()
    updateTransitLayer(map as unknown as MapboxMap, normalTransit, nextCityId(), true)
    // Wait a tick; no source should be added
    await new Promise(r => setTimeout(r, 10))
    expect(map.addSource).not.toHaveBeenCalled()
  })

  it('does nothing when fetch returns non-ok response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false } as Response)
    const map = makeMapMock()
    updateTransitLayer(map as unknown as MapboxMap, normalTransit, nextCityId(), true)
    await new Promise(r => setTimeout(r, 10))
    expect(map.addSource).not.toHaveBeenCalled()
  })

  it('skips addSource when style is not yet loaded after fetch', async () => {
    const map = makeMapMock()
    map.isStyleLoaded.mockReturnValue(false)
    updateTransitLayer(map as unknown as MapboxMap, normalTransit, nextCityId(), true)
    await new Promise(r => setTimeout(r, 20))
    expect(map.addSource).not.toHaveBeenCalled()
  })

  it('does not re-register event handlers on a second call with the same map', async () => {
    const cityId = nextCityId()
    const map = makeMapMock()

    updateTransitLayer(map as unknown as MapboxMap, normalTransit, cityId, true)
    await vi.waitFor(() => expect(map.on).toHaveBeenCalled())
    const onCallCount = map.on.mock.calls.length

    // Second call: source now exists
    map.getSource.mockReturnValue({ setData: vi.fn() })
    updateTransitLayer(map as unknown as MapboxMap, normalTransit, cityId, true)

    // No additional on() calls after the first registration
    expect(map.on.mock.calls.length).toBe(onCallCount)
  })

  it('tracks hover state in mousemove and clears it on mouseleave', async () => {
    const map = makeMapMock()
    updateTransitLayer(map as unknown as MapboxMap, normalTransit, nextCityId(), true)
    await vi.waitFor(() => expect(map.on).toHaveBeenCalled())

    type Handler = (e?: { features?: Array<{ id?: string | number }> }) => void
    const mousemoveCall = map.on.mock.calls.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (c: any[]) => c[0] === 'mousemove'
    ) as [string, string, Handler] | undefined
    const mouseleaveCall = map.on.mock.calls.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (c: any[]) => c[0] === 'mouseleave'
    ) as [string, string, Handler] | undefined

    if (!mousemoveCall || !mouseleaveCall) return

    const onMousemove = mousemoveCall[2]
    const onMouseleave = mouseleaveCall[2]

    // Hover over feature 1
    onMousemove({ features: [{ id: 1 }] })
    expect(map.setFeatureState).toHaveBeenCalledWith(
      { source: 'transit-lines', id: 1 },
      { hover: true }
    )

    // Move to feature 2 — prev (1) should be cleared first
    onMousemove({ features: [{ id: 2 }] })
    expect(map.setFeatureState).toHaveBeenCalledWith(
      { source: 'transit-lines', id: 1 },
      { hover: false }
    )

    // Leave — current (2) should be cleared
    onMouseleave()
    expect(map.setFeatureState).toHaveBeenCalledWith(
      { source: 'transit-lines', id: 2 },
      { hover: false }
    )
  })

  it('handles mousemove with no features without throwing', async () => {
    const map = makeMapMock()
    updateTransitLayer(map as unknown as MapboxMap, normalTransit, nextCityId(), true)
    await vi.waitFor(() => expect(map.on).toHaveBeenCalled())

    type Handler = (e?: { features?: Array<{ id?: string | number }> }) => void
    const mousemoveCall = map.on.mock.calls.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (c: any[]) => c[0] === 'mousemove'
    ) as [string, string, Handler] | undefined
    if (!mousemoveCall) return

    // No features → id is undefined → no setFeatureState call
    expect(() => mousemoveCall[2]({ features: [] })).not.toThrow()
    expect(map.setFeatureState).not.toHaveBeenCalled()
  })
})
