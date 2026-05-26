import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import ChatMessage from '@/components/chat/ChatMessage'
import { ChatMessage as ChatMessageType } from '@/lib/types'

describe('ChatMessage', () => {
  it('renders user message text content', () => {
    const msg: ChatMessageType = { role: 'user', content: 'Is it raining?' }
    render(<ChatMessage message={msg} />)
    expect(screen.getByText('Is it raining?')).toBeInTheDocument()
  })

  it('applies right-alignment style for user messages', () => {
    const msg: ChatMessageType = { role: 'user', content: 'Hello' }
    const { container } = render(<ChatMessage message={msg} />)
    const bubble = container.firstChild as HTMLElement
    expect(bubble).toHaveStyle({ marginLeft: 'auto' })
  })

  it('renders assistant message text content via MarkdownText', () => {
    const msg: ChatMessageType = { role: 'assistant', content: 'The weather is clear.' }
    render(<ChatMessage message={msg} />)
    expect(screen.getByText('The weather is clear.', { exact: false })).toBeInTheDocument()
  })

  it('shows blinking cursor when streaming=true for assistant messages', () => {
    const msg: ChatMessageType = { role: 'assistant', content: 'Thinking', streaming: true }
    const { container } = render(<ChatMessage message={msg} />)
    const cursorSpan = Array.from(container.querySelectorAll('span')).find(
      (s) => s.textContent === '|'
    )
    expect(cursorSpan).toBeDefined()
  })
})
