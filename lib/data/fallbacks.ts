import type { WeatherData, AirQualityData, EventsData, TransitData } from '@/lib/types'

export const WEATHER_FALLBACK: WeatherData = {
  temperature: 0,
  feelsLike: 0,
  condition: 'Unavailable',
  humidity: 0,
  windSpeed: 0,
  hourlyForecast: [],
}

export const AIR_QUALITY_FALLBACK: AirQualityData = {
  aqi: 0,
  category: 'Unavailable',
  dominantPollutant: 'Unavailable',
}

export const EVENTS_FALLBACK: EventsData = {
  count: 0,
  totalCapacity: 0,
  tonight: [],
}

export const TRANSIT_FALLBACK: TransitData = {
  provider: 'mta',
  alerts: [],
  delayCount: 0,
  status: 'unknown',
}

export const CRIME_FALLBACK: Record<string, unknown> = {}
