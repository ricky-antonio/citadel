import { describe, it, expect } from 'vitest'
import { mockSupabaseSingle, mockSupabaseUpsert, mockSupabaseGt } from '@/tests/mocks/supabase'
import { getCached, setCached } from '@/lib/cache'

describe('getCached', () => {
  it('returns null when no row exists for city+type', async () => {
    mockSupabaseSingle.mockResolvedValueOnce({ data: null, error: null })
    const result = await getCached('new-york', 'weather')
    expect(result).toBeNull()
  })

  it('returns null when row exists but expires_at is in the past', async () => {
    // The query filters via .gt('expires_at', now) — a stale row is excluded at DB level
    mockSupabaseSingle.mockResolvedValueOnce({ data: null, error: null })
    await getCached('new-york', 'weather')
    expect(mockSupabaseGt).toHaveBeenCalledWith('expires_at', expect.any(String))
  })

  it('returns payload when row exists and is fresh', async () => {
    const payload = { temperature: 72, condition: 'Sunny' }
    mockSupabaseSingle.mockResolvedValueOnce({ data: { payload }, error: null })
    const result = await getCached('new-york', 'weather')
    expect(result).toEqual(payload)
  })
})

describe('setCached', () => {
  it('upserts row with correct expires_at for weather (30 min)', async () => {
    mockSupabaseUpsert.mockResolvedValueOnce({ error: null })
    await setCached('new-york', 'weather', { temperature: 72 })

    expect(mockSupabaseUpsert).toHaveBeenCalledOnce()
    const [data, opts] = mockSupabaseUpsert.mock.calls[0] as [Record<string, unknown>, Record<string, unknown>]
    expect(data.city_id).toBe('new-york')
    expect(data.data_type).toBe('weather')
    expect(opts).toEqual({ onConflict: 'city_id,data_type' })

    const expiresAt = new Date(data.expires_at as string).getTime()
    const fetchedAt = new Date(data.fetched_at as string).getTime()
    const expectedTtl = 30 * 60 * 1000
    expect(expiresAt - fetchedAt).toBeGreaterThanOrEqual(expectedTtl - 100)
    expect(expiresAt - fetchedAt).toBeLessThanOrEqual(expectedTtl + 100)
  })

  it('upserts row with correct expires_at for transit (5 min)', async () => {
    mockSupabaseUpsert.mockResolvedValueOnce({ error: null })
    await setCached('chicago', 'transit', { delayCount: 2 })

    expect(mockSupabaseUpsert).toHaveBeenCalledOnce()
    const [data] = mockSupabaseUpsert.mock.calls[0] as [Record<string, unknown>]

    const expiresAt = new Date(data.expires_at as string).getTime()
    const fetchedAt = new Date(data.fetched_at as string).getTime()
    const expectedTtl = 5 * 60 * 1000
    expect(expiresAt - fetchedAt).toBeGreaterThanOrEqual(expectedTtl - 100)
    expect(expiresAt - fetchedAt).toBeLessThanOrEqual(expectedTtl + 100)
  })

  it('upserts row with correct expires_at for events (6 hours)', async () => {
    mockSupabaseUpsert.mockResolvedValueOnce({ error: null })
    await setCached('san-francisco', 'events', { count: 10 })

    expect(mockSupabaseUpsert).toHaveBeenCalledOnce()
    const [data] = mockSupabaseUpsert.mock.calls[0] as [Record<string, unknown>]

    const expiresAt = new Date(data.expires_at as string).getTime()
    const fetchedAt = new Date(data.fetched_at as string).getTime()
    const expectedTtl = 6 * 60 * 60 * 1000
    expect(expiresAt - fetchedAt).toBeGreaterThanOrEqual(expectedTtl - 100)
    expect(expiresAt - fetchedAt).toBeLessThanOrEqual(expectedTtl + 100)
  })
})
