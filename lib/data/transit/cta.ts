import type { TransitData, TransitAlert, TransitSeverity } from '@/lib/types'
import { TRANSIT_FALLBACK } from '@/lib/data/fallbacks'

const CTA_ALERTS_URL =
  'https://www.transitchicago.com/api/1.0/alerts.aspx?outputType=JSON&activeonly=true'

interface CtaService {
  ServiceType: string
  ServiceName: string
  ServiceId: string
}

interface CtaAlert {
  Headline: string
  Impact: string
  ImpactedService: { Service: CtaService | CtaService[] }
}

interface CtaResponse {
  CTAAlerts: { Alert: CtaAlert[] }
}

function alertSeverity(impact: string): TransitSeverity {
  return /major|No\s/i.test(impact) ? 'major' : 'minor'
}

export async function fetchCtaStatus(apiKey: string): Promise<TransitData> {
  try {
    const res = await fetch(CTA_ALERTS_URL, {
      headers: apiKey ? { 'x-api-key': apiKey } : {},
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const json: CtaResponse = await res.json()
    const rawAlerts = json.CTAAlerts?.Alert ?? []

    const trainAlerts = rawAlerts.filter(a => {
      const services = Array.isArray(a.ImpactedService.Service)
        ? a.ImpactedService.Service
        : [a.ImpactedService.Service]
      return services.some(s => s.ServiceType === 'T')
    })

    const delays = trainAlerts.filter(a => a.Impact !== 'Elevator Status')

    const alerts: TransitAlert[] = delays.flatMap(a => {
      const services = Array.isArray(a.ImpactedService.Service)
        ? a.ImpactedService.Service
        : [a.ImpactedService.Service]
      const trainServices = services.filter(s => s.ServiceType === 'T')
      return trainServices.map(s => ({
        line: s.ServiceName,
        message: a.Headline,
        severity: alertSeverity(a.Impact),
      }))
    })

    return {
      provider: 'cta',
      alerts,
      delayCount: delays.length,
      status: alerts.length > 0 ? 'disrupted' : 'normal',
    }
  } catch (err) {
    console.error('CTA fetch failed:', err)
    return { ...TRANSIT_FALLBACK, provider: 'cta' }
  }
}
