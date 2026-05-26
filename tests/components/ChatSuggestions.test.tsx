import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ChatSuggestions from '@/components/chat/ChatSuggestions'

const suggestions = [
  'Is it a good day to be outside?',
  'How is transit running right now?',
  "What's happening in the city tonight?",
]

describe('ChatSuggestions', () => {
  it('renders all provided suggestion chips', () => {
    render(<ChatSuggestions suggestions={suggestions} onSelect={vi.fn()} />)
    expect(screen.getByText('Is it a good day to be outside?')).toBeInTheDocument()
    expect(screen.getByText('How is transit running right now?')).toBeInTheDocument()
    expect(screen.getByText("What's happening in the city tonight?")).toBeInTheDocument()
  })

  it('limits to 3 chips even with more than 3 suggestions', () => {
    const four = [...suggestions, 'A fourth suggestion']
    render(<ChatSuggestions suggestions={four} onSelect={vi.fn()} />)
    expect(screen.getAllByRole('button')).toHaveLength(3)
    expect(screen.queryByText('A fourth suggestion')).not.toBeInTheDocument()
  })

  it('calls onSelect with the suggestion text when clicked', () => {
    const onSelect = vi.fn()
    render(<ChatSuggestions suggestions={suggestions} onSelect={onSelect} />)
    fireEvent.click(screen.getByText('Is it a good day to be outside?'))
    expect(onSelect).toHaveBeenCalledWith('Is it a good day to be outside?')
  })

  it('calls onSelect when Enter is pressed on a chip', () => {
    const onSelect = vi.fn()
    render(<ChatSuggestions suggestions={suggestions} onSelect={onSelect} />)
    fireEvent.keyDown(screen.getByText('How is transit running right now?'), { key: 'Enter' })
    expect(onSelect).toHaveBeenCalledWith('How is transit running right now?')
  })
})
