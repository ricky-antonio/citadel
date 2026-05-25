'use client'

import PanelBase from './PanelBase'
import type { Anomaly, MetricType } from '@/lib/types'

interface AnomalyPanelProps {
  anomalies: Anomaly[]
  onClose: () => void
}

function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  if (days > 0) return rtf.format(-days, 'day')
  if (hours > 0) return rtf.format(-hours, 'hour')
  if (minutes > 0) return rtf.format(-minutes, 'minute')
  return 'just now'
}

function metricLabel(metric: MetricType): string {
  switch (metric) {
    case 'pulse':   return 'PULSE'
    case 'aqi':     return 'AQI'
    case 'transit': return 'TRANSIT'
    case 'events':  return 'EVENTS'
  }
}

function MetricBadge({ metric }: { metric: MetricType }) {
  return (
    <span
      style={{
        fontSize: '9px',
        fontWeight: 700,
        letterSpacing: '0.5px',
        color: '#E8A020',
        background: '#E8A0201A',
        border: '1px solid #E8A0204D',
        borderRadius: '4px',
        padding: '2px 5px',
        whiteSpace: 'nowrap',
      }}
    >
      {metricLabel(metric)}
    </span>
  )
}

function AnomalyRow({ anomaly }: { anomaly: Anomaly }) {
  const deviationPct = `${(anomaly.deviation * 100).toFixed(0)}%`

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        paddingBottom: '8px',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <MetricBadge metric={anomaly.metric} />
        <span style={{ fontSize: '12px', fontWeight: 700, color: '#EF4444' }}>
          +{deviationPct}
        </span>
        <span style={{ fontSize: '10px', color: 'var(--tx-3)', marginLeft: 'auto' }}>
          {formatRelativeTime(anomaly.occurredAt)}
        </span>
      </div>
      <span style={{ fontSize: '11px', color: 'var(--tx-2)', lineHeight: 1.4 }}>
        {anomaly.description ?? (
          <span style={{ color: 'var(--tx-3)', fontStyle: 'italic' }}>Analyzing…</span>
        )}
      </span>
    </div>
  )
}

export default function AnomalyPanel({ anomalies, onClose }: AnomalyPanelProps) {
  const displayAnomalies = anomalies.slice(0, 10)

  return (
    <PanelBase anchor="left-center" onClose={onClose} title="ANOMALIES">
      {displayAnomalies.length === 0 ? (
        <p style={{ fontSize: '12px', color: 'var(--tx-2)', margin: 0 }}>
          No anomalies detected in the last 7 days.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {displayAnomalies.map((anomaly, i) => (
            <AnomalyRow key={anomaly.id ?? `${anomaly.metric}-${i}`} anomaly={anomaly} />
          ))}
        </div>
      )}
    </PanelBase>
  )
}
