import { createClient } from '@supabase/supabase-js'
import type { DataType } from '@/lib/types'

const TTL: Record<DataType, number> = {
  weather: 30 * 60 * 1000,
  air_quality: 60 * 60 * 1000,
  events: 6 * 60 * 60 * 1000,
  transit: 5 * 60 * 1000,
  crime: 24 * 60 * 60 * 1000,
}

function getClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  )
}

export async function getCached(cityId: string, dataType: DataType): Promise<unknown | null> {
  try {
    const supabase = getClient()
    const { data, error } = await supabase
      .from('api_cache')
      .select('id, payload, fetched_at, expires_at')
      .eq('city_id', cityId)
      .eq('data_type', dataType)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (error || !data) return null
    return (data as { payload: unknown }).payload
  } catch {
    return null
  }
}

export async function setCached(cityId: string, dataType: DataType, payload: unknown): Promise<void> {
  try {
    const supabase = getClient()
    const now = new Date()
    const expiresAt = new Date(now.getTime() + TTL[dataType])

    await supabase
      .from('api_cache')
      .upsert(
        {
          city_id: cityId,
          data_type: dataType,
          payload,
          fetched_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
        },
        { onConflict: 'city_id,data_type' }
      )
  } catch (err) {
    console.error('setCached failed:', err)
  }
}
