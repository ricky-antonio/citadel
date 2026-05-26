import { describe, it, expect, vi } from 'vitest'
import type { Map as MapboxMap } from 'mapbox-gl'
import { updateAQLayer } from '@/components/map/AQLayer'
import type { AirQualityData } from '@/lib/types'

function makeMapMock() {
  const mockSetData = vi.fn()
  return {
    getSource: vi.fn().mockReturnValue(null),
    addSource: vi.fn(),
    addLayer: vi.fn(),
    setLayoutProperty: vi.fn(),
    mockSetData,
  }
}

const airQualityWithStations: AirQualityData = {
  aqi: 55,
  category: 'Moderate',
  dominantPollutant: 'PM2.5',
  stations: [
    { lat: 40.71, lng: -74.01, aqi: 55 },
    { lat: 40.73, lng: -74.00, aqi: 65 },
  ],
}

const airQualityNoStations: AirQualityData = {
  aqi: 0,
  category: 'Good',
  dominantPollutant: 'PM2.5',
  stations: [],
}

describe('updateAQLayer', () => {
  it('adds source and heatmap layer on first call', () => {
    const map = makeMapMock()
    updateAQLayer(map as unknown as MapboxMap, airQualityWithStations, true)
    expect(map.addSource).toHaveBeenCalledWith('aq-stations', expect.objectContaining({ type: 'geojson' }))
    expect(map.addLayer).toHaveBeenCalledWith(expect.objectContaining({ type: 'heatmap' }))
  })

  it('creates GeoJSON Point features from stations', () => {
    const map = makeMapMock()
    updateAQLayer(map as unknown as MapboxMap, airQualityWithStations, true)
    const geojson = map.addSource.mock.calls[0][1].data as GeoJSON.FeatureCollection
    expect(geojson.features).toHaveLength(2)
    expect(geojson.features[0].geometry).toMatchObject({
      type: 'Point',
      coordinates: [-74.01, 40.71],
    })
  })

  it('creates empty FeatureCollection when airQuality is null', () => {
    const map = makeMapMock()
    updateAQLayer(map as unknown as MapboxMap, null, true)
    const geojson = map.addSource.mock.calls[0][1].data as GeoJSON.FeatureCollection
    expect(geojson.features).toHaveLength(0)
  })

  it('creates empty FeatureCollection when stations array is empty', () => {
    const map = makeMapMock()
    updateAQLayer(map as unknown as MapboxMap, airQualityNoStations, true)
    const geojson = map.addSource.mock.calls[0][1].data as GeoJSON.FeatureCollection
    expect(geojson.features).toHaveLength(0)
  })

  it('calls setData on existing source instead of adding a new one', () => {
    const mockSetData = vi.fn()
    const map = makeMapMock()
    map.getSource.mockReturnValue({ setData: mockSetData })
    updateAQLayer(map as unknown as MapboxMap, airQualityWithStations, true)
    expect(mockSetData).toHaveBeenCalled()
    expect(map.addSource).not.toHaveBeenCalled()
  })

  it('sets visibility to visible when visible is true', () => {
    const map = makeMapMock()
    updateAQLayer(map as unknown as MapboxMap, airQualityWithStations, true)
    expect(map.setLayoutProperty).toHaveBeenCalledWith('aq-heatmap', 'visibility', 'visible')
  })

  it('sets visibility to none when visible is false', () => {
    const map = makeMapMock()
    updateAQLayer(map as unknown as MapboxMap, airQualityWithStations, false)
    expect(map.setLayoutProperty).toHaveBeenCalledWith('aq-heatmap', 'visibility', 'none')
  })
})
