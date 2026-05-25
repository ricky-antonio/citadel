const LiveDot = () => (
  <span
    aria-label="Live data"
    style={{
      display: 'inline-block',
      width: '6px',
      height: '6px',
      borderRadius: '50%',
      background: '#4ADE80',
      animation: 'pulse-dot 1.5s ease-in-out infinite',
    }}
  />
)

export default LiveDot
