import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import PulseScore from '@/components/shared/PulseScore'

describe('PulseScore', () => {
  it('renders the score number', () => {
    render(<PulseScore score={55} />)
    expect(screen.getByText('55')).toBeInTheDocument()
  })

  it('renders label text when provided in md size', () => {
    render(<PulseScore score={55} label="Active" />)
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('does not render label when not provided', () => {
    render(<PulseScore score={55} />)
    expect(screen.queryByText('Active')).not.toBeInTheDocument()
  })

  it('renders a dot element in sm size', () => {
    const { container } = render(<PulseScore score={30} size="sm" />)
    // sm renders a dot span + score, md renders column layout
    const spans = container.querySelectorAll('span')
    // outer span + dot span + score text (via text node inside outer span)
    expect(spans.length).toBeGreaterThan(1)
  })

  it('uses amber color for score in the Active range (40–59)', () => {
    render(<PulseScore score={50} />)
    const scoreEl = screen.getByText('50')
    // jsdom normalizes hex to rgb
    expect(scoreEl.style.color).toBe('rgb(232, 160, 32)')
  })

  it('uses blue color for score in the Quiet range (< 20)', () => {
    render(<PulseScore score={10} />)
    const scoreEl = screen.getByText('10')
    expect(scoreEl.style.color).toBe('rgb(96, 165, 250)')
  })
})
