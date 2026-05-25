'use client'

import PanelBase from './PanelBase'
import type { TransitData, TransitSeverity } from '@/lib/types'

interface TransitPanelProps {
  transit: TransitData
  onClose: () => void
}

function severityColor(severity: TransitSeverity): string {
  return severity === 'major' ? '#EF4444' : '#E8A020'
}

function SeverityBadge({ severity }: { severity: TransitSeverity }) {
  const color = severityColor(severity)
  return (
    <span
      style={{
        fontSize: '9px',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        color,
        background: `${color}1A`,
        border: `1px solid ${color}4D`,
        borderRadius: '4px',
        padding: '2px 5px',
        whiteSpace: 'nowrap',
      }}
    >
      {severity}
    </span>
  )
}

export default function TransitPanel({ transit, onClose }: TransitPanelProps) {
  const displayAlerts = transit.alerts.slice(0, 5)

  // Derive unique lines from alerts (up to 8)
  const uniqueLines = Array.from(
    new Map(transit.alerts.map(a => [a.line, a])).entries()
  ).slice(0, 8)

  return (
    <PanelBase anchor="bottom-right" onClose={onClose} title="TRANSIT">
      {transit.delayCount === 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }} aria-hidden="true">✓</span>
          <span style={{ fontSize: '13px', color: '#4ADE80' }}>All lines running normally</span>
        </div>
      ) : (
        <>
          <div
            style={{
              fontSize: '14px',
              fontWeight: 700,
              color: '#E8A020',
              marginBottom: '10px',
            }}
          >
            {transit.delayCount} active delay{transit.delayCount !== 1 ? 's' : ''}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
            {displayAlerts.map((alert, i) => (
              <div
                key={`${alert.line}-${i}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '3px',
                  paddingBottom: '8px',
                  borderBottom: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--tx-1)' }}>
                    {alert.line}
                  </span>
                  <SeverityBadge severity={alert.severity} />
                </div>
                <span style={{ fontSize: '11px', color: 'var(--tx-2)', lineHeight: 1.4 }}>
                  {alert.message}
                </span>
              </div>
            ))}
          </div>

          {uniqueLines.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {uniqueLines.map(([line, alert]) => {
                const dotColor = severityColor(alert.severity)
                return (
                  <div
                    key={line}
                    style={{ display: 'flex', alignItems: 'center', gap: '7px' }}
                  >
                    <div
                      aria-hidden="true"
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        background: dotColor,
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontSize: '12px', color: 'var(--tx-1)' }}>{line}</span>
                    <span style={{ fontSize: '11px', color: dotColor, marginLeft: 'auto' }}>
                      {alert.severity === 'major' ? 'disrupted' : 'delayed'}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </PanelBase>
  )
}
