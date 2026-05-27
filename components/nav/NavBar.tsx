'use client'

import CitySelector from './CitySelector'
import LayerToggle from './LayerToggle'
import ThemeToggle from './ThemeToggle'
import LiveDot from '@/components/shared/LiveDot'

interface NavBarProps {
  cityId: string
  activeLayers: string[]
  onCityChange: (cityId: string) => void
  onLayerChange: (layers: string[]) => void
  onAskClick: () => void
}

export default function NavBar({
  cityId,
  activeLayers,
  onCityChange,
  onLayerChange,
  onAskClick,
}: NavBarProps) {
  return (
    <div
      data-nav="true"
      style={{
        position: 'absolute',
        top: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 'var(--z-nav)',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        height: '44px',
        borderRadius: '22px',
        padding: '0 16px',
        background: 'var(--nav-bg)',
        backdropFilter: 'blur(8px)',
        border: '1px solid var(--panel-border)',
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-inter)',
          fontWeight: 900,
          fontSize: '14px',
          letterSpacing: '0.2em',
          color: 'var(--wordmark-color)',
        }}
      >
        CITADEL
      </span>

      <CitySelector
        currentCityId={cityId}
        onCityChange={onCityChange}
        pulseScores={{}}
      />

      <LayerToggle activeLayers={activeLayers} onLayerChange={onLayerChange} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <LiveDot />
        <span style={{ fontSize: '11px', color: 'var(--tx-2)' }}>Live</span>
      </div>

      <button
        onClick={onAskClick}
        data-testid="chat-open-button"
        style={{
          height: '28px',
          padding: '0 12px',
          borderRadius: '14px',
          border: '1px solid var(--panel-border)',
          background: 'transparent',
          color: 'var(--tx-1)',
          fontSize: '12px',
          fontWeight: 600,
          cursor: 'pointer',
          minWidth: '44px',
        }}
        aria-label="Open AI chat"
      >
        Ask
      </button>

      <ThemeToggle />
    </div>
  )
}
