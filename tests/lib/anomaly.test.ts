import { describe, it, expect } from 'vitest'
import { mockSupabaseInsert, mockSupabaseLimit } from '@/tests/mocks/supabase'
import { detectAnomaly, logAnomaly, getAnomalyHistory } from '@/lib/anomaly'
import type { Anomaly } from '@/lib/types'

// mean = 50.3, stddev = 0.9
const baseHistory = [50, 51, 49, 50, 52, 50, 51, 49, 50, 51]

describe('detectAnomaly', () => {
  it('returns null when value is within 2 standard deviations', () => {
    // (52 - 50.3) / 0.9 ≈ 1.89 — below threshold
    const result = detectAnomaly('pulse', 52, baseHistory)
    expect(result).toBeNull()
  })

  it('returns anomaly object when value exceeds 2σ threshold', () => {
    // (55 - 50.3) / 0.9 ≈ 5.22 — clearly above threshold
    const result = detectAnomaly('pulse', 55, baseHistory)
    expect(result).not.toBeNull()
    expect(result?.metric).toBe('pulse')
    expect(result?.value).toBe(55)
    expect(result?.occurredAt).toBeDefined()
  })

  it('returns null when history has fewer than 10 points', () => {
    const result = detectAnomaly('pulse', 100, [50, 51, 49])
    expect(result).toBeNull()
  })

  it('calculates deviation as percentage above baseline', () => {
    const result = detectAnomaly('aqi', 55, baseHistory)
    expect(result).not.toBeNull()

    const mean = baseHistory.reduce((s, v) => s + v, 0) / baseHistory.length
    const expectedDeviation = (55 - mean) / mean
    const expectedBaseline = Math.round(mean * 100) / 100

    expect(result?.deviation).toBeCloseTo(expectedDeviation, 5)
    expect(result?.baseline).toBeCloseTo(expectedBaseline, 2)
  })
})

describe('logAnomaly', () => {
  it('inserts correct row to anomalies table', async () => {
    mockSupabaseInsert.mockResolvedValueOnce({ error: null })

    const anomaly: Anomaly = {
      cityId: 'new-york',
      metric: 'pulse',
      value: 85,
      baseline: 50.3,
      deviation: 0.69,
      occurredAt: '2024-01-01T00:00:00.000Z',
    }

    await logAnomaly('new-york', anomaly)

    expect(mockSupabaseInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        city_id: 'new-york',
        metric: 'pulse',
        value: 85,
        baseline: 50.3,
        deviation: 0.69,
        occurred_at: '2024-01-01T00:00:00.000Z',
      })
    )
  })
})

describe('getAnomalyHistory', () => {
  it('returns recent anomalies for a city', async () => {
    const row = {
      city_id: 'new-york',
      metric: 'pulse',
      value: 85,
      baseline: 50.3,
      deviation: 0.69,
      description: null,
      occurred_at: '2024-01-01T00:00:00.000Z',
    }
    mockSupabaseLimit.mockResolvedValueOnce({ data: [row], error: null })

    const result = await getAnomalyHistory('new-york')

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      cityId: 'new-york',
      metric: 'pulse',
      value: 85,
      baseline: 50.3,
      deviation: 0.69,
      occurredAt: '2024-01-01T00:00:00.000Z',
    })
  })
})
