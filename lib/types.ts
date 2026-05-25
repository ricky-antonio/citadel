// ── Union types ─────────────────────────────────────────────────────────────

export type TransitProvider = 'mta' | 'sf-511' | 'cta' | 'wmata'
export type CrimeProvider = 'nyc-open-data' | 'datasf' | 'chicago-data-portal' | 'dc-open-data'
export type DataType = 'weather' | 'air_quality' | 'events' | 'transit' | 'crime'
export type MetricType = 'pulse' | 'aqi' | 'transit' | 'events'
export type PulseLabel = 'Quiet' | 'Calm' | 'Active' | 'Buzzing' | 'Intense'
export type TransitSeverity = 'minor' | 'major'

// ── City config ──────────────────────────────────────────────────────────────

export interface City {
  id: string
  name: string
  state: string
  lat: number
  lng: number
  zoom: number
  timezone: string
  mapStyle: string
  transitProvider: TransitProvider
  crimeProvider: CrimeProvider
}

// ── Weather ──────────────────────────────────────────────────────────────────

export interface HourlyForecast {
  time: string
  temperature: number
  condition: string
}

export interface WeatherData {
  temperature: number
  feelsLike: number
  condition: string
  humidity: number
  windSpeed: number
  hourlyForecast: HourlyForecast[]
}

// ── Air quality ───────────────────────────────────────────────────────────────

export interface AirQualityData {
  aqi: number
  category: string
  dominantPollutant: string
}

// ── Events ────────────────────────────────────────────────────────────────────

export interface Event {
  id: string
  name: string
  venue: string
  time: string
  capacity: number
  source: 'ticketmaster' | 'eventbrite'
}

export interface EventsData {
  tonight: Event[]
  count: number
  totalCapacity: number
}

// ── Transit ───────────────────────────────────────────────────────────────────

export interface TransitAlert {
  line: string
  message: string
  severity: TransitSeverity
  delayMinutes?: number
}

export interface TransitData {
  provider: TransitProvider
  alerts: TransitAlert[]
  delayCount: number
  status: 'normal' | 'disrupted' | 'unknown'
}

// ── Anomaly ───────────────────────────────────────────────────────────────────

export interface Anomaly {
  id?: string
  cityId: string
  metric: MetricType
  value: number
  baseline: number
  deviation: number
  description?: string
  occurredAt: string
}

// ── Chat ──────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

// ── API error ────────────────────────────────────────────────────────────────

export interface ApiError {
  error: string
  code: string
}

// ── Pulse ─────────────────────────────────────────────────────────────────────

export interface PulseComponents {
  eventScore: number
  crowdScore: number
  transitScore: number
  aqScore: number
  timeScore: number
}

// ── City snapshot ─────────────────────────────────────────────────────────────

export interface CitySnapshot {
  city: City
  weather: WeatherData
  airQuality: AirQualityData
  events: EventsData
  transit: TransitData
  pulseScore: number
  pulseLabel: PulseLabel
  pulseColor: string
  pulseComponents: PulseComponents
  timestamp: string
}

// ── Supabase row types ────────────────────────────────────────────────────────

export interface CacheRow {
  id: string
  payload: unknown
  fetched_at: string
  expires_at: string
}
