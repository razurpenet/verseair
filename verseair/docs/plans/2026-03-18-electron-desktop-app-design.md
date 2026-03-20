# VerseAir Electron Desktop App — Design Document

**Date:** 2026-03-18
**Status:** Approved, not yet implemented
**Goal:** Wrap VerseAir in Electron to produce installable desktop apps for Windows (.exe) and macOS (.dmg)

---

## Why Electron (not Tauri)

Tauri uses the system WebView (WKWebView on macOS, WebKitGTK on Linux). The Web Speech API — VerseAir's core feature — is unreliable or unsupported on those WebViews. Electron bundles Chromium, guaranteeing Web Speech API works identically on Windows and macOS.

Trade-off: ~150-200MB installer size (acceptable for a one-time download).

### Alternatives considered

| Approach | Verdict |
|---|---|
| **Tauri** | Tiny installer but Web Speech API breaks on macOS (WKWebView) and Linux (WebKitGTK). Only reliable on Windows. |
| **PWA** | Zero install, Web Speech API works (runs in Chrome). But no native window management — can't control projector screen programmatically. Feels less professional for church setting. |
| **Electron** | Chosen. Bundles Chromium so Web Speech API works on all platforms. Full native window control, multi-monitor, system tray. Battle-tested (ProPresenter, VS Code, Slack). |

---

## Architecture

- **Main process** (`main.js`) — creates BrowserWindow, handles mic permissions, multi-monitor detection, system tray
- **Renderer** — existing `bible-verse-projector.html` loaded directly, zero changes needed
- **Preload** (`preload.js`) — secure bridge for any native features (monitor detection, etc.)
- **Build tool** — `electron-builder` for producing `.exe` (Windows) and `.dmg` (macOS) installers

---

## Key Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Mic permissions | Auto-grant via `session.setPermissionRequestHandler` | Churches shouldn't see browser permission dialogs every launch |
| Window mode | Borderless fullscreen on secondary monitor (if detected), windowed on primary | Projector use case — operator sees controls, congregation sees fullscreen |
| System tray | Yes — minimize to tray, quick quit | Prevents accidental close mid-sermon |
| Google Fonts | Keep loading from CDN | App requires internet for verse APIs anyway; fonts are cached after first load |
| Auto-update | Skip for v1 | Keeps initial scope small; can add `electron-updater` later |
| Code signing | Skip for v1 | Requires Apple Developer ($99/yr) and Windows EV cert. Can add later for distribution. Users will see "unverified developer" warning on first install. |

---

## File Structure

```
verseair/
├── bible-verse-projector.html   (existing, untouched)
├── main.js                      (Electron main process)
├── preload.js                   (secure bridge for native features)
├── package.json                 (npm + electron-builder config)
├── icons/                       (app icons for Windows .ico and macOS .icns)
│   ├── icon.ico
│   └── icon.icns
└── dist/                        (build output)
    ├── VerseAir Setup.exe       (Windows installer)
    └── VerseAir.dmg             (macOS installer)
```

---

## What Stays The Same (Zero Changes)

- All existing HTML/CSS/JS in `bible-verse-projector.html`
- Web Speech API works natively in Electron's Chromium
- All Bible APIs (bible-api.com, esv.org, getbible.net)
- IndexedDB 4-tier cache system
- Claude API integration for sermon summaries
- Fullscreen API
- localStorage for settings

---

## Implementation Scope (main.js)

### Must have (v1)
1. Create BrowserWindow loading `bible-verse-projector.html`
2. Auto-grant microphone permissions (no dialog)
3. Detect secondary monitor — offer to open fullscreen projector view on it
4. System tray icon with Show/Hide/Quit
5. Prevent window close during active session (confirm dialog)
6. Menu bar with basic options (File > Quit, View > Fullscreen, Help > About)

### Nice to have (v2)
- Auto-updater (`electron-updater` + GitHub Releases)
- Code signing for Windows and macOS
- Dual-window mode (operator controls on primary, clean verse display on projector)
- Export sermon summary as PDF (via Electron's `printToPDF`)

---

## Build Commands

```bash
# Development
npm install
npm start          # launches Electron in dev mode

# Production builds
npm run build:win  # produces Windows .exe installer
npm run build:mac  # produces macOS .dmg installer
npm run build:all  # both platforms
```

---

## Prerequisites

- Node.js 18+ and npm
- For macOS builds on Windows: requires macOS machine or CI (GitHub Actions)
- For Windows builds on macOS: requires `wine` or CI

---

## Notes

- The previous ProPresenter-style media feature attempt (March 2, 2026) caused a verse display bug by patching `renderVerseContent()` post-definition. When implementing the dual-window projector mode in v2, keep the display pipeline untouched — use Electron IPC to mirror content to a second window instead.
- Speech recognition in Electron uses Google's cloud service (same as Chrome). Requires internet for speech-to-text. Offline speech recognition is NOT available through Web Speech API in Electron.

---

*This document was created during a brainstorming session on 2026-03-18. Resume implementation by reading this doc and proceeding with the writing-plans skill.*
