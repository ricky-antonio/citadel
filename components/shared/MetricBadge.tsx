interface MetricBadgeProps {
  label: string
  value: string | number
  unit?: string
  color?: string
}

export default function MetricBadge({ label, value, unit, color }: MetricBadgeProps) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '2px 6px',
        background: 'var(--panel-bg)',
        border: '1px solid var(--panel-border)',
        borderRadius: 'var(--radius-sm)',
        fontSize: '10px',
        lineHeight: 1.4,
      }}
    >
      <span style={{ color: color ?? 'var(--tx-2)', fontWeight: 500 }}>
        {label}
      </span>
      <span style={{ color: 'var(--tx-1)', fontWeight: 700 }}>
        {value}{unit}
      </span>
    </span>
  )
}
