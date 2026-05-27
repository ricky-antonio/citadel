'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { getCityById } from '@/lib/cities'
import type { CitySnapshot } from '@/lib/types'
import NavBar from '@/components/nav/NavBar'
import ChatDrawer from '@/components/chat/ChatDrawer'
import { OrbitalLayout } from '@/components/orbital/OrbitalLayout'
import WeatherPanel from '@/components/panels/WeatherPanel'
import AQPanel from '@/components/panels/AQPanel'
import TransitPanel from '@/components/panels/TransitPanel'
import EventsPanel from '@/components/panels/EventsPanel'
import AnomalyPanel from '@/components/panels/AnomalyPanel'
import HistoryPanel from '@/components/panels/HistoryPanel'
import CrimePanel from '@/components/panels/CrimePanel'

const CityMap = dynamic(() => import('@/components/map/CityMap'), {
  ssr: false,
  loading: () => (
    <div style={{ width: '100vw', height: '100vh', background: '#060A0F' }} />
  ),
})

type ActivePanel = 'weather' | 'aq' | 'transit' | 'events' | 'anomaly' | 'history' | 'crime' | null

export default function CityPage() {
  const rawParams = useParams()
  const router = useRouter()

  const [cityId, setCityId] = useState(() => rawParams.id as string)
  const city = getCityById(cityId)

  const [snapshot, setSnapshot] = useState<CitySnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [activePanel, setActivePanel] = useState<ActivePanel>(null)
  const [chatOpen, setChatOpen] = useState(false)
  const [activeLayers, setActiveLayers] = useState<string[]>(['air-quality', 'events', 'transit', 'crowd', 'crime'])
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
    if (!city) {
      router.replace('/city/new-york')
      return
    }

    refetch()
    const interval = setInterval(refetch, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [cityId, router, refetch, city])

  // Fade overlays back in once new snapshot arrives after a city switch
  useEffect(() => {
    if (snapshot !== null) setFading(false)
  }, [snapshot])

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
      setCityId(newCityId)
      setActivePanel(null)
      setChatOpen(false)
      window.history.pushState({}, '', `/city/${newCityId}`)
    }, 300)
  }

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      {city && (
        <CityMap city={city} snapshot={snapshot} activeLayers={activeLayers} />
      )}

      {loading && !snapshot && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: '#060A0F',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 60,
          }}
        >
          <div style={{ color: 'var(--amber)', fontFamily: 'var(--font-inter)' }}>
            Loading...
          </div>
        </div>
      )}

      <NavBar
        cityId={cityId}
        activeLayers={activeLayers}
        onCityChange={handleCityChange}
        onLayerChange={setActiveLayers}
        onAskClick={() => setChatOpen(true)}
      />

      {chatOpen && snapshot && (
        <ChatDrawer
          cityId={cityId}
          snapshot={snapshot}
          onClose={() => setChatOpen(false)}
        />
      )}

      {snapshot && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
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
          {activePanel === 'crime' && snapshot && (
            <CrimePanel crime={snapshot.crime} onClose={() => setActivePanel(null)} />
          )}
        </div>
      )}
    </div>
  )
}
