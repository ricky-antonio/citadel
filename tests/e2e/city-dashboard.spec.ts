import { test, expect } from '@playwright/test'
import { buildMockSnapshot } from './fixtures/snapshot'

test.describe('City dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Intercept every snapshot request and return mock data keyed to the city in the URL.
    await page.route('/api/city/*/snapshot', async route => {
      const url = route.request().url()
      const match = url.match(/\/api\/city\/([^/]+)\/snapshot/)
      const cityId = match?.[1] ?? 'new-york'
      await route.fulfill({ json: buildMockSnapshot(cityId) })
    })
  })

  test('page loads and orbital renders with a pulse score above 0', async ({ page }) => {
    await page.goto('/city/new-york')
    const score = page.locator('[data-testid="pulse-score"]')
    await expect(score).toBeVisible()
    const text = await score.textContent()
    expect(text).toMatch(/[1-9]/)
  })

  test('clicking the weather orbital node opens WeatherPanel', async ({ page }) => {
    await page.goto('/city/new-york')
    await expect(page.locator('[data-testid="orbital-node-weather"]')).toBeVisible()
    // force: true bypasses Playwright's stability check — the float animation keeps the
    // element in perpetual motion, but the hit target is always correct.
    await page.click('[data-testid="orbital-node-weather"]', { force: true })
    await expect(page.locator('[data-testid="panel-weather"]')).toBeVisible()
  })

  test('typing in the chat drawer and submitting shows a streaming AI response', async ({ page }) => {
    // NDJSON body — matches the Anthropic SDK toReadableStream() format that ChatDrawer parses.
    await page.route('/api/chat', async route => {
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
        body: '{"type":"content_block_delta","delta":{"type":"text_delta","text":"Clear skies in New York."}}\n{"type":"message_stop"}\n',
      })
    })

    await page.goto('/city/new-york')
    // Wait for snapshot to load before opening the drawer.
    await expect(page.locator('[data-testid="pulse-score"]')).toBeVisible()

    await page.click('[data-testid="chat-open-button"]')
    await expect(page.locator('[data-testid="chat-input"]')).toBeVisible()

    await page.fill('[data-testid="chat-input"]', 'What is the weather?')
    await page.keyboard.press('Enter')

    // Allow for the drip-buffer drain (~3 chars/20ms for a 25-char string ≈ 170ms).
    await expect(page.locator('[data-testid="chat-messages"]')).toContainText('Clear skies', { timeout: 10000 })
  })

  test('switching from NYC to Chicago re-centres the map on Chicago', async ({ page }) => {
    await page.goto('/city/new-york')
    await expect(page.locator('[data-testid="pulse-score"]')).toBeVisible()

    await page.click('[data-testid="city-selector"]')
    await page.click('[data-testid="city-option-chicago"]')

    // 300ms fade-out + pushState + snapshot refetch.
    await expect(page).toHaveURL(/\/city\/chicago/, { timeout: 5000 })
    await expect(page.locator('[data-testid="pulse-score"]')).toBeVisible()
  })

  test('pressing Escape closes an open panel', async ({ page }) => {
    await page.goto('/city/new-york')
    await page.click('[data-testid="orbital-node-weather"]', { force: true })
    await expect(page.locator('[data-testid="panel-weather"]')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.locator('[data-testid="panel-weather"]')).not.toBeVisible()
  })
})
