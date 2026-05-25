'use client'

import { useEffect, useRef, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import PanelBase from './PanelBase'

interface HistoryPanelProps {
  cityId: string
  onClose: () => void
}

type PulseRow = { pulse_score: number; recorded_at: string }

const CHART_W = 248
const CHART_H = 100
const MAX_POINTS = 168

export default function HistoryPanel({ cityId, onClose }: HistoryPanelProps) {
  const [history, setHistory] = useState<PulseRow[]>([])
  const [currentPulse, setCurrentPulse] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`/api/pulse/${cityId}`)
      .then(r => r.json())
      .then(data => {
        setCurrentPulse(data.currentPulse ?? 0)
        // API returns newest-first; reverse for chart (oldest left, newest right)
        const rows: PulseRow[] = (data.history ?? []).slice(0, MAX_POINTS).reverse()
        setHistory(rows)
      })
      .catch(() => {})
  }, [cityId])

  const count = history.length
  const itemWidth = count > 1 ? CHART_W / (count - 1) : CHART_W

  const virtualizer = useVirtualizer({
    count,
    getScrollElement: () => containerRef.current,
    estimateSize: () => itemWidth,
    horizontal: true,
  })

  function pointCoords(i: number): { x: number; y: number } {
    const x = count > 1 ? (i / (count - 1)) * CHART_W : CHART_W / 2
    const y = CHART_H - (history[i].pulse_score / 100) * CHART_H
    return { x, y }
  }

  const polylinePoints = history
    .map((_, i) => {
      const { x, y } = pointCoords(i)
      return `${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(' ')

  return (
    <PanelBase anchor="right-center" onClose={onClose} title="PULSE HISTORY">
      {history.length < 2 ? (
        <p style={{ fontSize: '12px', color: 'var(--tx-2)', margin: 0 }}>
          Not enough data yet — check back after a few hours.
        </p>
      ) : (
        <>
          <div
            ref={containerRef}
            style={{ overflow: 'hidden', marginBottom: '12px' }}
          >
            <svg
              width={CHART_W}
              height={CHART_H}
              style={{ display: 'block' }}
              aria-label="Pulse score history over last 7 days"
            >
              {/* Subtle midpoint guide */}
              <line
                x1={0} y1={CHART_H / 2}
                x2={CHART_W} y2={CHART_H / 2}
                stroke="rgba(255,255,255,0.06)"
                strokeWidth={1}
              />
              <polyline
                points={polylinePoints}
                fill="none"
                stroke="#E8A020"
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {virtualizer.getVirtualItems().map(vi => {
                const { x, y } = pointCoords(vi.index)
                return (
                  <circle
                    key={vi.key}
                    cx={x}
                    cy={y}
                    r={2}
                    fill="#E8A020"
                  />
                )
              })}
            </svg>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span
              style={{
                fontSize: '32px',
                fontWeight: 800,
                color: '#E8A020',
                lineHeight: 1.1,
              }}
            >
              {currentPulse}
            </span>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                color: 'var(--tx-2)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              current pulse
            </span>
          </div>
        </>
      )}
    </PanelBase>
  )
}
