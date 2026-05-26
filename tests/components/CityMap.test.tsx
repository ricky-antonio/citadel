import React from 'react'
import { render, act, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import CityMap from '@/components/map/CityMap'
import { CITIES } from '@/lib/cities'

const { mockFlyTo, mockSetStyle, mockGetMap, themeHolder } = vi.hoisted(() => {
  const _mockFlyTo = vi.fn()
  const _mockSetStyle = vi.fn()
  const _mockGetMap = vi.fn()
  return {
    mockFlyTo: _mockFlyTo,
    mockSetStyle: _mockSetStyle,
    mockGetMap: _mockGetMap,
    themeHolder: { theme: 'dark' as string },
  }
})

vi.mock('@/components/map/MapLayers', () => ({
  default: () => null,
}))

vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: themeHolder.theme, setTheme: vi.fn() }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}))

vi.mock('react-map-gl/mapbox', async () => {
  const { forwardRef, useImperativeHandle, createElement } = await import('react')
  return {
    Map: forwardRef(function MockMap(
      props: {
        children?: React.ReactNode
        style?: React.CSSProperties
        initialViewState?: { zoom?: number; longitude?: number; latitude?: number }
        mapboxAccessToken?: string
        mapStyle?: string
        attributionControl?: boolean
      },
      ref: React.Ref<{ flyTo: typeof mockFlyTo; getMap: typeof mockGetMap }>
    ) {
      useImperativeHandle(ref, () => ({
        flyTo: mockFlyTo,
        getMap: mockGetMap,
      }))
      return createElement(
        'div',
        { 'data-testid': 'mock-map', 'data-zoom': props.initialViewState?.zoom, style: props.style },
        props.children
      )
    }),
    useMap: () => ({ current: null }),
  }
})

const mockCity = CITIES[0] // New York
const mockCityChicago = CITIES[2] // Chicago

beforeEach(() => {
  themeHolder.theme = 'dark'
  mockGetMap.mockReturnValue({ setStyle: mockSetStyle })
})

describe('CityMap', () => {
  it('renders the map with correct testid', () => {
    render(<CityMap city={mockCity} snapshot={null} activeLayers={[]} />)
    expect(screen.getByTestId('mock-map')).toBeInTheDocument()
  })

  it('passes initialViewState zoom from city.zoom', () => {
    render(<CityMap city={mockCity} snapshot={null} activeLayers={[]} />)
    expect(screen.getByTestId('mock-map')).toHaveAttribute('data-zoom', String(mockCity.zoom))
  })

  it('renders with a full snapshot and multiple active layers', () => {
    render(<CityMap city={mockCity} snapshot={null} activeLayers={['air-quality', 'transit']} />)
    expect(screen.getByTestId('mock-map')).toBeInTheDocument()
  })

  it('does not call flyTo on initial mount', () => {
    render(<CityMap city={mockCity} snapshot={null} activeLayers={[]} />)
    expect(mockFlyTo).not.toHaveBeenCalled()
  })

  it('calls flyTo with new city coordinates when city prop changes', async () => {
    const { rerender } = render(<CityMap city={mockCity} snapshot={null} activeLayers={[]} />)
    await act(async () => {
      rerender(<CityMap city={mockCityChicago} snapshot={null} activeLayers={[]} />)
    })
    expect(mockFlyTo).toHaveBeenCalledWith({
      center: [mockCityChicago.lng, mockCityChicago.lat],
      zoom: mockCityChicago.zoom,
      duration: 1500,
      essential: true,
    })
  })

  it('does not call setStyle on initial mount', () => {
    render(<CityMap city={mockCity} snapshot={null} activeLayers={[]} />)
    expect(mockSetStyle).not.toHaveBeenCalled()
  })

  it('calls setStyle with light style when theme changes to light', async () => {
    const { rerender } = render(<CityMap city={mockCity} snapshot={null} activeLayers={[]} />)
    themeHolder.theme = 'light'
    await act(async () => {
      rerender(<CityMap city={mockCity} snapshot={null} activeLayers={[]} />)
    })
    expect(mockSetStyle).toHaveBeenCalledWith('mapbox://styles/mapbox/light-v11')
  })

  it('calls setStyle with city dark style when theme changes back to dark', async () => {
    themeHolder.theme = 'light'
    const { rerender } = render(<CityMap city={mockCity} snapshot={null} activeLayers={[]} />)
    themeHolder.theme = 'dark'
    await act(async () => {
      rerender(<CityMap city={mockCity} snapshot={null} activeLayers={[]} />)
    })
    expect(mockSetStyle).toHaveBeenCalledWith(mockCity.mapStyle)
  })
})
