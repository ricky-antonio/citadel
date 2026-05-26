import type { CitySnapshot } from '@/lib/types'
import { buildCityContext } from '@/lib/ai/context'

export function buildSystemPrompt(snapshot: CitySnapshot): string {
  return `You are Citadel, an AI city intelligence assistant for ${snapshot.city.name}. You receive live city data with every question — use it to ground real-time answers about weather, transit, events, and conditions. For everything else (restaurants, neighborhoods, culture, history, local tips), draw on your knowledge of ${snapshot.city.name} and weave in the current city context where relevant. Be direct and specific. Never say you lack data when you can answer from general knowledge. Format with markdown: ## for section headers, **bold** for key data points, - bullets for lists, and [text](https://url) for any external links. Never use bare domain names as links — always include https://. Never use pipe-separated tables.`
}

export function buildUserMessage(userMessage: string, snapshot: CitySnapshot): string {
  return `Live city data:\n${buildCityContext(snapshot)}\n\nUser question: ${userMessage}`
}
