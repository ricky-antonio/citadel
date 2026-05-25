import type { TransitData, TransitAlert, TransitSeverity } from '@/lib/types'
import { TRANSIT_FALLBACK } from '@/lib/data/fallbacks'

const WMATA_INCIDENTS_URL =
  'https://api.wmata.com/Incidents.svc/json/Incidents'

interface WmataIncident {
  IncidentType: string
  LinesAffected: string
  Description: string
}

interface WmataIncidentsResponse {
  Incidents: WmataIncident[]
}

function alertSeverity(type: string): TransitSeverity {
  return /major|No\s/i.test(type) ? 'major' : 'minor'
}

function parseLines(linesAffected: string): string {
  // LinesAffected is semicolon-delimited, e.g. "RD; BL; OR;"
  return linesAffected
    .split(';')
    .map(s => s.trim())
    .filter(Boolean)
    .join(', ')
}

export async function fetchWmataStatus(apiKey: string): Promise<TransitData> {
  try {
    const res = await fetch(WMATA_INCIDENTS_URL, {
      headers: { api_key: apiKey },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const json: WmataIncidentsResponse = await res.json()
    const incidents = json.Incidents ?? []

    const alerts: TransitAlert[] = incidents.map(inc => ({
      line: parseLines(inc.LinesAffected),
      message: inc.Description,
      severity: alertSeverity(inc.IncidentType),
    }))

    return {
      provider: 'wmata',
      alerts,
      delayCount: alerts.length,
      status: alerts.length > 0 ? 'disrupted' : 'normal',
    }
  } catch (err) {
    console.error('WMATA fetch failed:', err)
    return { ...TRANSIT_FALLBACK, provider: 'wmata' }
  }
}
