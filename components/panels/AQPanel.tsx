'use client'

import PanelBase from './PanelBase'
import type { AirQualityData } from '@/lib/types'

interface AQPanelProps {
  airQuality: AirQualityData
  onClose: () => void
}

function getAQIColor(aqi: number): string {
  if (aqi <= 50) return '#4ADE80'
  if (aqi <= 100) return '#E8A020'
  if (aqi <= 150) return '#F97316'
  if (aqi <= 200) return '#EF4444'
  return '#9B1C1C'
}

function getAQIBarPosition(aqi: number): string {
  // Map AQI 0–300 to 0–100%
  const clamped = Math.min(aqi, 300)
  return `${(clamped / 300) * 100}%`
}

export default function AQPanel({ airQuality, onClose }: AQPanelProps) {
  const color = getAQIColor(airQuality.aqi)

  return (
    <PanelBase anchor="top-right" onClose={onClose} title="AIR QUALITY">
      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
          <span style={{ fontSize: '32px', fontWeight: 800, color, lineHeight: 1.1 }}>
            {airQuality.aqi}
          </span>
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
              padding: '2px 6px',
            }}
          >
            {airQuality.category}
          </span>
        </div>
        <div style={{ fontSize: '12px', color: 'var(--tx-2)' }}>
          Dominant: {airQuality.dominantPollutant.toUpperCase()}
        </div>
      </div>

      <div
        style={{
          position: 'relative',
          height: '6px',
          borderRadius: '3px',
          background: 'linear-gradient(to right, #4ADE80 0%, #E8A020 33%, #F97316 55%, #EF4444 75%, #9B1C1C 100%)',
          marginBottom: '4px',
        }}
        aria-label={`AQI ${airQuality.aqi} out of 300`}
      >
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: getAQIBarPosition(airQuality.aqi),
            transform: 'translate(-50%, -50%)',
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: color,
            border: '2px solid var(--bg-base)',
          }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--tx-3)' }}>
        <span>0</span>
        <span>300</span>
      </div>
    </PanelBase>
  )
}
