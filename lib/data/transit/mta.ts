import { transit_realtime } from 'gtfs-realtime-bindings'
import type { TransitData, TransitAlert, TransitSeverity } from '@/lib/types'
import { TRANSIT_FALLBACK } from '@/lib/data/fallbacks'

const MTA_ALERTS_URL =
  'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/camsys%2Fall-alerts'

function alertSeverity(text: string): TransitSeverity {
  // 'major' keyword or 'No ' (no service) indicates a major disruption
  return /major|No\s/i.test(text) ? 'major' : 'minor'
}

export async function fetchMtaStatus(): Promise<TransitData> {
  try {
    const res = await fetch(MTA_ALERTS_URL)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const buffer = await res.arrayBuffer()
    const feed = transit_realtime.FeedMessage.decode(new Uint8Array(buffer))

    const alertEntities = (feed.entity ?? []).filter(e => e.alert != null)
    if (alertEntities.length === 0) return TRANSIT_FALLBACK

    const alerts: TransitAlert[] = alertEntities.map(entity => {
      const alert = entity.alert!
      const routeIds = (alert.informedEntity ?? [])
        .map(e => e.routeId)
        .filter((id): id is string => Boolean(id))
      const line = routeIds.length > 0 ? routeIds.join(', ') : 'Unknown'
      const message = alert.headerText?.translation?.[0]?.text ?? ''
      return { line, message, severity: alertSeverity(message) }
    })

    return {
      provider: 'mta',
      alerts,
      delayCount: alerts.length,
      status: 'disrupted',
    }
  } catch (err) {
    console.error('MTA fetch failed:', err)
    return TRANSIT_FALLBACK
  }
}
