import type { AirQualityData } from '@/lib/types'
import { AIR_QUALITY_FALLBACK } from '@/lib/data/fallbacks'

const BASE_URL = 'https://api.openaq.org'

type OpenAQSensor = {
  id: number
  parameter: { name: string }
}

type OpenAQLocation = {
  id: number
  name: string
  coordinates: { latitude: number; longitude: number }
  sensors: OpenAQSensor[]
  datetimeLast: { utc: string }
}

type OpenAQLocationsResponse = {
  results: OpenAQLocation[]
}

type OpenAQLatestResult = {
  value: number
  sensorsId: number
  locationsId: number
  datetime: { utc: string; local: string }
}

type OpenAQLatestResponse = {
  results: OpenAQLatestResult[]
}

const AQI_BREAKPOINTS = [
  { cLow: 0, cHigh: 12.0, iLow: 0, iHigh: 50 },
  { cLow: 12.1, cHigh: 35.4, iLow: 51, iHigh: 100 },
  { cLow: 35.5, cHigh: 55.4, iLow: 101, iHigh: 150 },
  { cLow: 55.5, cHigh: 150.4, iLow: 151, iHigh: 200 },
  { cLow: 150.5, cHigh: 250.4, iLow: 201, iHigh: 300 },
]

function computeAQI(pm25: number): number {
  const bp = AQI_BREAKPOINTS.find(b => pm25 <= b.cHigh) ?? AQI_BREAKPOINTS[AQI_BREAKPOINTS.length - 1]
  return Math.round(((bp.iHigh - bp.iLow) / (bp.cHigh - bp.cLow)) * (pm25 - bp.cLow) + bp.iLow)
}

function getAQICategory(aqi: number): string {
  if (aqi <= 50) return 'Good'
  if (aqi <= 100) return 'Moderate'
  if (aqi <= 150) return 'Unhealthy for Sensitive Groups'
  if (aqi <= 200) return 'Unhealthy'
  if (aqi <= 300) return 'Very Unhealthy'
  return 'Hazardous'
}

export async function fetchAirQuality(lat: number, lng: number): Promise<AirQualityData> {
  try {
    const apiKey = process.env.OPENAQ_API_KEY
    if (!apiKey) return AIR_QUALITY_FALLBACK

    const locRes = await fetch(
      `${BASE_URL}/v3/locations?coordinates=${lat},${lng}&radius=25000&limit=10`,
      { headers: { 'X-API-Key': apiKey } }
    )
    if (!locRes.ok) return AIR_QUALITY_FALLBACK

    const locData = (await locRes.json()) as OpenAQLocationsResponse
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()

    const activeLocations = locData.results
      .filter(loc => loc.datetimeLast.utc > cutoff)
      .sort((a, b) => new Date(b.datetimeLast.utc).getTime() - new Date(a.datetimeLast.utc).getTime())
      .slice(0, 5)

    if (activeLocations.length === 0) return AIR_QUALITY_FALLBACK

    const latestResults = await Promise.all(
      activeLocations.map(async loc => {
        try {
          const res = await fetch(`${BASE_URL}/v3/locations/${loc.id}/latest`, {
            headers: { 'X-API-Key': apiKey },
          })
          if (!res.ok) return null
          return { location: loc, data: (await res.json()) as OpenAQLatestResponse }
        } catch {
          return null
        }
      })
    )

    const pm25Values: number[] = []
    const stations: Array<{ lat: number; lng: number; aqi: number }> = []
    for (const result of latestResults) {
      if (!result) continue
      const pm25Sensor = result.location.sensors.find(s => s.parameter.name === 'pm25')
      if (!pm25Sensor) continue
      const reading = result.data.results.find(r => r.sensorsId === pm25Sensor.id)
      if (reading !== undefined) {
        pm25Values.push(reading.value)
        stations.push({
          lat: result.location.coordinates.latitude,
          lng: result.location.coordinates.longitude,
          aqi: computeAQI(reading.value),
        })
      }
    }

    if (pm25Values.length === 0) return AIR_QUALITY_FALLBACK

    const avgPm25 = pm25Values.reduce((sum, v) => sum + v, 0) / pm25Values.length
    const aqi = computeAQI(avgPm25)

    return {
      aqi,
      category: getAQICategory(aqi),
      dominantPollutant: 'pm25',
      stations,
    }
  } catch (err) {
    console.error('Air quality fetch failed:', err)
    return AIR_QUALITY_FALLBACK
  }
}
