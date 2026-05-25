import { transit_realtime } from 'gtfs-realtime-bindings'
import type { TransitData, TransitAlert, TransitSeverity } from '@/lib/types'
import { TRANSIT_FALLBACK } from '@/lib/data/fallbacks'

function sf511Url(apiKey: string): string {
  return `https://api.511.org/transit/servicealerts?api_key=${apiKey}&agency=SF`
}

function alertSeverity(text: string): TransitSeverity {
  return /major|No\s/i.test(text) ? 'major' : 'minor'
}

export async function fetchSf511Status(apiKey: string): Promise<TransitData> {
  try {
    const res = await fetch(sf511Url(apiKey))
    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const buffer = await res.arrayBuffer()
    const feed = transit_realtime.FeedMessage.decode(new Uint8Array(buffer))

    const alertEntities = (feed.entity ?? []).filter(e => e.alert != null)

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
      provider: 'sf-511',
      alerts,
      delayCount: alerts.length,
      status: alerts.length > 0 ? 'disrupted' : 'normal',
    }
  } catch (err) {
    console.error('SF 511 fetch failed:', err)
    return { ...TRANSIT_FALLBACK, provider: 'sf-511' }
  }
}
