import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import AnomalyPanel from '@/components/panels/AnomalyPanel'
import type { Anomaly } from '@/lib/types'

const mockAnomalies: Anomaly[] = [
  {
    id: 'a1',
    cityId: 'new-york',
    metric: 'aqi',
    value: 155,
    baseline: 48,
    deviation: 2.23,
    description: 'AQI spiked significantly above the 7-day average.',
    occurredAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'a2',
    cityId: 'new-york',
    metric: 'transit',
    value: 42,
    baseline: 8,
    deviation: 4.25,
    description: undefined,
    occurredAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
]

describe('AnomalyPanel', () => {
  it('renders empty state when anomalies array is empty', () => {
    render(<AnomalyPanel anomalies={[]} onClose={vi.fn()} />)
    expect(screen.getByText(/No anomalies detected in the last 7 days/)).toBeInTheDocument()
  })

  it('renders "City metrics are within normal range." in empty state', () => {
    render(<AnomalyPanel anomalies={[]} onClose={vi.fn()} />)
    expect(screen.getByText(/City metrics are within normal range/)).toBeInTheDocument()
  })

  it('renders anomaly rows when anomalies exist', () => {
    render(<AnomalyPanel anomalies={mockAnomalies} onClose={vi.fn()} />)
    expect(screen.getByText('AQI spiked significantly above the 7-day average.')).toBeInTheDocument()
  })

  it('renders metric badge for each anomaly', () => {
    render(<AnomalyPanel anomalies={mockAnomalies} onClose={vi.fn()} />)
    expect(screen.getByText('AQI')).toBeInTheDocument()
    expect(screen.getByText('TRANSIT')).toBeInTheDocument()
  })

  it('renders deviation percentage', () => {
    render(<AnomalyPanel anomalies={mockAnomalies} onClose={vi.fn()} />)
    expect(screen.getByText('+223%')).toBeInTheDocument()
  })

  it('renders "Analyzing..." italic for anomaly with null description', () => {
    render(<AnomalyPanel anomalies={mockAnomalies} onClose={vi.fn()} />)
    expect(screen.getByText('Analyzing…')).toBeInTheDocument()
  })

  it('limits display to 10 anomalies', () => {
    const many = Array.from({ length: 12 }, (_, i): Anomaly => ({
      id: `a${i}`,
      cityId: 'new-york',
      metric: 'pulse',
      value: 80 + i,
      baseline: 50,
      deviation: 0.6 + i * 0.1,
      description: `Anomaly ${i + 1}`,
      occurredAt: new Date().toISOString(),
    }))
    render(<AnomalyPanel anomalies={many} onClose={vi.fn()} />)
    expect(screen.getByText('Anomaly 10')).toBeInTheDocument()
    expect(screen.queryByText('Anomaly 11')).not.toBeInTheDocument()
  })

  it('renders the panel title ANOMALIES', () => {
    render(<AnomalyPanel anomalies={[]} onClose={vi.fn()} />)
    expect(screen.getByText('ANOMALIES')).toBeInTheDocument()
  })
})
