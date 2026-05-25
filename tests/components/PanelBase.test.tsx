import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import PanelBase from '@/components/panels/PanelBase'

describe('PanelBase', () => {
  it('renders children inside the panel', () => {
    render(
      <PanelBase anchor="top-left" onClose={vi.fn()} title="TEST">
        <span>panel content</span>
      </PanelBase>
    )
    expect(screen.getByText('panel content')).toBeInTheDocument()
  })

  it('renders the title in the header', () => {
    render(
      <PanelBase anchor="top-right" onClose={vi.fn()} title="WEATHER">
        <span>child</span>
      </PanelBase>
    )
    expect(screen.getByText('WEATHER')).toBeInTheDocument()
  })

  it('calls onClose when Escape key is pressed', () => {
    const onClose = vi.fn()
    render(
      <PanelBase anchor="top-left" onClose={onClose} title="TEST">
        <span>child</span>
      </PanelBase>
    )
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('has role="dialog" and aria-label matching the title', () => {
    render(
      <PanelBase anchor="bottom-left" onClose={vi.fn()} title="AIR QUALITY">
        <span>child</span>
      </PanelBase>
    )
    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeInTheDocument()
    expect(dialog).toHaveAttribute('aria-label', 'AIR QUALITY')
  })
})
