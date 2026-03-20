# VerseAir — Competitor Analysis, Feature Brainstorm & Implementation Roadmap

**Date:** 2026-03-19
**Purpose:** Comprehensive breakdown of ProPresenter, EasyWorship, OpenLP, and MediaShout — with brainstormed innovations and a phased implementation plan for VerseAir.

---

## PART 1: COMPETITOR FEATURE MATRIX

### Quick Comparison

| Feature Area | ProPresenter | EasyWorship | MediaShout | OpenLP | VerseAir (Current) |
|---|:---:|:---:|:---:|:---:|:---:|
| **Price** | $289/yr | ~$180-280/yr | $599 one-time | Free | Free |
| **Platform** | Mac + Win | Win only | Win only | Mac/Win/Linux | Browser (any) |
| **Bible Translations** | 125+ | 60+ | 70+ | Web download | 13 (API-based) |
| **Speech Recognition** | No | No | No | No | **YES** |
| **Real-time Verse Detection** | No | No | No | No | **YES** |
| **AI Sermon Summary** | No | No | No | No | **YES** |
| **Voice-Guided Reading** | No | No | No | No | **YES** |
| **Offline Support** | Full (local) | Full (local) | Full (local) | Full (local) | 4-tier cache |
| **Song/Lyrics Database** | CCLI import | CCLI + 60+ Bibles | 2,500 hymns | 25+ import formats | No |
| **Multi-Screen Output** | Unlimited | 4 outputs | 3 outputs | 2+ outputs | Single screen |
| **Stage Display** | Yes | Yes (foldback) | Yes | Yes (web-based) | No |
| **Live Streaming** | Built-in RTMP | NDI output | OBS/BoxCast | No | No |
| **NDI/SDI Output** | Both | NDI + Alpha | NDI | No | No |
| **Media Playback** | Video/Audio/Images | Video/Audio/Images | Video/Audio/Images | VLC-based | No |
| **Slide Editor** | 8-layer | Shape engine | Script/Cue | Theme manager | No |
| **Mobile Remote** | iOS app | iOS + Android | No | iOS + Android | No |
| **MIDI/DMX Control** | Both | MIDI | No | No | No |
| **Planning Center** | Yes | No | No | Yes | No |
| **CCLI Integration** | Import + Report | Import + Report | Import + Report | Import only | No |
| **PowerPoint Import** | No | Yes | Yes (Win) | Yes | No |
| **Countdown Timers** | Yes | Yes | Yes | No | No |
| **Alerts/Nursery Paging** | Via messages | Yes | No | Yes | No |
| **Automation/Macros** | Yes | No | Script Scenario | No | Auto-advance |
| **Public API** | REST API | No | No | No | No |
| **Edge Blending** | Up to 5 screens | No | No | No | No |
| **Alpha Keying** | NDI + SDI | NDI | No | No | No |

---

### What Competitors ALL Have That VerseAir Lacks

1. **Song/Lyrics Management** — database of songs with verse/chorus/bridge structure
2. **Multi-Screen Output** — at minimum: operator screen + audience screen + stage display
3. **Media Playback** — video backgrounds, images, audio tracks
4. **Slide/Presentation Editor** — create custom slides beyond just Bible verses
5. **Service/Schedule Builder** — drag-and-drop order of service
6. **Countdown Timers** — pre-service, between-service, sermon timers
7. **Theme/Template System** — reusable visual styling
8. **Remote Control** — phone/tablet control from stage

### What VerseAir Has That NO Competitor Offers

1. **Real-time speech-to-verse detection** — preacher speaks, verse appears automatically
2. **AI-powered sermon summarisation** — Claude API generates structured summary
3. **Voice-guided congregational reading** — listens for congregation and auto-advances
4. **Zero-install browser app** — open an HTML file, done. No download, no account, no setup
5. **Verse range auto-advance with speech sync** — detects when congregation finishes reading
6. **Garbled speech correction** — sanitises speech recognition errors before detection
7. **100+ Bible reference detection patterns** — handles spoken numbers, abbreviations, preambles
8. **Parallel API racing** — fires 3 APIs simultaneously, uses first response

---

## PART 2: BRAINSTORMED INNOVATIONS — Features Beyond All Competitors

These are features that would make VerseAir not just a competitor but a **category-defining product**.

### A. AI-Powered Features (VerseAir's Unique Edge)

| # | Feature | Innovation Level | Description |
|---|---------|:---:|---|
| A1 | **AI Verse Prediction** | 🔥 New category | Predict the NEXT verse a preacher will reference based on sermon flow, theological patterns, and common sermon structures. Pre-load it before they even say it. |
| A2 | **AI Sermon Outline Generator** | 🔥 New category | Before the service, paste sermon notes → AI generates a verse schedule with expected references, pre-caches all verses, and creates a suggested display order. |
| A3 | **AI Cross-Reference Suggestions** | 🔥 New category | When a verse is displayed, show related/cross-referenced verses in a sidebar that the operator can quickly push to screen. |
| A4 | **AI Theme Detection** | 🔥 New category | Detect the sermon theme in real-time (grace, salvation, faith, etc.) and auto-adjust the visual theme/background to match. |
| A5 | **AI Translation Comparison** | Enhancement | Show the same verse in 2-3 translations side-by-side with AI-highlighted differences in meaning. |
| A6 | **AI Sermon Notes for Congregation** | 🔥 New category | Generate real-time fill-in-the-blank sermon notes that congregation members can follow along with on their phones via a shared link. |
| A7 | **AI Commentary Snippets** | Enhancement | When displaying a verse, show a brief AI-generated contextual commentary (historical context, original Greek/Hebrew meaning). |

### B. Collaborative & Connected Features

| # | Feature | Innovation Level | Description |
|---|---------|:---:|---|
| B1 | **Congregation Phone Sync** | 🔥 New category | Congregation members scan a QR code → see the current verse on their phone in real-time, in their preferred translation. |
| B2 | **Live Sermon Notes Feed** | 🔥 New category | A companion web page that shows verses, key points, and notes in real-time — congregation can save, highlight, and export. |
| B3 | **Multi-Device Operator Control** | Enhancement | Any device on the same WiFi can become an operator — phone becomes a remote, tablet becomes stage display. |
| B4 | **Cloud Service Plans** | Enhancement | Save and share service plans online. Import from Planning Center. |
| B5 | **Congregation Interaction** | 🔥 New category | Live polls, prayer request submissions, and "Amen" reactions from congregation phones. |

### C. Worship & Song Features

| # | Feature | Innovation Level | Description |
|---|---------|:---:|---|
| C1 | **Lyric Display Mode** | Table stakes | Display song lyrics with verse/chorus/bridge structure, manual or auto-advance. |
| C2 | **Hymn Database** | Table stakes | Built-in database of public domain hymns (500+ hymns, no CCLI needed). |
| C3 | **Chord Chart Overlay** | Enhancement | Show chord charts on the stage display for musicians. |
| C4 | **AI Lyric-to-Verse Matcher** | 🔥 New category | When worship lyrics reference a Bible verse, auto-detect and offer to display the actual verse. |
| C5 | **Worship Set Builder** | Table stakes | Drag-and-drop song order for the worship set. |

### D. Visual & Display Features

| # | Feature | Innovation Level | Description |
|---|---------|:---:|---|
| D1 | **Dynamic Backgrounds** | Table stakes | Animated/video backgrounds behind verse text. CSS/WebGL-powered. |
| D2 | **Multi-Screen Output** | Table stakes | Operator view + audience projection + stage display, all from one browser tab. |
| D3 | **Theme Presets** | Table stakes | Multiple visual themes (dark, light, stained glass, modern, seasonal). |
| D4 | **Responsive Projection** | Enhancement | Auto-detect screen resolution and aspect ratio; adapt layout accordingly. |
| D5 | **Picture-in-Picture Verse** | 🔥 New category | Small persistent verse overlay while other content (video, slides) plays — like sports score tickers. |
| D6 | **Seasonal Auto-Themes** | Enhancement | Auto-switch visual theme based on church calendar (Advent, Lent, Easter, Pentecost, Ordinary Time). |
| D7 | **Custom Lower Thirds** | Enhancement | Configurable lower-third overlays for announcements, speaker names, etc. |

### E. Service Management Features

| # | Feature | Innovation Level | Description |
|---|---------|:---:|---|
| E1 | **Service Schedule Builder** | Table stakes | Create an ordered list of service elements (call to worship → hymn → reading → sermon → etc.). |
| E2 | **Countdown Timer** | Table stakes | Pre-service countdown with customisable appearance. |
| E3 | **Nursery/Alert System** | Enhancement | Send overlay alerts (nursery paging, emergency messages) from any connected device. |
| E4 | **Service Recording & Replay** | Enhancement | Record the entire service (all displayed content + timestamps) for replay or archive. |
| E5 | **Service Analytics** | 🔥 New category | Track which verses are most referenced, average sermon length, song frequency — over time. |

### F. Technical & Platform Features

| # | Feature | Innovation Level | Description |
|---|---------|:---:|---|
| F1 | **Progressive Web App (PWA)** | Enhancement | Install VerseAir like a native app on any device. Works offline. |
| F2 | **Electron Desktop App** | Enhancement | Standalone app with better multi-screen, mic permissions, and offline support. |
| F3 | **WebRTC Screen Sharing** | 🔥 New category | Share the verse display to remote screens over the internet — for overflow rooms, online members. |
| F4 | **NDI Output via Electron** | Enhancement | Send output as NDI source for integration with OBS, vMix, broadcast workflows. |
| F5 | **Import from Competitors** | Enhancement | Import song databases from OpenLP, EasyWorship, MediaShout, ProPresenter formats. |
| F6 | **Offline Bible Database** | Enhancement | Bundle complete Bible translations locally (not just 222 popular verses). |
| F7 | **Plugin/Extension System** | Enhancement | Allow community plugins (similar to OpenLP 3.1's addon system). |

---

## PART 3: FEATURE PRIORITISATION — Impact vs. Effort Matrix

### Tier 1: HIGH IMPACT, LOW-MEDIUM EFFORT (Build First)
*These leverage VerseAir's existing strengths or fill critical gaps with minimal architecture changes.*

| Priority | Feature | Code | Effort | Why First |
|:---:|---|:---:|:---:|---|
| 1 | Congregation Phone Sync (QR code) | B1 | Medium | Massive differentiator. No competitor does this. Uses existing web tech. |
| 2 | Theme Presets | D3 | Low | Quick win. CSS-only. Makes the app look professional. |
| 3 | Countdown Timer | E2 | Low | Expected by every church. Simple JS timer. |
| 4 | AI Cross-Reference Suggestions | A3 | Medium | Leverages existing Claude API integration. Huge value add. |
| 5 | Dynamic Backgrounds | D1 | Low-Med | CSS animations/WebGL. No external dependencies. |
| 6 | PWA Support | F1 | Low | Add a manifest.json + service worker. Massive distribution boost. |
| 7 | AI Verse Prediction | A1 | Medium | Uses existing speech transcript + Claude API. Category-defining. |
| 8 | Lower Thirds / Alerts | D7/E3 | Low | Simple overlay div with animation. |

### Tier 2: HIGH IMPACT, MEDIUM-HIGH EFFORT (Build Second)
*These require new subsystems but are core to competing with established players.*

| Priority | Feature | Code | Effort | Why Second |
|:---:|---|:---:|:---:|---|
| 9 | Service Schedule Builder | E1 | Medium | Core UX for operators. Drag-and-drop list. |
| 10 | Song/Lyrics Display | C1 | Medium | Must-have for worship. New content type + editor. |
| 11 | Hymn Database | C2 | Medium | Bundle public domain hymns. Data curation needed. |
| 12 | Multi-Screen Output | D2 | High | Window.open() + BroadcastChannel API. Architecture shift. |
| 13 | Mobile Remote Control | B3 | Medium | WebSocket server. Any phone becomes a remote. |
| 14 | Offline Bible Database | F6 | Medium | Bundle full KJV/WEB/ASV (public domain) as IndexedDB. |
| 15 | Live Sermon Notes Feed | B2 | Medium | Companion page + WebSocket sync. |
| 16 | Electron Desktop App | F2 | High | Already planned (see existing design doc). Better offline + multi-screen. |

### Tier 3: MEDIUM IMPACT, VARIABLE EFFORT (Build Third)
*Nice-to-haves that round out the product.*

| Priority | Feature | Code | Effort | Why Third |
|:---:|---|:---:|:---:|---|
| 17 | AI Sermon Outline Generator | A2 | Medium | Pre-service prep tool. |
| 18 | AI Translation Comparison | A5 | Low | Side-by-side display of existing verse data. |
| 19 | Service Analytics | E5 | Medium | Requires persistent storage + dashboard UI. |
| 20 | Seasonal Auto-Themes | D6 | Low | Date-based CSS class switching. |
| 21 | AI Commentary Snippets | A7 | Medium | Claude API call with verse context. |
| 22 | Chord Chart Overlay | C3 | Medium | New data model for chord notation. |
| 23 | Congregation Interaction | B5 | High | Real-time WebSocket + UI for polls/reactions. |
| 24 | Service Recording & Replay | E4 | High | State serialisation + playback engine. |
| 25 | Import from Competitors | F5 | High | Multiple parsers for proprietary formats. |

---

## PART 4: IMPLEMENTATION CHUNKS — Phased Delivery Plan

### Phase 1: "Polish & Quick Wins" (Weeks 1-2)
*Goal: Make VerseAir look and feel professional. Zero architecture changes.*

#### Chunk 1.1: Theme System
- [ ] Define 6 theme presets as CSS variable sets:
  - **Classic Dark** (current gold/dark — default)
  - **Modern Light** (white bg, navy text, clean sans-serif)
  - **Stained Glass** (deep purples, warm amber, ornate feel)
  - **Minimal** (pure black bg, white text, no decorations)
  - **Nature** (forest greens, earth tones)
  - **Royal** (deep blue, silver accents)
- [ ] Add theme selector dropdown in settings panel
- [ ] Store selected theme in localStorage
- [ ] Apply theme via `:root` CSS variable override
- **Estimated lines of code:** ~150 CSS + ~30 JS

#### Chunk 1.2: Countdown Timer
- [ ] Add countdown timer component (pre-service, between elements)
- [ ] Timer modes: count down to time, count down from duration
- [ ] Visual styles: full-screen overlay, lower-third bar, minimal corner
- [ ] Start/pause/reset controls
- [ ] Optional audio chime on completion
- **Estimated lines of code:** ~100 CSS + ~80 JS

#### Chunk 1.3: Dynamic Backgrounds
- [ ] CSS-only animated backgrounds (particle drift, gradient flow, subtle cross patterns)
- [ ] WebGL canvas option for more complex animations (starfield, water ripple)
- [ ] Background selector in theme settings
- [ ] Performance toggle (disable animations on low-end devices)
- **Estimated lines of code:** ~200 CSS + ~150 JS

#### Chunk 1.4: Lower Thirds & Alerts
- [ ] Configurable lower-third overlay (speaker name, announcement text)
- [ ] Slide-in/slide-out animation
- [ ] Alert system: nursery paging, emergency messages
- [ ] Persistent until dismissed or timed auto-dismiss
- **Estimated lines of code:** ~80 CSS + ~60 JS

---

### Phase 2: "AI Superpowers" (Weeks 3-4)
*Goal: Leverage the existing Claude API integration to add features no competitor has.*

#### Chunk 2.1: AI Cross-Reference Engine
- [ ] When a verse is displayed, call Claude API with: "Given [verse], return 3-5 most relevant cross-references with brief explanations"
- [ ] Cache cross-references in IndexedDB (verse → cross-refs mapping)
- [ ] Display cross-references in a collapsible sidebar on the operator view
- [ ] One-click to push any cross-reference to the main display
- [ ] Rate-limit API calls (max 1 per verse, use cache thereafter)
- **Estimated lines of code:** ~120 JS + ~60 CSS

#### Chunk 2.2: AI Verse Prediction
- [ ] After every 3 detected verses, send the transcript + verse history to Claude
- [ ] Prompt: "Based on this sermon transcript and verses referenced so far, predict the next 2-3 verses the preacher is likely to reference"
- [ ] Pre-fetch predicted verses into cache
- [ ] Show predictions as subtle chips in the operator panel ("Likely next: Romans 8:28")
- [ ] Track prediction accuracy for model improvement prompts
- [ ] Debounce: only predict after 30s of new transcript content
- **Estimated lines of code:** ~100 JS + ~40 CSS

#### Chunk 2.3: AI Translation Comparison
- [ ] Button on displayed verse: "Compare Translations"
- [ ] Fetch same verse in 3 translations (KJV, NIV, ESV or user-selected)
- [ ] Side-by-side panel with AI-highlighted key differences
- [ ] Operator can push any single translation to the main display
- **Estimated lines of code:** ~80 JS + ~50 CSS

#### Chunk 2.4: AI Sermon Outline Pre-Loader
- [ ] Pre-service modal: paste sermon notes or outline
- [ ] Claude extracts all referenced verses, sermon structure, and themes
- [ ] Auto-populates a "service plan" with verses in order
- [ ] Pre-caches all expected verses
- [ ] Operator can follow the plan or let auto-detection override
- **Estimated lines of code:** ~150 JS + ~60 CSS

---

### Phase 3: "Congregation Connection" (Weeks 5-6)
*Goal: Make VerseAir the first church presentation tool that connects the congregation's phones.*

#### Chunk 3.1: QR Code Congregation Sync
- [ ] Generate a unique session URL (e.g., `verseair.app/live/[session-id]`)
- [ ] Display QR code on screen during pre-service countdown
- [ ] Congregation scans → opens a read-only companion page
- [ ] Companion page shows: current verse (text + reference), translation selector
- [ ] Use WebSocket or Server-Sent Events for real-time sync
- [ ] **Requires a lightweight server** (or use Supabase Realtime / Firebase)
- **Architecture decision:** For the single-file app, this could use a free WebSocket relay service or Supabase Realtime channel
- **Estimated lines of code:** ~200 JS (host) + ~150 JS (client page) + ~80 CSS

#### Chunk 3.2: Live Sermon Notes Feed
- [ ] Extend companion page with: verse history, AI-generated key points, timestamp
- [ ] Congregation can: bookmark verses, highlight text, export notes as PDF
- [ ] Uses same WebSocket channel as QR sync
- [ ] Privacy: no personal data collected, no sign-up required
- **Estimated lines of code:** ~180 JS + ~100 CSS

#### Chunk 3.3: AI Congregation Notes (Fill-in-the-Blank)
- [ ] Before service: operator uploads sermon outline
- [ ] AI generates fill-in-the-blank notes (key words removed)
- [ ] Congregation sees blanks on their phones
- [ ] As preacher speaks those words, blanks auto-fill (via speech detection)
- [ ] Export completed notes at end of service
- **Estimated lines of code:** ~200 JS + ~80 CSS

---

### Phase 4: "Worship & Songs" (Weeks 7-8)
*Goal: Add song/lyric capabilities to compete with the core value prop of all competitors.*

#### Chunk 4.1: Song/Lyric Data Model
- [ ] Define song schema: `{ title, author, ccli, sections: [{ type: verse|chorus|bridge|tag, lyrics, order }] }`
- [ ] IndexedDB storage for song library
- [ ] Import: plain text with section markers, OpenLP XML, OpenLyrics format
- [ ] Song search by title, lyrics, author
- **Estimated lines of code:** ~200 JS

#### Chunk 4.2: Lyric Display Engine
- [ ] New display mode: lyrics (separate from verse display pipeline — **DO NOT touch renderVerseContent**)
- [ ] Section-by-section display with animated transitions
- [ ] Manual advance (click/keyboard) or timed auto-advance
- [ ] Verse/chorus/bridge colour coding for operator
- [ ] Font size auto-scaling to fill display area
- **Estimated lines of code:** ~250 JS + ~100 CSS

#### Chunk 4.3: Public Domain Hymn Database
- [ ] Bundle 500+ public domain hymns (pre-1927, no CCLI needed)
- [ ] Sources: Hymnary.org data, Project Gutenberg hymn collections
- [ ] Include: "Amazing Grace", "How Great Thou Art", "Holy Holy Holy", etc.
- [ ] Searchable by title, first line, tune name, scripture reference
- **Estimated lines of code:** ~100 JS + ~large JSON data file

#### Chunk 4.4: Worship Set Builder
- [ ] Drag-and-drop list of songs for the worship set
- [ ] Reorder, add, remove songs
- [ ] Preview lyrics before going live
- [ ] Save/load worship sets
- **Estimated lines of code:** ~150 JS + ~80 CSS

---

### Phase 5: "Multi-Screen & Remote" (Weeks 9-10)
*Goal: Enable professional multi-output and remote control.*

#### Chunk 5.1: Multi-Screen Architecture
- [ ] **Operator Screen** (current window): controls, transcript, detection log
- [ ] **Audience Screen**: `window.open()` a clean display-only window
- [ ] **Stage Display**: `window.open()` a confidence monitor (current verse + next verse + clock)
- [ ] Communication via `BroadcastChannel` API (same-origin, zero server needed)
- [ ] Each screen independently fullscreenable
- [ ] Screen layout selector in settings
- **Estimated lines of code:** ~300 JS + ~150 CSS

#### Chunk 5.2: Stage Display
- [ ] High-contrast text on black background
- [ ] Shows: current verse text, next verse preview, verse reference, clock
- [ ] Large, readable font optimised for stage distance
- [ ] Configurable: show/hide elements, font size, clock format
- **Estimated lines of code:** ~100 JS + ~80 CSS

#### Chunk 5.3: Mobile Remote Control
- [ ] Lightweight web page served via local network (or shared URL)
- [ ] Controls: next/prev slide, go live, select from service plan
- [ ] Display: current slide preview, next slide preview
- [ ] WebSocket or BroadcastChannel communication
- [ ] QR code to connect (display IP:port)
- **Estimated lines of code:** ~200 JS + ~100 CSS

---

### Phase 6: "Service Management" (Weeks 11-12)
*Goal: Full service planning and management.*

#### Chunk 6.1: Service Schedule Builder
- [ ] Drag-and-drop service element list
- [ ] Element types: Bible reading, song, sermon, announcement, video, countdown, custom slide
- [ ] Each element links to its content (verse reference, song from library, etc.)
- [ ] One-click "Go Live" per element
- [ ] Save/load service plans (IndexedDB + JSON export)
- **Estimated lines of code:** ~300 JS + ~120 CSS

#### Chunk 6.2: Announcement Slides
- [ ] Simple slide creator: text + optional image/background
- [ ] Auto-rotate announcement loop (configurable timing)
- [ ] Useful for pre-service display
- **Estimated lines of code:** ~120 JS + ~60 CSS

#### Chunk 6.3: Service Analytics Dashboard
- [ ] Track per-service: verses displayed, songs sung, sermon duration
- [ ] Track over time: most-referenced books, average service length, verse frequency
- [ ] Simple chart display (Chart.js or vanilla SVG)
- [ ] Export data as CSV
- **Estimated lines of code:** ~250 JS + ~100 CSS

---

### Phase 7: "Platform & Distribution" (Weeks 13-16)
*Goal: Make VerseAir installable, distributable, and production-ready.*

#### Chunk 7.1: Progressive Web App (PWA)
- [ ] Add `manifest.json` with app metadata, icons, theme colours
- [ ] Add service worker for offline caching of app shell
- [ ] "Add to Home Screen" prompt on mobile
- [ ] Offline-first: entire app works without network
- **Estimated lines of code:** ~80 JS (service worker) + manifest.json

#### Chunk 7.2: Electron Desktop App
- [ ] Wrap VerseAir in Electron for native desktop experience
- [ ] Benefits: persistent mic permissions, native multi-screen, system tray, auto-update
- [ ] Already have a design doc (see `2026-03-18-electron-desktop-app-design.md`)
- [ ] Installers for Windows, macOS, Linux
- **Estimated effort:** Separate project structure

#### Chunk 7.3: Offline Bible Bundles
- [ ] Bundle complete public domain translations: KJV, WEB, ASV, BBE, YLT
- [ ] Compressed JSON or SQLite database
- [ ] Lazy-load: download translation bundle on first use, cache permanently
- [ ] Eliminates network dependency for covered translations
- **Estimated data size:** ~5-10 MB per translation (compressed)

#### Chunk 7.4: Landing Page & Distribution Site
- [ ] Simple landing page explaining VerseAir
- [ ] Download links (Electron) + "Use in Browser" link
- [ ] Feature comparison with competitors
- [ ] Demo video / screenshots
- **Estimated effort:** Separate web project

---

## PART 5: ARCHITECTURE PRINCIPLES FOR IMPLEMENTATION

### Critical Rules (Learned from Previous Failures)

1. **NEVER touch `renderVerseContent()`** — all new display modes (lyrics, slides, media) must use separate render functions and separate DOM containers
2. **NEVER add blocking scripts in `<head>`** — all new dependencies loaded async or deferred
3. **NEVER auto-fire permission dialogs on startup** — all permissions requested on user action only
4. **NEVER patch functions via `window.fn = newFn`** — V8 doesn't reliably intercept bare function calls this way
5. **Keep the verse display pipeline sacred** — speech → detect → fetch → display must remain untouched

### New Content Type Architecture

```
┌─────────────────────────────────────────┐
│              VerseAir App               │
├────────────┬────────────┬───────────────┤
│  Verse     │  Lyrics    │  Slides       │
│  Engine    │  Engine    │  Engine       │
│  (existing)│  (new)     │  (new)        │
├────────────┴────────────┴───────────────┤
│          Display Router                  │
│  (routes content to correct renderer)    │
├────────────┬────────────┬───────────────┤
│ Verse Panel│ Lyric Panel│ Slide Panel   │
│ (existing) │ (new DOM)  │ (new DOM)     │
└────────────┴────────────┴───────────────┘
```

Each engine:
- Has its own DOM container (hidden when inactive)
- Has its own render function (never shares with verse engine)
- Has its own state object (never interferes with `rangeState` or `currentRef`)
- Communicates to multi-screen outputs via `BroadcastChannel`

### Communication Architecture (Multi-Screen + Remote)

```
┌──────────────┐    BroadcastChannel    ┌──────────────┐
│   Operator   │◄──────────────────────►│   Audience   │
│   Window     │                        │   Window     │
│  (main tab)  │◄──────────────────────►│  (popup)     │
│              │                        └──────────────┘
│              │    BroadcastChannel    ┌──────────────┐
│              │◄──────────────────────►│    Stage     │
│              │                        │   Display    │
│              │                        │  (popup)     │
└──────┬───────┘                        └──────────────┘
       │
       │ WebSocket (local network)
       │
┌──────┴───────┐
│   Mobile     │
│   Remote     │
│  (phone)     │
└──────────────┘
```

---

## PART 6: COMPETITIVE POSITIONING SUMMARY

### VerseAir's Unique Value Proposition

> **"The only church presentation tool that listens."**

While ProPresenter, EasyWorship, MediaShout, and OpenLP are all **manual-first** tools (an operator must click to display each verse), VerseAir is **AI-first**:

- It **listens** to the preacher and **automatically displays** the right verse
- It **predicts** what verse comes next
- It **summarises** the sermon using AI
- It **connects** the congregation's phones to the live display
- It **runs in a browser** — no install, no license, no account
- It's **free**

### Target Market Position

| Segment | Current Leader | VerseAir Advantage |
|---|---|---|
| Small churches (<100 people) | OpenLP (free) | AI features, zero learning curve, phone sync |
| Medium churches (100-500) | EasyWorship | Free, AI-powered, browser-based, no Windows lock-in |
| Tech-forward churches | ProPresenter | AI sermon tools, congregation phone sync, open platform |
| International/multilingual | ProPresenter | Browser-based = works on any device in any country |
| Home churches / Bible studies | None | Perfect fit — just open the file and start |

---

*End of document. Total features identified: 25 prioritised implementation items across 7 phases.*
