'use client'

import React from 'react'

type OrbitalMetricProps = {
  metric: 'weather' | 'aq' | 'transit' | 'events' | 'crime'
  value: string
  label: string
  color: string
  animationDelay: string
  onOpen: () => void
  isExpanded?: boolean
}

export function OrbitalMetric({ metric, value, label, color, animationDelay, onOpen, isExpanded = false }: OrbitalMetricProps) {
  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onOpen()
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${label}: ${value}. Press Enter to expand.`}
      aria-expanded={isExpanded}
      data-testid={`orbital-node-${metric}`}
      onClick={onOpen}
      onKeyDown={handleKeyDown}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        cursor: 'pointer',
        pointerEvents: 'auto',
        animation: 'float 4s ease-in-out infinite',
        animationDelay,
        background: 'rgba(6, 10, 15, 0.70)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '8px',
        padding: '8px 12px',
      }}
    >
      <div
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: color,
        }}
      />
      <span style={{ fontSize: '14px', fontWeight: 700, color }}>
        {value}
      </span>
      <span
        style={{
          fontSize: '9px',
          fontWeight: 700,
          color: 'var(--tx-2)',
          letterSpacing: '1px',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </span>
    </div>
  )
}
