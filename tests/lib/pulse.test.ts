import { describe, it, expect } from 'vitest'
import { computePulseScore, getPulseLabel, getPulseColor, getTimeOfDayScore } from '@/lib/pulse'
import type { CitySnapshot } from '@/lib/types'

function makeMockSnapshot(overrides: Partial<CitySnapshot> = {}): CitySnapshot {
  return {
    city: {
      id: 'new-york',
      name: 'New York',
      state: 'NY',
      lat: 40.7128,
      lng: -74.006,
      zoom: 12,
      timezone: 'America/New_York',
      mapStyle: 'mapbox://styles/mapbox/dark-v11',
      transitProvider: 'mta',
      crimeProvider: 'nyc-open-data',
    },
    weather: {
      temperature: 72,
      feelsLike: 70,
      condition: 'Clear',
      humidity: 50,
      windSpeed: 10,
      hourlyForecast: [],
    },
    airQuality: { aqi: 50, category: 'Moderate', dominantPollutant: 'PM2.5' },
    events: { tonight: [], count: 25, totalCapacity: 50000 },
    transit: { provider: 'mta', alerts: [], delayCount: 0, status: 'normal' },
    pulseScore: 0,
    pulseLabel: 'Calm',
    pulseColor: '#4ADE80',
    pulseComponents: { eventScore: 0, crowdScore: 0, transitScore: 0, aqScore: 0, timeScore: 0 },
    // 2024-07-15T23:00:00Z = 19:00 EDT (UTC-4, summer) → timeScore 20
    timestamp: '2024-07-15T23:00:00.000Z',
    anomalies: [],
    ...overrides,
  }
}

describe('computePulseScore', () => {
  it('returns correct value for known inputs', () => {
    // eventScore  = (25/50)*25     = 12.5
    // crowdScore  = (50000/100000)*20 = 10
    // transitScore = 20 - 0*1.5   = 20
    // aqScore     = 15 - 50/10    = 10
    // timeScore   = 20 (19:00 EDT)
    // total = 72.5 → round → 73
    expect(computePulseScore(makeMockSnapshot())).toBe(73)
  })

  it('score never exceeds 100', () => {
    const snapshot = makeMockSnapshot({
      events: { tonight: [], count: 1000, totalCapacity: 10_000_000 },
      airQuality: { aqi: 0, category: 'Good', dominantPollutant: 'PM2.5' },
    })
    expect(computePulseScore(snapshot)).toBe(100)
  })

  it('score never drops below 0', () => {
    // 2024-07-15T07:00:00Z = 03:00 EDT → timeScore 2; all other components clamp to 0
    const snapshot = makeMockSnapshot({
      events: { tonight: [], count: 0, totalCapacity: 0 },
      transit: { provider: 'mta', alerts: [], delayCount: 100, status: 'disrupted' },
      airQuality: { aqi: 300, category: 'Hazardous', dominantPollutant: 'PM2.5' },
      timestamp: '2024-07-15T07:00:00.000Z',
    })
    expect(computePulseScore(snapshot)).toBeGreaterThanOrEqual(0)
  })
})

describe('getPulseLabel', () => {
  it('returns Quiet for score < 20', () => {
    expect(getPulseLabel(19)).toBe('Quiet')
  })

  it('returns Calm for score 20-39', () => {
    expect(getPulseLabel(20)).toBe('Calm')
  })

  it('returns Active for score 40-59', () => {
    expect(getPulseLabel(40)).toBe('Active')
  })

  it('returns Buzzing for score 60-79', () => {
    expect(getPulseLabel(60)).toBe('Buzzing')
  })

  it('returns Intense for score >= 80', () => {
    expect(getPulseLabel(80)).toBe('Intense')
  })
})

describe('getPulseColor', () => {
  it('returns blue hex for Quiet range', () => {
    expect(getPulseColor(19)).toBe('#60A5FA')
  })

  it('returns green hex for Calm range', () => {
    expect(getPulseColor(20)).toBe('#4ADE80')
  })

  it('returns amber hex for Active range', () => {
    expect(getPulseColor(40)).toBe('#E8A020')
  })

  it('returns orange hex for Buzzing range', () => {
    expect(getPulseColor(60)).toBe('#F97316')
  })

  it('returns red hex for Intense range', () => {
    expect(getPulseColor(80)).toBe('#EF4444')
  })
})

describe('getTimeOfDayScore', () => {
  it('returns 20 for evening hours 18-22', () => {
    // 2024-07-15T23:00:00Z = 19:00 EDT (UTC-4, summer)
    expect(getTimeOfDayScore('2024-07-15T23:00:00.000Z', 'America/New_York')).toBe(20)
  })

  it('returns lowest score for overnight hours', () => {
    // 2024-07-15T07:00:00Z = 03:00 EDT (UTC-4, summer) → hour 3 → 2
    expect(getTimeOfDayScore('2024-07-15T07:00:00.000Z', 'America/New_York')).toBe(2)
  })
})
