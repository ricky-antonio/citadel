'use client'

import PanelBase from './PanelBase'
import type { EventsData, Event } from '@/lib/types'

interface EventsPanelProps {
  events: EventsData
  onClose: () => void
}

function AttendanceBadge({ capacity }: { capacity: number }) {
  if (capacity < 1000) return null

  const k = Math.round(capacity / 1000)
  const isLarge = capacity >= 10000
  const color = isLarge ? '#EF4444' : '#E8A020'

  return (
    <span
      style={{
        fontSize: '9px',
        fontWeight: 700,
        color,
        background: `${color}1A`,
        border: `1px solid ${color}4D`,
        borderRadius: '4px',
        padding: '2px 5px',
        whiteSpace: 'nowrap',
      }}
    >
      ~{k}K
    </span>
  )
}

function formatEventTime(isoTime: string): string {
  try {
    return new Date(isoTime).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  } catch {
    return isoTime
  }
}

function EventRow({ event }: { event: Event }) {
  return (
    <div
      style={{
        paddingBottom: '8px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        gap: '3px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
        <span
          style={{
            fontSize: '12px',
            fontWeight: 700,
            color: 'var(--tx-1)',
            flex: 1,
            lineHeight: 1.3,
          }}
        >
          {event.name}
        </span>
        <AttendanceBadge capacity={event.capacity} />
      </div>
      <div style={{ display: 'flex', gap: '6px', fontSize: '11px', color: 'var(--tx-2)' }}>
        <span>{formatEventTime(event.time)}</span>
        <span aria-hidden="true">·</span>
        <span
          style={{
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
          }}
        >
          {event.venue}
        </span>
      </div>
    </div>
  )
}

export default function EventsPanel({ events, onClose }: EventsPanelProps) {
  const displayEvents = events.tonight.slice(0, 5)

  return (
    <PanelBase anchor="bottom-left" onClose={onClose} title="EVENTS">
      {displayEvents.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px' }} aria-hidden="true">📅</span>
            <span style={{ fontSize: '13px', color: 'var(--tx-1)' }}>No major events tonight.</span>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--tx-3)', margin: '4px 0 0 0' }}>
            Check back this afternoon for evening event listings.
          </p>
        </div>
      ) : (
        <>
          <div
            style={{
              fontSize: '11px',
              color: 'var(--tx-2)',
              marginBottom: '10px',
            }}
          >
            {events.count} events today — {events.tonight.length} tonight
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {displayEvents.map(event => (
              <EventRow key={event.id} event={event} />
            ))}
          </div>
        </>
      )}
    </PanelBase>
  )
}
