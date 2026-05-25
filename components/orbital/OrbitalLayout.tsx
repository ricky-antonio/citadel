'use client'

import { CitySnapshot } from '@/lib/types'
import { OrbitalCore } from './OrbitalCore'
import { OrbitalMetric } from './OrbitalMetric'

type OrbitalLayoutProps = {
  snapshot: CitySnapshot
  onOpenPanel: (panel: 'weather' | 'aq' | 'transit' | 'events') => void
}

function getAqiColor(aqi: number): string {
  if (aqi <= 50) return '#4ADE80'
  if (aqi <= 100) return '#E8A020'
  return '#EF4444'
}

function getTransitColor(delayCount: number): string {
  if (delayCount === 0) return '#4ADE80'
  if (delayCount > 5) return '#EF4444'
  return '#E8A020'
}

export function OrbitalLayout({ snapshot, onOpenPanel }: OrbitalLayoutProps) {
  const aqiColor = getAqiColor(snapshot.airQuality.aqi)
  const transitColor = getTransitColor(snapshot.transit.delayCount)
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
      }}
    >
      <div style={{ position: 'relative' }}>
        <OrbitalCore
          pulseScore={snapshot.pulseScore}
          pulseLabel={snapshot.pulseLabel}
          pulseColor={snapshot.pulseColor}
        />

        {/* Weather — North */}
        <div
          style={{
            position: 'absolute',
            top: '-48px',
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        >
          <OrbitalMetric
            metric="weather"
            value={`${snapshot.weather.temperature}°F`}
            label="WEATHER"
            color="#60A5FA"
            animationDelay="0s"
            onOpen={() => onOpenPanel('weather')}
          />
        </div>

        {/* AQI — East */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            right: '-88px',
            transform: 'translateY(-50%)',
          }}
        >
          <OrbitalMetric
            metric="aq"
            value={`AQI ${snapshot.airQuality.aqi}`}
            label="AQI"
            color={aqiColor}
            animationDelay="1s"
            onOpen={() => onOpenPanel('aq')}
          />
        </div>

        {/* Transit — South */}
        <div
          style={{
            position: 'absolute',
            bottom: '-48px',
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        >
          <OrbitalMetric
            metric="transit"
            value={transitValue}
            label="TRANSIT"
            color={transitColor}
            animationDelay="2s"
            onOpen={() => onOpenPanel('transit')}
          />
        </div>

        {/* Events — West */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '-88px',
            transform: 'translateY(-50%)',
          }}
        >
          <OrbitalMetric
            metric="events"
            value={`${snapshot.events.count} events`}
            label="EVENTS"
            color="#E8A020"
            animationDelay="3s"
            onOpen={() => onOpenPanel('events')}
          />
        </div>
      </div>
    </div>
  )
}
