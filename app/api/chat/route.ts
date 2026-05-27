import Anthropic from '@anthropic-ai/sdk'
import { Ratelimit } from '@upstash/ratelimit'
import { kv } from '@vercel/kv'
import { createClient } from '@supabase/supabase-js'
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

    const start = Date.now()
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

    // Capture token counts when the stream finalises (fires before stream closes)
    let inputTokens: number | null = null
    let outputTokens: number | null = null
    stream.on('finalMessage', (msg) => {
      inputTokens = msg.usage.input_tokens
      outputTokens = msg.usage.output_tokens
    })

    // Log ai_usage after the stream is fully consumed via flush()
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
    )
    const logger = new TransformStream({
      async flush() {
        await supabase.from('ai_usage').insert({
          city_id: cityId,
          route: '/api/chat',
          tokens_in: inputTokens,
          tokens_out: outputTokens,
          duration_ms: Date.now() - start,
        })
      },
    })

    return new Response(stream.toReadableStream().pipeThrough(logger), {
      headers: { 'Content-Type': 'text/event-stream' },
    })
  } catch {
    return Response.json(
      { error: 'AI service temporarily unavailable.', code: 'AI_ERROR' } satisfies ApiError,
      { status: 500 }
    )
  }
}
