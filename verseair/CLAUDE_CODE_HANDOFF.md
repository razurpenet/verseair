# VerseAir — Claude Code Handoff Document
**Project:** VerseAir — Live Bible Verse Projector  
**Handoff Date:** March 2026  
**Transfer from:** Claude.ai (claude-sonnet-4-6)  
**Transfer to:** Claude Code (claude-opus-4-6)  

---

## HOW TO USE THIS DOCUMENT

1. Install Claude Code: `npm install -g @anthropic/claude-code`
2. Put `bible-verse-projector.html` and this file in a folder, e.g. `~/verseair/`
3. Run: `cd ~/verseair && claude --model claude-opus-4-6`
4. Paste the contents of the **"First Message"** section below as your opening message

---

## FIRST MESSAGE (paste this into Claude Code)

```
I'm continuing development of VerseAir — a single-file offline-first Bible verse 
projector web app. The project file is bible-verse-projector.html in this directory.
Read this entire handoff doc first: CLAUDE_CODE_HANDOFF.md


```

---

## PROJECT OVERVIEW

**What it is:** A single HTML file (~3,700 lines) that acts as a live Bible verse 
projector for churches. A preacher speaks, the app listens via speech recognition, 
detects Bible references in real time, fetches the verse text, and displays it 
beautifully fullscreen for the congregation.

**File:** `bible-verse-projector.html` (single self-contained file, no build step)  
**Tech stack:** Vanilla HTML/CSS/JS, no framework, no bundler  
**Fonts:** Cinzel (serif display) + EB Garamond (body) via Google Fonts  
**Design:** Dark theme, gold (#c9a84c) accents, ecclesiastical aesthetic  

---

## FEATURES BUILT (in chronological order)

### 1. Core Bible Verse Projector
- Speech recognition via Web Speech API (SpeechRecognition / webkitSpeechRecognition)
- Detects Bible references in real-time transcript
- Fetches verse text from bible-api.com (primary) with fallback APIs
- Displays verse beautifully with animated entrance
- Manual lookup input as fallback

### 2. Performance Optimisations
- **Parallel proxy racing** — fires requests to 3 APIs simultaneously, uses first response
- **In-memory cache** — Map() keyed by `book-chapter-verse-translation`
- **Prefetching** — when a verse is displayed, prefetch ±2 surrounding verses
- **Garbled speech sanitisation** — cleans speech recognition noise before detection

### 3. Translation Switching
- Supports: KJV, NIV, ESV, NKJV, NLT, AMP, CSB, NET, YLT, WEB, ASV, BBE, WEB
- Voice-activated: saying "New Living Translation" or "King James" switches live
- `extractTranslation()` runs in two modes: strict then loose
- Translation label shown as toast notification on switch

### 4. Offline-First Architecture (4-tier cache)
- **Tier 1:** In-memory Map (instant, lost on reload)
- **Tier 2:** IndexedDB persistent cache (survives reloads, works offline)
- **Tier 3:** Hardcoded KJV database (222 popular verses, zero network)
- **Tier 4:** Network fetch with racing APIs
- Cache count shown in UI, cache clear button provided
- Online/offline badge in header with animated states

### 5. AI Sermon Summary (Claude API)
- Collects all speech transcript + detected verses throughout service
- User enters their Anthropic API key (stored in localStorage, never sent anywhere else)
- Generates structured sermon summary: theme, overview, key points, scripture highlights, takeaways, closing reflection
- Full-screen overlay with copy/print/download actions
- Calls `claude-sonnet-4-6` model via direct fetch to Anthropic API
- Pre-flight modal asks for sermon title + preacher name before generating

### 6. Verse Range Detection & Auto-Advance
- Detects ranges like "John 3:16-21" or "Matthew 5:1 through 12"
- Auto-advance mode: displays verses one by one with configurable timing (3s/5s/8s/12s/20s)
- Progress dots, verse counter badge, countdown bar
- Play/pause control, manual prev/next navigation
- Range formats: hyphen, em-dash, "through", "to", "and", comma-separated

### 7. Bible Verse Detection — 100+ Pattern Expansions
Added comprehensive detection patterns:
- **Number words:** one through one-hundred-seventy-six (covers all Psalm 119 stanzas)
- **Book abbreviations:** Academic (SBL, Chicago, MLA, APA standards)
- **Liturgical prefixes:** "First/Second/Third" for numbered books
- **Speech recognition errors:** Common mishearing patterns (e.g. "gene" → Genesis)
- **Alternative separators:** Period, comma, space between chapter and verse
- **Preacher preambles:** "turn to", "open your Bibles to", "let's read from", etc.
- **Ordinal stripping:** "chapter three verse sixteen" normalised
- 83-test test suite embedded in comments

### 8. Voice-Guided Reading Mode
- When a verse range is active, auutoenable "Listen" mode
- App listens for congregation reading the displayed verse aloud
- Detects when last 3-4 words of verse are spoken → auto-advances
- Per-word span highlighting tracks reading progress in real time
- Word-progress bar fills as congregation reads
- 1.5s cooldown prevents double-triggers
- "Reading complete ✓" shown after final verse

---

## FILE STRUCTURE

```
bible-verse-projector.html
├── <head>
│   ├── Google Fonts (Cinzel + EB Garamond)
│   └── <style> (~420 lines of CSS)
│       ├── CSS variables (:root)
│       ├── Banner, Header
│       ├── Layout (main grid: 360px left + 1fr right)
│       ├── Mic button + states
│       ├── Transcript box
│       ├── Debug/detection log
│       ├── Manual lookup
│       ├── History list
│       ├── Verse display panel (animations)
│       ├── Range bar + navigation
│       ├── Voice reading mode styles
│       ├── Translation toast
│       ├── Offline/online badge
│       ├── Cache stats row
│       ├── Summary button
│       ├── Settings + modals
│       └── Summary overlay
│
├── <body>
│   ├── #banner (dismissible info banner)
│   ├── <header> (logo + translation selector)
│   ├── <main> (grid: left panel + right verse panel)
│   │   ├── .left panel
│   │   │   ├── Mic button + status
│   │   │   ├── Offline speech warning
│   │   │   ├── Live transcript box
│   │   │   ├── Detected verse chip
│   │   │   ├── Detection log
│   │   │   ├── Manual lookup input
│   │   │   ├── Clear button
│   │   │   ├── Session history list
│   │   │   ├── Cache stats row
│   │   │   └── AI Summary button
│   │   └── .verse-panel (right)
│   │       ├── Watermark cross
│   │       ├── Empty state
│   │       ├── Spinner
│   │       ├── Error message
│   │       ├── Verse content (ref + divider + text + translation)
│   │       ├── Verse number badge (range mode)
│   │       ├── Range navigation bar
│   │       ├── Range countdown bar (with voice reading dots)
│   │       ├── Listen button (voice reading mode)
│   │       ├── Word-progress bar
│   │       ├── Translation toast
│   │       └── Fullscreen button
│   ├── Settings modal (API key)
│   ├── Pre-summary modal (sermon title/preacher)
│   └── Summary overlay (full screen)
│
└── <script> (~2,900 lines of JS)
    ├── Utility: $() helper, constants
    ├── API config (proxy list, TRANS_LABELS, BOOK_MAP)
    ├── BOOK_MAP (~400 entries: canonical + abbreviations + variants)
    ├── Detection engine (extractRef, sanitise, normalise)
    ├── Fetch engine (race, cache check, IndexedDB)
    ├── renderVerseContent() — core display function
    ├── Range state machine (rangeState object)
    ├── Voice-guided reading engine
    ├── Speech recognition setup + handlers
    ├── Translation switching logic
    ├── displayVerse() — main entry point
    ├── History management
    ├── Cache management (IndexedDB)
    ├── Network status detection
    ├── Fullscreen API
    ├── Settings modal handlers
    ├── Pre-summary modal
    ├── Claude API call (callClaudeAPI)
    ├── Sermon summary generation + rendering
    └── startup() IIFE
```

---

## KEY FUNCTIONS

| Function | Purpose |
|---|---|
| `displayVerse(ref, trans, force)` | Main entry point. Checks cache, fetches, calls renderVerseContent |
| `renderVerseContent(ref, text, trans)` | Renders verse text into DOM with animations |
| `extractRef(text)` | Core detection — returns parsed ref object or null |
| `sanitiseText(text)` | Cleans speech recognition noise |
| `fetchVerse(ref, trans)` | Races 3 APIs, checks all cache tiers |
| `extractTranslation(text, loose)` | Detects translation commands in speech |
| `switchTranslation(code, note)` | Switches active translation, re-displays current verse |
| `startRange(refs, trans)` | Begins auto-advance mode for verse ranges |
| `scheduleNext()` | Countdown timer for range auto-advance |
| `startListenMode()` | Activates voice-guided reading |
| `checkVoiceEndSignature(text)` | Checks if congregation finished reading verse |
| `callClaudeAPI(prompt)` | Fetches Claude API for sermon summary |
| `buildSummaryPrompt(meta)` | Constructs summary prompt from session data |

---

## KEY STATE VARIABLES

```javascript
let currentRef = null;          // Currently displayed verse reference
let currentText = '';           // Currently displayed verse text  
let sessionVerses = [];         // All verses shown this session (for summary)
let sessionTranscript = '';     // Full speech transcript this session
let rangeState = null;          // Active range playback state (null = no range)
let isListening = false;        // Mic active?
let recognition = null;         // SpeechRecognition instance
let memCache = new Map();       // In-memory verse cache
```

**rangeState object structure:**
```javascript
{
  refs: [],           // Array of parsed ref objects
  texts: [],          // Fetched verse texts (null until loaded)
  currentIdx: 0,      // Current verse position
  trans: 'KJV',       // Translation being used
  speed: 5000,        // Ms per verse (auto-advance)
  playing: true,      // Auto-advancing?
  voiceGuided: false, // Voice reading mode active?
  verseWords: [],     // Normalised words of current verse
  voiceWordProgress: 0 // How many words spoken
}
```

---

## APIs USED

```javascript
// Bible verse APIs (raced in parallel, first response wins)
const PROXIES = [
  'https://bible-api.com/{book}+{chapter}:{verse}?translation={trans}',
  'https://cdn.jsdelivr.net/gh/wldeh/bible-api/bibles/{trans-code}/books/{book}/chapters/{ch}/verses/{v}.json',
  // + 1 more fallback
];
```

**Anthropic API** (for sermon summary only):
```javascript
POST https://api.anthropic.com/v1/messages
Model: claude-sonnet-4-6
Key: user-provided, stored in localStorage as 'verseair_api_key'
```

---

## DESIGN TOKENS (CSS variables)

```css
:root {
  --bg: #0b0c0f;
  --panel: #111318;
  --border: #1e2028;
  --gold: #c9a84c;
  --gold-light: #e8c97a;
  --gold-dim: rgba(201,168,76,0.1);
  --text: #e8e4d8;
  --muted: #5a5950;
  --red: #c0392b;
  --orange: #e67e22;
  --green: #27ae60;
  --radius: 10px;
}
```

---

## BUGS FIXED IN PREVIOUS SESSIONS

1. **Temporal Dead Zone crash** — `const` declaration inside block caused entire UI to freeze. Fixed by moving to `let` at outer scope.
2. **Duplicate const declaration** — two `const recognition` declarations caused syntax error. Fixed by merging.
3. **Garbled speech false positives** — speech recognition outputting "genesis three sixteen" as "jen sis 316". Fixed with sanitiser.
4. **Persistent mic permissions** — browser forgetting mic permission between reloads. Fixed with Electron packaging option + permission persistence.
5. **Range not advancing** — countdown timer race condition. Fixed with state machine.

---

## KNOWN CURRENT BUG (the main thing to fix)

**Symptom:** Speech recognition works and detection log correctly identifies verses. But only the FIRST verse ever gets displayed. After that, the verse panel freezes — subsequent detections log correctly but the display never updates.

**Evidence from detection log:**
```
🌐 Translation + verse: <Matthew 3:4 [KJV]>
```
The `<Matthew 3:4 [KJV]>` format in the log means `displayVerse()` IS being called with the correct ref. The problem is downstream — in the async fetch/render chain.

**Likely suspects** (in order of probability):
1. A debounce or cooldown lock (`lastDetected`, `detectCooldown`, or similar) that sets a flag but never clears it
2. The `currentRef` equality check — if two consecutive detections match the same ref, the second is skipped. Check if `force` param isn't being passed correctly.
3. An unhandled promise rejection in `fetchVerse()` that silently swallows errors after the first call
4. The `rangeState` object getting stuck in a non-null state that hijacks the display path
5. A DOM state issue where `vcontent` display style gets corrupted

**How to debug:** Add `console.log` at the top of `displayVerse()` and `renderVerseContent()` to confirm whether they're being reached on the 2nd call.

---

## FEATURES TO BUILD NEXT (after bug fix)

The user wants to add media presentation capabilities (like ProPresenter). The previous attempt at this caused the verse display bug — it was rolled back. When implementing again, be careful not to touch the core verse display pipeline. Specifically:

- **DO NOT** patch or wrap `renderVerseContent()` after its definition
- **DO NOT** add auto-firing async operations on startup (no screen detection dialogs)
- **DO NOT** add blocking `<script>` tags in `<head>`

The media feature should be isolated in its own section with no coupling to the verse display system.

---

## PREVIOUS FAILED APPROACH (DO NOT REPEAT)

The ProPresenter-style media feature was attempted and caused the verse display to break. Root causes:

1. **Blocking CDN scripts** in `<head>` (JSZip ~400KB + mammoth.js ~150KB) delayed entire page startup including speech recognition init
2. **Auto `detectScreens()`** called 1 second after load — Chrome's Window Management API permission dialog interrupted speech recognition
3. **Post-definition patching of `renderVerseContent`** via `window.renderVerseContent = newFn` — this does NOT reliably intercept bare function calls in V8. The patch ran but calls to `renderVerseContent(...)` elsewhere kept using the original V8 binding. This caused display corruption.
4. **State interference** — media display state (`mediaDisplay.classList`) was being toggled inside `renderVerseContent` through the broken patch, causing the verse panel to flicker off

---

## HOW TO RUN

Just open `bible-verse-projector.html` in Chrome or Edge. No server, no build step, no npm install. 

For best speech recognition: use Chrome on desktop, allow microphone access when prompted.

For offline use: load once while online (caches verse API results in IndexedDB), then works without internet for any cached verses. The hardcoded 222-verse KJV database also works with zero network.

---

## SESSION HISTORY SUMMARY

| Date | Session | Key Output |
|---|---|---|
| Feb 28 | Initial build + optimisations | Core projector, parallel API racing, caching |
| Mar 1 00:00 | Voice translation switching | extractTranslation(), translation toasts |
| Mar 1 01:07 | Offline-first architecture | 4-tier cache, IndexedDB, offline badge |
| Mar 1 01:57 | AI Sermon Summary | Claude API integration, summary overlay |
| Mar 1 02:14 | Verse ranges + TDZ bug fix | Range state machine, auto-advance |
| Mar 1 02:33 | Detection gaps research | 100+ pattern analysis document |
| Mar 1 03:15 | Detection patterns implementation | Book variants, number words, preambles |
| Mar 1 03:40 | Detection expansion complete | 83 tests passing |
| Mar 1 03:48 | Voice-guided reading mode | End-signature detection, word highlighting |
| Mar 1 12:56 | ProPresenter research | Architecture doc (feature NOT built) |
| Mar 2 | ProPresenter feature attempt | ROLLED BACK — caused verse display bug |
| Mar 2 | Rollback complete | Restored to pre-ProPresenter state |

---

*End of handoff document. Current file: bible-verse-projector.html (3,724 lines, 205 KB)*
