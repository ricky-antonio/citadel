import { ChatMessage as ChatMessageType } from '@/lib/types'
import MarkdownText from './MarkdownText'

interface Props {
  message: ChatMessageType
}

export default function ChatMessage({ message }: Props) {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <div
        style={{
          marginLeft: 'auto',
          background: 'rgba(232, 160, 32, 0.12)',
          border: '1px solid var(--amber-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '10px 14px',
          maxWidth: '85%',
          color: 'var(--tx-1)',
          fontSize: '13px',
        }}
        aria-label={`You: ${message.content}`}
      >
        {message.content}
      </div>
    )
  }

  return (
    <div
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '10px 14px',
        maxWidth: '85%',
        color: 'var(--tx-1)',
        fontSize: '13px',
      }}
      aria-label={`Citadel: ${message.content}`}
    >
      <MarkdownText text={message.content} streaming={message.streaming ?? false} />
    </div>
  )
}
