import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { OrbitalCore } from '@/components/orbital/OrbitalCore'

describe('OrbitalCore', () => {
  const defaultProps = {
    pulseScore: 72,
    pulseLabel: 'Active',
    pulseColor: '#E8A020',
  }

  it('renders the pulse score number as text content', () => {
    render(<OrbitalCore {...defaultProps} />)
    expect(screen.getByText('72')).toBeInTheDocument()
  })

  it('renders the pulse label in uppercase', () => {
    render(<OrbitalCore {...defaultProps} />)
    expect(screen.getByText('ACTIVE')).toBeInTheDocument()
  })

  it('has aria-label containing the score and label', () => {
    render(<OrbitalCore {...defaultProps} />)
    const svg = screen.getByRole('img')
    expect(svg).toHaveAttribute('aria-label', 'Pulse score 72 — Active')
  })

  it('renders three circle elements for the SVG rings', () => {
    const { container } = render(<OrbitalCore {...defaultProps} />)
    // Three rings + one core circle = 4 total; rings have fill="none"
    const rings = container.querySelectorAll('circle[fill="none"]')
    expect(rings).toHaveLength(3)
  })
})
