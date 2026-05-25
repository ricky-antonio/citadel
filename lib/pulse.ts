import type { CitySnapshot, PulseLabel } from '@/lib/types'

function getLocalHour(timestamp: string, timezone: string): number {
  const date = new Date(timestamp)
  const formatter = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    hourCycle: 'h23',
    timeZone: timezone,
  })
  return parseInt(formatter.format(date), 10)
}

export function getTimeOfDayScore(timestamp: string, timezone: string): number {
  const hour = getLocalHour(timestamp, timezone)
  if (hour >= 18 && hour <= 22) return 20
  if (hour >= 12 && hour <= 17) return 15
  if (hour >= 8 && hour <= 11) return 12
  if (hour === 23 || hour === 0 || hour === 1) return 5
  return 2
}

export function computePulseScore(data: CitySnapshot): number {
  const eventScore = Math.min((data.events.count / 50) * 25, 25)
  const crowdScore = (data.events.totalCapacity / 100000) * 20
  const transitScore = Math.max(0, 20 - data.transit.delayCount * 1.5)
  const aqScore = Math.max(0, 15 - data.airQuality.aqi / 10)
  const timeScore = getTimeOfDayScore(data.timestamp, data.city.timezone)
  return Math.min(100, Math.round(eventScore + crowdScore + transitScore + aqScore + timeScore))
}

export function getPulseLabel(score: number): PulseLabel {
  if (score < 20) return 'Quiet'
  if (score < 40) return 'Calm'
  if (score < 60) return 'Active'
  if (score < 80) return 'Buzzing'
  return 'Intense'
}

export function getPulseColor(score: number): string {
  if (score < 20) return '#60A5FA'
  if (score < 40) return '#4ADE80'
  if (score < 60) return '#E8A020'
  if (score < 80) return '#F97316'
  return '#EF4444'
}
