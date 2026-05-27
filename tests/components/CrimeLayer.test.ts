import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Popup } from 'mapbox-gl'
import { updateCrimeLayer } from '@/components/map/CrimeLayer'
import type { CrimeData } from '@/lib/types'

const mockPopupMethods = vi.hoisted(() => ({
  setLngLat: vi.fn().mockReturnThis(),
  setHTML: vi.fn().mockReturnThis(),
  addTo: vi.fn().mockReturnThis(),
}))

vi.mock('mapbox-gl', () => ({
  Popup: vi.fn().mockImplementation(function (this: Record<string, unknown>) {
    this.setLngLat = mockPopupMethods.setLngLat
    this.setHTML = mockPopupMethods.setHTML
    this.addTo = mockPopupMethods.addTo
  }),
}))

function makeFreshMap() {
  return {
    getSource: vi.fn().mockReturnValue(null),
    addSource: vi.fn(),
    addLayer: vi.fn(),
    setLayoutProperty: vi.fn(),
    on: vi.fn(),
    queryRenderedFeatures: vi.fn(),
    getCanvas: vi.fn().mockReturnValue({ style: { cursor: '' } }),
    easeTo: vi.fn(),
  }
}

const mockMap = {
  getSource: vi.fn().mockReturnValue(null),
  addSource: vi.fn(),
  addLayer: vi.fn(),
  setLayoutProperty: vi.fn(),
  on: vi.fn(),
  queryRenderedFeatures: vi.fn(),
  getCanvas: vi.fn().mockReturnValue({ style: { cursor: '' } }),
}

const mockCrime: CrimeData = {
  safetyScore: 60,
  totalIncidents: 500,
  recentIncidents: [
    { lat: 40.71, lng: -74.01, category: 'THEFT', date: '2024-01-01' },
    { lat: 40.72, lng: -74.02, category: 'ASSAULT', date: '2024-01-02' },
  ],
}

beforeEach(() => {
  mockMap.getSource.mockReturnValue(null)
  vi.clearAllMocks()
  mockMap.getCanvas.mockReturnValue({ style: { cursor: '' } })
})

describe('updateCrimeLayer', () => {
  it('adds source and three layers on first call', () => {
    updateCrimeLayer(mockMap as never, mockCrime, true)
    expect(mockMap.addSource).toHaveBeenCalledWith('crime-incidents', expect.objectContaining({
      type: 'geojson',
      cluster: true,
    }))
    expect(mockMap.addLayer).toHaveBeenCalledTimes(3)
  })

  it('maps recentIncidents to GeoJSON features with correct coordinates', () => {
    updateCrimeLayer(mockMap as never, mockCrime, true)
    const sourceCall = mockMap.addSource.mock.calls[0]
    const geojson = sourceCall[1].data as GeoJSON.FeatureCollection
    expect(geojson.features).toHaveLength(2)
    expect(geojson.features[0].geometry).toMatchObject({
      type: 'Point',
      coordinates: [-74.01, 40.71],
    })
  })

  it('passes category and date as feature properties', () => {
    updateCrimeLayer(mockMap as never, mockCrime, true)
    const sourceCall = mockMap.addSource.mock.calls[0]
    const geojson = sourceCall[1].data as GeoJSON.FeatureCollection
    expect(geojson.features[0].properties).toMatchObject({
      category: 'THEFT',
      date: '2024-01-01',
    })
  })

  it('produces empty FeatureCollection when crime is null', () => {
    updateCrimeLayer(mockMap as never, null, true)
    const sourceCall = mockMap.addSource.mock.calls[0]
    const geojson = sourceCall[1].data as GeoJSON.FeatureCollection
    expect(geojson.features).toHaveLength(0)
  })

  it('calls setData on existing source instead of re-adding', () => {
    const mockSetData = vi.fn()
    mockMap.getSource.mockReturnValue({ setData: mockSetData })
    updateCrimeLayer(mockMap as never, mockCrime, true)
    expect(mockSetData).toHaveBeenCalledOnce()
    expect(mockMap.addSource).not.toHaveBeenCalled()
  })

  it('sets all three layers to visible when visible=true', () => {
    updateCrimeLayer(mockMap as never, mockCrime, true)
    const calls = mockMap.setLayoutProperty.mock.calls as unknown[][]
    const ids = calls.map(c => c[0] as string)
    expect(ids).toContain('crime-clusters')
    expect(ids).toContain('crime-cluster-count')
    expect(ids).toContain('crime-points')
    calls.forEach(c => expect(c[2]).toBe('visible'))
  })

  it('sets all three layers to none when visible=false', () => {
    updateCrimeLayer(mockMap as never, mockCrime, false)
    const calls = mockMap.setLayoutProperty.mock.calls as unknown[][]
    calls.forEach(c => expect(c[2]).toBe('none'))
  })
})

describe('updateCrimeLayer event handlers', () => {
  type OnCall = [string, string, (...args: unknown[]) => void]

  function getHandler(map: ReturnType<typeof makeFreshMap>, event: string, layer: string) {
    const calls = map.on.mock.calls as OnCall[]
    return calls.find(c => c[0] === event && c[1] === layer)?.[2]
  }

  it('cluster click calls easeTo with expansion zoom', () => {
    const freshMap = makeFreshMap()
    const mockGetClusterExpansionZoom = vi.fn(
      (_id: number, cb: (err: Error | null, zoom: number) => void) => cb(null, 12)
    )
    const mockSource = { setData: vi.fn(), getClusterExpansionZoom: mockGetClusterExpansionZoom }
    freshMap.getSource.mockReturnValueOnce(null).mockReturnValue(mockSource)
    updateCrimeLayer(freshMap as never, mockCrime, true)

    const handler = getHandler(freshMap, 'click', 'crime-clusters')
    expect(handler).toBeDefined()

    const mockFeature = {
      properties: { cluster_id: 42 },
      geometry: { type: 'Point', coordinates: [-74.0, 40.7] },
    }
    freshMap.queryRenderedFeatures.mockReturnValue([mockFeature])
    handler!({ point: [100, 100] })

    expect(freshMap.easeTo).toHaveBeenCalledWith({ center: [-74.0, 40.7], zoom: 12 })
  })

  it('cluster click does nothing when no features returned', () => {
    const freshMap = makeFreshMap()
    updateCrimeLayer(freshMap as never, mockCrime, true)

    const handler = getHandler(freshMap, 'click', 'crime-clusters')
    freshMap.queryRenderedFeatures.mockReturnValue([])
    handler!({ point: [100, 100] })

    expect(freshMap.easeTo).not.toHaveBeenCalled()
  })

  it('cluster click does nothing when cluster_id is undefined', () => {
    const freshMap = makeFreshMap()
    updateCrimeLayer(freshMap as never, mockCrime, true)

    const handler = getHandler(freshMap, 'click', 'crime-clusters')
    freshMap.queryRenderedFeatures.mockReturnValue([{
      properties: {},
      geometry: { type: 'Point', coordinates: [-74.0, 40.7] },
    }])
    handler!({ point: [100, 100] })

    expect(freshMap.easeTo).not.toHaveBeenCalled()
  })

  it('cluster click does nothing when getClusterExpansionZoom returns error', () => {
    const freshMap = makeFreshMap()
    const mockGetClusterExpansionZoom = vi.fn(
      (_id: number, cb: (err: Error | null, zoom: number | null) => void) => cb(new Error('fail'), null)
    )
    const mockSource = { setData: vi.fn(), getClusterExpansionZoom: mockGetClusterExpansionZoom }
    freshMap.getSource.mockReturnValueOnce(null).mockReturnValue(mockSource)
    updateCrimeLayer(freshMap as never, mockCrime, true)

    const handler = getHandler(freshMap, 'click', 'crime-clusters')
    freshMap.queryRenderedFeatures.mockReturnValue([{
      properties: { cluster_id: 42 },
      geometry: { type: 'Point', coordinates: [-74.0, 40.7] },
    }])
    handler!({ point: [100, 100] })

    expect(freshMap.easeTo).not.toHaveBeenCalled()
  })

  it('point click creates Popup with coordinates and HTML', () => {
    const freshMap = makeFreshMap()
    updateCrimeLayer(freshMap as never, mockCrime, true)

    const handler = getHandler(freshMap, 'click', 'crime-points')
    expect(handler).toBeDefined()

    handler!({
      features: [{
        properties: { category: 'THEFT', date: '2024-01-01' },
        geometry: { type: 'Point', coordinates: [-74.01, 40.71] },
      }],
    })

    expect(Popup).toHaveBeenCalled()
    expect(mockPopupMethods.setLngLat).toHaveBeenCalledWith([-74.01, 40.71])
    expect(mockPopupMethods.addTo).toHaveBeenCalled()
  })

  it('point click does nothing when features have no properties', () => {
    const freshMap = makeFreshMap()
    updateCrimeLayer(freshMap as never, mockCrime, true)

    const handler = getHandler(freshMap, 'click', 'crime-points')
    handler!({ features: [{ properties: null, geometry: { type: 'Point', coordinates: [] } }] })

    expect(Popup).not.toHaveBeenCalled()
  })

  it('mouseenter cluster sets cursor to pointer', () => {
    const canvas = { style: { cursor: '' } }
    const freshMap = makeFreshMap()
    freshMap.getCanvas.mockReturnValue(canvas)
    updateCrimeLayer(freshMap as never, mockCrime, true)

    const handler = getHandler(freshMap, 'mouseenter', 'crime-clusters')
    handler!()

    expect(canvas.style.cursor).toBe('pointer')
  })

  it('mouseleave cluster resets cursor', () => {
    const canvas = { style: { cursor: 'pointer' } }
    const freshMap = makeFreshMap()
    freshMap.getCanvas.mockReturnValue(canvas)
    updateCrimeLayer(freshMap as never, mockCrime, true)

    const handler = getHandler(freshMap, 'mouseleave', 'crime-clusters')
    handler!()

    expect(canvas.style.cursor).toBe('')
  })
})
