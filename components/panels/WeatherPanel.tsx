'use client'

import PanelBase from './PanelBase'
import ErrorBanner from '@/components/shared/ErrorBanner'
import type { WeatherData, HourlyForecast } from '@/lib/types'

interface WeatherPanelProps {
  weather: WeatherData
  onClose: () => void
}

function formatHour(isoTime: string): string {
  const d = new Date(isoTime)
  const h = d.getHours()
  if (h === 0) return '12 AM'
  if (h === 12) return '12 PM'
  return h < 12 ? `${h} AM` : `${h - 12} PM`
}

function HourlyItem({ item }: { item: HourlyForecast }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2px',
        minWidth: '36px',
      }}
    >
      <span style={{ fontSize: '9px', color: 'var(--tx-2)', fontWeight: 700 }}>
        {formatHour(item.time)}
      </span>
      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--tx-1)' }}>
        {item.temperature}°
      </span>
      <span style={{ fontSize: '9px', color: 'var(--tx-2)', textAlign: 'center', maxWidth: '36px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
        {item.condition}
      </span>
    </div>
  )
}

export default function WeatherPanel({ weather, onClose }: WeatherPanelProps) {
  const forecastItems = weather.hourlyForecast.slice(0, 6)
  const isUnavailable = weather.condition === 'Unavailable'

  return (
    <PanelBase anchor="top-left" onClose={onClose} title="WEATHER" testId="panel-weather">
      {isUnavailable && (
        <div style={{ marginBottom: '10px' }}>
          <ErrorBanner message="Weather data temporarily unavailable." />
        </div>
      )}
      <div style={{ marginBottom: '8px' }}>
        <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--tx-1)', lineHeight: 1.1 }}>
          {isUnavailable ? '–°F' : `${weather.temperature}°F`}
        </div>
        <div style={{ fontSize: '14px', color: 'var(--tx-2)', marginTop: '2px' }}>
          {isUnavailable ? '–' : weather.condition}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--tx-2)' }}>
          <span aria-hidden="true">💨</span>
          <span>{weather.windSpeed} mph</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--tx-2)' }}>
          <span aria-hidden="true">💧</span>
          <span>Humidity {weather.humidity}%</span>
        </div>
      </div>

      {forecastItems.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '4px',
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '10px',
          }}
        >
          {forecastItems.map((item) => (
            <HourlyItem key={item.time} item={item} />
          ))}
        </div>
      )}
    </PanelBase>
  )
}
