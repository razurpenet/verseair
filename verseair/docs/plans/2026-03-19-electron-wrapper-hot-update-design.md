# VerseAir Electron Wrapper + Hot Update — Design Document

**Date:** 2026-03-19
**Status:** Approved, ready for implementation
**Goal:** Wrap VerseAir in Electron to produce an installable Windows desktop app with background hot-update support for pushing HTML updates remotely via GitHub.

---

## Architecture

### File Structure

```
verseair/
├── bible-verse-projector_6.html       (existing, untouched)
├── main.js                            (Electron main process)
├── preload.js                         (secure bridge for native features)
├── package.json                       (npm + electron-builder config)
├── version.json                       (version hash for hot update)
├── update-hash.js                     (utility: recomputes hash after HTML edits)
├── assets/
│   └── verseair_icon_transparent.png  (existing app icon, 4000x4000 PNG)
└── dist/                              (build output, gitignored)
    └── VerseAir Setup.exe             (Windows installer)
```

### Main Process (`main.js`)

- Creates a `BrowserWindow` (1200x800, dark background `#0b0c0f`)
- Loads `bible-verse-projector_6.html` — checks app data folder for hot-updated copy first, falls back to bundled copy
- Auto-grants microphone permission via `session.setPermissionRequestHandler` — no browser permission dialogs
- Replaces default menu bar with minimal custom menu
- Initializes system tray with VerseAir icon
- Kicks off background hot-update check 3 seconds after window loads

### Preload (`preload.js`)

Exposes a minimal `verseairAPI` to the renderer via `contextBridge`:
- `getDisplays()` — returns list of connected monitors
- `getUpdateStatus()` — returns whether an update is available
- `restartToUpdate()` — restarts app to apply downloaded update

No `nodeIntegration` — keeps the renderer secure.

### Loading Priority

```
App launches
  → Check: does updated HTML exist in app data folder?
    → Yes → load updated copy
    → No  → load bundled bible-verse-projector_6.html
```

The bundled copy is always the fallback — the app works even if hot update hasn't run.

---

## Hot Update Mechanism

### Version File on GitHub

`version.json`:
```json
{
  "version": "1.0.0",
  "hash": "a3f9b2c...",
  "updated": "2026-03-19"
}
```

### Update Flow

```
App launches → window loads immediately (local HTML)
  │
  └─ 3 seconds later (background)
       │
       ├─ Fetch version.json from GitHub raw URL (~100 bytes)
       │
       ├─ Compare remote hash with locally stored hash
       │    └─ Same? → done, no update needed
       │
       ├─ Different? → download bible-verse-projector_6.html from GitHub
       │    └─ Save to app data folder (%APPDATA%/VerseAir/update/)
       │    └─ Save new hash locally
       │
       └─ Show subtle notification in-app:
            "Update available — restart to apply"
            [Restart Now]  [Later]
```

### Update Storage

- Downloaded HTML: `app.getPath('userData')/update/bible-verse-projector_6.html`
- Hash metadata: `app.getPath('userData')/update-meta.json`
- On next launch, `main.js` checks if updated file exists → loads it instead of bundled copy

### Developer Update Workflow

```
1. Edit bible-verse-projector_6.html
2. Run: node update-hash.js
   (auto-computes SHA256 of the HTML, updates version.json)
3. git add . && git commit && git push
4. Done — every running VerseAir instance picks it up on next launch
```

### Error Handling

| Scenario | Behavior |
|---|---|
| No internet | Silently skips update check, loads local HTML |
| GitHub unreachable | Same — silent skip, loads local |
| Download corrupted | Validates file size > 0 and contains `<html`. If invalid, discards and keeps current |
| version.json malformed | Silent skip |

No update check ever blocks the app from opening.

---

## Multi-Monitor Detection

```
App launches
  → screen.getAllDisplays()
  │
  ├─ 1 monitor → open windowed (1200x800), centered
  │
  └─ 2+ monitors → open windowed on primary monitor
       └─ Show prompt: "Projector detected — open fullscreen on external display?"
            [Yes] → opens second BrowserWindow fullscreen on secondary monitor
            [No]  → stays windowed on primary only
```

For v1, the second window loads the same HTML fullscreen. True dual-window mode (operator controls on one screen, clean verse display on the other via IPC) is a v2 feature.

---

## System Tray

- Tray icon: VerseAir logo (auto-resized by Electron to 16x16/32x32)
- Tray menu:
  - **Show/Hide** — toggles main window visibility
  - **Quit** — exits the app
- Closing the window (X button) minimizes to tray instead of quitting
- Tray balloon: "VerseAir is still running" when minimized

---

## Menu Bar

```
File
  └─ Quit (Ctrl+Q)
View
  └─ Toggle Fullscreen (F11)
  └─ Reload (Ctrl+R)
Help
  └─ About VerseAir
```

---

## Close Protection

```
User clicks X
  → Window hides to tray
  → Tray balloon: "VerseAir is still running"

User clicks Quit (tray or Ctrl+Q)
  → If speech recognition is active:
       "Session in progress — are you sure you want to quit?"
       [Quit] [Cancel]
  → If not active:
       Quits immediately
```

---

## What Stays The Same (Zero Changes)

- All existing HTML/CSS/JS in `bible-verse-projector_6.html`
- Web Speech API (works natively in Electron's Chromium)
- All Bible APIs (bible-api.com, bolls.life, esv.org, getbible.net)
- IndexedDB 4-tier cache system
- Claude API integration for sermon summaries
- Fullscreen API
- localStorage for settings

---

## Dependencies

| Package | Purpose | Size |
|---|---|---|
| `electron` | App shell with Chromium | ~150MB (bundled in installer) |
| `electron-builder` | Build `.exe` installer | Dev dependency only |

No runtime npm dependencies beyond Electron itself.

---

## Build Commands

```bash
# Development
npm install
npm start              # launches Electron in dev mode

# Production build
npm run build:win      # produces Windows .exe installer
```

---

## Prerequisites

- Node.js 18+ and npm
- GitHub repository for VerseAir (to host version.json + HTML for hot updates)

---

## v2 Features (not in scope)

- macOS `.dmg` build (requires macOS machine or CI)
- Code signing (requires Apple Developer $99/yr + Windows EV cert)
- Auto-updater for Electron shell itself (`electron-updater` + GitHub Releases)
- Dual-window mode with IPC sync (operator on primary, clean display on projector)
- Export sermon summary as PDF (`printToPDF`)

---

*This document was approved during a brainstorming session on 2026-03-19. Proceed with writing-plans skill for implementation planning.*
