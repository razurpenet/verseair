# VerseAir Feature Roadmap

## Status Legend
- **DONE** — Implemented and working
- **PROPOSED** — Discussed, not yet started
- **PLANNED** — Committed to building

---

## Completed Features

### Core
- [x] Real-time speech-to-text Bible verse detection (Azure Speech SDK)
- [x] 6+ regex patterns for verse reference extraction
- [x] Multi-verse range display (e.g., Genesis 3:1-5)
- [x] Voice-guided reading mode with word-match auto-advance
- [x] 4-tier verse caching (memory → IndexedDB → API → local KJV fallback)
- [x] Full KJV Bible bundled offline (kjv-full.json, 31,102 verses)
- [x] NKJV as default translation

### Search & Discovery
- [x] 3-tier contextual search engine (Bolls.life + FlexSearch + Claude Haiku)
- [x] Smart search panel with autocomplete and book/chapter/verse grid
- [x] FlexSearch full-text index loaded from local kjv-full.json

### Speech & Accent
- [x] Azure Cognitive Services Speech SDK integration
- [x] Nigerian accent support (~50+ Yoruba/Igbo transliterations)
- [x] Preacher preamble removal ("the Bible says in...", etc.)
- [x] STT mishearing corrections ("look" → "Luke", etc.)
- [x] Translation switching via voice command
- [x] Merged number parsing ("John 316" → John 3:16)
- [x] Slash separator support ("Romans 11/3")
- [x] 150ms debounce for near-instant detection from interim results

### Electron Desktop
- [x] Electron wrapper with Chromium
- [x] Localhost HTTP server for speech API origin
- [x] Auto-grant microphone permissions (no browser dialogs)
- [x] System tray with minimize-to-tray
- [x] Multi-monitor/projector detection
- [x] Hot update system (hash-based, via GitHub)
- [x] Azure API key management (secure dialog + encrypted storage)
- [x] Microphone device selection dropdown
- [x] Custom app logo in header, tray, about dialog, installer

### Manual Controls
- [x] Next/previous verse navigation arrows
- [x] Manual verse lookup panel
- [x] Keyboard navigation in search

---

## Proposed Features

### High Priority

#### ProPresenter-style UI Evolution
- **Status**: PROPOSED
- **Description**: Progressively evolve the UI to match ProPresenter's professional look and feel
- **Notes**: User wants VerseAir to eventually compete with ProPresenter for church use

#### Code Signing Certificate
- **Status**: PROPOSED
- **Description**: Sign the Windows installer to prevent SmartScreen warnings
- **Notes**: Required for professional distribution; current unsigned builds trigger Windows warnings

#### Full Auto-Updater
- **Status**: PROPOSED
- **Description**: Full app binary updates (not just HTML hot updates)
- **Notes**: Current hot update only replaces the HTML file; full Electron updates need electron-updater or similar

### Medium Priority

#### macOS Build
- **Status**: PROPOSED
- **Description**: Build and test macOS version
- **Notes**: Electron supports macOS but it hasn't been built/tested yet. May need code signing for macOS too (Apple notarization)

#### NKJV Commercial License
- **Status**: PROPOSED
- **Description**: Obtain license to bundle full NKJV text locally for offline use
- **Notes**: Currently NKJV fetches from API; copyright prevents local bundling without license

#### Replace Azure with Local Speech (Cost Optimization)
- **Status**: PROPOSED
- **Description**: Evaluate local speech-to-text alternatives for when Azure costs become significant
- **Notes**: Azure costs ~$1/hour standard tier. For large-scale commercial deployment, a local solution (Vosk 2.0, whisper.cpp streaming) could reduce costs. Not urgent — Azure free tier covers 5 hours/month

### Nice to Have

#### Multi-language Bible Support
- **Status**: PROPOSED
- **Description**: Support for non-English Bible translations and speech recognition
- **Notes**: Azure Speech SDK supports many languages; would need corresponding Bible text sources

#### Sermon Recording & Transcription
- **Status**: PROPOSED
- **Description**: Record full sermon audio with verse timestamps
- **Notes**: Natural extension of the real-time transcription capability

#### Remote Control / Mobile Companion
- **Status**: PROPOSED
- **Description**: Mobile app or web interface for operator to control projection remotely
- **Notes**: Could use WebSocket connection from the existing localhost server

#### Lyrics/Hymn Projection
- **Status**: PROPOSED
- **Description**: Extend beyond Bible verses to project song lyrics and hymns
- **Notes**: ProPresenter handles both; natural feature for church use

---

## Technical Debt

- [ ] Single HTML file is ~4,500+ lines — consider splitting into modules when it grows further
- [ ] `bible-verse-projector (20).html` and `backup/` copies should be cleaned up
- [ ] IDB version management is fragile (manual version bumping with delays)
- [ ] No automated tests
- [ ] No CI/CD pipeline
