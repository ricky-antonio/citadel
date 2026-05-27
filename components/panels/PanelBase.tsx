'use client'

import { useEffect, useRef, useState } from 'react'
import LiveDot from '@/components/shared/LiveDot'

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

export type PanelAnchor =
  | 'top-left'
  | 'top-right'
  | 'top-center'
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
  'top-center':   { top: '80px', left: '50%' },
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
    case 'top-center':
      return mounted ? 'translateX(-50%)' : 'translateX(-50%) translateY(-8px)'
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

  // Focus the panel div on open so Tab starts inside it
  useEffect(() => {
    if (mounted) panelRef.current?.focus()
  }, [mounted])

  // Manual focus trap — wraps Tab/Shift+Tab within the panel
  useEffect(() => {
    function handleTab(e: KeyboardEvent) {
      if (e.key !== 'Tab') return
      const panel = panelRef.current
      if (!panel) return
      const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (focusable.length === 0) { e.preventDefault(); return }
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey) {
        if (document.activeElement === first || document.activeElement === panel) {
          e.preventDefault(); last.focus()
        }
      } else {
        if (document.activeElement === last || document.activeElement === panel) {
          e.preventDefault(); first.focus()
        }
      }
    }
    document.addEventListener('keydown', handleTab)
    return () => document.removeEventListener('keydown', handleTab)
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
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
      aria-label={title}
      data-panel="true"
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
          pointerEvents: 'auto',
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
  )
}
