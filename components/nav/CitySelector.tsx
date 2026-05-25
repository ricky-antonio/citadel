'use client'

import { useEffect, useRef, useState } from 'react'
import { CITIES } from '@/lib/cities'
import PulseScore from '@/components/shared/PulseScore'

const STATE_ABBR: Record<string, string> = {
  'new-york':       'NY',
  'san-francisco':  'CA',
  'chicago':        'IL',
  'washington-dc':  'DC',
}

interface CitySelectorProps {
  currentCityId: string
  onCityChange: (cityId: string) => void
  pulseScores?: Record<string, number>
}

export default function CitySelector({
  currentCityId,
  onCityChange,
  pulseScores = {},
}: CitySelectorProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([])

  const currentCity = CITIES.find(c => c.id === currentCityId)

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        const focused = optionRefs.current.findIndex(el => el === document.activeElement)
        const next = (focused + 1) % CITIES.length
        optionRefs.current[next]?.focus()
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        const focused = optionRefs.current.findIndex(el => el === document.activeElement)
        const prev = (focused - 1 + CITIES.length) % CITIES.length
        optionRefs.current[prev]?.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open])

  useEffect(() => {
    if (!open) return
    const handleMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [open])

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(prev => !prev)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: '8px 10px',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--tx-1)',
          fontSize: '13px',
          fontWeight: 700,
          letterSpacing: '0.3px',
          minHeight: '44px',
          minWidth: '44px',
        }}
      >
        {currentCity?.name ?? currentCityId}
        <span style={{ fontSize: '10px', opacity: 0.6 }}>▾</span>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Select city"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            background: 'var(--panel-bg)',
            backdropFilter: 'blur(12px)',
            border: '1px solid var(--panel-border)',
            borderRadius: 'var(--radius-lg)',
            minWidth: '200px',
            zIndex: 'var(--z-nav)',
            overflow: 'hidden',
          }}
        >
          {CITIES.map((city, idx) => {
            const isActive = city.id === currentCityId
            const score = pulseScores[city.id]
            return (
              <button
                key={city.id}
                ref={el => { optionRefs.current[idx] = el }}
                role="option"
                aria-selected={isActive}
                onClick={() => {
                  onCityChange(city.id)
                  setOpen(false)
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: 'transparent',
                  border: 'none',
                  borderLeft: isActive ? '3px solid var(--amber)' : '3px solid transparent',
                  cursor: 'pointer',
                  color: isActive ? 'var(--tx-1)' : 'var(--tx-2)',
                  fontSize: '12px',
                  fontWeight: isActive ? 700 : 500,
                  textAlign: 'left',
                  minHeight: '44px',
                }}
              >
                <span>
                  {city.name}
                  <span style={{ color: 'var(--tx-3)', marginLeft: '4px', fontSize: '11px' }}>
                    {STATE_ABBR[city.id]}
                  </span>
                </span>
                {score !== undefined && (
                  <PulseScore score={score} size="sm" />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
