# Skills Demonstrated — VerseAir Project

A record of technical skills applied during the development of VerseAir,
a real-time speech-driven Bible verse projector for live church services.

---

## JavaScript (Advanced)

- **Single-file SPA architecture** — built a ~3,700-line production app in vanilla HTML/CSS/JS with no framework, no bundler, no build step
- **Async programming** — `async/await`, `Promise.race`, `Promise.any` for parallel API racing; non-blocking IndexedDB reads/writes
- **State machine design** — `rangeState` object managing auto-advance, voice-guided, and manual playback states
- **Closures and debouncing** — custom 1000ms debounce on speech events; closure-captured snapshot detection to avoid stale results
- **Regular expressions** — multi-pattern regex pipeline for natural language Bible reference detection; priority-ordered fallback passes
- **DOM manipulation** — dynamic per-word `<span>` injection for real-time word-highlighting; `innerHTML` management without XSS
- **Event-driven UI** — `SpeechRecognition.onresult`, `onend`, `onerror` event handling with keep-alive restart logic

---

## Web APIs

- **Web Speech API** (`SpeechRecognition` / `webkitSpeechRecognition`) — continuous real-time speech-to-text with interim and final result handling; cross-browser prefix detection
- **IndexedDB** — async persistent cache for Bible verses; survives page reloads and offline scenarios
- **Fetch API** — parallel requests to 3 Bible APIs simultaneously; first-response wins pattern
- **Fullscreen API** — `requestFullscreen` / `exitFullscreen` with cross-browser fallbacks
- **localStorage** — persisting user settings (API key, translation preference, mic permission)
- **CSS Animations** — entrance animations, countdown bar, word-progress bar, range dots — triggered programmatically from JS

---

## NLP & Speech Processing

- **Speech normalisation pipeline** — raw transcript → preamble stripping → separator normalisation → number-word-to-digit conversion → pattern matching
- **Multi-pattern reference detection** — 6 regex patterns in priority order: `Book ch:vs` (colon), `Book ch.vs` (period), `Book ch,vs` (comma), `Book chapter N verse N` (keywords), `Book N N` (bare space), inverted ordinal forms
- **Spoken number conversion** — `wordsToDigits()` maps number words ("three sixteen", "one hundred and nineteen") to digits; handles compound forms, ordinals, hyphenated forms
- **Garbled speech sanitisation** — `sanitiseSpeech()` corrects common speech-API errors and stuttered/repeated utterances before retry
- **False-positive reduction** — two-tier book classification (ambiguous vs unambiguous); final-only transcript detection; 1000ms debounce; 600-char rolling window; mandatory trigger phrases for loose patterns
- **Context-aware detection** — chapter-only reference defaulting to verse 1; relative verse resolution ("go to verse eleven") using currently displayed reference as context
- **Multi-accent handling** — tested against Nigerian English speech patterns; accent-specific false-positive suppression for common names (John, Mark, Luke, Daniel, Amos, etc.)

---

## API Integration & Data Fetching

- **Multi-API fallback chain** — bible-api.com (primary), api.esv.org, getbible.net (fallbacks); errors handled gracefully with user toast
- **Parallel request racing** — fires all 3 API endpoints simultaneously; first successful response wins; losers aborted
- **Anthropic Claude API** — direct `fetch` to `api.anthropic.com/v1/messages`; structured prompt engineering for sermon summary generation (theme, key points, scripture highlights, takeaways); `claude-sonnet-4-6` model
- **API key management** — secure storage in `localStorage`; never logged or transmitted to third parties; revocable in UI

---

## Performance Engineering

- **4-tier caching strategy** — memory Map (instant) → IndexedDB (persistent) → hardcoded local KJV database (222 verses, zero network) → live API fetch
- **Intelligent prefetching** — on verse display, silently prefetch ±2 surrounding verses; primes cache for likely next references
- **Request deduplication** — in-flight Set prevents duplicate API calls for the same reference
- **Speech processing efficiency** — Bible bounds validation (`isValidBibleRef`) rejects impossible references before any network call is made

---

## UI / UX Design

- **Ecclesiastical aesthetic** — dark theme, gold (#c9a84c) accents, Cinzel + EB Garamond typography; designed for large-screen church projection
- **Real-time visual feedback** — per-word span highlighting during congregation voice reading; word-progress bar; range countdown bar; verse number badge
- **Voice-guided reading mode** — listens for congregation reading a verse aloud; detects last 3–4 words spoken; auto-advances with 1.5s cooldown; marks "Complete ✓" after final verse
- **AI Sermon Summary overlay** — full-screen modal with copy/print/download; pre-flight title + preacher name input; structured output formatting
- **Offline/online status indicator** — animated badge; automatic fallback to cached content

---

## Software Architecture

- **Offline-first design** — app fully functional with zero network using hardcoded KJV tier + IndexedDB cache
- **Fail-open validation** — Bible bounds checking allows unknown canonical book names through to the API rather than silently blocking them
- **Scripted surgical patching** — used Python scripts to apply precise, assertion-verified string replacements to a large HTML file; each step independently verifiable
- **Bible data modelling** — complete Protestant canon (66 books) verse-count database; book name alias resolution covering abbreviations, alternate names (Psalms/Psalm, Song of Songs/Song of Solomon), speech misheard variants (83+ patterns)

---

## Languages & Tools Used

- HTML5, CSS3, JavaScript (ES2020+)
- Python 3 (file patching scripts)
- Web Speech API, IndexedDB, Fetch API, Fullscreen API
- Anthropic Claude API (`claude-sonnet-4-6`)
- Bible APIs: bible-api.com, api.esv.org, getbible.net
- Google Fonts (Cinzel, EB Garamond)
- Claude Code (AI-assisted development)


# Role & Persona
You are a Senior Full-Stack Product Engineer and Architect. Your goal is to help me build "LocalExpert," a high-performance, local service marketplace. You prioritize clean, type-safe code, scalable database design, and exceptional user experience.

# Technical Stack (The "Source of Truth")
- Framework: Next.js 15+ (App Router)
- Language: TypeScript (Strict mode)
- Styling: Tailwind CSS & Shadcn UI
- Backend/Auth/Database: Supabase
- Geolocation: PostGIS (via Supabase) for radius-based search
- Icons: Lucide-React

# Project Principles
1. Two-Sided Logic: Always consider both "Provider" and "Customer" perspectives.
2. Mobile First: The UI must be highly responsive, as most local service searches happen on phones.
3. Security First: Use Supabase RLS (Row Level Security) for all database tables.
4. Performance: Use Next.js Server Components by default; use 'use client' only when necessary for interactivity.

# Implementation Workflow
When I ask to build a feature, follow this 4-step process:
1. Analysis: Briefly explain the logic and any potential edge cases.
2. Database: Provide the SQL necessary to update the Supabase schema.
3. Backend: Write the TypeScript interfaces and Server Actions.
4. Frontend: Create the React components with Tailwind styling.

# Communication Style
Be direct, professional, and slightly witty. Avoid fluff. If I suggest a bad architectural pattern, politely explain why and suggest a better industry standard (e.g., suggesting PostGIS over basic lat/long filtering).