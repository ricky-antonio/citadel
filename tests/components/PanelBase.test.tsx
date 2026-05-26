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

  it('renders with left-center anchor without error', () => {
    render(
      <PanelBase anchor="left-center" onClose={vi.fn()} title="ANOMALY">
        <span>left-center content</span>
      </PanelBase>
    )
    expect(screen.getByText('left-center content')).toBeInTheDocument()
  })

  it('renders with right-center anchor without error', () => {
    render(
      <PanelBase anchor="right-center" onClose={vi.fn()} title="HISTORY">
        <span>right-center content</span>
      </PanelBase>
    )
    expect(screen.getByText('right-center content')).toBeInTheDocument()
  })

  it('calls onClose when mousedown occurs outside the panel', () => {
    const onClose = vi.fn()
    render(
      <PanelBase anchor="top-left" onClose={onClose} title="TEST">
        <span>child</span>
      </PanelBase>
    )
    fireEvent.mouseDown(document.body)
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('does not call onClose when mousedown occurs inside the panel', () => {
    const onClose = vi.fn()
    render(
      <PanelBase anchor="top-left" onClose={onClose} title="TEST">
        <span>inside content</span>
      </PanelBase>
    )
    fireEvent.mouseDown(screen.getByText('inside content'))
    expect(onClose).not.toHaveBeenCalled()
  })
})
