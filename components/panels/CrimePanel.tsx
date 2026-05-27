'use client'

import PanelBase from './PanelBase'
import type { CrimeData } from '@/lib/types'

interface CrimePanelProps {
  crime: CrimeData
  onClose: () => void
}

function safetyColor(score: number): string {
  if (score >= 70) return '#4ADE80'
  if (score >= 40) return '#E8A020'
  return '#EF4444'
}

function safetyLabel(score: number): string {
  if (score >= 70) return 'Low risk'
  if (score >= 40) return 'Moderate'
  return 'Elevated'
}

export default function CrimePanel({ crime, onClose }: CrimePanelProps) {
  const color = safetyColor(crime.safetyScore)

  const categoryCounts = crime.recentIncidents.reduce<Record<string, number>>((acc, inc) => {
    acc[inc.category] = (acc[inc.category] ?? 0) + 1
    return acc
  }, {})

  const topCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  return (
    <PanelBase anchor="top-center" onClose={onClose} title="SAFETY">
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '12px' }}>
        <span style={{ fontSize: '36px', fontWeight: 800, color, lineHeight: 1 }}>
          {crime.safetyScore}
        </span>
        <span style={{ fontSize: '11px', fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {safetyLabel(crime.safetyScore)}
        </span>
      </div>

      <div
        style={{
          fontSize: '11px',
          color: 'var(--tx-2)',
          marginBottom: '14px',
          paddingBottom: '12px',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        {crime.totalIncidents.toLocaleString()} incidents in the last 30 days
      </div>

      {topCategories.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {topCategories.map(([category, count]) => {
            const pct = Math.round((count / crime.recentIncidents.length) * 100)
            return (
              <div key={category} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: 'var(--tx-1)', textTransform: 'capitalize' }}>
                    {category.toLowerCase()}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--tx-2)' }}>{count}</span>
                </div>
                <div
                  style={{
                    height: '2px',
                    background: 'var(--border-subtle)',
                    borderRadius: '1px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${pct}%`,
                      background: color,
                      borderRadius: '1px',
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {topCategories.length === 0 && (
        <div style={{ fontSize: '12px', color: '#4ADE80' }}>No recent incidents reported</div>
      )}
    </PanelBase>
  )
}
