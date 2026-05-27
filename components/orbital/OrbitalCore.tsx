interface OrbitalCoreProps {
  pulseScore: number
  pulseLabel: string
  pulseColor: string
}

export function OrbitalCore({ pulseScore, pulseLabel }: OrbitalCoreProps) {
  return (
    <svg
      width="280"
      height="280"
      viewBox="0 0 280 280"
      role="img"
      aria-label={`Pulse score ${pulseScore} — ${pulseLabel}`}
      aria-live="polite"
      aria-atomic="true"
    >
      <circle cx="140" cy="140" r="139" fill="none" stroke="rgba(232,160,32,0.12)" strokeWidth="1" />
      <circle cx="140" cy="140" r="99"  fill="none" stroke="rgba(232,160,32,0.18)" strokeWidth="1" />
      <circle cx="140" cy="140" r="59"  fill="none" stroke="rgba(232,160,32,0.25)" strokeWidth="1" />

      <circle cx="140" cy="140" r="36" fill="#1A1200" stroke="#E8A020" strokeWidth="2" />

      <text
        x="140"
        y="138"
        textAnchor="middle"
        fontSize="22"
        fontWeight="800"
        fill="#E8A020"
        fontFamily="var(--font-inter)"
      >
        {pulseScore}
      </text>
      <text
        x="140"
        y="150"
        textAnchor="middle"
        fontSize="9"
        fontWeight="700"
        fill="#7A4400"
        letterSpacing="1"
        fontFamily="var(--font-inter)"
      >
        {pulseLabel.toUpperCase()}
      </text>
    </svg>
  )
}
