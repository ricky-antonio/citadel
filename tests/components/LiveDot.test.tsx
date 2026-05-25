import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import LiveDot from '@/components/shared/LiveDot'

describe('LiveDot', () => {
  it('renders with aria-label "Live data"', () => {
    render(<LiveDot />)
    expect(screen.getByLabelText('Live data')).toBeInTheDocument()
  })

  it('has the green background color in its style', () => {
    render(<LiveDot />)
    const dot = screen.getByLabelText('Live data')
    expect(dot).toHaveStyle({ background: '#4ADE80' })
  })
})
