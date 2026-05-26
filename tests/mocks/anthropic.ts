import { vi } from 'vitest'

export const mockFinalMessage = vi.fn().mockResolvedValue({
  usage: { input_tokens: 100, output_tokens: 50 },
})

export const mockStream = {
  toReadableStream: vi.fn(() => new ReadableStream()),
  finalMessage: mockFinalMessage,
  on: vi.fn((event: string, cb: (msg: unknown) => void) => {
    if (event === 'message' || event === 'finalMessage') {
      cb({ usage: { input_tokens: 100, output_tokens: 50 } })
    }
  }),
}

export const mockMessagesStream = vi.fn().mockResolvedValue(mockStream)

vi.mock('@anthropic-ai/sdk', () => ({
  default: class {
    messages = { stream: mockMessagesStream }
  },
}))
