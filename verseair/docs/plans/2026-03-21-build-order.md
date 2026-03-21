# VerseAir Feature Build Order

**Date:** 2026-03-21
**Purpose:** Optimal implementation order for all 25 planned features, sequenced to minimize errors and build proper foundations.

---

## Principles

| Principle | Rationale |
|---|---|
| CSS-only changes first | Can't break logic with CSS |
| Infrastructure before features that need it | Multi-screen before remote control, before congregation sync |
| Read-only features before write features | AI sidebar (reads transcript) before service builder (writes data) |
| New DOM containers before new render engines | Lower thirds before lyrics engine |
| Desktop-complete before cloud-connected | Ship value without server dependency |
| Never touch `renderVerseContent()` or the speech pipeline | Every new content type gets its own engine |

---

## Stage 1: Foundation & Visual Polish (Lowest Risk)
*Pure CSS/UI work — zero chance of breaking the verse pipeline*

| # | Feature | Code | Status |
|---|---|---|---|
| 1 | Theme Presets (6 CSS variable sets + selector) | D3 | BUILDING |
| 2 | Dynamic Backgrounds (CSS/WebGL ambient + bold) | D1 | TODO |
| 3 | Lower Thirds & Alerts (speaker, announcement, emergency) | D7/E3 | TODO |
| 4 | Countdown/Session Timer (operator + projected view) | E2 | TODO |

**Why first:** Additive only — new CSS, new DOM elements, new functions. No existing code paths modified.

---

## Stage 2: Multi-Screen Architecture (Critical Infrastructure)
*Must come before congregation sync, remote control, or lyrics*

| # | Feature | Code | Status |
|---|---|---|---|
| 5 | Multi-Screen Output (window.open + BroadcastChannel) | D2 | TODO |
| 6 | Stage Display (confidence monitor for speaker) | 5.2 | TODO |

**Why second:** Nearly every later feature (remote control, congregation sync, lyrics projection) needs to send content to other screens. Building this early prevents retrofitting.

---

## Stage 3: AI Features (Leverage Existing Claude Integration)
*Uses existing Claude API + speech transcript — minimal new architecture*

| # | Feature | Code | Status |
|---|---|---|---|
| 7 | AI Cross-Reference Suggestions | A3 | TODO |
| 8 | AI Translation Comparison | A5 | TODO |
| 9 | AI Verse Prediction | A1 | TODO |
| 10 | AI Sermon Outline Pre-Loader | A2 | TODO |

**Why third:** Read-only additions to the operator panel. They display info but don't change how verses are detected or rendered. Low blast radius.

---

## Stage 4: Service Management (New Data Layer)
*Introduces persistent data models — careful IndexedDB work*

| # | Feature | Code | Status |
|---|---|---|---|
| 11 | Service Schedule Builder | E1 | TODO |
| 12 | Announcement Slides | 6.2 | TODO |
| 13 | Service Analytics Dashboard | E5 | TODO |

**Why fourth:** Introduces new data models and IndexedDB stores. The schedule builder becomes the natural place to integrate songs (next stage).

---

## Stage 5: Worship & Songs (New Content Engine)
*Biggest architecture risk — new render engine parallel to verse engine*

| # | Feature | Code | Status |
|---|---|---|---|
| 14 | Song/Lyric Data Model | 4.1 | TODO |
| 15 | Lyric Display Engine (separate from renderVerseContent) | 4.2 | TODO |
| 16 | Public Domain Hymn Database (500+ hymns) | C2 | TODO |
| 17 | Worship Set Builder | 4.4 | TODO |

**Why fifth:** Highest-risk feature — adds a second content rendering engine. By this point multi-screen is working, Display Router pattern is proven, foundations are stable.

---

## Stage 6: Congregation Connection (Requires Backend)
*Only stage needing infrastructure outside the Electron app*

| # | Feature | Code | Status |
|---|---|---|---|
| 18 | QR Code Congregation Sync | B1 | TODO |
| 19 | Live Sermon Notes Feed | B2 | TODO |
| 20 | AI Congregation Notes (fill-in-the-blank) | 3.3 | TODO |

**Why sixth:** Requires external infrastructure (server for phone sync). Delaying means a fully-featured desktop app ships first. AI features from stage 3 enrich the sermon notes feed.

---

## Stage 7: Remote Control & Platform (Final Polish)

| # | Feature | Code | Status |
|---|---|---|---|
| 21 | Mobile Remote Control | B3 | TODO |
| 22 | PWA Support (manifest.json + service worker) | F1 | TODO |
| 23 | Offline Bible Bundles (more translations) | 7.3 | TODO |
| 24 | Landing Page & Distribution Site | 7.4 | TODO |
| 25 | Code Signing + Full Auto-Updater | — | TODO |

---

## Already Complete

| Feature | Status |
|---|---|
| Electron Desktop App (F2) | DONE |
| Offline KJV Bible (F6) | DONE |
| Real-time speech-to-verse detection | DONE |
| AI sermon summarisation (Claude Haiku) | DONE |
| Voice-guided congregational reading | DONE |
| Nigerian accent support | DONE |
| Smart search panel | DONE |
| Hot update system | DONE |

---

*Total: 25 features across 7 stages. Update Status column as features are built.*
