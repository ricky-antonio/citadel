import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import StreamingText from '@/components/chat/StreamingText'

describe('StreamingText', () => {
  it('renders the text prop as text content', () => {
    render(<StreamingText text="Hello world" streaming={false} />)
    expect(screen.getByText('Hello world', { exact: false })).toBeInTheDocument()
  })

  it('shows the cursor span when streaming is true', () => {
    const { container } = render(<StreamingText text="Loading" streaming={true} />)
    const spans = container.querySelectorAll('span')
    // outer span + cursor span
    expect(spans.length).toBe(2)
    const cursor = spans[1]
    expect(cursor.textContent).toBe('|')
    expect(cursor).toHaveStyle({ animation: 'blink-cursor 0.8s ease-in-out infinite' })
  })

  it('does not show cursor when streaming is false', () => {
    const { container } = render(<StreamingText text="Done" streaming={false} />)
    const spans = container.querySelectorAll('span')
    // only the outer span
    expect(spans.length).toBe(1)
  })

  it('renders empty string without crashing', () => {
    const { container } = render(<StreamingText text="" streaming={false} />)
    expect(container.querySelector('span')).toBeInTheDocument()
  })
})
