import type { CitySnapshot } from '@/lib/types'

export function formatLocalTime(timestamp: string, timezone: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'long',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(timestamp))
}

export function buildCityContext(snapshot: CitySnapshot): string {
  const { city, weather, airQuality, events, transit, pulseScore, pulseLabel, timestamp } = snapshot

  const localTime = formatLocalTime(timestamp, city.timezone)

  const eventsTonight = events.tonight.slice(0, 5)
  const eventsSection =
    eventsTonight.length === 0
      ? 'None'
      : eventsTonight
          .map(e => `  - ${e.name} @ ${e.venue} (${e.time})`)
          .join('\n')

  const delaysSection =
    transit.alerts.length === 0
      ? 'None'
      : transit.alerts
          .map(a => `  - [${a.severity.toUpperCase()}] ${a.line}: ${a.message}`)
          .join('\n')

  const output = `CITY: ${city.name}, ${city.state}
TIME: ${localTime}

PULSE: ${pulseScore}/100 — ${pulseLabel}

WEATHER: ${weather.temperature}°F, feels like ${weather.feelsLike}°F, ${weather.condition}
  Humidity: ${weather.humidity}% · Wind: ${weather.windSpeed} mph

AIR QUALITY: AQI ${airQuality.aqi} (${airQuality.category}) · Dominant pollutant: ${airQuality.dominantPollutant}

EVENTS TONIGHT (${events.count} total, capacity ${events.totalCapacity.toLocaleString()}):
${eventsSection}

TRANSIT (${transit.provider.toUpperCase()}, status: ${transit.status}):
${delaysSection}`

  if (process.env.NODE_ENV === 'development' && output.length > 3200) {
    console.warn('buildCityContext: output exceeds 3200 chars:', output.length)
  }

  return output
}
