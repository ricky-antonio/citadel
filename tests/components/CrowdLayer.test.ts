import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Map as MapboxMap } from 'mapbox-gl'
import { updateCrowdLayer } from '@/components/map/CrowdLayer'
import type { EventsData } from '@/lib/types'

function makeMapMock() {
  return {
    getSource: vi.fn().mockReturnValue(null),
    addSource: vi.fn(),
    addLayer: vi.fn(),
    setLayoutProperty: vi.fn(),
    isStyleLoaded: vi.fn().mockReturnValue(true),
    on: vi.fn(),
  }
}

// Midtown polygon: lng [-74.000, -73.970], lat [40.748, 40.764]
const mockNeighbourhoods: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-74.000, 40.748], [-73.970, 40.748], [-73.970, 40.764],
          [-74.000, 40.764], [-74.000, 40.748],
        ]],
      },
      properties: { name: 'Midtown', city: 'new-york' },
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-74.015, 40.700], [-73.985, 40.700], [-73.985, 40.720],
          [-74.015, 40.720], [-74.015, 40.700],
        ]],
      },
      properties: { name: 'Lower Manhattan', city: 'new-york' },
    },
  ],
}

// Event inside Midtown (lat 40.755, lng -73.985)
const eventsWithMidtownEvent: EventsData = {
  count: 1,
  totalCapacity: 1000,
  tonight: [
    {
      id: '1',
      name: 'Concert at MSG',
      venue: 'Madison Square Garden',
      time: '8:00 PM',
      capacity: 1000,
      source: 'ticketmaster',
      lat: 40.755,
      lng: -73.985,
    },
  ],
}

// Event outside both polygons
const eventsOutsidePolygons: EventsData = {
  count: 1,
  totalCapacity: 500,
  tonight: [
    {
      id: '2',
      name: 'Concert in Brooklyn',
      venue: 'Barclays Center',
      time: '7:00 PM',
      capacity: 500,
      source: 'ticketmaster',
      lat: 40.683,
      lng: -73.975,
    },
  ],
}

let testId = 0
function nextCityId() {
  return `crowd-test-city-${++testId}`
}

beforeEach(() => {
  vi.mocked(fetch).mockResolvedValue({
    ok: true,
    json: async () => mockNeighbourhoods,
  } as Response)
})

describe('updateCrowdLayer', () => {
  it('does not fetch when cityId is empty string', () => {
    const map = makeMapMock()
    updateCrowdLayer(map as unknown as MapboxMap, null, '', true)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('fetches GeoJSON on first call and adds source and fill layer', async () => {
    const map = makeMapMock()
    updateCrowdLayer(map as unknown as MapboxMap, null, nextCityId(), true)
    await vi.waitFor(() => expect(map.addSource).toHaveBeenCalled())
    expect(map.addLayer).toHaveBeenCalled()
    const layerCall = map.addLayer.mock.calls[0][0]
    expect(layerCall.type).toBe('fill')
    expect(layerCall.paint['fill-color']).toBe('#E8A020')
  })

  it('assigns crowd_score 0 when events list is empty', async () => {
    const map = makeMapMock()
    const emptyEvents: EventsData = { count: 0, totalCapacity: 0, tonight: [] }
    updateCrowdLayer(map as unknown as MapboxMap, emptyEvents, nextCityId(), true)
    await vi.waitFor(() => expect(map.addSource).toHaveBeenCalled())
    const geojson = map.addSource.mock.calls[0][1].data as GeoJSON.FeatureCollection
    geojson.features.forEach(f => {
      expect((f.properties as { crowd_score: number }).crowd_score).toBe(0)
    })
  })

  it('assigns crowd_score 0 when events is null', async () => {
    const map = makeMapMock()
    updateCrowdLayer(map as unknown as MapboxMap, null, nextCityId(), true)
    await vi.waitFor(() => expect(map.addSource).toHaveBeenCalled())
    const geojson = map.addSource.mock.calls[0][1].data as GeoJSON.FeatureCollection
    expect((geojson.features[0].properties as { crowd_score: number }).crowd_score).toBe(0)
  })

  it('assigns positive crowd_score for an event inside the polygon bounding box', async () => {
    const map = makeMapMock()
    updateCrowdLayer(map as unknown as MapboxMap, eventsWithMidtownEvent, nextCityId(), true)
    await vi.waitFor(() => expect(map.addSource).toHaveBeenCalled())
    const geojson = map.addSource.mock.calls[0][1].data as GeoJSON.FeatureCollection
    const midtown = geojson.features.find(
      f => (f.properties as { name: string }).name === 'Midtown'
    )
    expect((midtown?.properties as { crowd_score: number }).crowd_score).toBeGreaterThan(0)
  })

  it('assigns 0 crowd_score for a neighbourhood with no nearby events', async () => {
    const map = makeMapMock()
    // eventsWithMidtownEvent has a Midtown event — Lower Manhattan should still be 0
    updateCrowdLayer(map as unknown as MapboxMap, eventsWithMidtownEvent, nextCityId(), true)
    await vi.waitFor(() => expect(map.addSource).toHaveBeenCalled())
    const geojson = map.addSource.mock.calls[0][1].data as GeoJSON.FeatureCollection
    const lower = geojson.features.find(
      f => (f.properties as { name: string }).name === 'Lower Manhattan'
    )
    expect((lower?.properties as { crowd_score: number }).crowd_score).toBe(0)
  })

  it('assigns 0 crowd_score when event coordinates are outside all polygons', async () => {
    const map = makeMapMock()
    updateCrowdLayer(map as unknown as MapboxMap, eventsOutsidePolygons, nextCityId(), true)
    await vi.waitFor(() => expect(map.addSource).toHaveBeenCalled())
    const geojson = map.addSource.mock.calls[0][1].data as GeoJSON.FeatureCollection
    geojson.features.forEach(f => {
      expect((f.properties as { crowd_score: number }).crowd_score).toBe(0)
    })
  })

  it('clamps crowd_score to maximum 1.0 for high event counts', async () => {
    const map = makeMapMock()
    // 10 events in Midtown — score should cap at 1
    const manyEvents: EventsData = {
      count: 10,
      totalCapacity: 10000,
      tonight: Array.from({ length: 10 }, (_, i) => ({
        id: String(i),
        name: `Event ${i}`,
        venue: 'Venue',
        time: '8:00 PM',
        capacity: 1000,
        source: 'ticketmaster' as const,
        lat: 40.755,
        lng: -73.985,
      })),
    }
    updateCrowdLayer(map as unknown as MapboxMap, manyEvents, nextCityId(), true)
    await vi.waitFor(() => expect(map.addSource).toHaveBeenCalled())
    const geojson = map.addSource.mock.calls[0][1].data as GeoJSON.FeatureCollection
    const midtown = geojson.features.find(
      f => (f.properties as { name: string }).name === 'Midtown'
    )
    expect((midtown?.properties as { crowd_score: number }).crowd_score).toBeLessThanOrEqual(1)
  })

  it('sets visibility to none when visible is false', async () => {
    const map = makeMapMock()
    updateCrowdLayer(map as unknown as MapboxMap, null, nextCityId(), false)
    await vi.waitFor(() => expect(map.setLayoutProperty).toHaveBeenCalled())
    expect(map.setLayoutProperty).toHaveBeenCalledWith('crowd-fill', 'visibility', 'none')
  })

  it('calls setData when source already exists (subsequent update)', async () => {
    const cityId = nextCityId()
    const mockSetData = vi.fn()

    // First call: populate cache
    const map1 = makeMapMock()
    updateCrowdLayer(map1 as unknown as MapboxMap, null, cityId, true)
    await vi.waitFor(() => expect(map1.addSource).toHaveBeenCalled())

    // Second call: source exists → setData
    const map2 = makeMapMock()
    map2.getSource.mockReturnValue({ setData: mockSetData })
    updateCrowdLayer(map2 as unknown as MapboxMap, null, cityId, true)
    expect(mockSetData).toHaveBeenCalled()
  })

  it('does nothing when fetch fails', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))
    const map = makeMapMock()
    updateCrowdLayer(map as unknown as MapboxMap, null, nextCityId(), true)
    await new Promise(r => setTimeout(r, 10))
    expect(map.addSource).not.toHaveBeenCalled()
  })

  it('skips addSource when style is not loaded after fetch', async () => {
    const map = makeMapMock()
    map.isStyleLoaded.mockReturnValue(false)
    updateCrowdLayer(map as unknown as MapboxMap, null, nextCityId(), true)
    await new Promise(r => setTimeout(r, 20))
    expect(map.addSource).not.toHaveBeenCalled()
  })

  it('assigns crowd_score 0 for non-Polygon geometry features', async () => {
    const pointGeoJson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [-73.99, 40.75] },
          properties: { name: 'Not a polygon', city: 'new-york' },
        },
      ],
    }
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => pointGeoJson,
    } as Response)
    const map = makeMapMock()
    updateCrowdLayer(map as unknown as MapboxMap, eventsWithMidtownEvent, nextCityId(), true)
    await vi.waitFor(() => expect(map.addSource).toHaveBeenCalled())
    const geojson = map.addSource.mock.calls[0][1].data as GeoJSON.FeatureCollection
    expect((geojson.features[0].properties as { crowd_score: number }).crowd_score).toBe(0)
  })

  it('assigns 0 crowd_score for events missing lat/lng coordinates', async () => {
    const map = makeMapMock()
    const eventsNoCoords: EventsData = {
      count: 1,
      totalCapacity: 500,
      tonight: [
        { id: '99', name: 'No Coord Event', venue: 'Venue', time: '8pm', capacity: 500, source: 'ticketmaster' },
      ],
    }
    updateCrowdLayer(map as unknown as MapboxMap, eventsNoCoords, nextCityId(), true)
    await vi.waitFor(() => expect(map.addSource).toHaveBeenCalled())
    const geojson = map.addSource.mock.calls[0][1].data as GeoJSON.FeatureCollection
    geojson.features.forEach(f => {
      expect((f.properties as { crowd_score: number }).crowd_score).toBe(0)
    })
  })
})
