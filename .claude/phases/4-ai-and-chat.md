# Phase 4 — AI & Chat

**Complete this phase entirely before starting Phase 5.**

Phase 3 produced the visual map + orbital + panels. Phase 4 adds the AI intelligence layer: the streaming chat drawer, the daily briefing API, and the contextual suggestions. By the end of this phase the "Ask" button works end-to-end — the user types a question and the AI responds word by word.

---

## What to build

### AI lib functions
- [ ] `lib/ai/chat.ts` — `streamChatResponse(message, cityId, history)` — builds context, calls Anthropic streaming
- [ ] `lib/ai/briefing.ts` — `getDailyBriefing(cityId)` — checks `ai_briefings` table, generates if missing, logs to `ai_usage`
- [ ] `lib/ai/suggestions.ts` — `generateSuggestions(snapshot)` — rule-based 3 chips (already in CLAUDE.md)
- [ ] `tests/lib/ai/chat.test.ts`

### API routes
- [ ] `app/api/chat/route.ts` — POST, rate limited, validates input, builds context, streams Anthropic response, logs to `ai_usage`
- [ ] `app/api/city/[id]/briefing/route.ts` — GET, checks cache, generates if missing
- [ ] `tests/api/chat.test.ts`

### Chat UI components
- [ ] `components/chat/StreamingText.tsx` — renders text token-by-token from a string prop, shows amber cursor `|` while streaming, hides cursor when done
- [ ] `components/chat/ChatMessage.tsx` — single message bubble: user (right-aligned, amber tint) or assistant (left-aligned, glass surface)
- [ ] `components/chat/ChatSuggestions.tsx` — three chip buttons, calls `onSelect(suggestion)` when clicked
- [ ] `components/chat/ChatDrawer.tsx` — slide-up drawer (42vh), manages `messages[]` state, streaming state, input field, sends to `/api/chat`
- [ ] `tests/components/StreamingText.test.tsx`
- [ ] `tests/components/ChatMessage.test.tsx`

### Wire into page
- [ ] Update `app/city/[id]/page.tsx`:
  - Add "Ask" button to nav pill → `setChatOpen(true)`
  - Render `<ChatDrawer>` when `chatOpen`
  - Pass `snapshot` and `cityId` to `<ChatDrawer>`
  - Escape key at page level closes the drawer if open (when no panel is open)

---

## Key flows to implement

### Chat message send → stream → render
```
User types "Is it a good day to be outside?"
  → presses Enter or Send button
  → ChatDrawer.handleSend():
      setStreaming(true)            ← FIRST — before any await
      setInput('')
      setMessages(prev => [...prev, { role: 'user', content: message }])
      setMessages(prev => [...prev, { role: 'assistant', content: '', streaming: true }])

      response = await fetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ message, cityId, history: prev })
      })

      reader = response.body.getReader()
      decoder = new TextDecoder()

      while (true):
        { done, value } = await reader.read()
        if done: break
        chunk = decoder.decode(value)
        setMessages(prev => [
          ...prev.slice(0, -1),
          { ...prev[prev.length-1], content: prev[prev.length-1].content + chunk }
        ])

      setStreaming(false)  ← sets streaming: false on the last message

  → StreamingText renders text character by character
  → Amber cursor blinks while streaming
  → Cursor disappears when streaming = false
```

### Daily briefing generation
```
GET /api/city/new-york/briefing
  → today = new Date().toISOString().slice(0, 10)  // '2026-05-24'
  → row = supabase.from('ai_briefings').select('briefing').eq('city_id', 'new-york').eq('date', today).single()
  → if row: return { briefing: row.data.briefing }
  → else:
      snapshot = await getCitySnapshot('new-york')
      context = buildCityContext(snapshot)
      start = Date.now()
      response = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 200,
        messages: [{ role: 'user', content: `Write a 2-sentence intelligence briefing for ${snapshot.city.name} right now based on: ${context}` }]
      })
      briefing = response.content[0].text
      await supabase.from('ai_briefings').upsert({ city_id, briefing, date: today })
      await supabase.from('ai_usage').insert({ city_id, route: '/api/city/[id]/briefing', tokens_in: response.usage.input_tokens, tokens_out: response.usage.output_tokens, duration_ms: Date.now() - start })
      return { briefing }
```

### Rate limiting in `/api/chat`
```
ip = req.headers.get('x-forwarded-for') ?? 'anonymous'
try:
  { success } = await ratelimit.limit(ip)
  if !success: return 429 with { error, code: 'RATE_LIMITED' }
catch:
  // KV unavailable (local dev) — fail open
```

---

## Tests to write

### `tests/lib/ai/chat.test.ts`
```
it('buildCityContext is called with the correct snapshot')
it('Anthropic stream is initiated with correct model and system prompt')
it('city name appears in the system prompt')
it('returns streaming response on valid input')
```

### `tests/api/chat.test.ts`
```
it('returns 400 when message is missing')
it('returns 400 when cityId is missing')
it('returns 400 when message exceeds 500 characters')
it('returns 404 for unknown cityId')
it('returns 429 when rate limit is exceeded')
it('returns 200 streaming response for valid input (mock Anthropic)')
it('injects city context into the Anthropic system prompt')
it('logs to ai_usage table on successful response')
it('handles Anthropic API error — returns 500 with ApiError shape')
```

### `tests/components/StreamingText.test.tsx`
```
it('renders the text prop as-is')
it('shows amber cursor pipe character when streaming=true')
it('does not show cursor when streaming=false')
it('renders empty string gracefully')
```

### `tests/components/ChatMessage.test.tsx`
```
it('renders user message with correct text')
it('renders assistant message with StreamingText')
it('applies user-message styling for role=user')
it('applies assistant-message styling for role=assistant')
it('passes streaming prop to StreamingText for assistant messages')
```

---

## Manual verification checklist

Before marking Phase 4 complete:

- [ ] Click "Ask" in the nav pill → chat drawer slides up from the bottom
- [ ] Three contextual suggestion chips are visible above the input
- [ ] Click a suggestion chip → it pre-fills the input field (or sends immediately — your choice, document the decision)
- [ ] Type a question, press Enter → user message appears, AI response begins streaming word by word
- [ ] Amber cursor `|` blinks while the AI is responding
- [ ] Cursor disappears when the response is complete
- [ ] Rate limit works: send 21 messages rapidly → 21st returns a rate-limit error message in the UI (not a blank)
- [ ] Escape closes the chat drawer
- [ ] Clicking above the drawer (on the map) closes it
- [ ] `GET /api/city/new-york/briefing` returns a briefing string (check Supabase `ai_briefings` table — a row should appear)
- [ ] Second request to the same briefing endpoint returns the same cached text (no new Anthropic call)
- [ ] `ai_usage` table in Supabase has rows after chat and briefing calls
- [ ] Browser DevTools → Network: no direct Anthropic API calls from the client
- [ ] `npm run type-check` — zero errors
- [ ] `npm test` — all tests pass
- [ ] `npm run build` — production build succeeds

---

## Coverage target after this phase
Lines ≥ 80% · Functions ≥ 80% · Branches ≥ 75%
