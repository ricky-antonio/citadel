import type { City, TransitData } from '@/lib/types'
import { fetchMtaStatus } from './mta'
import { fetchSf511Status } from './sf511'
import { fetchCtaStatus } from './cta'
import { fetchWmataStatus } from './wmata'

export async function fetchTransitStatus(city: City): Promise<TransitData> {
  switch (city.transitProvider) {
    case 'mta':
      return fetchMtaStatus()
    case 'sf-511':
      return fetchSf511Status(process.env.SF_511_API_KEY ?? '')
    case 'cta':
      return fetchCtaStatus(process.env.CTA_API_KEY ?? '')
    case 'wmata':
      return fetchWmataStatus(process.env.WMATA_API_KEY ?? '')
    default: {
      const _exhaustive: never = city.transitProvider
      return _exhaustive
    }
  }
}
