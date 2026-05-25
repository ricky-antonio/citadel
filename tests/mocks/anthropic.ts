import { vi } from 'vitest'

export const mockStream = {
  toReadableStream: vi.fn(() => new ReadableStream()),
}

export const mockMessagesStream = vi.fn().mockResolvedValue(mockStream)

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn(() => ({
    messages: {
      stream: mockMessagesStream,
    },
  })),
}))
