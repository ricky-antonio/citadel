# Phase 6 — Polish & Deploy

**This is the final phase. When it is complete, the app is shipped.**

Phase 5 completed the full feature set. Phase 6 is about quality: empty states, keyboard completeness, accessibility audit, performance verification, and the production deployment. Nothing new is invented here — existing features are finished.

---

## What to build

### Empty states
- [ ] Empty state for EventsPanel when no events tonight
- [ ] Empty state for TransitPanel when no active delays
- [ ] Empty state for AnomalyPanel when no anomalies in the last 7 days
- [ ] Empty state for HistoryPanel when fewer than 2 data points exist
- [ ] Empty state when all four external APIs fail simultaneously (full snapshot fallback)
- [ ] Error state in ChatDrawer when the AI stream fails mid-response (graceful message: "Connection interrupted. Please try again.")

### Keyboard completeness
- [ ] Full keyboard navigation of the nav pill: Tab through each item, Enter to activate
- [ ] `Escape` closes: any open panel, the chat drawer, the city dropdown — in that priority order
- [ ] City selector: arrow keys navigate options, Enter selects, Escape closes
- [ ] Layer toggle: checkboxes are natively keyboard-accessible (verify)
- [ ] Suggestion chips: Tab navigates, Enter activates
- [ ] Orbital nodes: Tab cycles through all four, Enter opens the panel, Escape closes it

### Accessibility audit
- [ ] Run [axe DevTools](https://www.deque.com/axe/) browser extension on each city page
- [ ] Fix any critical or serious violations (minor/moderate: evaluate and document)
- [ ] Verify `aria-live="polite"` on pulse score is announcing to screen reader (test with macOS VoiceOver)
- [ ] Verify all icon-only buttons have `aria-label`
- [ ] Verify all panels have `role="dialog"` and `aria-label`
- [ ] Color contrast: text on glass panels meets WCAG AA (4.5:1 for body text)
- [ ] Verify focus ring is visible on all interactive elements

### Performance audit
- [ ] Run Lighthouse on `/city/chicago` (incognito, production URL or `npm run build && npm start`)
- [ ] Target: Performance ≥ 85, Accessibility ≥ 90, Best Practices ≥ 90
- [ ] Verify Mapbox is dynamically imported (check JS bundle — `mapbox-gl` should not be in the initial chunk)
- [ ] Verify `HistoryPanel` uses `@tanstack/react-virtual` when showing > 20 data points
- [ ] Verify `buildCityContext` output is under 3200 characters for all four cities (log output locally)
- [ ] Verify no map remount on 5-minute poll (check DevTools Performance tab — no `Map` component re-initialisation)

### Light mode polish
- [ ] Map style switches to `mapbox://styles/mapbox/light-v11` when theme is `light`
- [ ] All panels correctly use light mode CSS variables
- [ ] Nav pill and chat drawer look correct in light mode
- [ ] Orbital amber stays the same in light mode (confirm — no override needed)

### Responsive (nice-to-have, do after everything else)
- [ ] Tablet breakpoint (768–1023px): panels reduce to 240px, orbital scales to 80%
- [ ] Mobile breakpoint (< 768px): basic usability only — orbital repositioned, nav collapsed

### Playwright E2E setup
- [ ] Install: `npm install -D @playwright/test && npx playwright install chromium`
- [ ] `playwright.config.ts` — Chromium only, `baseURL: http://localhost:3000`, `testDir: ./tests/e2e`, `webServer` block pointing to `npm run dev`
- [ ] `tests/e2e/fixtures/snapshot.ts` — `buildMockSnapshot(cityId, overrides?)` factory
- [ ] `tests/e2e/city-dashboard.spec.ts` — 5 critical path tests, all external routes mocked via `page.route()`
- [ ] Add `"test:e2e": "playwright test"` and `"test:e2e:ui": "playwright test --ui"` to `package.json`
- [ ] CI: add `npx playwright install --with-deps chromium` step before `npm run test:e2e` in `.github/workflows/ci.yml`

### Pre-deploy checklist
- [ ] All env vars set in Vercel for all three environments (local, preview, production)
- [ ] Mapbox token restricted to production domain in Mapbox dashboard
- [ ] Separate Supabase projects for preview and production — schema deployed to both
- [ ] Vercel KV created and connected to all environments
- [ ] Sentry DSN set in production environment
- [ ] `npm run build` passes locally with zero TypeScript errors
- [ ] All four city APIs returning real data in production (verify by hitting `/api/city/[id]/snapshot` on the production URL)
- [ ] Rate limiting works in production: send 21 chat messages in 1 minute, confirm 429 response on the 21st
- [ ] `npm audit` — no high or critical vulnerabilities in the production dependency tree

---

## Key flows to verify end-to-end (manual, on production)

### Full city experience
```
1. Open the production URL → redirects to /city/chicago
2. Dark map renders with the custom amber-road dark style
3. Orbital appears with a real pulse score (not 0 or a fallback number)
4. Click each orbital node → correct panel opens from the correct edge
5. Each panel shows real data (not fallback text or empty state)
6. Live dot in nav pill is pulsing green
7. Switch city to San Francisco → map re-centres, orbital updates
8. Open chat drawer → type "What's the weather like?" → response streams
9. Response is relevant to San Francisco current conditions
10. Close chat with Escape
11. Toggle dark/light mode → map style switches, panels look correct
12. Toggle an event layer off → event pins disappear from map
13. Toggle it back on → pins reappear
```

### Anomaly detection (may need to wait for a spike)
```
After the app has been running for a day or more:
  → Check /api/anomalies/chicago for logged anomalies
  → If AnomalyPanel shows data, verify the AI description is present
  → Verify anomalies table in Supabase has rows
```

---

## Tests to write

### Final coverage push
- [ ] Add any missing unit tests identified during the audit to reach Phase 6 thresholds
- [ ] Add tests for empty state rendering in key panels:
  ```
  it('EventsPanel renders empty state when no events are in tonight array')
  it('TransitPanel renders empty state when delayCount is 0 and delays array is empty')
  it('AnomalyPanel renders empty state when anomalies array is empty')
  ```

---

## Manual verification checklist

Before marking Phase 6 (and the project) complete:

**Functionality:**
- [ ] Every orbital node click → correct panel opens
- [ ] Every panel closes on Escape
- [ ] City switch works for all four cities
- [ ] Chat responds with contextual AI answers
- [ ] All map layers toggle on/off correctly
- [ ] Data refreshes every 5 minutes without page reload or map flash

**Keyboard:**
- [ ] Tab through the entire app without a mouse — everything reachable
- [ ] Escape key priority order is correct (panel > chat drawer > city dropdown)
- [ ] Orbital nodes reachable and activatable via keyboard

**Accessibility:**
- [ ] axe DevTools: zero critical violations
- [ ] VoiceOver (or NVDA): pulse score announces when it changes
- [ ] All focus rings are visible

**Performance:**
- [ ] Lighthouse performance ≥ 85 on production
- [ ] Mapbox not in initial JS bundle
- [ ] Map data updates without remount

**Security:**
- [ ] Only Mapbox calls leave the client browser
- [ ] Service role key not in client bundle
- [ ] Rate limiting rejects the 21st chat request in 1 minute

**Deferred from Phase 4:**
- [ ] `ai_usage` logging for `/api/chat` streaming responses — implement and verify a row appears in Supabase after a chat message is sent (briefing logging works; chat logging was deferred because post-stream callbacks are unreliable in Next.js route handlers with streaming responses)

**Tests:**
- [ ] `npm run type-check` — zero errors
- [ ] `npm test` — all tests pass
- [ ] `npm run test:coverage` — lines ≥ 85%, functions ≥ 85%, branches ≥ 80%
- [ ] `npm run build` — production build succeeds
- [ ] `npm audit` — no high or critical vulnerabilities

**Deploy:**
- [ ] All pre-deploy checklist items above checked
- [ ] Production URL is live and working
- [ ] CHANGELOG.md updated with all phases completed
- [ ] README.md updated with live URL

---

## Coverage target after this phase
Lines ≥ 85% · Functions ≥ 85% · Branches ≥ 80%
