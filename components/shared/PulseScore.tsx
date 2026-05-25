import { getPulseColor } from '@/lib/pulse'

interface PulseScoreProps {
  score: number
  label?: string
  size?: 'sm' | 'md'
}

export default function PulseScore({ score, label, size = 'md' }: PulseScoreProps) {
  const color = getPulseColor(score)

  if (size === 'sm') {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '10px',
          fontWeight: 700,
          color,
        }}
      >
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: color,
            flexShrink: 0,
          }}
        />
        {score}
      </span>
    )
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2px',
      }}
    >
      <span
        style={{
          fontSize: '13px',
          fontWeight: 800,
          color,
          lineHeight: 1,
        }}
      >
        {score}
      </span>
      {label && (
        <span
          style={{
            fontSize: '9px',
            fontWeight: 600,
            color,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            lineHeight: 1,
          }}
        >
          {label}
        </span>
      )}
    </span>
  )
}
