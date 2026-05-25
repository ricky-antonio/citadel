interface ErrorBannerProps {
  message?: string
}

const ErrorBanner = ({ message = 'Data temporarily unavailable' }: ErrorBannerProps) => (
  <div
    style={{
      padding: '8px 12px',
      background: 'rgba(239, 68, 68, 0.1)',
      border: '1px solid rgba(239, 68, 68, 0.3)',
      borderRadius: 'var(--radius)',
      color: '#EF4444',
      fontSize: '12px',
    }}
  >
    {message}
  </div>
)

export default ErrorBanner
