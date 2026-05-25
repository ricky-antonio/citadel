import { getCityById } from '@/lib/cities'
import { getPulseHistoryRows } from '@/lib/pulse-history'
import type { ApiError } from '@/lib/types'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const city = getCityById(id)

  if (!city) {
    return Response.json(
      { error: 'City not found.', code: 'CITY_NOT_FOUND' } satisfies ApiError,
      { status: 404 }
    )
  }

  const rows = await getPulseHistoryRows(id, 168)
  const currentPulse = rows.length > 0 ? rows[0].pulse_score : 0

  return Response.json({ cityId: id, currentPulse, history: rows })
}
