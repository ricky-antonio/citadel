import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import CitySelector from '@/components/nav/CitySelector'

describe('CitySelector', () => {
  it('renders the current city name in the trigger', () => {
    render(
      <CitySelector
        currentCityId="new-york"
        onCityChange={vi.fn()}
      />
    )
    expect(screen.getByText('New York')).toBeInTheDocument()
  })

  it('does not show dropdown initially', () => {
    render(
      <CitySelector
        currentCityId="new-york"
        onCityChange={vi.fn()}
      />
    )
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('opens dropdown on trigger click', () => {
    render(
      <CitySelector
        currentCityId="new-york"
        onCityChange={vi.fn()}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /select city/i }))
    expect(screen.getByRole('listbox')).toBeInTheDocument()
  })

  it('shows all four cities in the dropdown', () => {
    render(
      <CitySelector
        currentCityId="new-york"
        onCityChange={vi.fn()}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /select city/i }))
    expect(screen.getByText(/Chicago/)).toBeInTheDocument()
    expect(screen.getByText(/San Francisco/)).toBeInTheDocument()
    expect(screen.getByText(/Washington/)).toBeInTheDocument()
  })

  it('calls onCityChange with the selected city id', () => {
    const onCityChange = vi.fn()
    render(
      <CitySelector
        currentCityId="new-york"
        onCityChange={onCityChange}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /select city/i }))
    const chicagoOption = screen.getAllByRole('option').find(
      el => el.textContent?.includes('Chicago')
    )!
    fireEvent.click(chicagoOption)
    expect(onCityChange).toHaveBeenCalledWith('chicago')
  })

  it('closes dropdown after selecting a city', () => {
    render(
      <CitySelector
        currentCityId="new-york"
        onCityChange={vi.fn()}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /select city/i }))
    const chicagoOption = screen.getAllByRole('option').find(
      el => el.textContent?.includes('Chicago')
    )!
    fireEvent.click(chicagoOption)
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('closes dropdown on Escape key', () => {
    render(
      <CitySelector
        currentCityId="new-york"
        onCityChange={vi.fn()}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /select city/i }))
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('trigger button has aria-haspopup="listbox" and aria-expanded', () => {
    render(
      <CitySelector
        currentCityId="new-york"
        onCityChange={vi.fn()}
      />
    )
    const trigger = screen.getByRole('button', { name: /select city/i })
    expect(trigger).toHaveAttribute('aria-haspopup', 'listbox')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
  })

  it('shows pulse score badge when pulseScores contains the city id', () => {
    render(
      <CitySelector
        currentCityId="new-york"
        onCityChange={vi.fn()}
        pulseScores={{ 'new-york': 55, chicago: 30 }}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /select city/i }))
    // scores 55 and 30 should appear in the dropdown
    expect(screen.getAllByText('55').length).toBeGreaterThan(0)
    expect(screen.getByText('30')).toBeInTheDocument()
  })

  it('marks the current city option as aria-selected', () => {
    render(
      <CitySelector
        currentCityId="chicago"
        onCityChange={vi.fn()}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /select city/i }))
    const selected = screen.getAllByRole('option').find(
      el => el.getAttribute('aria-selected') === 'true'
    )!
    expect(selected.textContent).toContain('Chicago')
  })
})
