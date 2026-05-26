import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import MarkdownText from '@/components/chat/MarkdownText'

describe('MarkdownText', () => {
  it('renders plain text without modification', () => {
    render(<MarkdownText text="The city is quiet." streaming={false} />)
    expect(screen.getByText('The city is quiet.')).toBeInTheDocument()
  })

  it('renders **bold** tokens as strong elements', () => {
    render(<MarkdownText text="It is **very** cold." streaming={false} />)
    const bold = screen.getByText('very')
    expect(bold.tagName).toBe('STRONG')
  })

  it('renders # heading with amber color', () => {
    const { container } = render(
      <MarkdownText text="# Chicago Tonight" streaming={false} />
    )
    const heading = container.querySelector('div[style*="color: var(--amber)"]')
    expect(heading?.textContent).toContain('Chicago Tonight')
  })

  it('renders ### sub-heading as styled amber text', () => {
    render(<MarkdownText text="### Air Quality" streaming={false} />)
    expect(screen.getByText('Air Quality')).toBeInTheDocument()
  })

  it('renders ## sub-heading in uppercase style', () => {
    const { container } = render(
      <MarkdownText text="## Transit Note" streaming={false} />
    )
    // Second amber heading has uppercase text-transform
    const headings = Array.from(
      container.querySelectorAll<HTMLElement>('div')
    ).filter((el) => el.style.textTransform === 'uppercase')
    expect(headings.length).toBeGreaterThan(0)
    expect(headings[0].textContent).toContain('Transit Note')
  })

  it('renders --- as a horizontal divider element', () => {
    const { container } = render(<MarkdownText text="---" streaming={false} />)
    // The rule is a div with height:1px inside a wrapper
    const rule = container.querySelector('div[style*="height: 1px"]')
    expect(rule).toBeInTheDocument()
  })

  it('renders - bullet items with an amber dot', () => {
    render(<MarkdownText text="- Go for a walk" streaming={false} />)
    expect(screen.getByText('·')).toBeInTheDocument()
    expect(screen.getByText('Go for a walk', { exact: false })).toBeInTheDocument()
  })

  it('renders numbered list items', () => {
    render(<MarkdownText text="1. First item" streaming={false} />)
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('First item', { exact: false })).toBeInTheDocument()
  })

  it('shows the blinking cursor when streaming=true', () => {
    const { container } = render(
      <MarkdownText text="Responding" streaming={true} />
    )
    const cursorSpan = Array.from(container.querySelectorAll('span')).find(
      (s) => s.textContent === '|'
    )
    expect(cursorSpan).toBeDefined()
  })

  it('does not show cursor when streaming=false', () => {
    const { container } = render(
      <MarkdownText text="Done." streaming={false} />
    )
    const cursorSpan = Array.from(container.querySelectorAll('span')).find(
      (s) => s.textContent === '|'
    )
    expect(cursorSpan).toBeUndefined()
  })

  it('shows only cursor when text is empty and streaming=true', () => {
    const { container } = render(<MarkdownText text="" streaming={true} />)
    const cursorSpan = Array.from(container.querySelectorAll('span')).find(
      (s) => s.textContent === '|'
    )
    expect(cursorSpan).toBeDefined()
  })

  it('renders [text](url) as a clickable link opening in new tab', () => {
    render(
      <MarkdownText text="Check [mlb.com/cubs](https://mlb.com/cubs) for the schedule." streaming={false} />
    )
    const link = screen.getByRole('link', { name: 'mlb.com/cubs' })
    expect(link).toHaveAttribute('href', 'https://mlb.com/cubs')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('auto-links bare https:// URLs', () => {
    render(
      <MarkdownText text="See https://example.com for details." streaming={false} />
    )
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', 'https://example.com')
    expect(link).toHaveAttribute('target', '_blank')
  })

  it('does not link plain text that looks like a domain without protocol', () => {
    render(<MarkdownText text="Visit mlb.com for info." streaming={false} />)
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('renders multi-line text as separate blocks', () => {
    render(
      <MarkdownText
        text={'First line\nSecond line'}
        streaming={false}
      />
    )
    expect(screen.getByText('First line')).toBeInTheDocument()
    expect(screen.getByText('Second line')).toBeInTheDocument()
  })
})
