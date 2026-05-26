import type { City, CrimeData, CrimeIncident } from '@/lib/types'
import { CRIME_FALLBACK } from '@/lib/data/fallbacks'

function thirtyDaysAgoIso(): string {
  const d = new Date()
  d.setDate(d.getDate() - 30)
  return d.toISOString().split('T')[0]
}

function safetyScore(totalIncidents: number): number {
  return Math.round(100 - Math.min(100, (totalIncidents / 500) * 100))
}

async function fetchNycCrime(): Promise<CrimeData> {
  const since = thirtyDaysAgoIso()
  const url =
    `https://data.cityofnewyork.us/resource/5uac-w243.json` +
    `?$where=cmplnt_fr_dt>'${since}'&$limit=500&$select=latitude,longitude,ofns_desc,cmplnt_fr_dt`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`NYC crime HTTP ${res.status}`)
  const rows = (await res.json()) as Array<Record<string, string>>
  const recentIncidents: CrimeIncident[] = rows
    .filter((r) => r.latitude && r.longitude)
    .map((r) => ({
      lat: parseFloat(r.latitude),
      lng: parseFloat(r.longitude),
      category: r.ofns_desc ?? 'Unknown',
      date: r.cmplnt_fr_dt ?? '',
    }))
  return { totalIncidents: recentIncidents.length, recentIncidents, safetyScore: safetyScore(recentIncidents.length) }
}

async function fetchSfCrime(): Promise<CrimeData> {
  const since = thirtyDaysAgoIso()
  const url =
    `https://data.sfgov.org/resource/wg3w-h783.json` +
    `?$where=incident_date>'${since}'&$limit=500&$select=latitude,longitude,incident_category,incident_date`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`SF crime HTTP ${res.status}`)
  const rows = (await res.json()) as Array<Record<string, string>>
  const recentIncidents: CrimeIncident[] = rows
    .filter((r) => r.latitude && r.longitude)
    .map((r) => ({
      lat: parseFloat(r.latitude),
      lng: parseFloat(r.longitude),
      category: r.incident_category ?? 'Unknown',
      date: r.incident_date ?? '',
    }))
  return { totalIncidents: recentIncidents.length, recentIncidents, safetyScore: safetyScore(recentIncidents.length) }
}

async function fetchChicagoCrime(): Promise<CrimeData> {
  const since = thirtyDaysAgoIso()
  const url =
    `https://data.cityofchicago.org/resource/ijzp-q8t2.json` +
    `?$where=date>'${since}'&$limit=500&$select=latitude,longitude,primary_type,date`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Chicago crime HTTP ${res.status}`)
  const rows = (await res.json()) as Array<Record<string, string>>
  const recentIncidents: CrimeIncident[] = rows
    .filter((r) => r.latitude && r.longitude)
    .map((r) => ({
      lat: parseFloat(r.latitude),
      lng: parseFloat(r.longitude),
      category: r.primary_type ?? 'Unknown',
      date: r.date ?? '',
    }))
  return { totalIncidents: recentIncidents.length, recentIncidents, safetyScore: safetyScore(recentIncidents.length) }
}

interface DcFeature {
  attributes: {
    LATITUDE?: number | null
    LONGITUDE?: number | null
    OFFENSE?: string | null
    REPORT_DAT?: string | number | null
  }
}

async function fetchDcCrime(): Promise<CrimeData> {
  const since = thirtyDaysAgoIso()
  const params = new URLSearchParams({
    where: `REPORT_DAT >= DATE '${since}'`,
    outFields: 'LATITUDE,LONGITUDE,OFFENSE,REPORT_DAT',
    returnGeometry: 'false',
    resultRecordCount: '500',
    f: 'json',
  })
  const url = `https://maps2.dcgis.dc.gov/dcgis/rest/services/FEEDS/MPD/MapServer/6/query?${params.toString()}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`DC crime HTTP ${res.status}`)
  const data = (await res.json()) as { features?: DcFeature[] }
  const features = data.features ?? []
  const recentIncidents: CrimeIncident[] = features
    .filter((f) => f.attributes.LATITUDE != null && f.attributes.LONGITUDE != null)
    .map((f) => ({
      lat: f.attributes.LATITUDE as number,
      lng: f.attributes.LONGITUDE as number,
      category: f.attributes.OFFENSE ?? 'Unknown',
      date: f.attributes.REPORT_DAT != null ? String(f.attributes.REPORT_DAT) : '',
    }))
  return { totalIncidents: recentIncidents.length, recentIncidents, safetyScore: safetyScore(recentIncidents.length) }
}

export async function fetchCrimeData(city: City): Promise<CrimeData> {
  try {
    switch (city.crimeProvider) {
      case 'nyc-open-data':
        return await fetchNycCrime()
      case 'datasf':
        return await fetchSfCrime()
      case 'chicago-data-portal':
        return await fetchChicagoCrime()
      case 'dc-open-data':
        return await fetchDcCrime()
    }
  } catch (err) {
    console.error('Crime fetch failed:', err)
    return CRIME_FALLBACK
  }
}
