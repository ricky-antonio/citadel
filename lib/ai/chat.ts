import type { CitySnapshot } from '@/lib/types'
import { buildCityContext } from '@/lib/ai/context'

export function buildSystemPrompt(snapshot: CitySnapshot): string {
  return `You are Citadel, an AI city intelligence assistant. You have access to live data for ${snapshot.city.name}. Answer questions about the city using only the provided data. Be concise, specific, and direct. Never mention the data sources by name.`
}

export function buildUserMessage(userMessage: string, snapshot: CitySnapshot): string {
  return `Live city data:\n${buildCityContext(snapshot)}\n\nUser question: ${userMessage}`
}
