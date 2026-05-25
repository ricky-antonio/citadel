import { createClient } from '@supabase/supabase-js'
import type { Anomaly, MetricType } from '@/lib/types'

function getClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  )
}

function computeStdDev(values: number[]): number {
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length
  return Math.sqrt(variance)
}

export function detectAnomaly(
  metric: MetricType,
  value: number,
  history: number[]
): Anomaly | null {
  if (history.length < 10) return null

  const mean = history.reduce((sum, v) => sum + v, 0) / history.length
  const stddev = computeStdDev(history)

  if (stddev === 0 || (value - mean) / stddev <= 2.0) return null

  return {
    cityId: '',
    metric,
    value,
    baseline: Math.round(mean * 100) / 100,
    deviation: (value - mean) / mean,
    occurredAt: new Date().toISOString(),
  }
}

export async function logAnomaly(cityId: string, anomaly: Anomaly): Promise<void> {
  try {
    const supabase = getClient()
    await supabase.from('anomalies').insert({
      city_id: cityId,
      metric: anomaly.metric,
      value: anomaly.value,
      baseline: anomaly.baseline,
      deviation: anomaly.deviation,
      description: anomaly.description ?? null,
      occurred_at: anomaly.occurredAt,
    })
  } catch (err) {
    console.error('logAnomaly failed:', err)
  }
}

type AnomalyRow = {
  city_id: string
  metric: string
  value: number
  baseline: number
  deviation: number
  description: string | null
  occurred_at: string
}

export async function getAnomalyHistory(cityId: string, limit = 10): Promise<Anomaly[]> {
  try {
    const supabase = getClient()
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const { data, error } = await supabase
      .from('anomalies')
      .select('city_id, metric, value, baseline, deviation, description, occurred_at')
      .eq('city_id', cityId)
      .gt('occurred_at', sevenDaysAgo.toISOString())
      .order('occurred_at', { ascending: false })
      .limit(limit)

    if (error || !data) return []

    return (data as AnomalyRow[]).map(row => ({
      cityId: row.city_id,
      metric: row.metric as MetricType,
      value: row.value,
      baseline: row.baseline,
      deviation: row.deviation,
      description: row.description ?? undefined,
      occurredAt: row.occurred_at,
    }))
  } catch {
    return []
  }
}
