interface Props {
  suggestions: string[]
  onSelect: (suggestion: string) => void
}

export default function ChatSuggestions({ suggestions, onSelect }: Props) {
  return (
    <div
      data-chat-suggestions="true"
      style={{
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        padding: '0 16px 8px',
        scrollbarWidth: 'none',
        flexShrink: 0,
      }}
    >
      {suggestions.slice(0, 3).map((suggestion, i) => (
        <button
          key={i}
          tabIndex={0}
          onClick={() => onSelect(suggestion)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSelect(suggestion)
          }}
          style={{
            background: 'rgba(232, 160, 32, 0.08)',
            color: 'var(--amber)',
            border: '1px solid rgba(232, 160, 32, 0.20)',
            borderRadius: '16px',
            padding: '6px 12px',
            fontSize: '12px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          {suggestion}
        </button>
      ))}
    </div>
  )
}
