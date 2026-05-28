'use client'

import { useEffect, useState } from 'react'

// City skyline silhouette — rises to a central tower, irregular buildings on both sides
const SKYLINE =
  'M0,250 L0,205 L45,205 L45,188 L80,188 L80,220 L95,220 L95,172 L130,172 ' +
  'L130,195 L150,195 L150,158 L175,158 L175,178 L195,178 L195,142 L220,142 ' +
  'L220,168 L240,168 L240,128 L260,128 L260,145 L280,145 L280,105 L305,105 ' +
  'L305,118 L325,118 L325,88 L345,88 L345,68 L360,68 L360,50 L380,50 L380,32 ' +
  'L400,32 L400,18 L420,18 L420,6 L440,6 L440,0 L460,0 L460,8 L480,8 L480,22 ' +
  'L500,22 L500,38 L515,38 L515,58 L535,58 L535,78 L555,78 L555,100 L580,100 ' +
  'L580,122 L605,122 L605,148 L630,148 L630,165 L660,165 L660,182 L690,182 ' +
  'L690,198 L720,198 L720,178 L750,178 L750,205 L780,205 L780,185 L810,185 ' +
  'L810,215 L845,215 L845,198 L880,198 L880,225 L920,225 L920,212 L960,212 ' +
  'L960,235 L1000,235 L1000,250 Z'

// Bokeh blobs — simulates blurred distant city lights
const BOKEH = [
  { x: 8,  y: 80, w: 200, h: 120, blur: 50, color: 'rgba(232,160,32,0.07)'  },
  { x: 28, y: 86, w: 140, h: 80,  blur: 35, color: 'rgba(100,130,220,0.05)' },
  { x: 52, y: 88, w: 280, h: 150, blur: 60, color: 'rgba(232,160,32,0.06)'  },
  { x: 74, y: 83, w: 160, h: 90,  blur: 40, color: 'rgba(200,130,60,0.05)'  },
  { x: 91, y: 87, w: 130, h: 75,  blur: 35, color: 'rgba(232,160,32,0.05)'  },
]

export function LoadingScreen() {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 60,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at 50% 45%, #0D1926 0%, #060A0F 75%)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 400ms ease',
      }}
    >
      {/* Blurred bokeh lights — simulated cityscape depth */}
      {BOKEH.map((b, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            borderRadius: '50%',
            width: b.w,
            height: b.h,
            left: `${b.x}%`,
            top: `${b.y}%`,
            transform: 'translate(-50%, -50%)',
            background: `radial-gradient(ellipse, ${b.color} 0%, transparent 70%)`,
            filter: `blur(${b.blur}px)`,
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* Warm ground glow beneath skyline */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '70%',
          height: '45%',
          background: 'radial-gradient(ellipse at 50% 100%, rgba(232,160,32,0.09) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* CITADEL wordmark */}
      <div
        style={{
          fontFamily: 'var(--font-inter)',
          fontWeight: 900,
          fontSize: 'clamp(18px, 3.5vw, 26px)',
          letterSpacing: '0.3em',
          color: '#E8A020',
          marginBottom: '48px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        CITADEL
      </div>

      {/* Skyline silhouette with glinting sweep */}
      <div style={{ width: '88vw', maxWidth: '820px', position: 'relative', zIndex: 1 }}>
        <svg
          viewBox="0 0 1000 250"
          preserveAspectRatio="xMidYMax meet"
          style={{ width: '100%', height: 'auto', display: 'block' }}
        >
          <defs>
            {/* Vertical gradient: brighter at rooflines, dim at street level */}
            <linearGradient id="ls-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="rgba(232,160,32,0.28)" />
              <stop offset="100%" stopColor="rgba(232,160,32,0.07)" />
            </linearGradient>

            {/* Glint sweep — translates across the skyline via SMIL */}
            <linearGradient
              id="ls-glint"
              x1="-200" y1="0" x2="200" y2="0"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%"   stopColor="rgba(255,255,255,0)" />
              <stop offset="50%"  stopColor="rgba(255,242,200,0.65)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
              <animateTransform
                attributeName="gradientTransform"
                type="translate"
                from="-400 0"
                to="1400 0"
                dur="3.5s"
                repeatCount="indefinite"
              />
            </linearGradient>
          </defs>

          {/* Base fill */}
          <path d={SKYLINE} fill="url(#ls-fill)" />

          {/* Roofline edge */}
          <path
            d={SKYLINE}
            fill="none"
            stroke="rgba(232,160,32,0.45)"
            strokeWidth="1"
          />

          {/* Glint overlay — same shape, animated gradient */}
          <path d={SKYLINE} fill="url(#ls-glint)" />
        </svg>
      </div>

      {/* Loading label */}
      <div
        style={{
          marginTop: '28px',
          fontSize: '10px',
          fontWeight: 600,
          letterSpacing: '0.25em',
          color: 'rgba(232,160,32,0.45)',
          fontFamily: 'var(--font-inter)',
          textTransform: 'uppercase',
          position: 'relative',
          zIndex: 1,
        }}
      >
        Loading
      </div>
    </div>
  )
}
