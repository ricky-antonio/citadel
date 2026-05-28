import type { City } from '@/lib/types'

export const CITIES: City[] = [
  {
    id: 'chicago',
    name: 'Chicago',
    state: 'Illinois',
    lat: 41.8781,
    lng: -87.6298,
    zoom: 12,
    timezone: 'America/Chicago',
    mapStyle: 'mapbox://styles/mapbox/dark-v11',
    transitProvider: 'cta',
    crimeProvider: 'chicago-data-portal',
  },
  {
    id: 'new-york',
    name: 'New York',
    state: 'New York',
    lat: 40.7128,
    lng: -74.006,
    zoom: 12,
    timezone: 'America/New_York',
    mapStyle: 'mapbox://styles/mapbox/dark-v11',
    transitProvider: 'mta',
    crimeProvider: 'nyc-open-data',
  },
  {
    id: 'san-francisco',
    name: 'San Francisco',
    state: 'California',
    lat: 37.7749,
    lng: -122.4194,
    zoom: 13,
    timezone: 'America/Los_Angeles',
    mapStyle: 'mapbox://styles/mapbox/dark-v11',
    transitProvider: 'sf-511',
    crimeProvider: 'datasf',
  },
  {
    id: 'washington-dc',
    name: 'Washington',
    state: 'D.C.',
    lat: 38.9072,
    lng: -77.0369,
    zoom: 13,
    timezone: 'America/New_York',
    mapStyle: 'mapbox://styles/mapbox/dark-v11',
    transitProvider: 'wmata',
    crimeProvider: 'dc-open-data',
  },
]

export function getCityById(id: string): City | undefined {
  return CITIES.find(c => c.id === id)
}
