import type { CitySnapshot } from '@/lib/types'

export function generateSuggestions(snapshot: CitySnapshot): string[] {
  const { weather, airQuality, transit, events, pulseScore } = snapshot
  const suggestions: string[] = []

  // Weather chip
  if (weather.temperature >= 90) {
    suggestions.push('Is it too hot to be outside right now?')
  } else if (weather.temperature <= 35) {
    suggestions.push('Is it too cold to go out today?')
  } else if (weather.condition.toLowerCase().includes('rain') || weather.condition.toLowerCase().includes('storm')) {
    suggestions.push('Should I bring an umbrella today?')
  } else {
    suggestions.push('Is it a good day to be outside?')
  }

  // Transit chip
  if (transit.delayCount > 10) {
    suggestions.push('Which transit lines are most disrupted right now?')
  } else if (transit.delayCount > 0) {
    suggestions.push('Are there transit delays I should know about?')
  } else {
    suggestions.push('How is transit running right now?')
  }

  // AQI / events / pulse chip — pick the most notable
  if (airQuality.aqi > 100) {
    suggestions.push('Is the air quality safe to exercise outside?')
  } else if (events.tonight.length > 0) {
    suggestions.push(`What's happening in the city tonight?`)
  } else if (pulseScore >= 75) {
    suggestions.push('Why is the city so active right now?')
  } else if (pulseScore <= 25) {
    suggestions.push('Why is the city so quiet today?')
  } else {
    suggestions.push('What should I know about the city right now?')
  }

  return suggestions
}
