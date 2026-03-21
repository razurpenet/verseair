# Stage 2: Multi-Screen Architecture — Design Document

**Date:** 2026-03-21
**Status:** Approved
**Goal:** Separate operator controls from clean audience/projector display using BroadcastChannel.

---

## Architecture

```
┌─────────────────────────┐         BroadcastChannel         ┌─────────────────────┐
│   OPERATOR WINDOW       │  ──────── "va-channel" ────────► │  PROJECTOR WINDOW   │
│   (bible-verse-         │                                  │  (projector.html)   │
│    projector_6.html)    │  Messages:                       │                     │
│                         │  • verse-update {ref, html, ...} │  Clean display:     │
│  All controls:          │  • timer-update {label, time}    │  • Verse text       │
│  • Mic, search, log    │  • lower-third {type, title}     │  • Timer overlay    │
│  • Production panel    │  • theme-change {theme, vars}    │  • Lower third      │
│  • Timer controls      │  • bg-change {bg}                │  • Background       │
│  • Lower third inputs  │  • clear                         │  • Nothing else     │
│  • Theme/BG selectors  │                                  │                     │
└─────────────────────────┘                                  └─────────────────────┘
```

## projector.html — Lightweight display page

~150 lines. Contains:
- Background canvas (same engine code as operator)
- Verse display (ref, text, translation label)
- Projected timer overlay
- Lower third overlay
- Listens on `BroadcastChannel('va-channel')` for all state updates
- No controls, no search, no speech, no AI — pure display
- Receives theme colors via messages, applies as CSS variables

## Communication Protocol

All messages: `{ type: string, payload: object }`

| Message Type | Payload | When Sent |
|---|---|---|
| `verse-update` | `{ ref, html, trans }` | Verse displayed |
| `verse-clear` | `{}` | Display cleared |
| `timer-update` | `{ label, time, state }` | Every timer tick |
| `timer-visibility` | `{ visible }` | Project button toggled |
| `lower-third-show` | `{ type, title, subtitle }` | Show clicked |
| `lower-third-hide` | `{}` | Hide clicked |
| `theme-change` | `{ name, vars }` | Theme changed |
| `bg-change` | `{ name }` | Background changed |

## Electron Changes (main.js)

- Update `checkForProjector()` to load `/projector.html`
- Add IPC handler `open-projector` from renderer
- Add to preload.js: expose `openProjector()` via verseairAPI
- Second display: open fullscreen on external display
- No second display: open as draggable window

## Operator Changes (bible-verse-projector_6.html)

- Create `BroadcastChannel('va-channel')` on startup
- After `renderVerseContent()`: broadcast `verse-update`
- Timer ticks: broadcast `timer-update`
- Lower third show/hide: broadcast messages
- Theme/BG changes: broadcast messages
- Add "Open Projector" button in Production section
