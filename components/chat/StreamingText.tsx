interface Props {
  text: string
  streaming: boolean
}

export default function StreamingText({ text, streaming }: Props) {
  return (
    <span>
      {text}
      {streaming && (
        <span
          style={{
            color: 'var(--amber)',
            animation: 'blink-cursor 0.8s ease-in-out infinite',
            marginLeft: '1px',
          }}
        >
          |
        </span>
      )}
    </span>
  )
}
