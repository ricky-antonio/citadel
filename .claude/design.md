# Design System

## Brand personality
Citadel is a precision intelligence tool. The aesthetic is:
- **Atmospheric** — the city at night, dark and alive
- **Precise** — data is shown exactly, never rounded for aesthetics
- **Minimal** — every element earns its place; nothing decorative
- **Authoritative** — like a war room display, not a consumer app

Never: playful, rounded, pastel, bubbly, social, bright white backgrounds.

---

## Typography

**Font stack:**
- UI: `Inter` — loaded via `next/font/google`
- Wordmark/display: `Inter` Black (weight 900), all caps, wide letter-spacing (`tracking-widest`)
- Monospace: `JetBrains Mono` — coordinates, timestamps, raw metric values

**Type scale:**

| Step | Size | Weight | Line-height | Use |
|------|------|--------|-------------|-----|
| Hero | 48px | 900 | 1.0 | Wordmark only |
| Display | 32px | 800 | 1.1 | Major headings |
| H1 | 24px | 700 | 1.2 | Page-level titles |
| H2 | 18px | 600 | 1.3 | Panel section headers |
| H3 | 14px | 600 | 1.4 | Panel sub-headers |
| Body | 13px | 400 | 1.5 | All readable content |
| Small | 11px | 400 | 1.4 | Secondary labels, captions |
| Micro | 9px | 700 | 1.2 | UPPERCASE metric labels, status badges |

**Orbital-specific:**
- Pulse number (core): 22px / weight 800 / amber `#E8A020`
- Pulse label (core): 9px / weight 700 / uppercase / `#7A4400`
- Metric node value: 14px / weight 700 / semantic color
- Metric node label: 9px / weight 700 / uppercase / `var(--tx-2)`

---

## Color system

### Primary brand palette — Amber

| Token | Hex | Use |
|-------|-----|-----|
| `amber-50` | `#FFFBF0` | Light mode backgrounds |
| `amber-100` | `#FFF0C2` | Light mode tints |
| `amber-200` | `#FFD97A` | Light mode accents |
| `amber-300` | `#F5B731` | Secondary highlights |
| `amber-400` | `#E8A020` | **Primary** — orbital core, active states, CTA |
| `amber-500` | `#C47D0A` | Hover state |
| `amber-600` | `#9A5E00` | Text on amber fills |
| `amber-700` | `#7A4400` | Muted amber text |
| `amber-dark` | `#1A1200` | Amber-tinted dark surface |

### Secondary palette — Electric Blue

| Token | Hex | Use |
|-------|-----|-----|
| `blue-400` | `#60A5FA` | "Quiet" pulse state, weather data |
| `blue-500` | `#3B82F6` | Data visualisation, secondary charts |
| `blue-600` | `#2563EB` | Active secondary elements |

### Dark surfaces

| Token | Hex | Use |
|-------|-----|-----|
| `dark-900` | `#060A0F` | Deepest — map water, outer background |
| `dark-800` | `#0A0D12` | Land fill on map |
| `dark-700` | `#0F1318` | Buildings; panel background base |
| `dark-600` | `#141820` | Elevated panel surfaces |
| `dark-500` | `#1C2230` | Borders, dividers |

### Panel glass

| Token | Value | Use |
|-------|-------|-----|
| `panel-bg` | `rgba(10, 13, 18, 0.85)` | Floating data panels |
| `panel-border` | `rgba(232, 160, 32, 0.15)` | Panel and nav borders |
| `nav-bg` | `rgba(10, 13, 18, 0.80)` | Navigation pill |
| `chat-bg` | `rgba(10, 13, 18, 0.92)` | Chat drawer |

### Semantic — pulse states

| State | Color | Hex | Use |
|-------|-------|-----|-----|
| Quiet | Blue | `#60A5FA` | Pulse 0–19 |
| Calm | Green | `#4ADE80` | Pulse 20–39 |
| Active | Amber | `#E8A020` | Pulse 40–59 |
| Buzzing | Orange | `#F97316` | Pulse 60–79 |
| Intense | Red | `#EF4444` | Pulse 80–100 |
| Live | Green | `#4ADE80` | Always — live indicator dot |

### Semantic — status colors

| State | Background | Text | Border |
|-------|------------|------|--------|
| Success | `rgba(74, 222, 128, 0.1)` | `#4ADE80` | `rgba(74, 222, 128, 0.3)` |
| Warning | `rgba(232, 160, 32, 0.1)` | `#E8A020` | `rgba(232, 160, 32, 0.3)` |
| Danger | `rgba(239, 68, 68, 0.1)` | `#EF4444` | `rgba(239, 68, 68, 0.3)` |
| Info | `rgba(96, 165, 250, 0.1)` | `#60A5FA` | `rgba(96, 165, 250, 0.3)` |

---

## CSS variables (`app/globals.css`)

### Dark mode (default)
```css
:root {
  --amber:          #E8A020;
  --amber-hover:    #C47D0A;
  --amber-muted:    #7A4400;
  --amber-bg:       rgba(232, 160, 32, 0.10);
  --amber-border:   rgba(232, 160, 32, 0.15);

  --panel-bg:       rgba(10, 13, 18, 0.85);
  --panel-border:   rgba(232, 160, 32, 0.15);
  --nav-bg:         rgba(10, 13, 18, 0.80);
  --chat-bg:        rgba(10, 13, 18, 0.92);

  --bg-base:        #060A0F;
  --bg-surface:     #0F1318;
  --bg-elevated:    #141820;
  --border-subtle:  #1C2230;

  --tx-1:           #F0EDE8;   /* primary text */
  --tx-2:           #8A9BAA;   /* secondary text */
  --tx-3:           #3A4A5A;   /* muted text */

  --radius:         8px;
  --radius-lg:      12px;
  --radius-pill:    22px;

  --z-map:          0;
  --z-orbital:      10;
  --z-panels:       20;
  --z-nav:          30;
  --z-chat:         40;
  --z-modals:       50;
}
```

### Light mode
```css
[data-theme='light'] {
  --panel-bg:       rgba(245, 242, 236, 0.92);
  --panel-border:   rgba(100, 80, 20, 0.15);
  --nav-bg:         rgba(245, 242, 236, 0.88);
  --chat-bg:        rgba(240, 236, 228, 0.95);

  --bg-base:        #F5F0E8;
  --bg-surface:     #FFFFFF;
  --bg-elevated:    #F0EDE8;
  --border-subtle:  #E0D8CC;

  --tx-1:           #1A1200;
  --tx-2:           #5A4A30;
  --tx-3:           #9A8A70;
}
```

Amber variables are identical in light mode — the orbital and CTAs look the same on both.

---

## Layout & shell specs

| Element | Spec |
|---------|------|
| Map | `100vw × 100vh`, `position: fixed`, `z-index: var(--z-map)` |
| Nav pill | `position: absolute`, top 16px, horizontally centred, height 44px, `border-radius: 22px` |
| Orbital | `position: absolute`, centred on map (calc 50% - half-width), `z-index: var(--z-orbital)` |
| Orbital outer ring | 280px diameter |
| Orbital middle ring | 200px diameter |
| Orbital inner ring | 120px diameter |
| Orbital core | 72px diameter |
| Panels | `position: absolute`, `width: 280px`, `max-height: 60vh`, `z-index: var(--z-panels)` |
| Chat drawer | `position: absolute`, bottom 0, full width, `height: 42vh`, `z-index: var(--z-chat)` |

**Panel anchoring:**
| Panel | Position |
|-------|----------|
| Weather | `top: 80px; left: 16px` |
| AQI | `top: 80px; right: 16px` |
| Events | `bottom: 16px; left: 16px` |
| Transit | `bottom: 16px; right: 16px` |
| Anomaly | `top: 50%; left: 16px; transform: translateY(-50%)` |
| History | `top: 50%; right: 16px; transform: translateY(-50%)` |

---

## Component specs

### Orbital core (SVG)
- Three concentric rings: `stroke="rgba(232,160,32,0.12)"` / `0.18` / `0.25` at the inner ring
- Ring stroke-width: 1px. No fill.
- Core circle: 72px, `fill="#1A1200"`, `stroke="#E8A020"`, `stroke-width="2"`
- Pulse number: 22px, weight 800, `fill="var(--amber)"`
- Pulse label: 9px, weight 700, uppercase, `fill="#7A4400"`
- Metric nodes at cardinal positions: coloured dot (8px, semantic color) + value (14px/700) + label (9px/700 uppercase, `var(--tx-2)`)
- Node float animation: `translateY(±3px)`, 4s sine cycle, staggered phases (0s / 1s / 2s / 3s per node)

### Floating panels
```
backdrop-filter: blur(12px)
background: var(--panel-bg)
border: 1px solid var(--panel-border)
border-radius: 12px
padding: 16px
width: 280px
max-height: 60vh
overflow-y: auto
```
- Header: `9px/700 uppercase` amber label + `<LiveDot />` aligned right
- Slide-in: `200ms ease` — Weather/AQ panels slide from top (translateY(-8px) → 0), Events/Transit from bottom, side panels from the nearest edge
- Close: Escape key or click outside

### Navigation pill
```
background: var(--nav-bg)
backdrop-filter: blur(8px)
border: 1px solid var(--panel-border)
border-radius: 22px
height: 44px
padding: 0 16px
gap: 16px between items
```
Items (left to right): `CITADEL` wordmark | city selector | layers toggle | live dot | Ask button | theme toggle

### Chat drawer
```
background: var(--chat-bg)
border-top: 1px solid rgba(232, 160, 32, 0.20)
height: 42vh
position: absolute; bottom: 0; left: 0; right: 0
```
- Slide-up: `transform: translateY(100%)` → `translateY(0)`, `200ms ease`
- Suggestion chips: `background: rgba(232,160,32,0.08)`, amber text, `border-radius: 16px`, `padding: 6px 12px`

### Buttons

| Variant | Background | Text | Border | Hover |
|---------|------------|------|--------|-------|
| Primary | `var(--amber)` | `#1A1200` | none | `var(--amber-hover)` |
| Secondary | `transparent` | `var(--amber)` | `var(--amber-border)` | `var(--amber-bg)` |
| Ghost | `transparent` | `var(--tx-2)` | none | `var(--tx-1)` text |
| Danger | `transparent` | `#EF4444` | `rgba(239,68,68,0.3)` | `rgba(239,68,68,0.1)` bg |

All buttons: `border-radius: var(--radius)`, `height: 36px`, `padding: 0 12px`, `font-size: 13px`, `font-weight: 600`

Disabled state: `opacity: 0.4`, `cursor: not-allowed`
Loading state: show spinner or present-participle label, `disabled={true}`

### AI streaming cursor
- Character: `|` (pipe)
- Color: `var(--amber)`
- Animation: `opacity 0.8s ease-in-out infinite` (1 → 0.3 → 1)
- Disappears when streaming is complete

---

## Spacing system

Base unit: 4px

| Token | Value | Use |
|-------|-------|-----|
| `space-1` | 4px | Tight gaps |
| `space-2` | 8px | Icon + label gaps |
| `space-3` | 12px | Inner element gaps |
| `space-4` | 16px | Standard padding |
| `space-5` | 20px | Section gaps |
| `space-6` | 24px | Panel internal gaps |
| `space-8` | 32px | Major section separation |

---

## Motion rules

| Element | Duration | Easing | Notes |
|---------|----------|--------|-------|
| Panel open/close | 200ms | ease | translateX/Y from nearest edge |
| Chat drawer | 200ms | ease | translateY(100%) → 0 |
| City switch fade | 300ms | ease | opacity 1→0, data update, 0→1 |
| Orbital node float | 4s | ease-in-out infinite | sinusoidal, staggered per node |
| Live dot pulse | 1.5s | ease-in-out infinite | opacity 1→0.3→1 |
| Map layer transitions | 200ms | Mapbox default | built-in, not CSS |
| Streaming cursor blink | 0.8s | ease-in-out infinite | opacity 1→0.3→1 |

**Never animate:**
- Data tables or lists longer than 20 items
- Text content that is updating with live data (the text itself changes — no additional animation)
- Anything on a scroll event (no parallax, no scroll-triggered)

**Never use:**
- Spring physics (`stiffness`, `damping` in Framer Motion)
- Bounce easing
- Duration > 400ms for any interactive element

---

## Responsive strategy

Desktop-first. The map-as-interface layout is inherently desktop-oriented.

| Breakpoint | Width | Changes |
|------------|-------|---------|
| Default (desktop) | ≥ 1024px | Full layout as designed |
| Tablet | 768–1023px | Nav pill items collapse; panels reduce to 240px wide; orbital scales to 80% |
| Mobile | < 768px | Orbital moves to bottom strip; panels become full-width bottom sheets; nav collapses to hamburger |

Mobile is explicitly a nice-to-have, not a v1 requirement. Build desktop first; add breakpoints only after Phase 5.

---

## Mobile adaptations (Phase 6 if time allows)

- Navigation: hamburger menu or bottom nav strip instead of the pill
- Orbital: scaled to 60% and repositioned to lower-center of screen
- Panels: full-width bottom sheets instead of anchored floating panels
- Chat drawer: full-screen on mobile (100vh)
- Tap targets: minimum 44×44px for all interactive elements — no exceptions
- No hover-only affordances — all hover effects must have a touch equivalent

---

## Strict don'ts
- No light backgrounds behind the map (dark surfaces only in dark mode)
- No rounded corners larger than 22px (pill shape for nav only)
- No drop shadows (glass morphism blur is the depth signal — shadows conflict)
- No gradients on text
- No animation durations > 400ms on interactive elements
- No spring physics or bounce
- No color-only status indicators — always pair with a label or icon
- No `console.log` in production (Sentry handles error reporting)
- No `select *` in any Supabase query
- No hover-only affordances — touch users can't hover

---

## Mapbox custom dark style

Apply via Mapbox Studio. Reference the custom style URL in each city config's `mapStyle` field.

Custom overrides from the default `dark-v11`:
- Roads (major): `#3D2800` amber
- Roads (minor): `#1A1200` near-black amber
- Water: `#060A0F`
- Land: `#0A0D12`
- Buildings: `#0F1318` fill, `#2A1A00` amber extrusions at zoom ≥ 15
- Labels: `#2A3A4A` — muted, not competing with data overlays

Light mode map: `mapbox://styles/mapbox/light-v11` (standard Mapbox — no custom style needed)
