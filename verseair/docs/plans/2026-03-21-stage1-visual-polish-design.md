# Stage 1: Foundation & Visual Polish — Design Document

**Date:** 2026-03-21
**Status:** Approved
**Goal:** Make VerseAir look and feel professional with zero risk to the verse detection pipeline.

---

## 1. Theme Presets (D3)

### 6 Themes as CSS Variable Overrides

| Theme | --bg | --panel | --border | Accent | --text | --muted |
|---|---|---|---|---|---|---|
| Classic Dark (default) | #0b0c0f | #111318 | #2a2b35 | Gold #c9a84c | #e8e4d8 | #8a8980 |
| Modern Light | #f5f5f0 | #ffffff | #d4d4d0 | Navy #1a365d | #1a1a1a | #6b6b6b |
| Stained Glass | #1a0e2e | #221440 | #3a2a5a | Amber #d4a017 | #e8dcc8 | #9a8a7a |
| Minimal | #000000 | #0a0a0a | #222222 | White #ffffff | #ffffff | #888888 |
| Nature | #0a1a0a | #0f1f0f | #1a3a1a | Green #4a8c5c | #d8e8d8 | #7a9a7a |
| Royal | #0a0e1a | #0f1428 | #1a2a4a | Silver #a8b4c4 | #d8dce8 | #7a8a9a |

### Implementation

- Themes defined as JS objects mapping CSS variable names to values
- Selector: `<select>` dropdown in settings panel, labelled "Theme"
- On change: iterate object, set `document.documentElement.style.setProperty()` for each variable
- Stored in `localStorage('va-theme')` — key is theme name string
- On app load: read localStorage, apply theme (default: "classic-dark")
- Projector window: receives theme via existing `postMessage` or reads same localStorage

### Variables to Override

```
--bg, --panel, --border, --gold, --gold-light, --gold-dim, --text, --muted, --red, --orange
```

For non-gold themes, `--gold` becomes the accent color (navy, amber, white, green, silver). All existing CSS already uses these variables, so the entire UI recolors automatically.

---

## 2. Dynamic Backgrounds (D1)

### Background Types

**Subtle (default safe choices):**
1. **Gradient Drift** — two-color radial gradient that slowly shifts position
2. **Particle Float** — sparse dots drifting upward with slight opacity variation
3. **Light Rays** — soft angled beams sweeping slowly

**Bold (opt-in):**
4. **Starfield** — stars moving toward viewer (z-axis parallax)
5. **Abstract Waves** — flowing sine-wave ribbons with accent color

### Implementation

- `<canvas id="bgCanvas">` placed as first child of `<body>`, z-index: 0, position: fixed, covers viewport
- All existing content has higher z-index (already the case with current panel layout)
- Each background is a class with `init(canvas)`, `start()`, `stop()`, `destroy()` methods
- Animation via `requestAnimationFrame` — pauses when `document.hidden` is true
- Selector: dropdown in settings panel next to theme selector, labelled "Background"
- Options: "None", "Gradient Drift", "Particle Float", "Light Rays", "Starfield", "Abstract Waves"
- Stored in `localStorage('va-bg')`
- Colors derived from current theme's CSS variables (accent color, background color)
- Performance: particle count and complexity kept low; "None" option for low-end devices
- Projector window: separate canvas instance, syncs background choice via localStorage/postMessage

---

## 3. Lower Thirds & Alerts (D7/E3)

### 3 Visual Types

| Type | CSS Class | Default Duration | Visual Style |
|---|---|---|---|
| Speaker | `.lt-speaker` | Persistent (manual dismiss) | Subtle bar, accent border-top, themed |
| Announcement | `.lt-announce` | Configurable 5-30s auto-dismiss | Medium bar, readable body text |
| Emergency | `.lt-emergency` | Persistent (manual dismiss) | High-contrast, red background, optional pulse |

### DOM Structure

```html
<div id="lowerThird" class="lt-bar lt-hidden">
  <div class="lt-content">
    <div class="lt-title"></div>
    <div class="lt-subtitle"></div>
  </div>
</div>
```

### Implementation

- Positioned `fixed` at bottom of viewport, full width, z-index above backgrounds but below modals
- Animate: slide-up from below viewport via CSS `transform: translateY(100%)` → `translateY(0)`
- Transition duration: 400ms ease-out
- Operator controls in new "Production" section:
  - Type selector (Speaker / Announcement / Emergency)
  - Title input (e.g., "Pastor James Adeyemi")
  - Subtitle input (e.g., "Senior Pastor" or announcement text)
  - Duration input (for announcements, in seconds)
  - "Show" / "Hide" buttons
- State: simple object `{ type, title, subtitle, duration, visible }`
- Projector window: receives lower third state via postMessage, renders its own instance

---

## 4. Countdown/Session Timer (E2)

### Two Views

**Operator View (in Production section):**
- Session label input (e.g., "Worship", "Sermon", "Announcements")
- Duration input (minutes:seconds)
- Start / Pause / Reset buttons
- Current time display (large, readable)
- Warning threshold input (seconds, default 60)

**Projected View (on projector/audience screen):**
- Large centered countdown: "12:45"
- Session label above: "SERMON"
- Normal state: themed accent color
- Warning state: transitions to warm/orange
- Expired state: flashes red, shows "0:00"
- Clean, minimal — no controls, just display

### Implementation

- Timer logic: `setInterval` at 1000ms, decrements seconds counter
- State: `{ label, totalSeconds, remainingSeconds, running, warningThreshold }`
- On tick: update operator display + send state to projector via postMessage
- Pause: clears interval, preserves remainingSeconds
- Reset: stops interval, resets to totalSeconds
- Warning: when `remainingSeconds <= warningThreshold`, apply `.timer-warning` class
- Expired: when `remainingSeconds === 0`, apply `.timer-expired` class, stop interval
- Stored in memory only (not persisted — each service is fresh)
- Projector: receives timer state, renders large countdown display

---

## New UI Section: "Production" Panel

Added to the control panel (left sidebar), below existing sections:

```
[PRODUCTION] ─────────────────────
  Timer
    Session: [____________]
    Duration: [__:__]
    [Start] [Pause] [Reset]
    ► 12:45 remaining

  Lower Third
    Type: [Speaker ▼]
    Title: [____________]
    Subtitle: [____________]
    Duration: [15s] (announcements only)
    [Show] [Hide]

  Background
    Style: [Gradient Drift ▼]
```

Theme selector stays in the existing settings area (alongside translation, mic, etc.).

---

## Architecture Rules

1. **No modifications to `renderVerseContent()`** — all new features use separate DOM containers
2. **No modifications to the speech pipeline** — detection, extraction, fetch, display untouched
3. **All new DOM elements added at end of `<body>`** — lower third overlay, background canvas
4. **All new JS functions added at end of `<script>`** — theme, background, timer, lower third modules
5. **All new CSS added at end of `<style>`** — clearly commented section markers
6. **Communication to projector via existing `postMessage` pattern**
