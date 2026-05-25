# Code Rules

Non-negotiable. These apply in every session, every file, every PR.

---

## TypeScript

- **Strict mode is on.** `tsconfig.json` has `"strict": true`. Zero type errors before committing.
- **No `any`.** If you reach for `any`, define the interface instead. `unknown` is acceptable as an input type when the shape is genuinely unknown — always narrow before use.
- **No type assertions without a comment.** `as SomeType` is a lie you make to the compiler. If you must use one, add a comment explaining why the types don't match.
- **No non-null assertions (`!`) on nullable values.** Check for null/undefined explicitly.

---

## Query location

All Supabase queries live in `lib/` — never inline in route handlers or components.

```
lib/cache.ts       — getCached, setCached
lib/anomaly.ts     — detectAnomaly, logAnomaly, getAnomalyHistory
lib/ai/briefing.ts — getBriefing, saveBriefing
```

Route handlers call these lib functions. They never call `supabase.from(...)` directly.

---

## Column selection

**Never `select *`.** Always name columns explicitly in Supabase queries.

```ts
// WRONG
.from('api_cache').select('*')

// CORRECT
.from('api_cache').select('id, payload, fetched_at, expires_at')
```

Silent schema changes break `select *` in ways that TypeScript cannot catch.

---

## Optimistic UI

Not applicable in v1 — there are no user mutations. If mutations are added, follow this pattern:

```ts
// 1. Save the previous state
const prev = currentState

// 2. Update the UI immediately
setCurrentState(optimisticNewState)

// 3. Call the API
const result = await mutate(data)
if (!result.ok) {
  // 4. Roll back on failure
  setCurrentState(prev)
  showErrorToast('Something went wrong. Your change was not saved.')
}
```

---

## Access control

All external API calls and Supabase writes go through server-side route handlers (`app/api/**/route.ts`). The client never calls external APIs directly — only `/api/**` endpoints.

The `SUPABASE_SERVICE_ROLE_KEY` is used only in server-side code. Never in a component, never in a `NEXT_PUBLIC_` variable.

---

## Logging

No `console.log` in committed code. Sentry handles production error reporting.

Permitted:
```ts
console.error('Weather fetch failed:', err)  // in data fetchers — these are caught and fallback is returned
console.warn('Context exceeds token budget:', charCount)  // in buildCityContext — dev-only check
```

Never:
```ts
console.log('snapshot:', snapshot)  // debug cruft — remove before committing
```

---

## HTML sanitization

User input is rendered as **text only** — never via `dangerouslySetInnerHTML`. AI responses are rendered as plain text — never parsed as HTML.

If HTML rendering is ever introduced (e.g. briefing as markdown), sanitize with DOMPurify:
```ts
import DOMPurify from 'dompurify'
const clean = DOMPurify.sanitize(rawHtml, { ALLOWED_TAGS: ['p', 'strong', 'em', 'br'] })
```

---

## External API error handling

Every function in `lib/data/` wraps external calls in try/catch and returns a typed fallback on failure. Never throw from a data fetcher.

```ts
export async function fetchWeather(lat: number, lng: number): Promise<WeatherData> {
  try {
    const res = await fetch(OPEN_METEO_URL)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return parseWeatherResponse(await res.json())
  } catch (err) {
    console.error('Weather fetch failed:', err)
    return WEATHER_FALLBACK
  }
}
```

Typed fallback constants live in `lib/data/fallbacks.ts`. Every data type must have one.

---

## Error shape

All route handlers return errors in this shape. Use `ApiError` from `lib/types.ts`.

```ts
interface ApiError {
  error: string  // safe to show the user — no stack traces, no internal paths
  code: string   // e.g. 'RATE_LIMITED', 'CITY_NOT_FOUND', 'UPSTREAM_FAILURE', 'INVALID_INPUT'
}
```

```ts
// In a route handler:
if (!cityId) {
  return Response.json({ error: 'City ID is required.', code: 'INVALID_INPUT' }, { status: 400 })
}
```

---

## Component size limit

Components over **150 lines** must be split. When splitting:
- Extract pure rendering logic into a sub-component in the same directory
- Extract data transformation logic into a lib function
- Never extract just to hit the line limit — only split when it makes the code clearer

---

## Comment policy

Write comments only for the WHY — never the WHAT.

```ts
// WRONG — the code already says this
// Compute the pulse score from the snapshot
const pulse = computePulseScore(snapshot)

// WRONG — references a ticket/session that will rot
// Added for the city switch flow (issue #42)
setFading(true)

// CORRECT — explains a non-obvious constraint
// Mapbox setData() must be called after the style has loaded,
// not just after the map has mounted — hence the style.load listener
map.on('style.load', () => { ... })
```

---

## Mobile rules

Even though mobile is desktop-first / nice-to-have, these rules apply from day one:
- All interactive elements must have a minimum tap target of 44×44px
- No affordances that are hover-only — every hover effect must have a visible default state that makes the element's interactivity clear
- Touch-friendly drag interactions: minimum 44px drag handle, no mousedown-only handlers

---

## Accessibility minimums (every component, every phase)

- All icon-only buttons have `aria-label`
- Orbital metric nodes: `tabIndex={0}`, `role="button"`, `onKeyDown` handles Enter and Space
- All panels: trap focus when open using `react-focus-trap`; release on close
- Escape closes any open panel, the chat drawer, and the city selector dropdown
- Suggestion chips: keyboard navigable with Tab, activatable with Enter
- Pulse score container: `aria-live="polite"` — screen readers announce changes
- Color is never the sole indicator of state — pulse label text accompanies pulse color at all times
- Chat input: `Enter` submits, `Escape` closes the drawer

---

## Performance rules

- **Dynamic import Mapbox:** `dynamic(() => import('@/components/map/CityMap'), { ssr: false })` — mandatory
- **Map layer updates:** use `setData()` not unmount/remount — mandatory
- **Virtualize pulse history:** use `@tanstack/react-virtual` for lists > 20 items in HistoryPanel
- **No `select *`:** explicit column selection prevents silent payload bloat
- **Chat context budget:** `buildCityContext` must stay under ~3200 characters. Truncate event lists if needed.
