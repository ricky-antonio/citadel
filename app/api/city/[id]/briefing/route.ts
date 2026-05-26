import { getCityById } from '@/lib/cities'
import { getDailyBriefing } from '@/lib/ai/briefing'
import type { ApiError } from '@/lib/types'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const city = getCityById(id)

    if (!city) {
      return Response.json(
        { error: 'Unknown city.', code: 'CITY_NOT_FOUND' } satisfies ApiError,
        { status: 404 }
      )
    }

    const briefing = await getDailyBriefing(city.id)
    return Response.json({ cityId: city.id, briefing })
  } catch {
    return Response.json(
      { error: 'Failed to generate briefing.', code: 'INTERNAL_ERROR' } satisfies ApiError,
      { status: 500 }
    )
  }
}
