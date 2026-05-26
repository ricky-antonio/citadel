import { describe, it, expect } from 'vitest'
import { generateSuggestions } from '@/lib/ai/suggestions'
import type { CitySnapshot } from '@/lib/types'
import { CITIES } from '@/lib/cities'

function makeSnapshot(overrides: Partial<CitySnapshot['weather'] & { transitDelays: number; aqi: number; eventsTonight: number; pulse: number }> = {}): CitySnapshot {
  const temp = overrides.temperature ?? 72
  const condition = overrides.condition ?? 'Clear'
  const delayCount = overrides.transitDelays ?? 0
  const aqi = overrides.aqi ?? 42
  const eventsCount = overrides.eventsTonight ?? 0
  const pulse = overrides.pulse ?? 55

  return {
    city: CITIES[0],
    weather: { temperature: temp, feelsLike: temp - 2, condition, humidity: 50, windSpeed: 10, hourlyForecast: [] },
    airQuality: { aqi, category: 'Good', dominantPollutant: 'PM2.5', stations: [] },
    events: {
      count: eventsCount,
      totalCapacity: eventsCount * 500,
      tonight: Array.from({ length: eventsCount }, (_, i) => ({
        id: String(i),
        name: `Event ${i}`,
        venue: 'Venue',
        time: '8:00 PM',
        capacity: 500,
        source: 'ticketmaster' as const,
      })),
    },
    transit: {
      provider: 'mta',
      alerts: [],
      delayCount,
      status: delayCount > 0 ? 'disrupted' : 'normal',
    },
    pulseScore: pulse,
    pulseLabel: 'Active',
    pulseColor: '#E8A020',
    pulseComponents: { eventScore: 10, crowdScore: 10, transitScore: 15, aqScore: 10, timeScore: 10 },
    timestamp: new Date().toISOString(),
    anomalies: [],
  }
}

describe('generateSuggestions', () => {
  it('returns exactly 3 suggestions', () => {
    const result = generateSuggestions(makeSnapshot())
    expect(result).toHaveLength(3)
  })

  it('suggests heat warning when temperature is 90°F or above', () => {
    const result = generateSuggestions(makeSnapshot({ temperature: 95 }))
    expect(result[0]).toContain('hot')
  })

  it('suggests cold warning when temperature is 35°F or below', () => {
    const result = generateSuggestions(makeSnapshot({ temperature: 30 }))
    expect(result[0]).toContain('cold')
  })

  it('suggests umbrella when condition contains rain', () => {
    const result = generateSuggestions(makeSnapshot({ condition: 'Heavy Rain' }))
    expect(result[0]).toContain('umbrella')
  })

  it('suggests umbrella when condition contains storm', () => {
    const result = generateSuggestions(makeSnapshot({ condition: 'Thunderstorm' }))
    expect(result[0]).toContain('umbrella')
  })

  it('suggests going outside when weather is pleasant', () => {
    const result = generateSuggestions(makeSnapshot({ temperature: 72, condition: 'Clear' }))
    expect(result[0]).toContain('outside')
  })

  it('suggests most disrupted lines chip when delayCount is above 10', () => {
    const result = generateSuggestions(makeSnapshot({ transitDelays: 11 }))
    expect(result[1]).toContain('most disrupted')
  })

  it('suggests delays chip when delayCount is between 1 and 10', () => {
    const result = generateSuggestions(makeSnapshot({ transitDelays: 3 }))
    expect(result[1]).toContain('delays')
  })

  it('suggests transit running chip when no delays', () => {
    const result = generateSuggestions(makeSnapshot({ transitDelays: 0 }))
    expect(result[1]).toContain('transit')
  })

  it('suggests air quality chip when AQI is above 100', () => {
    const result = generateSuggestions(makeSnapshot({ aqi: 150 }))
    expect(result[2]).toContain('air quality')
  })

  it('suggests tonight events chip when events are scheduled', () => {
    const result = generateSuggestions(makeSnapshot({ aqi: 42, eventsTonight: 2 }))
    expect(result[2]).toContain('tonight')
  })

  it('suggests why active chip when pulse score is 75 or above', () => {
    const result = generateSuggestions(makeSnapshot({ aqi: 42, eventsTonight: 0, pulse: 80 }))
    expect(result[2]).toContain('active')
  })

  it('suggests why quiet chip when pulse score is 25 or below', () => {
    const result = generateSuggestions(makeSnapshot({ aqi: 42, eventsTonight: 0, pulse: 20 }))
    expect(result[2]).toContain('quiet')
  })

  it('suggests general info chip for mid-range pulse with no events or high AQI', () => {
    const result = generateSuggestions(makeSnapshot({ aqi: 42, eventsTonight: 0, pulse: 55 }))
    expect(result[2]).toContain('know about')
  })
})
