# Phase 4 Roadmap — AI & Chat

All prompts below are self-contained. Clear context between sessions and paste the next prompt fresh. Do not skip a prompt or combine two into one session.

---

## Status

```
P4.1  AI lib functions                   ○ Not started
P4.2  Chat + briefing API routes         ○ Not started
P4.3  StreamingText + ChatMessage        ○ Not started
P4.4  ChatSuggestions + ChatDrawer       ○ Not started
P4.5  Phase 4 final checklist            ○ Not started
```

---

## PROMPT P4.1 — AI lib functions

```
Read CLAUDE.md, .claude/rules/testing.md, .claude/phases/4-ai-and-chat.md, and
PROGRESS.md in that order. Confirm: current phase, last completed task, next task.
Do not write any code until you have confirmed.

---

You are building three AI helper functions in lib/ai/. These are the library-level
functions that the route handlers call. The chat streaming function wraps the
Anthropic SDK. The briefing function checks the database cache. The suggestions
function is pure logic with no external calls.

Describe what you are about to create before writing any code:
- lib/ai/chat.ts — buildChatMessages (assembles message array for Anthropic)
- lib/ai/briefing.ts — getDailyBriefing (checks ai_briefings, generates if missing)
- lib/ai/suggestions.ts — generateSuggestions (rule-based 3 chips)
- tests/lib/ai/chat.test.ts — tests for the message assembly logic

Wait for confirmation before writing.

---

FILES TO CREATE:

lib/ai/chat.ts:
  This file does NOT do the streaming itself — that happens in the route handler.
  It provides helpers for building the message payload.

  buildSystemPrompt(snapshot: CitySnapshot): string
    Returns the system prompt string:
    "You are Citadel, an AI city intelligence assistant. You have access to live data
    for ${snapshot.city.name}. Answer questions about the city using only the provided
    data. Be concise, specific, and direct. Never mention the data sources by name."

  buildUserMessage(userMessage: string, snapshot: CitySnapshot): string
    Returns: `Live city data:\n${buildCityContext(snapshot)}\n\nUser question: ${userMessage}`

  These functions are pure — no side effects, easy to test.

lib/ai/briefing.ts:
  Uses the Supabase SERVICE_ROLE client (write access).

  getDailyBriefing(cityId: string): Promise<string>
    today = new Date().toISOString().slice(0, 10)  // '2026-05-24'
    Check ai_briefings: .eq('city_id', cityId).eq('date', today).single()
    If found: return row.briefing
    If not found:
      snapshot = await fetch local snapshot API... 
        Actually: call all the data fetchers directly (same as snapshot route).
        Do NOT call the /api/city/[id]/snapshot HTTP endpoint from within a route handler.
        Instead, call getCitySnapshot(cityId) — create this helper function:
          getCitySnapshot(cityId: string): Promise<CitySnapshot>
            Calls fetchWeather, fetchAirQuality, fetchEvents, fetchTransitStatus,
            fetchCrimeData (same as the snapshot route but as a lib function).
            Uses getCached/setCached pattern.
      context = buildCityContext(snapshot)
      start = Date.now()
      client = new Anthropic()
      response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 200,
        messages: [{
          role: 'user',
          content: `Write a 2-sentence intelligence briefing for ${snapshot.city.name}
                   right now based on this live data:\n${context}`
        }]
      })
      briefing = response.content[0].text (assert type: TextBlock)
      Upsert to ai_briefings: { city_id: cityId, briefing, date: today }
      Insert to ai_usage: { city_id: cityId, route: '/api/city/[id]/briefing',
        tokens_in: response.usage.input_tokens, tokens_out: response.usage.output_tokens,
        duration_ms: Date.now() - start }
      Return briefing

  Also export: getCitySnapshot(cityId: string): Promise<CitySnapshot>
    This reusable helper assembles a snapshot using the cache-first data fetchers.
    Used by getDailyBriefing and the snapshot route.

lib/ai/suggestions.ts:
  Implement generateSuggestions exactly as shown in CLAUDE.md's suggestions section.
  Three contextual chips based on snapshot conditions. Returns string[].

tests/lib/ai/chat.test.ts:
  Test the pure helper functions only (no streaming, no HTTP):
  it('buildSystemPrompt includes the city name')
  it('buildUserMessage includes the city context string')
  it('buildUserMessage includes the user question')
  it('buildCityContext is embedded in the user message (integration check)')

After writing, run:
  npm test
  npm run type-check

Update PROGRESS.md: mark P4.1 complete, next = P4.2 Chat + briefing API routes.
```

---

## PROMPT P4.2 — Chat + briefing API routes

```
Read CLAUDE.md, .claude/rules/testing.md, .claude/phases/4-ai-and-chat.md, and
PROGRESS.md in that order. Confirm: current phase, last completed task, next task.
Do not write any code until you have confirmed.

---

You are building the two AI-facing API routes. The chat route is the most security-
sensitive route in the app — it calls Anthropic and costs money per request, so it
must be rate-limited by IP. It validates all input before doing anything else, then
streams the Anthropic response directly to the client.

Describe what you are about to create before writing any code:
- app/api/chat/route.ts — POST, rate-limited, streaming Anthropic response
- app/api/city/[id]/briefing/route.ts — GET, daily briefing with cache
- tests/api/chat.test.ts — 8 integration tests

Wait for confirmation before writing.

---

FILES TO CREATE:

app/api/chat/route.ts:
  Use the exact structure from CLAUDE.md's chat route section.
  
  Rate limiting (first thing after parsing):
    Import { Ratelimit } from '@upstash/ratelimit' and { kv } from '@vercel/kv'
    Use the exact pattern from .claude/rules/security.md (sliding window 20/1m)
    Fail open if KV is unavailable (try/catch around the ratelimit call).
    Return 429 ApiError on rate limit hit.
  
  Input validation:
    Parse body: { message, cityId, history }
    message: required, string, max 500 chars → 400 if invalid
    cityId: must be in VALID_CITY_IDS → 404 if not found
    history: array of ChatMessage, max 20 items → 400 if invalid
  
  Snapshot: use getCitySnapshot(cityId) from lib/ai/briefing.ts (the reusable helper)
  
  Anthropic streaming:
    client = new Anthropic()
    stream = await client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      system: buildSystemPrompt(snapshot),
      messages: [
        ...history,
        { role: 'user', content: buildUserMessage(message, snapshot) }
      ]
    })
    
    After streaming completes, log to ai_usage (fire-and-forget — do not await):
      const usage = await stream.finalMessage()
      supabase.from('ai_usage').insert({
        city_id: cityId,
        route: '/api/chat',
        tokens_in: usage.usage.input_tokens,
        tokens_out: usage.usage.output_tokens,
        duration_ms: Date.now() - start
      })
    
    Return:
      return new Response(stream.toReadableStream(), {
        headers: { 'Content-Type': 'text/event-stream' }
      })
  
  Error handling: wrap the entire handler in try/catch.
    Anthropic errors → 500 ApiError { error: 'AI service temporarily unavailable.', code: 'AI_ERROR' }

app/api/city/[id]/briefing/route.ts:
  Next.js 15: export async function GET(req: Request, { params }: { params: Promise<{ id: string }> })
  const { id } = await params
  Validate city ID (getCityById(id)) → 404 if not found.
  briefing = await getDailyBriefing(city.id)
  Return { cityId: city.id, briefing }
  Wrap in try/catch → 500 ApiError on failure.

tests/api/chat.test.ts — 8 tests from .claude/phases/4-ai-and-chat.md:
  Mock: @upstash/ratelimit, @vercel/kv, @anthropic-ai/sdk (from tests/mocks/anthropic.ts),
  lib/ai/briefing.ts getCitySnapshot, lib/cache.ts
  
  it('returns 400 when message field is missing')
  it('returns 400 when cityId field is missing')
  it('returns 400 when message exceeds 500 characters')
  it('returns 404 for unknown cityId "xyz"')
  it('returns 429 when rate limit is exceeded (mock ratelimit.limit returning success: false)')
  it('returns a streaming response for valid input (mock Anthropic stream)')
  it('calls buildSystemPrompt with the snapshot — city name appears in system prompt')
  it('handles Anthropic error — returns 500 with ApiError shape')

After writing, run:
  npm test
  npm run type-check

Update PROGRESS.md: mark P4.2 complete, next = P4.3 StreamingText + ChatMessage.
```

---

## PROMPT P4.3 — StreamingText + ChatMessage

```
Read CLAUDE.md, .claude/rules/testing.md, .claude/phases/4-ai-and-chat.md, and
PROGRESS.md in that order. Confirm: current phase, last completed task, next task.
Do not write any code until you have confirmed.

---

You are building two UI components for the chat system. StreamingText renders AI
responses character by character with an amber cursor. ChatMessage wraps a single
message bubble — different styling for user vs assistant, and passes the streaming
prop through to StreamingText for assistant messages.

Describe what you are about to create before writing any code:
- components/chat/StreamingText.tsx — text renderer with streaming cursor
- components/chat/ChatMessage.tsx — single message bubble
- tests for both components

Wait for confirmation before writing.

---

FILES TO CREATE:

components/chat/StreamingText.tsx:
  Props: { text: string; streaming: boolean }
  
  Renders the text prop as-is (no character-by-character animation — the text state
  in ChatDrawer already updates character-by-character via stream chunks).
  
  Shows an amber cursor | while streaming:
    <span style={{
      color: 'var(--amber)',
      animation: 'blink-cursor 0.8s ease-in-out infinite',
      marginLeft: '1px',
    }}>|</span>
  
  The cursor is hidden when streaming is false (use && conditional).
  
  Wraps everything in a <span> (inline — for use inside message bubbles).
  
  Note: text is user-generated AI output — render as text ONLY, never as HTML.
  Never use dangerouslySetInnerHTML. Just: {text}

components/chat/ChatMessage.tsx:
  Props: { message: ChatMessage }  (ChatMessage type from lib/types.ts)
  
  Two visual states:
    role === 'user':
      Align right (marginLeft: auto)
      Background: rgba(232, 160, 32, 0.12), border: var(--amber-border)
      borderRadius: var(--radius-lg), padding: 10px 14px, maxWidth: '85%'
      Text: var(--tx-1), 13px
      Content: {message.content} as plain text
    
    role === 'assistant':
      Align left
      Background: var(--bg-elevated), border: 1px solid var(--border-subtle)
      borderRadius: var(--radius-lg), padding: 10px 14px, maxWidth: '85%'
      Text: var(--tx-1), 13px
      Content: <StreamingText text={message.content} streaming={message.streaming ?? false} />
  
  aria-label: `${message.role === 'user' ? 'You' : 'Citadel'}: ${message.content}`

tests/components/StreamingText.test.tsx — 4 tests:
  it('renders the text prop as text content')
  it('shows the cursor span when streaming is true')
  it('does not show cursor when streaming is false')
  it('renders empty string without crashing')

tests/components/ChatMessage.test.tsx — 4 tests:
  it('renders user message text content')
  it('applies right-alignment style for user messages')
  it('renders assistant message via StreamingText')
  it('passes streaming=true to StreamingText when message.streaming is true')

After writing, run:
  npm test
  npm run type-check

Update PROGRESS.md: mark P4.3 complete, next = P4.4 ChatSuggestions + ChatDrawer.
```

---

## PROMPT P4.4 — ChatSuggestions + ChatDrawer + wire into page

```
Read CLAUDE.md, .claude/rules/testing.md, .claude/phases/4-ai-and-chat.md, and
PROGRESS.md in that order. Confirm: current phase, last completed task, next task.
Do not write any code until you have confirmed.

---

You are building the complete chat experience: the suggestion chips that appear above
the input, and the full ChatDrawer that slides up from the bottom. The drawer manages
the full conversation state and handles the streaming fetch loop. At the end you wire
the "Ask" button in the nav pill to open it.

Describe what you are about to create before writing any code:
- components/chat/ChatSuggestions.tsx — three chip buttons
- components/chat/ChatDrawer.tsx — full slide-up chat panel with streaming
- Update app/city/[id]/page.tsx — render ChatDrawer when chatOpen is true

Wait for confirmation before writing.

---

FILES TO CREATE:

components/chat/ChatSuggestions.tsx:
  Props: { suggestions: string[]; onSelect: (suggestion: string) => void }
  
  Renders up to 3 chips in a horizontal scrollable row.
  Chip styles: from .claude/design.md — background rgba(232,160,32,0.08), amber text,
  borderRadius 16px, padding: 6px 12px, fontSize 12px, cursor pointer.
  On click: onSelect(suggestion)
  Keyboard accessible: tabIndex={0}, Enter activates.
  Chips scroll horizontally if they overflow (overflow-x: auto).

components/chat/ChatDrawer.tsx ('use client'):
  Props:
    cityId: string
    snapshot: CitySnapshot
    onClose: () => void

  State:
    messages: ChatMessage[] = []
    input: string = ''
    streaming: boolean = false
    suggestions: string[] — computed from snapshot via generateSuggestions

  On mount: generate suggestions from snapshot.

  handleSend(message: string):
    if streaming or message.trim() === '': return
    setStreaming(true)                              ← FIRST, before any await
    setInput('')
    const userMsg: ChatMessage = { role: 'user', content: message }
    const assistantMsg: ChatMessage = { role: 'assistant', content: '', streaming: true }
    setMessages(prev => [...prev, userMsg, assistantMsg])
    
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          cityId,
          history: messages.slice(-10)  // send last 10 messages as context
        })
      })
      
      if (!res.ok) {
        const err = await res.json()
        setMessages(prev => [
          ...prev.slice(0, -1),
          { role: 'assistant', content: err.error ?? 'Something went wrong.', streaming: false }
        ])
        setStreaming(false)
        return
      }
      
      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        setMessages(prev => [
          ...prev.slice(0, -1),
          { ...prev[prev.length - 1], content: prev[prev.length - 1].content + chunk }
        ])
      }
    } catch {
      setMessages(prev => [
        ...prev.slice(0, -1),
        { role: 'assistant', content: '[Connection interrupted. Please try again.]', streaming: false }
      ])
    }
    
    setMessages(prev => [
      ...prev.slice(0, -1),
      { ...prev[prev.length - 1], streaming: false }
    ])
    setStreaming(false)

  Escape key: useEffect → document keydown listener → if Escape → onClose()
  
  Render — slide up from bottom:
    Outer div: position: absolute, bottom: 0, left: 0, right: 0, height: 42vh
    background: var(--chat-bg), backdropFilter: blur(16px)
    borderTop: 1px solid rgba(232,160,32,0.20)
    zIndex: var(--z-chat)
    transition: transform 200ms ease (animate in via useEffect adding 'open' class)
    
    Inside:
      Header row: "Ask Citadel" label (13px/600/amber) + close button (×, aria-label="Close chat")
      
      Messages area: scrollable, flex-col gap-8px, padding 12px
        {messages.map((msg, i) => <ChatMessage key={i} message={msg} />)}
        Auto-scroll to bottom on new message (useRef on container, scrollTop = scrollHeight)
      
      Suggestion chips (above input, only when messages is empty):
        <ChatSuggestions suggestions={suggestions} onSelect={msg => handleSend(msg)} />
      
      Input row (bottom, fixed):
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) handleSend(input) }}
          placeholder="Ask about the city..."
          disabled={streaming}
          aria-label="Chat input"
        />
        Send button: disabled={streaming || !input.trim()}
          label: streaming ? 'Sending…' : 'Send'

Update app/city/[id]/page.tsx:
  The "Ask" button in the nav pill already sets setChatOpen(true).
  Add below the panel section:
    {chatOpen && snapshot && (
      <ChatDrawer
        cityId={cityId}
        snapshot={snapshot}
        onClose={() => setChatOpen(false)}
      />
    )}

After writing, run:
  npm run dev
  Test end-to-end in browser:
    Click "Ask" → drawer slides up
    Type a question → streaming response appears word by word
    Amber cursor blinks during response, disappears when done
    Escape closes the drawer
  npm test
  npm run type-check

Update PROGRESS.md: mark P4.4 complete, next = P4.5 Phase 4 final checklist.
```

---

## PROMPT P4.5 — Phase 4 final checklist

```
Read CLAUDE.md, .claude/rules/testing.md, .claude/phases/4-ai-and-chat.md, and
PROGRESS.md in that order. Confirm: current phase, last completed task, next task.
Do not write any code unless fixing a failing check.

---

This is the final checklist for Phase 4. Run each check and report the result.

---

1. npm run type-check — zero errors.

2. npm test — all tests pass.

3. npm run test:coverage — lines ≥ 80%, functions ≥ 80%, branches ≥ 75%.
   Update vitest.config.ts thresholds to these values.

4. npm run build — production build succeeds.

5. npm run dev — manual browser verification:
   - Click "Ask" → chat drawer slides up with 200ms ease animation
   - Three suggestion chips appear above the input when no messages exist
   - Click a suggestion chip → it sends immediately
   - Type a question, press Enter → user message appears, AI streams response
   - Amber cursor | blinks while streaming, disappears when done
   - Error response: send a request when rate-limited → graceful error message in chat (not a blank)
   - Escape closes the chat drawer from any state
   - Click above the drawer (on the map) closes it
   - GET /api/city/new-york/briefing → returns a briefing string (check in browser)
   - Second request to /api/city/new-york/briefing → returns same text (cached)
   - Supabase ai_usage table → rows appear after chat and briefing calls
   - Browser DevTools → Network: no direct calls to api.anthropic.com from client

6. Rate limiting manual test:
   Open browser DevTools console. Send 21 chat messages as fast as possible:
   for(let i=0;i<21;i++) { fetch('/api/chat', { method:'POST',
     headers:{'Content-Type':'application/json'},
     body: JSON.stringify({ message:'test', cityId:'new-york', history:[] }) }) }
   The 21st response should be 429. (This only works with KV configured.)
   If KV is not configured locally, note this and test on the deployed preview.

7. npm audit — no high or critical vulnerabilities.

After all checks pass:
  Update PROGRESS.md:
    - Mark P4.5 complete
    - Change current phase to "Phase 5 — Map Layers (not started)"

Proceed to PHASE5ROADMAP.md when ready.
```
