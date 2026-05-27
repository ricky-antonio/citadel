import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import CrimePanel from '@/components/panels/CrimePanel'
import type { CrimeData } from '@/lib/types'

const mockCrime: CrimeData = {
  safetyScore: 72,
  totalIncidents: 1250,
  recentIncidents: [
    { lat: 40.71, lng: -74.01, category: 'THEFT', date: '2024-01-01' },
    { lat: 40.72, lng: -74.02, category: 'THEFT', date: '2024-01-02' },
    { lat: 40.73, lng: -74.03, category: 'ASSAULT', date: '2024-01-03' },
    { lat: 40.74, lng: -74.04, category: 'BURGLARY', date: '2024-01-04' },
  ],
}

describe('CrimePanel', () => {
  it('renders the safety score', () => {
    render(<CrimePanel crime={mockCrime} onClose={vi.fn()} />)
    expect(screen.getByText('72')).toBeInTheDocument()
  })

  it('renders "Low risk" label for score >= 70', () => {
    render(<CrimePanel crime={mockCrime} onClose={vi.fn()} />)
    expect(screen.getByText('Low risk')).toBeInTheDocument()
  })

  it('renders "Moderate" label for score 40–69', () => {
    render(<CrimePanel crime={{ ...mockCrime, safetyScore: 55 }} onClose={vi.fn()} />)
    expect(screen.getByText('Moderate')).toBeInTheDocument()
  })

  it('renders "Elevated" label for score < 40', () => {
    render(<CrimePanel crime={{ ...mockCrime, safetyScore: 25 }} onClose={vi.fn()} />)
    expect(screen.getByText('Elevated')).toBeInTheDocument()
  })

  it('renders total incidents count', () => {
    render(<CrimePanel crime={mockCrime} onClose={vi.fn()} />)
    expect(screen.getByText(/1,250 incidents/)).toBeInTheDocument()
  })

  it('renders top incident categories', () => {
    render(<CrimePanel crime={mockCrime} onClose={vi.fn()} />)
    expect(screen.getByText('theft')).toBeInTheDocument()
    expect(screen.getByText('assault')).toBeInTheDocument()
    expect(screen.getByText('burglary')).toBeInTheDocument()
  })

  it('renders category counts', () => {
    render(<CrimePanel crime={mockCrime} onClose={vi.fn()} />)
    const counts = screen.getAllByText('1')
    expect(counts.length).toBeGreaterThanOrEqual(2) // assault and burglary both have count 1
  })

  it('renders no incidents message when recentIncidents is empty', () => {
    render(
      <CrimePanel
        crime={{ safetyScore: 90, totalIncidents: 0, recentIncidents: [] }}
        onClose={vi.fn()}
      />
    )
    expect(screen.getByText('No recent incidents reported')).toBeInTheDocument()
  })

  it('limits category breakdown to top 5', () => {
    const incidents = ['A', 'B', 'C', 'D', 'E', 'F'].map((cat, i) => ({
      lat: 40 + i,
      lng: -74,
      category: cat,
      date: '2024-01-01',
    }))
    render(<CrimePanel crime={{ ...mockCrime, recentIncidents: incidents }} onClose={vi.fn()} />)
    // Only 5 categories should appear
    expect(screen.queryByText('f')).not.toBeInTheDocument()
    expect(screen.getByText('a')).toBeInTheDocument()
  })
})
