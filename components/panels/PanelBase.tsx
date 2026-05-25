'use client'

import { useEffect, useRef, useState } from 'react'
import FocusTrap from 'react-focus-trap'
import LiveDot from '@/components/shared/LiveDot'

// react-focus-trap types predate React 19 — explicit children cast required
const FT = FocusTrap as React.ComponentType<{ children: React.ReactNode }>

export type PanelAnchor =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'left-center'
  | 'right-center'

interface PanelBaseProps {
  anchor: PanelAnchor
  onClose: () => void
  title: string
  children: React.ReactNode
}

const POSITIONS: Record<PanelAnchor, React.CSSProperties> = {
  'top-left':     { top: '80px', left: '16px' },
  'top-right':    { top: '80px', right: '16px' },
  'bottom-left':  { bottom: '16px', left: '16px' },
  'bottom-right': { bottom: '16px', right: '16px' },
  'left-center':  { top: '50%', left: '16px' },
  'right-center': { top: '50%', right: '16px' },
}

function getTransform(anchor: PanelAnchor, mounted: boolean): string {
  switch (anchor) {
    case 'top-left':
    case 'top-right':
      return mounted ? 'translateY(0)' : 'translateY(-8px)'
    case 'bottom-left':
    case 'bottom-right':
      return mounted ? 'translateY(0)' : 'translateY(8px)'
    case 'left-center':
      return mounted ? 'translateY(-50%)' : 'translateY(-50%) translateX(-8px)'
    case 'right-center':
      return mounted ? 'translateY(-50%)' : 'translateY(-50%) translateX(8px)'
  }
}

export default function PanelBase({ anchor, onClose, title, children }: PanelBaseProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const id = setTimeout(() => setMounted(true), 1)
    return () => clearTimeout(id)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [onClose])

  return (
    <FT>
      <div
        ref={panelRef}
        role="dialog"
        aria-label={title}
        style={{
          position: 'absolute',
          width: '280px',
          maxHeight: '60vh',
          overflowY: 'auto',
          background: 'var(--panel-bg)',
          backdropFilter: 'blur(12px)',
          border: '1px solid var(--panel-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px',
          zIndex: 'var(--z-panels)',
          opacity: mounted ? 1 : 0,
          transform: getTransform(anchor, mounted),
          transition: 'opacity 200ms ease, transform 200ms ease',
          ...POSITIONS[anchor],
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
          }}
        >
          <span
            style={{
              fontSize: '9px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              color: 'var(--amber)',
            }}
          >
            {title}
          </span>
          <LiveDot />
        </div>
        {children}
      </div>
    </FT>
  )
}
