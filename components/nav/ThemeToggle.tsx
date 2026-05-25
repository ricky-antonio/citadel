'use client'

import { useTheme } from 'next-themes'

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme()
  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: 'var(--tx-2)',
        fontSize: '16px',
        padding: '8px',
        minWidth: '44px',
        minHeight: '44px',
      }}
    >
      {theme === 'dark' ? '☀' : '◑'}
    </button>
  )
}

export default ThemeToggle
