import { createClient } from '@supabase/supabase-js'
import type { PulseComponents } from '@/lib/types'

function getClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  )
}

export type PulseHistoryRow = {
  city_id: string
  pulse_score: number
  components: unknown
  recorded_at: string
}

export async function getPulseHistory(cityId: string, days: number): Promise<number[]> {
  try {
    const supabase = getClient()
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    const { data, error } = await supabase
      .from('pulse_history')
      .select('pulse_score')
      .eq('city_id', cityId)
      .gt('recorded_at', since.toISOString())
      .order('recorded_at', { ascending: false })

    if (error || !data) return []
    return (data as { pulse_score: number }[]).map(r => r.pulse_score)
  } catch {
    return []
  }
}

export async function getPulseHistoryRows(cityId: string, limit: number): Promise<PulseHistoryRow[]> {
  try {
    const supabase = getClient()
    const { data, error } = await supabase
      .from('pulse_history')
      .select('city_id, pulse_score, components, recorded_at')
      .eq('city_id', cityId)
      .order('recorded_at', { ascending: false })
      .limit(limit)

    if (error || !data) return []
    return data as PulseHistoryRow[]
  } catch {
    return []
  }
}

export async function writePulseScore(
  cityId: string,
  pulseScore: number,
  components: PulseComponents
): Promise<void> {
  try {
    const supabase = getClient()
    await supabase.from('pulse_history').insert({
      city_id: cityId,
      pulse_score: pulseScore,
      components,
      recorded_at: new Date().toISOString(),
    })
  } catch (err) {
    console.error('writePulseScore failed:', err)
  }
}
