import type { City } from '@/lib/types'
import { CRIME_FALLBACK } from '@/lib/data/fallbacks'

// Real open-data implementations (NYC Open Data, DataSF, Chicago Data Portal, DC Open Data)
// are added in Phase 5. Crime data is not in CitySnapshot for Phases 1–4.
export async function fetchCrimeData(_: City): Promise<Record<string, unknown>> {
  return Promise.resolve(CRIME_FALLBACK)
}
