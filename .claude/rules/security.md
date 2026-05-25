# Security Rules

## Authorization verification

All writes go through server-side route handlers using `SUPABASE_SERVICE_ROLE_KEY`. No client-side writes exist. Verify this before any phase is marked complete:

1. Open browser DevTools → Network tab
2. Perform a city load and check every outgoing request
3. Confirm: only requests to `/api/**` and `api.mapbox.com` leave the client
4. Confirm: no requests directly to `supabase.co`, `api.anthropic.com`, Ticketmaster, Eventbrite, or transit APIs
5. Confirm: `SUPABASE_SERVICE_ROLE_KEY` does not appear anywhere in the client bundle

Automated tests passing is not sufficient for this check — it must be verified manually by inspecting the network tab.

---

## Input validation

Validate on the server side in every route handler, even when the client already validates.

**Required validations:**
- `cityId` in any `[id]` route: must be one of the four valid city IDs. Reject unknown city IDs with `{ error: 'Unknown city.', code: 'CITY_NOT_FOUND' }` and status 404.
- `message` in `/api/chat`: must be a non-empty string, max 500 characters
- `history` in `/api/chat`: must be an array of `{role, content}` objects, max 20 messages

```ts
const VALID_CITY_IDS = ['new-york', 'san-francisco', 'chicago', 'washington-dc']

if (!VALID_CITY_IDS.includes(cityId)) {
  return Response.json({ error: 'Unknown city.', code: 'CITY_NOT_FOUND' }, { status: 404 })
}
```

---

## Rate limiting

Every route that calls Anthropic or performs expensive work must be rate limited. Use `@upstash/ratelimit` with `@vercel/kv`.

**Implementation pattern (paste this in each rate-limited route):**
```ts
import { Ratelimit } from '@upstash/ratelimit'
import { kv } from '@vercel/kv'

const chatRatelimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(20, '1m'),
  prefix: 'citadel:chat',
})

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') ?? 'anonymous'
  try {
    const { success, limit, remaining, reset } = await chatRatelimit.limit(ip)
    if (!success) {
      return Response.json(
        { error: 'Too many requests. Please wait a moment.', code: 'RATE_LIMITED' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(limit),
            'X-RateLimit-Remaining': String(remaining),
            'X-RateLimit-Reset': String(reset),
            'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)),
          },
        }
      )
    }
  } catch {
    // KV not available locally — fail open (allow the request)
  }
  // ... rest of handler
}
```

**Rate limits:**
| Route | Limit | Window |
|-------|-------|--------|
| `POST /api/chat` | 20 requests | 1 minute per IP |
| `GET /api/city/[id]/snapshot` | 60 requests | 1 minute per IP |

The `/api/city/[id]/briefing`, `/api/pulse/[id]`, and `/api/anomalies/[id]` routes do not require rate limiting — they serve cached data and do not call Anthropic.

---

## Content sanitization

User-typed chat messages are rendered as **text only** — inserted via React's `{children}` or `textContent`, never via `dangerouslySetInnerHTML`.

AI responses are streamed as plain text — they are appended character by character to a string state variable, then rendered as text. Never parse AI output as HTML.

No third-party content (event descriptions, transit alerts) is ever rendered as HTML. All such strings are displayed with `{text}` in JSX.

If markdown rendering is ever introduced, use `DOMPurify` before rendering:
```ts
import DOMPurify from 'dompurify'
const safe = DOMPurify.sanitize(markdown, { ALLOWED_TAGS: ['p', 'strong', 'em', 'br', 'ul', 'li'] })
```

---

## Sensitive operations

No admin-only APIs exist in v1. The service role key is used for cache writes and anomaly logging in server-side route handlers. No route returns the service role key in its response.

If admin operations are added:
- Server route handler only — no client-side exposure
- Service role credentials via environment variables only
- Add an authentication check before any admin operation

---

## API key protection

**`NEXT_PUBLIC_MAPBOX_TOKEN`** is the only key that is intentionally client-side — Mapbox GL JS requires it. All other keys are server-only.

Checklist before first deploy:
- [ ] `NEXT_PUBLIC_MAPBOX_TOKEN` restricted to the production domain in Mapbox dashboard → Tokens → Allowed URLs
- [ ] No `NEXT_PUBLIC_` prefix on any other API key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` never appears in a client bundle (check with `npm run build` and inspect `.next/static/`)
- [ ] `.env.local` is in `.gitignore` — never committed

---

## Dependency security

Before adding any new npm package:
1. Check the package's GitHub for recent activity and open issues
2. Run `npm audit` after installation — address any high or critical vulnerabilities
3. Prefer packages with > 1M weekly downloads for security-relevant dependencies (auth, crypto, parsing)
4. Never install packages from untrusted sources or with typosquatted names

Run `npm audit` at the end of every phase. Address any high or critical issues before marking the phase complete.

---

## Secret management

- Secrets live in `.env.local` (local dev) and Vercel environment variables (deployed)
- `.env.example` is the contract — it lists all required variable names with placeholder values and comments. No real values.
- `.env*` and `*.local` are in `.gitignore` — confirmed before first commit
- Never hardcode an API key, token, or credential in source code
- Never log secrets — no `console.log(process.env.ANTHROPIC_API_KEY)`

---

## Mapbox token exposure

The Mapbox token appears in the client-side JavaScript bundle because it is `NEXT_PUBLIC_`. This is expected and unavoidable — Mapbox GL JS requires it.

Mitigation: restrict the token to specific allowed URLs in the Mapbox dashboard. Without this restriction, anyone who extracts the token from the bundle can use it against your map tile quota. Add the production domain restriction before launching.
