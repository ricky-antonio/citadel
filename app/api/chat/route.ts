import Anthropic from '@anthropic-ai/sdk'
import { Ratelimit } from '@upstash/ratelimit'
import { kv } from '@vercel/kv'
import { getCitySnapshot } from '@/lib/ai/briefing'
import { buildSystemPrompt, buildUserMessage } from '@/lib/ai/chat'
import type { ApiError, ChatMessage } from '@/lib/types'

const VALID_CITY_IDS = ['new-york', 'san-francisco', 'chicago', 'washington-dc']

const chatRatelimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(15, '1m'),
  prefix: 'citadel:chat',
})

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') ?? 'anonymous'
    try {
      const { success, limit, remaining, reset } = await chatRatelimit.limit(ip)
      if (!success) {
        return Response.json(
          { error: 'Too many requests. Please wait a moment.', code: 'RATE_LIMITED' } satisfies ApiError,
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': String(limit),
              'X-RateLimit-Remaining': String(remaining),
              'X-RateLimit-Reset': String(reset),
              'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)),
            },
          }
        )
      }
    } catch {
      // KV not available locally — fail open
    }

    const body = (await req.json()) as { message?: unknown; cityId?: unknown; history?: unknown }

    if (!body.message || typeof body.message !== 'string' || body.message.trim() === '') {
      return Response.json(
        { error: 'Message is required.', code: 'INVALID_INPUT' } satisfies ApiError,
        { status: 400 }
      )
    }

    if (body.message.length > 500) {
      return Response.json(
        { error: 'Message exceeds 500 characters.', code: 'INVALID_INPUT' } satisfies ApiError,
        { status: 400 }
      )
    }

    if (!body.cityId || typeof body.cityId !== 'string') {
      return Response.json(
        { error: 'City ID is required.', code: 'INVALID_INPUT' } satisfies ApiError,
        { status: 400 }
      )
    }

    if (!VALID_CITY_IDS.includes(body.cityId)) {
      return Response.json(
        { error: 'Unknown city.', code: 'CITY_NOT_FOUND' } satisfies ApiError,
        { status: 404 }
      )
    }

    const message = body.message
    const cityId = body.cityId
    const history = Array.isArray(body.history) ? (body.history as ChatMessage[]).slice(0, 20) : []

    const snapshot = await getCitySnapshot(cityId)

    if (process.env.NODE_ENV === 'development') {
      const userMsg = buildUserMessage(message, snapshot)
      if (userMsg.length > 3200) {
        console.warn('Context budget exceeded:', userMsg.length, 'chars')
      }
    }

    const client = new Anthropic()
    const stream = await client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: buildSystemPrompt(snapshot),
      messages: [
        ...history,
        { role: 'user', content: buildUserMessage(message, snapshot) },
      ],
    })

    // ai_usage logging for streaming chat deferred to Phase 6 — see PHASE6ROADMAP.md P6.7
    return new Response(stream.toReadableStream(), {
      headers: { 'Content-Type': 'text/event-stream' },
    })
  } catch {
    return Response.json(
      { error: 'AI service temporarily unavailable.', code: 'AI_ERROR' } satisfies ApiError,
      { status: 500 }
    )
  }
}
