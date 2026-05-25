'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { getCityById } from '@/lib/cities'
import type { CitySnapshot } from '@/lib/types'
import NavBar from '@/components/nav/NavBar'
import { OrbitalLayout } from '@/components/orbital/OrbitalLayout'
import WeatherPanel from '@/components/panels/WeatherPanel'
import AQPanel from '@/components/panels/AQPanel'
import TransitPanel from '@/components/panels/TransitPanel'
import EventsPanel from '@/components/panels/EventsPanel'
import AnomalyPanel from '@/components/panels/AnomalyPanel'
import HistoryPanel from '@/components/panels/HistoryPanel'

const CityMap = dynamic(() => import('@/components/map/CityMap'), {
  ssr: false,
  loading: () => (
    <div style={{ width: '100vw', height: '100vh', background: '#060A0F' }} />
  ),
})

type ActivePanel = 'weather' | 'aq' | 'transit' | 'events' | 'anomaly' | 'history' | null

export default function CityPage() {
  const rawParams = useParams()
  const cityId = rawParams.id as string
  const router = useRouter()

  const [snapshot, setSnapshot] = useState<CitySnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [activePanel, setActivePanel] = useState<ActivePanel>(null)
  const [chatOpen, setChatOpen] = useState(false)
  const [activeLayers, setActiveLayers] = useState<string[]>(['air-quality', 'events', 'transit', 'crowd'])
  const [fading, setFading] = useState(false)

  const refetch = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/city/${cityId}/snapshot`)
      if (res.ok) {
        const data = await res.json() as CitySnapshot
        setSnapshot(data)
      }
    } finally {
      setLoading(false)
    }
  }, [cityId])

  useEffect(() => {
    const city = getCityById(cityId)
    if (!city) {
      router.replace('/city/new-york')
      return
    }

    refetch()
    const interval = setInterval(refetch, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [cityId, router, refetch])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (activePanel) {
          setActivePanel(null)
        } else if (chatOpen) {
          setChatOpen(false)
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [activePanel, chatOpen])

  function handleCityChange(newCityId: string) {
    setFading(true)
    setTimeout(() => {
      router.push(`/city/${newCityId}`)
    }, 300)
  }

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      {loading && !snapshot && (
        <div
          style={{
            width: '100vw',
            height: '100vh',
            background: '#060A0F',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ color: 'var(--amber)', fontFamily: 'var(--font-inter)' }}>
            Loading...
          </div>
        </div>
      )}

      {snapshot && (
        <CityMap city={snapshot.city} snapshot={snapshot} activeLayers={activeLayers} />
      )}

      <NavBar
        cityId={cityId}
        activeLayers={activeLayers}
        onCityChange={handleCityChange}
        onLayerChange={setActiveLayers}
        onAskClick={() => setChatOpen(true)}
      />

      {snapshot && (
        <div
          style={{
            opacity: fading ? 0 : 1,
            transition: 'opacity 300ms ease',
          }}
        >
          <OrbitalLayout snapshot={snapshot} onOpenPanel={setActivePanel} />

          {activePanel === 'weather' && (
            <WeatherPanel weather={snapshot.weather} onClose={() => setActivePanel(null)} />
          )}
          {activePanel === 'aq' && (
            <AQPanel airQuality={snapshot.airQuality} onClose={() => setActivePanel(null)} />
          )}
          {activePanel === 'transit' && (
            <TransitPanel transit={snapshot.transit} onClose={() => setActivePanel(null)} />
          )}
          {activePanel === 'events' && (
            <EventsPanel events={snapshot.events} onClose={() => setActivePanel(null)} />
          )}
          {activePanel === 'anomaly' && (
            <AnomalyPanel anomalies={snapshot.anomalies} onClose={() => setActivePanel(null)} />
          )}
          {activePanel === 'history' && (
            <HistoryPanel cityId={cityId} onClose={() => setActivePanel(null)} />
          )}
        </div>
      )}
    </div>
  )
}
