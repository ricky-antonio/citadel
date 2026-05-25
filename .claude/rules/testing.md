# Testing Rules

## Philosophy

Four layers — each tests something different:

1. **Unit** — pure lib logic (`lib/pulse.ts`, `lib/cache.ts`, `lib/anomaly.ts`, `lib/data/**`, `lib/ai/**`). No UI, no network, no database. Fast.
2. **Component** — what the user sees (`components/**`). Tests the rendered output and interactions, not implementation details.
3. **Integration** — full API route with mocked external services (`app/api/**`). Verifies the route wiring and response shape, not individual lib functions.
4. **E2E** — browser-level critical path tests (`tests/e2e/**`). Uses Playwright + Chromium. Mocks all API routes via `page.route()` — never calls real external APIs or Anthropic in tests.

---

## Non-negotiable rules

1. **Write tests for a module before moving to the next.** Same session, not "I'll come back to it."
2. **Never mock the module under test.** Only mock its dependencies (Supabase client, Anthropic client, external fetch calls).
3. **Test behaviour, not implementation.** If renaming a private function breaks a test, the test is wrong.
4. **A failing test is never fixed by deleting it.** Fix the code or fix the test — never delete it.
5. **Use fake timers for anything time-dependent.** Never use real `setTimeout`/`setInterval` in tests — `vi.useFakeTimers()`.
6. **Run the test suite after writing each test file.** Fix all failures before creating the next file.
7. **Never create inline mocks for Supabase or Anthropic.** Always import from `tests/mocks/supabase.ts` and `tests/mocks/anthropic.ts`.
8. **Tests are part of the definition of done.** A feature without tests is not done. Never skip tests for speed or simplicity.

---

## Authoring order — enforce every time

```
types → lib function → lib test → component → component test
```

Never write a component before its lib dependencies are tested. Never write a test after the next module has started.

---

## Per-category requirements

### AI / LLM routes (`app/api/chat/route.ts`, `app/api/city/[id]/briefing/route.ts`)
- Mock the Anthropic client — never call the real API in tests
- Cover all four status codes: 200 (happy path), 400 (bad input), 429 (rate limited), 500 (Anthropic error)
- Verify that city context is injected into the system prompt
- Verify that the response is a streaming ReadableStream (not JSON)

### Auth functions
Not applicable — no auth in this project.

### Optimistic UI
Not applicable in v1 — no user mutations. If added: simulate DB failure and verify the UI rolls back to the previous state.

### Data fetchers (`lib/data/**`)
- Mock `fetch` globally in `tests/setup.ts`
- Cover: happy path (valid API response), API error (non-2xx), network failure (fetch throws), malformed response
- Verify that the typed fallback is returned on any failure — never undefined or null

### Cache (`lib/cache.ts`)
- Mock Supabase client — never hit the real database
- Cover: cache hit (fresh entry), cache miss (no row), cache miss (expired row), write (upsert behavior)

---

## Full test config

`vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      exclude: [
        'node_modules/**',
        'tests/**',
        '.next/**',
        'next.config.ts',
        'tailwind.config.ts',
        'vitest.config.ts',
      ],
      thresholds: {
        lines: 75,      // raised each phase — see per-phase targets below
        functions: 75,
        branches: 70,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
```

---

## Full setup file

`tests/setup.ts`:
```ts
import '@testing-library/jest-dom'
import { vi, beforeEach, afterEach } from 'vitest'

// Reset all mocks between tests
beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
})

// Mock next/navigation — always needed for App Router components
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useParams: () => ({ id: 'new-york' }),
  usePathname: () => '/city/new-york',
}))

// Mock next-themes — prevents ThemeProvider errors in component tests
vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'dark', setTheme: vi.fn() }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}))

// Global fetch mock — individual tests override with vi.mocked(fetch).mockResolvedValueOnce(...)
global.fetch = vi.fn()
```

---

## Shared mock files

### `tests/mocks/supabase.ts`
```ts
import { vi } from 'vitest'

export const mockSupabaseFrom = vi.fn()
export const mockSupabaseSelect = vi.fn()
export const mockSupabaseEq = vi.fn()
export const mockSupabaseGt = vi.fn()
export const mockSupabaseSingle = vi.fn()
export const mockSupabaseUpsert = vi.fn()
export const mockSupabaseInsert = vi.fn()

export const mockSupabase = {
  from: mockSupabaseFrom.mockReturnThis(),
  select: mockSupabaseSelect.mockReturnThis(),
  eq: mockSupabaseEq.mockReturnThis(),
  gt: mockSupabaseGt.mockReturnThis(),
  single: mockSupabaseSingle,
  upsert: mockSupabaseUpsert,
  insert: mockSupabaseInsert,
}

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabase),
}))
```

Import in tests:
```ts
import { mockSupabaseSingle } from '@/tests/mocks/supabase'
```

### `tests/mocks/anthropic.ts`
```ts
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
```

Import in tests:
```ts
import { mockMessagesStream } from '@/tests/mocks/anthropic'
```

---

## Coverage thresholds per phase

| Phase | Lines | Functions | Branches |
|-------|-------|-----------|----------|
| Phase 1 — Foundation | 75% | 75% | 70% |
| Phase 2 — Shell & Map | 75% | 75% | 70% |
| Phase 3 — Orbital & Panels | 78% | 78% | 72% |
| Phase 4 — AI & Chat | 80% | 80% | 75% |
| Phase 5 — Map Layers | 82% | 82% | 77% |
| Phase 6 — Polish & Deploy | 85% | 85% | 80% |

Update `vitest.config.ts` thresholds when starting each phase.

---

## Playwright config

`playwright.config.ts` (root):
```ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

E2E tests live in `tests/e2e/`. All external API calls must be intercepted with `page.route()` — the dev server must start clean with no real API calls leaving the process.

```
tests/e2e/
  fixtures/
    snapshot.ts       ← factory: buildMockSnapshot(cityId, overrides?)
  city-dashboard.spec.ts
```

**Critical path E2E tests** (all 5 must pass before Phase 6 is complete):
```
it('page loads and orbital renders with a pulse score above 0')
it('clicking the weather orbital node opens WeatherPanel')
it('typing in the chat drawer and submitting shows a streaming AI response')
it('switching from NYC to Chicago re-centres the map on Chicago')
it('pressing Escape closes an open panel')
```

**API mocking strategy:**
```ts
// Mock snapshot route — returns fixture data, no real external calls
await page.route('/api/city/*/snapshot', async route => {
  await route.fulfill({ json: buildMockSnapshot('new-york') })
})

// Mock chat route — returns a fake SSE stream, no Anthropic calls
await page.route('/api/chat', async route => {
  await route.fulfill({
    status: 200,
    headers: { 'Content-Type': 'text/event-stream' },
    body: 'data: {"type":"text","text":"The weather in New York is clear."}\n\ndata: [DONE]\n\n',
  })
})
```

---

## npm scripts

Add to `package.json`:
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "type-check": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "lint": "next lint"
  }
}
```

---

## End-of-session checklist

Run all four before ending any session. All must pass before committing.

```bash
npm run type-check     # zero TypeScript errors
npm test               # all tests pass
npm run test:coverage  # above the current phase threshold
npm run build          # production build succeeds
```

If any of these fail, fix the failure before closing the session. Do not leave the codebase in a broken state.
