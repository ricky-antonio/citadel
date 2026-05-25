import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import MetricBadge from '@/components/shared/MetricBadge'

describe('MetricBadge', () => {
  it('renders the label', () => {
    render(<MetricBadge label="AQI" value={42} />)
    expect(screen.getByText('AQI')).toBeInTheDocument()
  })

  it('renders the value', () => {
    render(<MetricBadge label="AQI" value={42} />)
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('renders value with unit when unit is provided', () => {
    render(<MetricBadge label="Temp" value={72} unit="°F" />)
    expect(screen.getByText('72°F')).toBeInTheDocument()
  })

  it('renders string value', () => {
    render(<MetricBadge label="Status" value="Active" />)
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('renders without unit when omitted', () => {
    const { container } = render(<MetricBadge label="Score" value={88} />)
    expect(container.textContent).toContain('88')
    expect(container.textContent).not.toContain('undefined')
  })
})
