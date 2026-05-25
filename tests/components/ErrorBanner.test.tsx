import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import ErrorBanner from '@/components/shared/ErrorBanner'

describe('ErrorBanner', () => {
  it('renders the default message when no prop is passed', () => {
    render(<ErrorBanner />)
    expect(screen.getByText('Data temporarily unavailable')).toBeInTheDocument()
  })

  it('renders a custom message when passed', () => {
    render(<ErrorBanner message="Weather data unavailable" />)
    expect(screen.getByText('Weather data unavailable')).toBeInTheDocument()
  })
})
