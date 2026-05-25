'use client'

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-base)',
        color: 'var(--amber)',
        fontFamily: 'var(--font-inter)',
        textAlign: 'center',
        gap: '1.5rem',
      }}
    >
      <p style={{ fontSize: '1.125rem', margin: 0 }}>Something went wrong.</p>
      <button
        onClick={reset}
        style={{
          background: 'transparent',
          border: '1px solid var(--amber)',
          color: 'var(--amber)',
          fontFamily: 'var(--font-inter)',
          fontSize: '0.875rem',
          padding: '0.5rem 1.25rem',
          cursor: 'pointer',
          borderRadius: 'var(--radius-sm)',
          minHeight: '44px',
          minWidth: '44px',
        }}
      >
        Try again
      </button>
    </div>
  )
}
