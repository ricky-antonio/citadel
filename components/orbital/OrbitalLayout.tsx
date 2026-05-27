'use client'

import { CitySnapshot } from '@/lib/types'
import { OrbitalCore } from './OrbitalCore'
import { OrbitalMetric } from './OrbitalMetric'

type OrbitalLayoutProps = {
  snapshot: CitySnapshot
  onOpenPanel: (panel: 'weather' | 'aq' | 'transit' | 'events' | 'crime') => void
  activePanel?: string | null
}

function getAqiColor(aqi: number): string {
  if (aqi <= 50) return '#4ADE80'
  if (aqi <= 100) return '#E8A020'
  return '#EF4444'
}

function getSafetyColor(score: number): string {
  if (score >= 70) return '#4ADE80'
  if (score >= 40) return '#E8A020'
  return '#EF4444'
}

function getTransitColor(delayCount: number): string {
  if (delayCount === 0) return '#4ADE80'
  if (delayCount > 5) return '#EF4444'
  return '#E8A020'
}

// Returns CSS position for a node on a circle of radius r,
// at angle degrees clockwise from North, centered in a 280×280 container.
function nodePos(angleDeg: number, r = 160): { top: string; left: string; transform: string } {
  const rad = (angleDeg * Math.PI) / 180
  const x = Math.round(r * Math.sin(rad))
  const y = Math.round(-r * Math.cos(rad))
  return {
    top: `calc(50% + ${y}px)`,
    left: `calc(50% + ${x}px)`,
    transform: 'translate(-50%, -50%)',
  }
}

export function OrbitalLayout({ snapshot, onOpenPanel, activePanel }: OrbitalLayoutProps) {
  const aqiColor = getAqiColor(snapshot.airQuality.aqi)
  const transitColor = getTransitColor(snapshot.transit.delayCount)
  const safetyColor = getSafetyColor(snapshot.crime.safetyScore)
  const transitValue =
    snapshot.transit.delayCount === 0
      ? 'On time'
      : `${snapshot.transit.delayCount} delays`

  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 'var(--z-orbital)',
        pointerEvents: 'auto',
      }}
    >
      <div style={{ position: 'relative' }}>
        <OrbitalCore
          pulseScore={snapshot.pulseScore}
          pulseLabel={snapshot.pulseLabel}
          pulseColor={snapshot.pulseColor}
        />

        {/* Weather — 0° (North) */}
        <div style={{ position: 'absolute', ...nodePos(0) }}>
          <OrbitalMetric
            metric="weather"
            value={`${snapshot.weather.temperature}°F`}
            label="WEATHER"
            color="#60A5FA"
            animationDelay="0s"
            onOpen={() => onOpenPanel('weather')}
            isExpanded={activePanel === 'weather'}
          />
        </div>

        {/* AQI — 72° (NE) */}
        <div style={{ position: 'absolute', ...nodePos(72) }}>
          <OrbitalMetric
            metric="aq"
            value={`AQI ${snapshot.airQuality.aqi}`}
            label="AQI"
            color={aqiColor}
            animationDelay="0.8s"
            onOpen={() => onOpenPanel('aq')}
            isExpanded={activePanel === 'aq'}
          />
        </div>

        {/* Transit — 144° (SE) */}
        <div style={{ position: 'absolute', ...nodePos(144) }}>
          <OrbitalMetric
            metric="transit"
            value={transitValue}
            label="TRANSIT"
            color={transitColor}
            animationDelay="1.6s"
            onOpen={() => onOpenPanel('transit')}
            isExpanded={activePanel === 'transit'}
          />
        </div>

        {/* Events — 216° (SW) */}
        <div style={{ position: 'absolute', ...nodePos(216) }}>
          <OrbitalMetric
            metric="events"
            value={`${snapshot.events.count} events`}
            label="EVENTS"
            color="#E8A020"
            animationDelay="2.4s"
            onOpen={() => onOpenPanel('events')}
            isExpanded={activePanel === 'events'}
          />
        </div>

        {/* Safety — 288° (NW) */}
        <div style={{ position: 'absolute', ...nodePos(288) }}>
          <OrbitalMetric
            metric="crime"
            value={`${snapshot.crime.safetyScore}`}
            label="SAFETY"
            color={safetyColor}
            animationDelay="3.2s"
            onOpen={() => onOpenPanel('crime')}
            isExpanded={activePanel === 'crime'}
          />
        </div>
      </div>
    </div>
  )
}
