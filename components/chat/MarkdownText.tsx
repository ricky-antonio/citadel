import React from 'react'

interface Props {
  text: string
  streaming: boolean
}

const cursor = (
  <span
    style={{
      color: 'var(--amber)',
      animation: 'blink-cursor 0.8s ease-in-out infinite',
      marginLeft: '1px',
    }}
  >
    |
  </span>
)

// Inline link style — amber underline, opens in new tab
const linkStyle: React.CSSProperties = {
  color: 'var(--amber)',
  textDecorationLine: 'underline',
  textDecorationColor: 'rgba(232,160,32,0.45)',
  cursor: 'pointer',
}

// Splits on **bold**, [text](https://url), and bare https:// URLs.
// Only http/https URLs are linked — no javascript: or other schemes.
// Incomplete **tokens (mid-stream) fall through as literal text.
const INLINE_RE =
  /(\*\*[^*\n]+?\*\*|\[[^\]]+\]\(https?:\/\/[^)\s]+\)|https?:\/\/[^\s,)"'<>]+)/

function renderInline(text: string, key: string): React.ReactNode {
  const parts = text.split(INLINE_RE)
  if (parts.length === 1) return text
  return (
    <>
      {parts.map((part, i) => {
        // Bold
        if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
          return (
            <strong key={`${key}-b${i}`} style={{ fontWeight: 600, color: 'var(--tx-1)' }}>
              {part.slice(2, -2)}
            </strong>
          )
        }
        // Markdown link: [display text](https://url)
        const md = part.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/)
        if (md) {
          return (
            <a
              key={`${key}-l${i}`}
              href={md[2]}
              target="_blank"
              rel="noopener noreferrer"
              style={linkStyle}
            >
              {md[1]}
            </a>
          )
        }
        // Bare URL
        if (/^https?:\/\//.test(part)) {
          return (
            <a
              key={`${key}-u${i}`}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              style={linkStyle}
            >
              {part}
            </a>
          )
        }
        return <React.Fragment key={`${key}-t${i}`}>{part}</React.Fragment>
      })}
    </>
  )
}

function renderBlock(
  line: string,
  key: string,
  showCursor: boolean
): React.ReactNode {
  const c = showCursor ? cursor : null

  // Horizontal rule
  if (line.trim() === '---') {
    return (
      <div key={key} style={{ padding: '4px 0 6px' }}>
        <div
          style={{ height: '1px', background: 'rgba(232, 160, 32, 0.18)' }}
        />
        {c}
      </div>
    )
  }

  // H1 — used for the briefing title line
  if (line.startsWith('# ')) {
    return (
      <div
        key={key}
        style={{
          fontSize: '13px',
          fontWeight: 700,
          color: 'var(--amber)',
          marginBottom: '6px',
        }}
      >
        {renderInline(line.slice(2), key)}
        {c}
      </div>
    )
  }

  // H2 — section headers ("## 🎭 Tonight's Events")
  if (line.startsWith('## ')) {
    return (
      <div
        key={key}
        style={{
          fontSize: '10px',
          fontWeight: 700,
          color: 'var(--amber)',
          textTransform: 'uppercase',
          letterSpacing: '0.7px',
          marginTop: '8px',
          marginBottom: '3px',
          opacity: 0.85,
        }}
      >
        {renderInline(line.slice(3), key)}
        {c}
      </div>
    )
  }

  // H3 — sub-section headers ("### Air Quality")
  if (line.startsWith('### ')) {
    return (
      <div
        key={key}
        style={{
          fontSize: '11px',
          fontWeight: 600,
          color: 'var(--amber)',
          marginTop: '6px',
          marginBottom: '2px',
          opacity: 0.8,
        }}
      >
        {renderInline(line.slice(4), key)}
        {c}
      </div>
    )
  }

  // Bullet point (- or *)
  if (/^[-*] /.test(line)) {
    return (
      <div
        key={key}
        style={{ display: 'flex', gap: '7px', marginBottom: '2px', alignItems: 'flex-start' }}
      >
        <span
          style={{
            color: 'var(--amber)',
            flexShrink: 0,
            fontSize: '14px',
            lineHeight: '1.4',
          }}
        >
          ·
        </span>
        <span style={{ flex: 1, color: 'var(--tx-2)' }}>
          {renderInline(line.slice(2), key)}
          {c}
        </span>
      </div>
    )
  }

  // Pipe-separated table row (| cell | cell |) — render as a bullet item
  if (line.startsWith('|') && line.endsWith('|') && line.length > 2) {
    const cells = line
      .slice(1, -1)
      .split('|')
      .map(s => s.trim())
      .filter(s => s && !/^[-:\s]+$/.test(s)) // skip divider rows (---|---)
    if (cells.length > 0) {
      return (
        <div
          key={key}
          style={{ display: 'flex', gap: '7px', marginBottom: '2px', alignItems: 'flex-start' }}
        >
          <span style={{ color: 'var(--amber)', flexShrink: 0, fontSize: '14px', lineHeight: '1.4' }}>
            ·
          </span>
          <span style={{ flex: 1, color: 'var(--tx-2)' }}>
            {cells.map((cell, ci) => (
              <React.Fragment key={ci}>
                {ci > 0 && <span style={{ color: 'var(--tx-3)', margin: '0 4px' }}>·</span>}
                {renderInline(cell, `${key}-c${ci}`)}
              </React.Fragment>
            ))}
            {c}
          </span>
        </div>
      )
    }
  }

  // Numbered list (1. 2. etc.)
  const numberedMatch = line.match(/^(\d+)\. (.+)/)
  if (numberedMatch) {
    return (
      <div
        key={key}
        style={{ display: 'flex', gap: '7px', marginBottom: '2px', alignItems: 'flex-start' }}
      >
        <span
          style={{
            color: 'var(--amber)',
            flexShrink: 0,
            fontSize: '10px',
            fontWeight: 700,
            lineHeight: '1.8',
            minWidth: '14px',
          }}
        >
          {numberedMatch[1]}
        </span>
        <span style={{ flex: 1, color: 'var(--tx-2)' }}>
          {renderInline(numberedMatch[2], key)}
          {c}
        </span>
      </div>
    )
  }

  // Empty line → small spacer
  if (line.trim() === '') {
    return <div key={key} style={{ height: '4px' }}>{c}</div>
  }

  // Regular paragraph
  return (
    <div key={key} style={{ marginBottom: '1px', color: 'var(--tx-2)' }}>
      {renderInline(line, key)}
      {c}
    </div>
  )
}

export default function MarkdownText({ text, streaming }: Props) {
  const lines = text.split('\n')
  return (
    <div style={{ lineHeight: 1.55, fontSize: '13px' }}>
      {lines.map((line, i) =>
        renderBlock(line, String(i), streaming && i === lines.length - 1)
      )}
      {/* Cursor shown on its own when text is empty and still streaming */}
      {streaming && text === '' && cursor}
    </div>
  )
}
