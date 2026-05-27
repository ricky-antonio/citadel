'use client'

import { useEffect, useRef, useState } from 'react'

const LAYERS: { id: string; label: string }[] = [
  { id: 'air-quality', label: 'Air Quality' },
  { id: 'events',      label: 'Events' },
  { id: 'transit',     label: 'Transit' },
  { id: 'crowd',       label: 'Crowd' },
  { id: 'crime',       label: 'Crime' },
]

interface LayerToggleProps {
  activeLayers: string[]
  onLayerChange: (layers: string[]) => void
}

export default function LayerToggle({ activeLayers, onLayerChange }: LayerToggleProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
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

  function toggleLayer(id: string) {
    if (activeLayers.includes(id)) {
      onLayerChange(activeLayers.filter(l => l !== id))
    } else {
      onLayerChange([...activeLayers, id])
    }
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen(prev => !prev)}
        aria-expanded={open}
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
        Layers
        <span style={{ fontSize: '10px', opacity: 0.6 }}>▾</span>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            background: 'var(--panel-bg)',
            backdropFilter: 'blur(12px)',
            border: '1px solid var(--panel-border)',
            borderRadius: 'var(--radius-lg)',
            minWidth: '160px',
            zIndex: 'var(--z-nav)',
            padding: '8px 0',
            overflow: 'hidden',
          }}
        >
          {LAYERS.map(layer => {
            const checked = activeLayers.includes(layer.id)
            return (
              <label
                key={layer.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 14px',
                  cursor: 'pointer',
                  color: 'var(--tx-1)',
                  fontSize: '12px',
                  fontWeight: checked ? 600 : 400,
                  minHeight: '44px',
                }}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleLayer(layer.id)}
                  style={{
                    accentColor: 'var(--amber)',
                    width: '14px',
                    height: '14px',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                />
                {layer.label}
              </label>
            )
          })}
        </div>
      )}
    </div>
  )
}
