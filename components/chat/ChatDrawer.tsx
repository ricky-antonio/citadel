'use client'

import { useState, useEffect, useRef } from 'react'
import type { CitySnapshot, ChatMessage } from '@/lib/types'
import { generateSuggestions } from '@/lib/ai/suggestions'
import ChatSuggestions from './ChatSuggestions'
import ChatMessageBubble from './ChatMessage'

interface Props {
  cityId: string
  snapshot: CitySnapshot
  onClose: () => void
}

// Narrow the SSE event shape coming from Anthropic or the E2E mock
interface SseTextDelta {
  type: 'content_block_delta'
  delta: { type: 'text_delta'; text: string }
}
interface SseMockText {
  type: 'text'
  text: string
}
type SseEvent = SseTextDelta | SseMockText | { type: string }

function extractText(data: SseEvent): string {
  if (data.type === 'content_block_delta') {
    const d = (data as SseTextDelta).delta
    if (d?.type === 'text_delta') return d.text
  }
  if (data.type === 'text') {
    return (data as SseMockText).text ?? ''
  }
  return ''
}

export default function ChatDrawer({ cityId, snapshot, onClose }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [open, setOpen] = useState(false)
  const [suggestions] = useState<string[]>(() => generateSuggestions(snapshot))
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  // Incoming text is buffered here and drained at a fixed rate so the display
  // scrolls smoothly instead of jumping in network-sized batches.
  const pendingBufferRef = useRef('')
  const streamEndedRef = useRef(false)

  useEffect(() => {
    const id = setTimeout(() => setOpen(true), 1)
    return () => clearTimeout(id)
  }, [])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // Scroll container to bottom when new messages arrive.
  // Avoid scrollIntoView — Chrome's smooth-scroll implementation can escape
  // overflow:hidden and scroll the document, causing the whole page to scroll.
  useEffect(() => {
    if (messages.length > 0 && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }, [messages])

  // Drain the pending buffer 3 chars every 20ms (~150 chars/sec).
  // When the stream has ended and the buffer is empty, flip streaming: false.
  useEffect(() => {
    const interval = setInterval(() => {
      if (pendingBufferRef.current.length > 0) {
        const chars = pendingBufferRef.current.slice(0, 3)
        pendingBufferRef.current = pendingBufferRef.current.slice(3)
        setMessages(prev => {
          if (prev.length === 0) return prev
          const last = prev[prev.length - 1]
          return [...prev.slice(0, -1), { ...last, content: last.content + chars }]
        })
      } else if (streamEndedRef.current) {
        streamEndedRef.current = false
        setMessages(prev => {
          if (prev.length === 0) return prev
          return [...prev.slice(0, -1), { ...prev[prev.length - 1], streaming: false }]
        })
        setStreaming(false)
      }
    }, 20)
    return () => clearInterval(interval)
  }, [])

  async function handleSend(message: string) {
    if (streaming || message.trim() === '') return
    setStreaming(true)
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
          // Strip UI-only 'streaming' field — Anthropic API rejects unknown message fields
          history: messages.slice(-10).map(({ role, content }) => ({ role, content })),
        }),
      })

      if (!res.ok) {
        const err = (await res.json()) as { error?: string }
        pendingBufferRef.current = ''
        streamEndedRef.current = false
        setMessages(prev => [
          ...prev.slice(0, -1),
          { role: 'assistant', content: err.error ?? 'Something went wrong.', streaming: false },
        ])
        setStreaming(false)
        return
      }

      const body = res.body
      if (!body) throw new Error('Empty response body')

      const reader = body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        // The Anthropic SDK's toReadableStream() emits NDJSON:
        // each event is JSON.stringify(event) + '\n' — no SSE 'data:' prefix.
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.trim()) continue
          try {
            const data = JSON.parse(line) as SseEvent
            const text = extractText(data)
            if (text) {
              pendingBufferRef.current += text
            }
          } catch {
            // Skip malformed lines
          }
        }
      }
    } catch {
      pendingBufferRef.current = ''
      streamEndedRef.current = false
      setMessages(prev => [
        ...prev.slice(0, -1),
        {
          role: 'assistant',
          content: '[Connection interrupted. Please try again.]',
          streaming: false,
        },
      ])
      setStreaming(false)
      return
    }

    // Signal drain interval to flip streaming: false once buffer empties
    streamEndedRef.current = true
  }

  return (
    <div
      data-chat-drawer="true"
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '42vh',
        background: 'var(--chat-bg)',
        backdropFilter: 'blur(16px)',
        borderTop: '1px solid var(--panel-border)',
        zIndex: 'var(--z-chat)' as unknown as number,
        display: 'flex',
        flexDirection: 'column',
        transform: open ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 200ms ease',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px 8px',
          borderBottom: '1px solid var(--border-subtle)',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--amber)',
          }}
        >
          Ask Citadel
        </span>
        <button
          onClick={onClose}
          aria-label="Close chat"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--tx-2)',
            fontSize: '18px',
            cursor: 'pointer',
            minWidth: '44px',
            minHeight: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ×
        </button>
      </div>

      {/* Messages area */}
      <div
        ref={messagesContainerRef}
        aria-live="polite"
        aria-atomic="false"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {messages.map((msg, i) => (
          <ChatMessageBubble key={i} message={msg} />
        ))}
      </div>

      {/* Suggestion chips — only when no messages have been sent */}
      {messages.length === 0 && (
        <ChatSuggestions
          suggestions={suggestions}
          onSelect={msg => void handleSend(msg)}
        />
      )}

      {/* Input row */}
      <div
        style={{
          padding: '8px 16px 16px',
          display: 'flex',
          gap: '8px',
          flexShrink: 0,
          borderTop: '1px solid var(--border-subtle)',
        }}
      >
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              void handleSend(input)
            }
          }}
          placeholder="Ask about the city..."
          disabled={streaming}
          aria-label="Chat input"
          style={{
            flex: 1,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius)',
            color: 'var(--tx-1)',
            fontSize: '13px',
            padding: '0 12px',
            height: '36px',
            outline: 'none',
          }}
        />
        <button
          onClick={() => void handleSend(input)}
          disabled={streaming || !input.trim()}
          style={{
            background: 'var(--amber)',
            color: '#1A1200',
            border: 'none',
            borderRadius: 'var(--radius)',
            padding: '0 16px',
            height: '36px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: streaming || !input.trim() ? 'not-allowed' : 'pointer',
            opacity: streaming || !input.trim() ? 0.4 : 1,
            whiteSpace: 'nowrap',
          }}
        >
          {streaming ? 'Sending…' : 'Send'}
        </button>
      </div>
    </div>
  )
}
