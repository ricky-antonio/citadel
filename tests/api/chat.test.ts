import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@/tests/mocks/supabase'
import { mockMessagesStream } from '@/tests/mocks/anthropic'

const mockLimit = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ success: true, limit: 20, remaining: 19, reset: 0 })
)

const mockSnapshot = vi.hoisted(() => ({
  city: {
    id: 'new-york',
    name: 'New York',
    state: 'New York',
    lat: 40.7128,
    lng: -74.006,
    zoom: 12,
    timezone: 'America/New_York',
    mapStyle: 'mapbox://styles/mapbox/dark-v11',
    transitProvider: 'mta' as const,
    crimeProvider: 'nyc-open-data' as const,
  },
  weather: { temperature: 72, feelsLike: 70, condition: 'Clear', humidity: 50, windSpeed: 10, hourlyForecast: [] },
  airQuality: { aqi: 42, category: 'Good', dominantPollutant: 'PM2.5', stations: [] },
  events: { count: 5, totalCapacity: 10000, tonight: [] },
  transit: { provider: 'mta' as const, alerts: [], delayCount: 0, status: 'normal' as const },
  pulseScore: 55,
  pulseLabel: 'Active' as const,
  pulseColor: '#E8A020',
  pulseComponents: { eventScore: 10, crowdScore: 10, transitScore: 15, aqScore: 10, timeScore: 10 },
  timestamp: '2024-06-15T20:00:00.000Z',
  anomalies: [],
}))

vi.mock('@upstash/ratelimit', () => ({
  Ratelimit: class {
    limit = mockLimit
    static slidingWindow = vi.fn().mockReturnValue({})
  },
}))

vi.mock('@vercel/kv', () => ({ kv: {} }))

vi.mock('@/lib/ai/briefing', () => ({
  getCitySnapshot: vi.fn().mockResolvedValue(mockSnapshot),
  getDailyBriefing: vi.fn().mockResolvedValue('Briefing text'),
}))

import { POST } from '@/app/api/chat/route'

function makeRequest(body: Record<string, unknown>) {
  return new Request('http://localhost/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/chat', () => {
  beforeEach(() => {
    mockLimit.mockResolvedValue({ success: true, limit: 20, remaining: 19, reset: 0 })
    mockMessagesStream.mockResolvedValue({
      toReadableStream: vi.fn(() => new ReadableStream()),
      finalMessage: vi.fn().mockResolvedValue({ usage: { input_tokens: 100, output_tokens: 50 } }),
      on: vi.fn((event: string, cb: (msg: unknown) => void) => {
        if (event === 'message' || event === 'finalMessage') {
          cb({ usage: { input_tokens: 100, output_tokens: 50 } })
        }
      }),
    })
  })

  it('returns 400 when message field is missing', async () => {
    const res = await POST(makeRequest({ cityId: 'new-york', history: [] }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.code).toBe('INVALID_INPUT')
    expect(body.error).toBeDefined()
  })

  it('returns 400 when cityId field is missing', async () => {
    const res = await POST(makeRequest({ message: 'Hello', history: [] }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.code).toBe('INVALID_INPUT')
    expect(body.error).toBeDefined()
  })

  it('returns 400 when message exceeds 500 characters', async () => {
    const res = await POST(makeRequest({ message: 'a'.repeat(501), cityId: 'new-york', history: [] }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.code).toBe('INVALID_INPUT')
  })

  it('returns 404 for unknown cityId "xyz"', async () => {
    const res = await POST(makeRequest({ message: 'Hello', cityId: 'xyz', history: [] }))
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.code).toBe('CITY_NOT_FOUND')
    expect(body.error).toBeDefined()
  })

  it('returns 429 when rate limit is exceeded', async () => {
    mockLimit.mockResolvedValueOnce({ success: false, limit: 20, remaining: 0, reset: Date.now() + 60000 })
    const res = await POST(makeRequest({ message: 'Hello', cityId: 'new-york', history: [] }))
    expect(res.status).toBe(429)
    const body = await res.json()
    expect(body.code).toBe('RATE_LIMITED')
    expect(body.error).toBeDefined()
  })

  it('returns a streaming response for valid input', async () => {
    const res = await POST(makeRequest({ message: 'What is the weather?', cityId: 'new-york', history: [] }))
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toBe('text/event-stream')
    expect(res.body).toBeInstanceOf(ReadableStream)
  })

  it('city name appears in the Anthropic system prompt', async () => {
    await POST(makeRequest({ message: 'test question', cityId: 'new-york', history: [] }))
    expect(mockMessagesStream).toHaveBeenCalledWith(
      expect.objectContaining({
        system: expect.stringContaining('New York'),
      })
    )
  })

  it('returns 500 with ApiError shape on Anthropic error', async () => {
    mockMessagesStream.mockRejectedValueOnce(new Error('Anthropic API unavailable'))
    const res = await POST(makeRequest({ message: 'test', cityId: 'new-york', history: [] }))
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.code).toBe('AI_ERROR')
    expect(body.error).toBeDefined()
  })
})
