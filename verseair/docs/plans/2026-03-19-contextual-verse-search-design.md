# Contextual Bible Verse Search — Design Document

**Date:** 2026-03-19
**Status:** Approved, ready for implementation
**Goal:** Detect Bible quotes and paraphrases in speech without explicit references and display the matching verse

---

## Problem Statement

Currently VerseAir only displays verses when the speaker explicitly says a reference like "John 3:16". But preachers frequently:
1. **Quote directly** without citing — "For God so loved the world..."
2. **Paraphrase** — "when the angel of the Lord appeared unto Mary..."
3. **Reference narratives** — "the story of David and Goliath"

The app should detect all three cases and display the correct verse.

---

## Approach: 3-Tier Contextual Search

Mirrors the existing 4-tier cache philosophy: local/fast first, network fallback.

| Tier | Engine | Handles | Latency | Cost | Offline? |
|---|---|---|---|---|---|
| **1** | Bolls.life text search API | Direct quotes | ~200ms | Free, no key | No |
| **2** | FlexSearch + embedded KJV in IndexedDB | Fuzzy/garbled speech, offline | <50ms | Free | Yes |
| **3** | Claude Haiku + prompt caching | Paraphrases & narratives | ~500-600ms | ~$0.005/sermon | No |

---

## Detection: When to Trigger Contextual Search

Contextual search triggers when ALL of these are true:
- `extractRef()` returned null (no explicit reference detected)
- Speech is a **final** result (not interim)
- Transcript snippet is **≥8 words**
- **10-second cooldown** since last contextual search has elapsed
- **1.5-second debounce** since last speech — waits for speaker to pause before searching

The biblical keyword pre-filter was intentionally dropped — too many valid quotes contain only common words ("The truth shall set you free"). The guards above are sufficient.

---

## Search Engine: Data Flow

```
Speech final result
  │
  ├─ extractRef() → found? → existing pipeline (unchanged)
  │
  └─ extractRef() → null?
       │
       ├─ Guards: ≥8 words? cooldown (10s) clear?
       │    └─ Fail → skip
       │
       └─ Start 1.5s debounce timer
            │
            └─ Timer fires (speaker paused)
                 │
                 ├─ Check contextual result cache → hit? → show result → done
                 │
                 └─ Cache miss → fire Tier 1 + Tier 2 in parallel
                      │
                      ├─ Merge & deduplicate results
                      ├─ Apply context boost (same book/chapter as recent verses)
                      ├─ Score with consecutive-word-weighted confidence
                      ├─ Cache the results
                      │
                      ├─ Top result ≥85% → auto-display + picker with alternatives
                      ├─ Top result 70-84% → show picker + fire Tier 3 in background
                      │    └─ Tier 3 returns? → merge into picker, re-sort
                      ├─ Top result 50-69% → fire Tier 3, wait for response, then show picker
                      └─ All <50% and no Tier 3 available → discard, log to debug
```

---

## Confidence Scoring

### Consecutive-Word-Weighted Matching

Simple word-overlap is too naive — common words like "for", "so", "the" cause false positives. Instead:

1. Strip stopwords from both spoken snippet and verse text
2. Count matching cleaned words
3. **Weight consecutive matches higher** — a run of 3+ consecutive words in the same order is a strong signal of a direct quote

**Example:**
```
Spoken:  "For God so loved the world"
Cleaned: ["god", "loved", "world"]

Verse A: "For God so loved the world that he gave..."
Cleaned: ["god", "loved", "world", "gave"]
Match:   3/3 words + 3 consecutive → 95% confidence

Verse B: "The world was made by God and loved by him"
Cleaned: ["world", "made", "god", "loved"]
Match:   3/3 words but 0 consecutive → 60% confidence
```

### Context Boost

Biases results toward the book/chapter the preacher has been in during this session:
- Result is from the **same book** as last 3 displayed verses → **+10% confidence**
- Result is from the **same chapter** → **+15% confidence**

Uses the existing `sessionVerses[]` array (already tracked).

### Result Caching

Contextual search results are cached in the existing `memCache` Map, keyed by the cleaned/normalized snippet. Cache persists for the entire session (cleared on reload).

---

## UI: Operator-Facing Presentation

### High Confidence (≥85%) — Auto-Display

Verse displays on the right panel via `displayVerse()` (existing pipeline, unchanged). A subtle "context match" label appears below the verse so the operator knows it wasn't an explicit reference.

The multi-match picker also appears in the left panel with alternatives, in case the auto-displayed verse is wrong.

### Multi-Match Picker (50-84%, or alternatives for auto-displayed)

Appears in the left panel below the existing `.chip` element:

```
┌──────────────────────────────────────┐
│ 💬 Possible matches:                 │
│                                      │
│  ▸ John 3:16 ·············· 87%  [▶] │
│    "For God so loved the world..."   │
│                                      │
│  ▸ 1 John 4:9 ············· 71%  [▶] │
│    "In this was manifested the..."   │
│                                      │
│  ▸ Romans 5:8 ············· 63%  [▶] │
│    "But God commendeth his love..."  │
│                                      │
│                          [Dismiss]   │
└──────────────────────────────────────┘
```

**Behaviour:**
- Each row: reference, confidence %, truncated preview (~8 words), one-click `[▶]` button
- `[▶]` tap → calls `displayVerse()` with that reference, picker dismisses
- Max **4 results** shown, sorted by confidence descending
- Auto-dismisses after **20 seconds** if no action
- New contextual search replaces the current picker
- Only one picker visible at a time
- Styled with existing dark theme, gold accents, Cinzel headers

### Low Confidence (<50%) — Silent Discard

Nothing shown to operator. Logged to detection debug box:
```
💬 Context search: "and then he said to them" → no match
```

### Detection Log Integration

All contextual search activity logged:
```
💬 Context search: "For God so loved the world" → John 3:16 [92%] ✓ auto
💬 Context search: "the angel appeared unto Mary" → Luke 1:26 [67%] ? suggested
💬 Context search: "and then he said to them" → no match
```

---

## Error Handling

| Error | Response |
|---|---|
| Bolls.life fails | Tier 2 still resolves independently (parallel). Use Tier 2 results only |
| FlexSearch index not ready | Tier 1 still resolves independently. If Tier 1 also weak, fire Tier 3 |
| Both Tier 1 + 2 fail | Fire Tier 3 if API key exists. Otherwise log "context search unavailable" |
| Claude fails | Show whatever Tiers 1-2 found (even low confidence) in picker rather than discarding |
| All 3 tiers return nothing | Log to debug. No UI |
| Offline | Tier 2 only (FlexSearch). No Tier 1 or 3. If index not built → "context search unavailable offline" |

---

## Integration: What Gets Modified

### Untouched (zero changes)
- `renderVerseContent()` — never touched
- `displayVerse()` — called as-is with a reference
- `fetchVerse()` — unchanged
- `extractRef()` — unchanged, still runs first
- Range state machine, voice-guided reading, translation switching — unchanged
- All existing CSS for the verse panel — unchanged

### New Code (additive, not patches)

| Component | Purpose |
|---|---|
| `contextualSearch(snippet)` | Orchestrates the 3-tier search |
| `searchBolls(snippet, trans)` | Tier 1: Bolls.life search endpoint |
| `searchLocal(snippet)` | Tier 2: FlexSearch index query |
| `searchClaude(snippet, context)` | Tier 3: Claude Haiku API call |
| `scoreConfidence(spoken, verseText)` | Consecutive-word-weighted scoring |
| `applyContextBoost(results)` | Biases toward recent book/chapter |
| `showContextPicker(results)` | Renders multi-match picker UI |
| `initSearchIndex()` | Downloads KJV JSON → IndexedDB → FlexSearch index |
| Picker HTML | New `<div>` after existing `.chip` element |
| Picker CSS | New block appended to `<style>` |

### Minimal Modifications to Existing Code (4 lines total)

**1. Speech `onresult` handler** — add 3 lines after existing `extractRef()` logic:
```javascript
if (!detectedRef && finalTranscript.split(' ').length >= 8) {
  debounceContextSearch(finalTranscript);
}
```

**2. `startup()` IIFE** — add 1 line:
```javascript
initSearchIndex();
```

---

## KJV Database Lifecycle

```
First app load (online)
  → Fetch KJV JSON from CDN (~4-5MB)
  → Store in IndexedDB (key: "kjv-search-db")
  → Build FlexSearch index in memory

Subsequent loads
  → Check IndexedDB for "kjv-search-db"
  → Found → build FlexSearch index from cache (~1-2 seconds)
  → Not found → re-fetch from CDN
```

---

## External Dependencies (added)

| Dependency | Size | Source | Purpose |
|---|---|---|---|
| FlexSearch | ~6KB gzipped | CDN (jsdelivr) | Client-side fuzzy Bible search |
| KJV Bible JSON | ~4-5MB (one-time download) | GitHub CDN | Full Bible text for local search |

---

## Claude Haiku Prompt (Tier 3)

```
You are a Bible verse identifier. Given a speech transcript snippet, identify which Bible verse(s) are being quoted or referenced. Consider direct quotes, paraphrases, and narrative references.

Return JSON only, no explanation:
{"results":[{"ref":"John 3:16","confidence":92,"preview":"For God so loved the world..."}]}

If no Bible verse is being referenced, return: {"results":[]}

Speech: "{snippet}"
Last verses shown this session: [{sessionVerses}]
Translation: {currentTranslation}
```

Uses prompt caching — system prompt cached for 5 minutes during sermon. Repeated calls pay only 10% of input token cost.

---

## Cost Summary

| Component | Cost |
|---|---|
| Bolls.life API | Free |
| FlexSearch library | Free |
| KJV JSON database | Free |
| Claude Haiku (per sermon, ~90 potential checks) | ~$0.005 |
| Claude Haiku (per year, 52 sermons) | ~$0.26 |

---

## Future Enhancements (not in scope for v1)

- Support contextual search across multiple translations (currently KJV-only for local search)
- Operator "pin" feature — save frequently quoted verses for instant access
- Learning mode — track which contextual matches the operator confirms/dismisses to improve future confidence scoring

---

*This document was approved during a brainstorming session on 2026-03-19. Proceed with writing-plans skill for implementation planning.*
