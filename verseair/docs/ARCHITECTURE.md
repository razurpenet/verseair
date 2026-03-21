# VerseAir Architecture

## Overview

VerseAir is an Electron desktop app that listens to a speaker in real-time and automatically displays Bible verses on screen as they are mentioned. It targets churches, primarily Nigerian congregations with Yoruba/Igbo accent support.

## Stack

| Component | Technology |
|---|---|
| Desktop wrapper | Electron 35.7.5 |
| UI & logic | Single HTML file (`bible-verse-projector_6.html`) |
| Speech recognition | Azure Cognitive Services Speech SDK (`microsoft-cognitiveservices-speech-sdk`) |
| Text search | FlexSearch (in-browser full-text index) |
| AI fallback | Claude Haiku via Anthropic API (Tier 3 contextual search) |
| Bible data | `kjv-full.json` (31,102 verses, bundled locally) |
| Build/package | electron-builder (NSIS installer for Windows) |

## File Structure

```
verseair/
├── main.js                        # Electron main process
├── preload.js                     # Secure IPC bridge (verseairAPI)
├── launch.js                      # Launcher (fixes ELECTRON_RUN_AS_NODE)
├── bible-verse-projector_6.html   # Main app (all UI, CSS, JS — ~4,500 lines)
├── azure-speech-polyfill.js       # Azure SDK → SpeechRecognition adapter
├── kjv-full.json                  # Full KJV Bible (4.7MB)
├── version.json                   # Hash for hot update checking
├── update-hash.js                 # Regenerates version.json hash
├── package.json                   # Electron config & build settings
├── assets/
│   └── verseair_icon_transparent.png  # App logo (gold V with cross)
├── docs/
│   ├── ARCHITECTURE.md            # This file
│   ├── BUGS.md                    # Bug history and resolutions
│   ├── ROADMAP.md                 # Feature roadmap and proposals
│   └── plans/                     # Design documents
└── node_modules/
    └── microsoft-cognitiveservices-speech-sdk/  # Azure Speech SDK
```

## How It Works

### 1. App Startup Flow

```
launch.js (deletes ELECTRON_RUN_AS_NODE)
  → main.js (Electron main process)
    → startLocalServer() — HTTP server on random port, serves all files
    → createWindow() — BrowserWindow loads http://127.0.0.1:<port>/
    → createTray() — system tray icon
    → checkForProjector() — multi-monitor detection
    → checkForUpdates() — hot update check (3s delay)
```

### 2. Speech Recognition Pipeline

```
Azure Speech SDK (WebSocket to wss://uksouth.stt.speech.microsoft.com)
  → azure-speech-polyfill.js (interim + final results)
    → cleanAzureText() (strip punctuation, normalize quotes)
      → onresult handler in HTML
        → preNormalise() (Nigerian accent fixes, preamble removal)
          → wordsToDigits() (word numbers → digits)
            → extractRef() (6+ regex patterns)
              → fetchAndDisplay() (4-tier cache: memory → IDB → API → fallback)
```

### 3. Verse Detection Patterns (extractRef)

| Pattern | Example Input | Detected As |
|---|---|---|
| Book C:V | "John 3:16" | John 3:16 |
| Book chapter C verse V | "John chapter 3 verse 16" | John 3:16 |
| Book C/V (slash) | "Romans 11/3" | Romans 11:3 |
| Book bare space | "Psalms 23 1" | Psalms 23:1 |
| Merged digits | "John 316" | John 3:16 |
| Range | "Genesis 3:1-5" | Genesis 3:1 through 3:5 |

### 4. Contextual Search (3-Tier Engine)

Triggers when `extractRef()` finds no reference and speech is 8+ words:

1. **Tier 1 — Bolls.life API**: Free text search, ~200ms, direct quote matches
2. **Tier 2 — FlexSearch**: Local full-text index of all 31,102 KJV verses, fuzzy matching
3. **Tier 3 — Claude Haiku**: AI-powered paraphrase/narrative matching, ~$0.005/sermon

Tiers 1 and 2 fire in parallel. Tier 3 only if both return no results.

### 5. Caching Architecture (4-Tier)

```
1. Memory cache (Map) — instant, cleared on reload
2. IndexedDB — persists across sessions
3. API fetch — bible-api.com, bolls.life, esv.org, etc.
4. Local KJV fallback — kjv-full.json for KJV-only offline
```

### 6. Nigerian Accent Support

- ~50+ Yoruba transliterations (genesisi, eksodu, matteu, johannu, etc.)
- Igbo transliterations
- Preacher preamble removal ("the Bible says in", "are you there", "somebody say amen")
- th→t number normalization ("tree" → "three", "tirty" → "thirty")
- STT mishearing corrections ("look" → "Luke", "proferbs" → "Proverbs")

### 7. Hot Update System

```
main.js on startup:
  1. Fetch version.json from GitHub raw URL
  2. Compare remote hash with local hash
  3. If different, download new HTML
  4. Verify downloaded hash matches
  5. Save to %APPDATA%/verseair/update/
  6. Notify renderer → user can restart to apply
```

### 8. Permission Handling (Electron)

- `setPermissionRequestHandler` — auto-grants microphone permission requests
- `setPermissionCheckHandler` — auto-approves `navigator.permissions.query()` checks
- Both set on main window and projector window
- No browser-style permission dialogs ever shown

### 9. Azure Speech Key Management

- Key entered via HTML modal dialog on first use
- Stored in `%APPDATA%/verseair/speech-config.json` via IPC bridge
- If auth fails, key is cleared and user prompted to re-enter
- IPC handlers: `get-speech-config`, `set-speech-config`, `has-speech-config`

## Key Design Decisions

1. **Single HTML file** — All UI, CSS, and JS in one file for simplicity and hot-updateability
2. **Localhost server** — Required for speech API origins (file:// rejected)
3. **Azure polyfill pattern** — App code uses standard SpeechRecognition API; Azure is swappable
4. **Electron over Tauri** — Guaranteed Chromium behavior on all platforms
5. **150ms debounce** — Scans interim results for near-instant verse detection
