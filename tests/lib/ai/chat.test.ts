import { describe, it, expect } from 'vitest'
import { buildSystemPrompt, buildUserMessage } from '@/lib/ai/chat'
import { buildCityContext } from '@/lib/ai/context'
import type { CitySnapshot } from '@/lib/types'

function makeMockSnapshot(): CitySnapshot {
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
    airQuality: { aqi: 42, category: 'Good', dominantPollutant: 'PM2.5', stations: [] },
    events: { count: 5, totalCapacity: 10000, tonight: [] },
    transit: { provider: 'mta', alerts: [], delayCount: 0, status: 'normal' },
    pulseScore: 55,
    pulseLabel: 'Active',
    pulseColor: '#E8A020',
    pulseComponents: { eventScore: 10, crowdScore: 10, transitScore: 15, aqScore: 10, timeScore: 10 },
    timestamp: '2024-06-15T20:00:00.000Z',
    anomalies: [],
    crime: { totalIncidents: 0, recentIncidents: [], safetyScore: 50 },
  }
}

describe('buildSystemPrompt', () => {
  it('includes the city name', () => {
    const result = buildSystemPrompt(makeMockSnapshot())
    expect(result).toContain('New York')
  })

  it('identifies itself as Citadel', () => {
    const result = buildSystemPrompt(makeMockSnapshot())
    expect(result).toContain('Citadel')
  })
})

describe('buildUserMessage', () => {
  it('includes the user question', () => {
    const result = buildUserMessage('Is it safe to run outside?', makeMockSnapshot())
    expect(result).toContain('Is it safe to run outside?')
  })

  it('includes the city context string', () => {
    const snapshot = makeMockSnapshot()
    const result = buildUserMessage('test', snapshot)
    expect(result).toContain('Live city data:')
  })

  it('embeds buildCityContext output in the message', () => {
    const snapshot = makeMockSnapshot()
    const context = buildCityContext(snapshot)
    const result = buildUserMessage('test question', snapshot)
    expect(result).toContain(context)
  })

  it('places the user question after the city context', () => {
    const question = 'What is the weather like?'
    const result = buildUserMessage(question, makeMockSnapshot())
    const contextEnd = result.indexOf('User question:')
    const questionPos = result.indexOf(question)
    expect(contextEnd).toBeGreaterThan(0)
    expect(questionPos).toBeGreaterThan(contextEnd)
  })
})
