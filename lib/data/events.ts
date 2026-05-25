import type { EventsData, Event } from '@/lib/types'
import { EVENTS_FALLBACK } from '@/lib/data/fallbacks'

const TICKETMASTER_BASE = 'https://app.ticketmaster.com/discovery/v2/events.json'

export async function fetchEvents(cityName: string): Promise<EventsData> {
  const apiKey = process.env.TICKETMASTER_API_KEY
  if (!apiKey) {
    console.error('Events fetch failed: TICKETMASTER_API_KEY not set')
    return EVENTS_FALLBACK
  }

  try {
    const now = new Date()
    const todayISO = now.toISOString().split('T')[0] + 'T00:00:00Z'
    const tomorrowISO =
      new Date(now.getTime() + 86_400_000).toISOString().split('T')[0] + 'T23:59:59Z'

    const url = new URL(TICKETMASTER_BASE)
    url.searchParams.set('apikey', apiKey)
    url.searchParams.set('city', cityName)
    url.searchParams.set('size', '50')
    url.searchParams.set('sort', 'date,asc')
    url.searchParams.set('startDateTime', todayISO)
    url.searchParams.set('endDateTime', tomorrowISO)

    const res = await fetch(url.toString())
    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    return parseTicketmasterResponse(await res.json(), now)
  } catch (err) {
    console.error('Events fetch failed:', err)
    return EVENTS_FALLBACK
  }
}

function parseTicketmasterResponse(json: unknown, now: Date): EventsData {
  if (!json || typeof json !== 'object') return EVENTS_FALLBACK

  const data = json as Record<string, unknown>
  const embedded = data._embedded as Record<string, unknown> | undefined

  if (!embedded) {
    return { count: 0, totalCapacity: 0, tonight: [] }
  }

  const rawEvents = embedded.events
  if (!Array.isArray(rawEvents)) return EVENTS_FALLBACK

  const events: Event[] = rawEvents
    .map(parseTicketmasterEvent)
    .filter((e): e is Event => e !== null)

  // "tonight" = events whose local date matches today and start hour >= 18, capped at 10
  const todayDate = now.toISOString().split('T')[0]
  const tonight = events
    .filter(e => {
      const [datePart, timePart] = e.time.split('T')
      if (!datePart || !timePart) return false
      return datePart === todayDate && parseInt(timePart.split(':')[0], 10) >= 18
    })
    .slice(0, 10)

  const totalCapacity = events.reduce((sum, e) => sum + e.capacity, 0)

  return { count: events.length, totalCapacity, tonight }
}

function parseTicketmasterEvent(raw: unknown): Event | null {
  if (!raw || typeof raw !== 'object') return null

  const e = raw as Record<string, unknown>

  const id = typeof e.id === 'string' ? e.id : ''
  if (!id) return null

  const name = typeof e.name === 'string' ? e.name : 'Unknown Event'

  const embeddedVenues = e._embedded as Record<string, unknown> | undefined
  const venues = embeddedVenues?.venues
  const firstVenue =
    Array.isArray(venues) && venues.length > 0
      ? (venues[0] as Record<string, unknown>)
      : null
  const venue = typeof firstVenue?.name === 'string' ? firstVenue.name : 'Unknown Venue'

  const dates = e.dates as Record<string, unknown> | undefined
  const start = dates?.start as Record<string, unknown> | undefined
  // Use Ticketmaster's local date+time fields — already in the city's local timezone
  const localDate = typeof start?.localDate === 'string' ? start.localDate : ''
  const localTime = typeof start?.localTime === 'string' ? start.localTime : '00:00:00'
  const time = localDate ? `${localDate}T${localTime}` : new Date().toISOString()

  // Ticketmaster's events endpoint does not reliably expose venue capacity
  const capacity = 0

  return { id, name, venue, time, capacity, source: 'ticketmaster' }
}
