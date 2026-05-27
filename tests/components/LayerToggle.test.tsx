import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import LayerToggle from '@/components/nav/LayerToggle'

describe('LayerToggle', () => {
  it('renders the Layers trigger button', () => {
    render(<LayerToggle activeLayers={[]} onLayerChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: /layers/i })).toBeInTheDocument()
  })

  it('does not show dropdown initially', () => {
    render(<LayerToggle activeLayers={[]} onLayerChange={vi.fn()} />)
    expect(screen.queryByLabelText('Air Quality')).not.toBeInTheDocument()
  })

  it('opens dropdown on trigger click', () => {
    render(<LayerToggle activeLayers={[]} onLayerChange={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /layers/i }))
    expect(screen.getByLabelText('Air Quality')).toBeInTheDocument()
    expect(screen.getByLabelText('Events')).toBeInTheDocument()
    expect(screen.getByLabelText('Transit')).toBeInTheDocument()
    expect(screen.getByLabelText('Crowd')).toBeInTheDocument()
    expect(screen.getByLabelText('Crime')).toBeInTheDocument()
  })

  it('shows checkboxes as unchecked when activeLayers is empty', () => {
    render(<LayerToggle activeLayers={[]} onLayerChange={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /layers/i }))
    const checkbox = screen.getByLabelText('Air Quality') as HTMLInputElement
    expect(checkbox.checked).toBe(false)
  })

  it('shows checkbox as checked for active layer', () => {
    render(<LayerToggle activeLayers={['transit']} onLayerChange={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /layers/i }))
    const transit = screen.getByLabelText('Transit') as HTMLInputElement
    expect(transit.checked).toBe(true)
    const aq = screen.getByLabelText('Air Quality') as HTMLInputElement
    expect(aq.checked).toBe(false)
  })

  it('calls onLayerChange with the layer added when toggling on', () => {
    const onLayerChange = vi.fn()
    render(<LayerToggle activeLayers={[]} onLayerChange={onLayerChange} />)
    fireEvent.click(screen.getByRole('button', { name: /layers/i }))
    fireEvent.click(screen.getByLabelText('Events'))
    expect(onLayerChange).toHaveBeenCalledWith(['events'])
  })

  it('calls onLayerChange with the layer removed when toggling off', () => {
    const onLayerChange = vi.fn()
    render(<LayerToggle activeLayers={['events', 'transit']} onLayerChange={onLayerChange} />)
    fireEvent.click(screen.getByRole('button', { name: /layers/i }))
    fireEvent.click(screen.getByLabelText('Events'))
    expect(onLayerChange).toHaveBeenCalledWith(['transit'])
  })

  it('closes dropdown on Escape key', () => {
    render(<LayerToggle activeLayers={[]} onLayerChange={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /layers/i }))
    expect(screen.getByLabelText('Air Quality')).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByLabelText('Air Quality')).not.toBeInTheDocument()
  })

  it('trigger has aria-expanded reflecting open state', () => {
    render(<LayerToggle activeLayers={[]} onLayerChange={vi.fn()} />)
    const btn = screen.getByRole('button', { name: /layers/i })
    expect(btn).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(btn)
    expect(btn).toHaveAttribute('aria-expanded', 'true')
  })
})
