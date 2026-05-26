import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ChatDrawer from '@/components/chat/ChatDrawer'
import type { CitySnapshot } from '@/lib/types'

const mockSnapshot: CitySnapshot = {
  city: {
    id: 'new-york',
    name: 'New York',
    state: 'New York',
    lat: 40.7128,
    lng: -74.006,
    zoom: 12,
    timezone: 'America/New_York',
    mapStyle: 'mapbox://styles/mapbox/dark-v11',
    transitProvider: 'mta',
    crimeProvider: 'nyc-open-data',
  },
  weather: {
    temperature: 72,
    feelsLike: 70,
    condition: 'Clear',
    humidity: 50,
    windSpeed: 10,
    hourlyForecast: [],
  },
  airQuality: { aqi: 42, category: 'Good', dominantPollutant: 'PM2.5', stations: [] },
  events: {
    count: 1,
    totalCapacity: 5000,
    tonight: [
      {
        id: '1',
        name: 'Concert',
        venue: 'MSG',
        time: '8:00 PM',
        capacity: 5000,
        source: 'ticketmaster',
      },
    ],
  },
  transit: { provider: 'mta', alerts: [], delayCount: 0, status: 'normal' },
  pulseScore: 55,
  pulseLabel: 'Active',
  pulseColor: '#E8A020',
  pulseComponents: {
    eventScore: 10,
    crowdScore: 10,
    transitScore: 15,
    aqScore: 10,
    timeScore: 10,
  },
  timestamp: '2024-06-15T20:00:00.000Z',
  anomalies: [],
  crime: { totalIncidents: 0, recentIncidents: [], safetyScore: 50 },
}

function makeStream(body: string): ReadableStream {
  const encoder = new TextEncoder()
  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(body))
      controller.close()
    },
  })
}

describe('ChatDrawer', () => {
  it('renders the "Ask Citadel" header', () => {
    render(
      <ChatDrawer cityId="new-york" snapshot={mockSnapshot} onClose={vi.fn()} />
    )
    expect(screen.getByText('Ask Citadel')).toBeInTheDocument()
  })

  it('renders a close button with the correct aria-label', () => {
    render(
      <ChatDrawer cityId="new-york" snapshot={mockSnapshot} onClose={vi.fn()} />
    )
    expect(screen.getByRole('button', { name: 'Close chat' })).toBeInTheDocument()
  })

  it('calls onClose when the close button is clicked', () => {
    const onClose = vi.fn()
    render(<ChatDrawer cityId="new-york" snapshot={mockSnapshot} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: 'Close chat' }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn()
    render(<ChatDrawer cityId="new-york" snapshot={mockSnapshot} onClose={onClose} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('renders the chat input with the correct aria-label and placeholder', () => {
    render(
      <ChatDrawer cityId="new-york" snapshot={mockSnapshot} onClose={vi.fn()} />
    )
    const input = screen.getByRole('textbox', { name: 'Chat input' })
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('placeholder', 'Ask about the city...')
  })

  it('shows suggestion chips when no messages have been sent', () => {
    render(
      <ChatDrawer cityId="new-york" snapshot={mockSnapshot} onClose={vi.fn()} />
    )
    // generateSuggestions returns 3 chips for this snapshot
    const chips = screen.getAllByRole('button')
    const suggestionChips = chips.filter(
      b => b.getAttribute('aria-label') !== 'Close chat' && b.textContent !== 'Send'
    )
    expect(suggestionChips).toHaveLength(3)
  })

  it('send button is disabled when input is empty', () => {
    render(
      <ChatDrawer cityId="new-york" snapshot={mockSnapshot} onClose={vi.fn()} />
    )
    expect(screen.getByRole('button', { name: /send/i })).toBeDisabled()
  })

  it('send button enables after typing in the input', async () => {
    const user = userEvent.setup()
    render(<ChatDrawer cityId="new-york" snapshot={mockSnapshot} onClose={vi.fn()} />)
    const input = screen.getByRole('textbox', { name: 'Chat input' })
    await user.type(input, 'Hello')
    expect(screen.getByRole('button', { name: /send/i })).not.toBeDisabled()
  })

  it('calls fetch with correct body when a message is submitted', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      json: vi.fn().mockResolvedValue({ error: 'Test error' }),
    } as unknown as Response)

    const user = userEvent.setup()
    render(<ChatDrawer cityId="new-york" snapshot={mockSnapshot} onClose={vi.fn()} />)
    const input = screen.getByRole('textbox', { name: 'Chat input' })
    await user.type(input, 'What is the weather?')
    await user.click(screen.getByRole('button', { name: /send/i }))

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/chat',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"message":"What is the weather?"'),
        })
      )
    })
  })

  it('shows user message and error reply when API returns non-ok', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      json: vi.fn().mockResolvedValue({ error: 'Rate limited' }),
    } as unknown as Response)

    const user = userEvent.setup()
    render(<ChatDrawer cityId="new-york" snapshot={mockSnapshot} onClose={vi.fn()} />)
    const input = screen.getByRole('textbox', { name: 'Chat input' })
    await user.type(input, 'Hello')
    await user.click(screen.getByRole('button', { name: /send/i }))

    await waitFor(() => {
      expect(screen.getByText('Hello')).toBeInTheDocument()
      expect(screen.getByText('Rate limited')).toBeInTheDocument()
    })
  })

  it('shows connection-interrupted message when fetch throws', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

    const user = userEvent.setup()
    render(<ChatDrawer cityId="new-york" snapshot={mockSnapshot} onClose={vi.fn()} />)
    const input = screen.getByRole('textbox', { name: 'Chat input' })
    await user.type(input, 'Hello')
    await user.click(screen.getByRole('button', { name: /send/i }))

    await waitFor(() => {
      expect(
        screen.getByText('[Connection interrupted. Please try again.]')
      ).toBeInTheDocument()
    })
  })

  it('appends streamed text from Anthropic NDJSON content_block_delta events', async () => {
    // The Anthropic SDK's toReadableStream() emits NDJSON: one JSON object per line.
    // Empty lines (blank separators) must be skipped without errors.
    const ndjsonBody = [
      '{"type":"message_start","message":{"id":"msg_1"}}\n',
      '{"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}\n',
      '\n',
      '{"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Hello "}}\n',
      '{"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"world"}}\n',
      '{"type":"message_stop"}\n',
    ].join('')

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      body: makeStream(ndjsonBody),
    } as unknown as Response)

    const user = userEvent.setup()
    render(<ChatDrawer cityId="new-york" snapshot={mockSnapshot} onClose={vi.fn()} />)
    const input = screen.getByRole('textbox', { name: 'Chat input' })
    await user.type(input, 'Test question')
    await user.click(screen.getByRole('button', { name: /send/i }))

    await waitFor(() => {
      expect(screen.getByText('Test question')).toBeInTheDocument()
      expect(screen.getByText('Hello world')).toBeInTheDocument()
    })
  })

  it('appends streamed text when event type is "text" (E2E mock format)', async () => {
    // E2E tests mock the route directly and can use a simpler format
    const ndjsonBody = '{"type":"text","text":"City is active"}\n'

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      body: makeStream(ndjsonBody),
    } as unknown as Response)

    const user = userEvent.setup()
    render(<ChatDrawer cityId="new-york" snapshot={mockSnapshot} onClose={vi.fn()} />)
    const input = screen.getByRole('textbox', { name: 'Chat input' })
    await user.type(input, 'Quick question')
    await user.click(screen.getByRole('button', { name: /send/i }))

    await waitFor(() => {
      expect(screen.getByText('City is active')).toBeInTheDocument()
    })
  })

  it('skips malformed JSON lines without crashing', async () => {
    const body = 'not-valid-json\n{"type":"text","text":"Valid text"}\n'

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      body: makeStream(body),
    } as unknown as Response)

    const user = userEvent.setup()
    render(<ChatDrawer cityId="new-york" snapshot={mockSnapshot} onClose={vi.fn()} />)
    await user.type(screen.getByRole('textbox', { name: 'Chat input' }), 'Question')
    await user.click(screen.getByRole('button', { name: /send/i }))

    await waitFor(() => {
      expect(screen.getByText('Valid text')).toBeInTheDocument()
    })
  })
})
