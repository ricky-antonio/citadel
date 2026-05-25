import { getCityById } from '@/lib/cities'
import { getCached, setCached } from '@/lib/cache'
import { computePulseScore, getPulseLabel, getPulseColor, getTimeOfDayScore } from '@/lib/pulse'
import { detectAnomaly, logAnomaly, getAnomalyHistory } from '@/lib/anomaly'
import { getPulseHistory, writePulseScore } from '@/lib/pulse-history'
import { fetchWeather } from '@/lib/data/weather'
import { fetchAirQuality } from '@/lib/data/airQuality'
import { fetchEvents } from '@/lib/data/events'
import { fetchTransitStatus } from '@/lib/data/transit'
import { fetchCrimeData } from '@/lib/data/crime'
import type {
  ApiError,
  CitySnapshot,
  WeatherData,
  AirQualityData,
  EventsData,
  TransitData,
  PulseComponents,
} from '@/lib/types'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const city = getCityById(id)

    if (!city) {
      return Response.json(
        { error: 'City not found.', code: 'CITY_NOT_FOUND' } satisfies ApiError,
        { status: 404 }
      )
    }

    // Weather
    const cachedWeather = await getCached(city.id, 'weather')
    let weather: WeatherData
    if (cachedWeather) {
      weather = cachedWeather as WeatherData
    } else {
      weather = await fetchWeather(city.lat, city.lng)
      void setCached(city.id, 'weather', weather)
    }

    // Air quality
    const cachedAQ = await getCached(city.id, 'air_quality')
    let airQuality: AirQualityData
    if (cachedAQ) {
      airQuality = cachedAQ as AirQualityData
    } else {
      airQuality = await fetchAirQuality(city.lat, city.lng)
      void setCached(city.id, 'air_quality', airQuality)
    }

    // Events
    const cachedEvents = await getCached(city.id, 'events')
    let events: EventsData
    if (cachedEvents) {
      events = cachedEvents as EventsData
    } else {
      events = await fetchEvents(city.name)
      void setCached(city.id, 'events', events)
    }

    // Transit
    const cachedTransit = await getCached(city.id, 'transit')
    let transit: TransitData
    if (cachedTransit) {
      transit = cachedTransit as TransitData
    } else {
      transit = await fetchTransitStatus(city)
      void setCached(city.id, 'transit', transit)
    }

    // Crime — stub; cache to avoid unnecessary re-runs
    const cachedCrime = await getCached(city.id, 'crime')
    if (!cachedCrime) {
      const crime = await fetchCrimeData(city)
      void setCached(city.id, 'crime', crime)
    }

    const timestamp = new Date().toISOString()

    // computePulseScore needs CitySnapshot shape, but pulse fields aren't computed yet —
    // it only reads events, transit, airQuality, timestamp, and city.timezone
    const partial = { city, weather, airQuality, events, transit, timestamp } as CitySnapshot

    const pulseScore = computePulseScore(partial)
    const pulseLabel = getPulseLabel(pulseScore)
    const pulseColor = getPulseColor(pulseScore)
    const pulseComponents: PulseComponents = {
      eventScore: Math.min((events.count / 50) * 25, 25),
      crowdScore: (events.totalCapacity / 100000) * 20,
      transitScore: Math.max(0, 20 - transit.delayCount * 1.5),
      aqScore: Math.max(0, 15 - airQuality.aqi / 10),
      timeScore: getTimeOfDayScore(timestamp, city.timezone),
    }

    const snapshot: CitySnapshot = {
      city,
      weather,
      airQuality,
      events,
      transit,
      pulseScore,
      pulseLabel,
      pulseColor,
      pulseComponents,
      timestamp,
    }

    // Anomaly detection against last 30 days of pulse history
    const pulseHistory = await getPulseHistory(city.id, 30)
    const anomaly = detectAnomaly('pulse', pulseScore, pulseHistory)
    if (anomaly) {
      void logAnomaly(city.id, { ...anomaly, cityId: city.id })
    }

    // Fire-and-forget — don't block the response on the history write
    void writePulseScore(city.id, pulseScore, pulseComponents)

    const anomalies = await getAnomalyHistory(city.id)

    return Response.json({ ...snapshot, anomalies })
  } catch {
    return Response.json(
      { error: 'Internal server error.', code: 'INTERNAL_ERROR' } satisfies ApiError,
      { status: 500 }
    )
  }
}
