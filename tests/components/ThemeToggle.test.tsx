import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import ThemeToggle from '@/components/nav/ThemeToggle'

const mockSetTheme = vi.hoisted(() => vi.fn())
const mockUseTheme = vi.hoisted(() => vi.fn())

vi.mock('next-themes', () => ({
  useTheme: mockUseTheme,
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}))

describe('ThemeToggle', () => {
  beforeEach(() => {
    mockUseTheme.mockReturnValue({ theme: 'dark', setTheme: mockSetTheme })
  })

  it('renders a button with aria-label', () => {
    render(<ThemeToggle />)
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Switch to light mode')
  })

  it('calls setTheme with "light" when current theme is "dark"', () => {
    render(<ThemeToggle />)
    fireEvent.click(screen.getByRole('button'))
    expect(mockSetTheme).toHaveBeenCalledWith('light')
  })

  it('calls setTheme with "dark" when current theme is "light"', () => {
    mockUseTheme.mockReturnValueOnce({ theme: 'light', setTheme: mockSetTheme })
    render(<ThemeToggle />)
    fireEvent.click(screen.getByRole('button'))
    expect(mockSetTheme).toHaveBeenCalledWith('dark')
  })
})
