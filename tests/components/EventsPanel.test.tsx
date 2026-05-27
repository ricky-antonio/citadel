import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import EventsPanel from '@/components/panels/EventsPanel'
import type { EventsData } from '@/lib/types'

const mockEvents: EventsData = {
  count: 3,
  totalCapacity: 25000,
  tonight: [
    { id: '1', name: 'Jazz Night', venue: 'Blue Note', time: '2024-06-15T20:00:00', capacity: 500, source: 'ticketmaster' },
    { id: '2', name: 'Rock Concert', venue: 'Madison Square Garden', time: '2024-06-15T21:00:00', capacity: 20000, source: 'ticketmaster' },
    { id: '3', name: 'Comedy Show', venue: 'Beacon Theatre', time: '2024-06-15T22:00:00', capacity: 2800, source: 'ticketmaster' },
  ],
}

const emptyEvents: EventsData = {
  count: 0,
  totalCapacity: 0,
  tonight: [],
}

describe('EventsPanel', () => {
  it('renders empty state when events.count is 0 and tonight is empty', () => {
    render(<EventsPanel events={emptyEvents} onClose={vi.fn()} />)
    expect(screen.getByText('No major events tonight.')).toBeInTheDocument()
  })

  it('renders sub-text in empty state', () => {
    render(<EventsPanel events={emptyEvents} onClose={vi.fn()} />)
    expect(screen.getByText(/Check back this afternoon/)).toBeInTheDocument()
  })

  it('renders event names when tonight has events', () => {
    render(<EventsPanel events={mockEvents} onClose={vi.fn()} />)
    expect(screen.getByText('Jazz Night')).toBeInTheDocument()
    expect(screen.getByText('Rock Concert')).toBeInTheDocument()
  })

  it('renders event count header when events exist', () => {
    render(<EventsPanel events={mockEvents} onClose={vi.fn()} />)
    expect(screen.getByText(/3 events today/)).toBeInTheDocument()
  })

  it('renders attendance badge for large events', () => {
    render(<EventsPanel events={mockEvents} onClose={vi.fn()} />)
    expect(screen.getByText('~20K')).toBeInTheDocument()
  })

  it('renders attendance badge for medium events', () => {
    render(<EventsPanel events={mockEvents} onClose={vi.fn()} />)
    expect(screen.getByText('~3K')).toBeInTheDocument()
  })

  it('does not render attendance badge for small events', () => {
    render(<EventsPanel events={mockEvents} onClose={vi.fn()} />)
    // Jazz Night (500 capacity) should have no badge
    expect(screen.queryByText('~1K')).not.toBeInTheDocument()
  })

  it('limits display to 5 events', () => {
    const manyEvents: EventsData = {
      count: 7,
      totalCapacity: 10000,
      tonight: Array.from({ length: 7 }, (_, i) => ({
        id: String(i),
        name: `Event ${i + 1}`,
        venue: 'Venue',
        time: '2024-06-15T20:00:00',
        capacity: 100,
        source: 'ticketmaster' as const,
      })),
    }
    render(<EventsPanel events={manyEvents} onClose={vi.fn()} />)
    expect(screen.getByText('Event 5')).toBeInTheDocument()
    expect(screen.queryByText('Event 6')).not.toBeInTheDocument()
  })

  it('renders the panel title EVENTS', () => {
    render(<EventsPanel events={emptyEvents} onClose={vi.fn()} />)
    expect(screen.getByText('EVENTS')).toBeInTheDocument()
  })
})
