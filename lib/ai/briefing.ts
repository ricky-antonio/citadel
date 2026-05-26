import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { getCityById } from '@/lib/cities'
import { getCached, setCached } from '@/lib/cache'
import { fetchWeather } from '@/lib/data/weather'
import { fetchAirQuality } from '@/lib/data/airQuality'
import { fetchEvents } from '@/lib/data/events'
import { fetchTransitStatus } from '@/lib/data/transit'
import { fetchCrimeData } from '@/lib/data/crime'
import { computePulseScore, getPulseLabel, getPulseColor, getTimeOfDayScore } from '@/lib/pulse'
import { getAnomalyHistory } from '@/lib/anomaly'
import { buildCityContext } from '@/lib/ai/context'
import type { CitySnapshot, WeatherData, AirQualityData, EventsData, TransitData, PulseComponents } from '@/lib/types'

function getClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  )
}

export async function getCitySnapshot(cityId: string): Promise<CitySnapshot> {
  const city = getCityById(cityId)
  if (!city) throw new Error(`Unknown city: ${cityId}`)

  const cachedWeather = await getCached(city.id, 'weather')
  const weather: WeatherData = cachedWeather
    ? (cachedWeather as WeatherData)
    : await fetchWeather(city.lat, city.lng).then(w => { void setCached(city.id, 'weather', w); return w })

  const cachedAQ = await getCached(city.id, 'air_quality')
  const airQuality: AirQualityData = cachedAQ
    ? (cachedAQ as AirQualityData)
    : await fetchAirQuality(city.lat, city.lng).then(a => { void setCached(city.id, 'air_quality', a); return a })

  const cachedEvents = await getCached(city.id, 'events')
  const events: EventsData = cachedEvents
    ? (cachedEvents as EventsData)
    : await fetchEvents(city.name).then(e => { void setCached(city.id, 'events', e); return e })

  const cachedTransit = await getCached(city.id, 'transit')
  const transit: TransitData = cachedTransit
    ? (cachedTransit as TransitData)
    : await fetchTransitStatus(city).then(t => { void setCached(city.id, 'transit', t); return t })

  const cachedCrime = await getCached(city.id, 'crime')
  if (!cachedCrime) {
    const crime = await fetchCrimeData(city)
    void setCached(city.id, 'crime', crime)
  }

  const timestamp = new Date().toISOString()
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

  const anomalies = await getAnomalyHistory(city.id)

  return { city, weather, airQuality, events, transit, pulseScore, pulseLabel, pulseColor, pulseComponents, timestamp, anomalies }
}

export async function getDailyBriefing(cityId: string): Promise<string> {
  const supabase = getClient()
  const today = new Date().toISOString().slice(0, 10)

  const { data } = await supabase
    .from('ai_briefings')
    .select('briefing')
    .eq('city_id', cityId)
    .eq('date', today)
    .single()

  if (data) return (data as { briefing: string }).briefing

  const snapshot = await getCitySnapshot(cityId)
  const context = buildCityContext(snapshot)
  const start = Date.now()

  const client = new Anthropic()
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 200,
    messages: [{
      role: 'user',
      content: `Write a 2-sentence intelligence briefing for ${snapshot.city.name} right now based on this live data:\n${context}`,
    }],
  })

  const first = response.content[0]
  if (first.type !== 'text') throw new Error('Unexpected Anthropic response block type')
  const briefing = first.text

  await supabase
    .from('ai_briefings')
    .upsert({ city_id: cityId, briefing, date: today }, { onConflict: 'city_id,date' })

  await supabase
    .from('ai_usage')
    .insert({
      city_id: cityId,
      route: '/api/city/[id]/briefing',
      tokens_in: response.usage.input_tokens,
      tokens_out: response.usage.output_tokens,
      duration_ms: Date.now() - start,
    })

  return briefing
}
