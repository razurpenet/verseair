# Contextual Bible Verse Search — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Detect Bible quotes and paraphrases in speech (without explicit references) and display the matching verse using a 3-tier search engine.

**Architecture:** When `extractRef()` returns null, a new `contextualSearch()` function fires Bolls.life text search + FlexSearch local index in parallel. If results are weak, Claude Haiku is used as a fallback for paraphrases. Results are scored with consecutive-word-weighted confidence and shown via auto-display (≥85%) or a multi-match picker (50-84%).

**Tech Stack:** Vanilla JS (no framework), FlexSearch (CDN, ~6KB), KJV Bible JSON (~4-5MB, cached in IndexedDB), Anthropic Claude Haiku API (existing integration), Bolls.life search API (free, no key).

**File:** `bible-verse-projector (20).html` (single-file app, ~3,790 lines)

---

## Task 1: Add Context Picker CSS

**Files:**
- Modify: `bible-verse-projector (20).html:416-418` (before `</style>`)

**Step 1: Add CSS for the context picker panel**

Insert before the `</style>` closing tag at line 418:

```css
/* ── CONTEXT SEARCH PICKER ── */
.ctx-picker{
  display:none;flex-direction:column;gap:6px;
  background:var(--bg);border:1px solid var(--border);border-radius:var(--radius);
  padding:12px;animation:ctxFadeIn 0.25s ease-out;
}
.ctx-picker.on{display:flex}
@keyframes ctxFadeIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
.ctx-picker-hdr{
  font-family:'Cinzel',serif;font-size:0.6rem;letter-spacing:0.18em;
  color:var(--muted);text-transform:uppercase;margin-bottom:4px;
  display:flex;align-items:center;gap:6px;
}
.ctx-row{
  display:flex;align-items:center;gap:8px;
  background:var(--panel);border:1px solid var(--border);border-radius:7px;
  padding:8px 10px;cursor:pointer;transition:all 0.18s;
}
.ctx-row:hover{border-color:var(--gold);background:var(--gold-dim)}
.ctx-row-ref{
  font-family:'Cinzel',serif;font-size:0.72rem;letter-spacing:0.06em;
  color:var(--gold);min-width:100px;
}
.ctx-row-preview{
  flex:1;font-size:0.76rem;color:var(--muted);
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
}
.ctx-row-conf{
  font-family:'Cinzel',serif;font-size:0.64rem;letter-spacing:0.04em;
  color:var(--muted);min-width:32px;text-align:right;
}
.ctx-row-play{
  background:var(--gold);color:#0b0c0f;border:none;border-radius:5px;
  width:26px;height:26px;font-size:0.7rem;cursor:pointer;
  display:flex;align-items:center;justify-content:center;
  transition:all 0.18s;flex-shrink:0;
}
.ctx-row-play:hover{background:var(--gold-light);transform:scale(1.08)}
.ctx-dismiss{
  background:transparent;color:var(--muted);border:1px solid var(--border);
  border-radius:6px;padding:4px 12px;font-family:'Cinzel',serif;
  font-size:0.6rem;letter-spacing:0.06em;cursor:pointer;
  align-self:flex-end;margin-top:2px;transition:all 0.18s;
}
.ctx-dismiss:hover{border-color:var(--red);color:var(--red)}
.ctx-match-label{
  font-family:'Cinzel',serif;font-size:0.52rem;letter-spacing:0.14em;
  color:var(--muted);text-transform:uppercase;opacity:0.7;
  margin-top:4px;
}
```

**Step 2: Verify CSS compiles** — open the file in browser, confirm no styling regressions.

**Step 3: Commit**

```bash
git add "bible-verse-projector (20).html"
git commit -m "style: add CSS for contextual search picker"
```

---

## Task 2: Add Context Picker HTML

**Files:**
- Modify: `bible-verse-projector (20).html:484` (after the `.chip` div)

**Step 1: Add picker HTML**

Insert immediately after line 484 (`<div class="chip" id="chip">...</div>`):

```html
<!-- Context Search Picker -->
<div class="ctx-picker" id="ctxPicker">
  <div class="ctx-picker-hdr"><span>💬</span> Possible matches:</div>
  <div id="ctxRows"></div>
  <button class="ctx-dismiss" id="ctxDismiss">Dismiss</button>
</div>
```

**Step 2: Verify** — open in browser, confirm the picker is hidden by default and no layout breaks.

**Step 3: Commit**

```bash
git add "bible-verse-projector (20).html"
git commit -m "feat: add context picker HTML to left panel"
```

---

## Task 3: Add FlexSearch CDN Script Tag

**Files:**
- Modify: `bible-verse-projector (20).html:7` (after Google Fonts link, before `<style>`)

**Step 1: Add FlexSearch script**

Insert after line 7 (the Google Fonts `<link>`) and before line 8 (`<style>`):

```html
<script src="https://cdn.jsdelivr.net/npm/flexsearch@0.7.43/dist/flexsearch.bundle.min.js"></script>
```

**Important:** This is a non-blocking script in `<head>`. FlexSearch is ~6KB gzipped and loads fast. Do NOT add `async` or `defer` — the library must be available before the main `<script>` block runs.

**Step 2: Verify** — open in browser, confirm `window.FlexSearch` is available in the console.

**Step 3: Commit**

```bash
git add "bible-verse-projector (20).html"
git commit -m "feat: add FlexSearch CDN dependency"
```

---

## Task 4: Implement Confidence Scoring (`scoreConfidence`)

**Files:**
- Modify: `bible-verse-projector (20).html` — insert new function after the `log()` function (after line 2895)

**Step 1: Add stopwords list and scoring function**

Insert after line 2895 (end of `log()` function):

```javascript
// ═══════════════════════════════════════════════════════════════════════════════
// CONTEXTUAL SEARCH — CONFIDENCE SCORING
// ═══════════════════════════════════════════════════════════════════════════════
const CTX_STOPWORDS = new Set([
  'a','an','the','and','or','but','in','on','at','to','for','of','with',
  'is','it','be','as','do','so','if','by','up','no','not','he','she',
  'his','her','him','they','them','we','us','i','my','me','your','you',
  'was','were','are','am','been','has','had','have','did','does','will',
  'shall','that','this','from','into','than','then','also','just','very',
  'all','out','about','which','when','what','who','whom','how','can',
  'would','could','should','may','might','must','let','its','our','their',
]);

function cleanWords(text) {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s']/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1 && !CTX_STOPWORDS.has(w));
}

function scoreConfidence(spoken, verseText) {
  const spokenWords = cleanWords(spoken);
  const verseWords = cleanWords(verseText);
  if (spokenWords.length === 0 || verseWords.length === 0) return 0;

  // Count word matches
  const verseSet = new Set(verseWords);
  const matchCount = spokenWords.filter(w => verseSet.has(w)).length;
  const wordRatio = matchCount / spokenWords.length;

  // Count longest consecutive run in verse order
  let maxConsecutive = 0;
  for (let i = 0; i < spokenWords.length; i++) {
    let run = 0;
    let vIdx = 0;
    for (let j = i; j < spokenWords.length; j++) {
      const found = verseWords.indexOf(spokenWords[j], vIdx);
      if (found !== -1 && (run === 0 || found === vIdx)) {
        run++;
        vIdx = found + 1;
      } else break;
    }
    if (run > maxConsecutive) maxConsecutive = run;
  }
  const consecBonus = Math.min(maxConsecutive / spokenWords.length, 1) * 0.35;

  // Final score: 65% word overlap + 35% consecutive bonus
  const raw = (wordRatio * 0.65) + consecBonus;
  return Math.round(Math.min(raw * 100, 100));
}
```

**Step 2: Test in browser console**

```javascript
// Should return high confidence (90+)
scoreConfidence("For God so loved the world", "For God so loved the world that he gave his only begotten Son");

// Should return lower confidence (50-70)
scoreConfidence("For God so loved the world", "The world was made by God and loved by him");

// Should return 0
scoreConfidence("hello there", "For God so loved the world");
```

**Step 3: Commit**

```bash
git add "bible-verse-projector (20).html"
git commit -m "feat: add confidence scoring with consecutive-word weighting"
```

---

## Task 5: Implement Context Boost (`applyContextBoost`)

**Files:**
- Modify: `bible-verse-projector (20).html` — insert after the `scoreConfidence` function

**Step 1: Add context boost function**

```javascript
function applyContextBoost(results) {
  // Get recent books/chapters from session history
  const recentRefs = sessionHistory.slice(-3);
  if (recentRefs.length === 0) return results;

  const recentBooks = recentRefs.map(h => h.book?.toLowerCase()).filter(Boolean);
  const recentChapters = recentRefs.map(h => `${h.book?.toLowerCase()}:${h.chapter}`).filter(Boolean);

  return results.map(r => {
    let boost = 0;
    const rBook = r.book?.toLowerCase();
    const rChapter = `${rBook}:${r.chapter}`;

    if (recentChapters.includes(rChapter)) boost = 15;
    else if (recentBooks.includes(rBook)) boost = 10;

    return { ...r, confidence: Math.min(r.confidence + boost, 100), boosted: boost > 0 };
  });
}
```

**Step 2: Verify** — no console errors on load.

**Step 3: Commit**

```bash
git add "bible-verse-projector (20).html"
git commit -m "feat: add context boost for recent book/chapter bias"
```

---

## Task 6: Implement Tier 1 — Bolls.life Text Search (`searchBolls`)

**Files:**
- Modify: `bible-verse-projector (20).html` — insert after `applyContextBoost`

**Step 1: Add Bolls.life search function**

```javascript
// ═══════════════════════════════════════════════════════════════════════════════
// CONTEXTUAL SEARCH — TIER 1: BOLLS.LIFE TEXT SEARCH API
// ═══════════════════════════════════════════════════════════════════════════════
async function searchBolls(snippet, trans) {
  const code = (trans || 'KJV').toUpperCase();
  const slug = { KJV:'KJV', NIV:'NIV', ESV:'ESV', NKJV:'NKJV', NLT:'NLT',
                 AMP:'AMP', CSB:'CSB', NET:'NET', YLT:'YLT', WEB:'WEB',
                 ASV:'ASV', BBE:'BBE' }[code] || 'KJV';

  // Take the most distinctive 6-8 words from the snippet
  const queryWords = cleanWords(snippet).slice(0, 8).join(' ');
  if (queryWords.length < 3) return [];

  try {
    const url = `https://bolls.life/v2/find/${slug}?search=${encodeURIComponent(queryWords)}`;
    const resp = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!resp.ok) return [];
    const data = await resp.json();
    if (!Array.isArray(data)) return [];

    return data.slice(0, 6).map(v => {
      const bookName = v.book_name || v.bookname || `Book ${v.book}`;
      const ref = `${bookName} ${v.chapter}:${v.verse}`;
      const text = (v.text || '').replace(/<[^>]*>/g, ''); // strip HTML tags
      return {
        ref,
        book: bookName,
        chapter: String(v.chapter),
        verse: String(v.verse),
        text,
        preview: text.split(/\s+/).slice(0, 10).join(' ') + '…',
        confidence: scoreConfidence(snippet, text),
        tier: 1,
      };
    }).filter(r => r.confidence >= 30); // discard very weak matches
  } catch {
    return []; // silent fail — Tier 2 will still resolve
  }
}
```

**Step 2: Test in browser console**

```javascript
searchBolls("For God so loved the world", "KJV").then(r => console.log(r));
```

Expected: Array with John 3:16 as top result with high confidence.

**Step 3: Commit**

```bash
git add "bible-verse-projector (20).html"
git commit -m "feat: add Tier 1 Bolls.life text search"
```

---

## Task 7: Implement Tier 2 — FlexSearch Local Index (`initSearchIndex`, `searchLocal`)

**Files:**
- Modify: `bible-verse-projector (20).html` — insert after `searchBolls`

**Step 1: Add IndexedDB helpers and FlexSearch index builder**

```javascript
// ═══════════════════════════════════════════════════════════════════════════════
// CONTEXTUAL SEARCH — TIER 2: FLEXSEARCH LOCAL KJV INDEX
// ═══════════════════════════════════════════════════════════════════════════════
const CTX_IDB_STORE = 'kjvSearchDB';
let _flexIndex = null;
let _flexVerses = null; // Map of id → { ref, book, chapter, verse, text }
let _flexReady = false;

async function initSearchIndex() {
  try {
    // Upgrade IndexedDB to add the new store if needed
    const currentVersion = _idb ? _idb.version : IDB_VERSION;
    const newVersion = Math.max(currentVersion, 2);

    // Close existing connection so we can upgrade
    if (_idb) { _idb.close(); _idb = null; }

    const db = await new Promise((resolve, reject) => {
      const req = indexedDB.open(IDB_NAME, newVersion);
      req.onupgradeneeded = e => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(IDB_STORE))
          db.createObjectStore(IDB_STORE, { keyPath: 'id' });
        if (!db.objectStoreNames.contains(CTX_IDB_STORE))
          db.createObjectStore(CTX_IDB_STORE, { keyPath: 'id' });
      };
      req.onsuccess = e => resolve(e.target.result);
      req.onerror = () => reject(req.error);
    });
    _idb = db; // update shared connection

    // Check if KJV data is already cached
    const cached = await new Promise(resolve => {
      const tx = db.transaction(CTX_IDB_STORE, 'readonly');
      const store = tx.objectStore(CTX_IDB_STORE);
      const req = store.get('kjv-full');
      req.onsuccess = () => resolve(req.result?.data || null);
      req.onerror = () => resolve(null);
    });

    let verses;
    if (cached) {
      verses = cached;
      log('📚 Search index loaded from cache', 'dl-miss');
    } else {
      // Fetch KJV Bible JSON from CDN
      log('📚 Downloading Bible search index…', 'dl-miss');
      const resp = await fetch('https://cdn.jsdelivr.net/gh/aruljohn/Bible-kjv@master/Books.json',
                               { signal: AbortSignal.timeout(30000) });
      if (!resp.ok) throw new Error(`CDN error ${resp.status}`);
      const books = await resp.json();

      // Fetch each book and build verse array
      verses = [];
      for (const book of books) {
        try {
          const bResp = await fetch(
            `https://cdn.jsdelivr.net/gh/aruljohn/Bible-kjv@master/${encodeURIComponent(book.name)}.json`,
            { signal: AbortSignal.timeout(10000) }
          );
          if (!bResp.ok) continue;
          const bData = await bResp.json();
          for (const chapter of bData.chapters) {
            const chNum = chapter.chapter || bData.chapters.indexOf(chapter) + 1;
            for (const [verseNum, text] of Object.entries(chapter.verses || chapter)) {
              if (typeof text !== 'string') continue;
              verses.push({
                id: `${book.name}-${chNum}-${verseNum}`,
                ref: `${book.name} ${chNum}:${verseNum}`,
                book: book.name,
                chapter: String(chNum),
                verse: String(verseNum),
                text,
              });
            }
          }
        } catch { /* skip failed book */ }
      }

      // Cache in IndexedDB
      const tx = db.transaction(CTX_IDB_STORE, 'readwrite');
      tx.objectStore(CTX_IDB_STORE).put({ id: 'kjv-full', data: verses, ts: Date.now() });
      log(`📚 Cached ${verses.length} verses for search`, 'dl-miss');
    }

    // Build FlexSearch index
    _flexVerses = new Map(verses.map(v => [v.id, v]));
    _flexIndex = new FlexSearch.Index({
      tokenize: 'forward',
      resolution: 9,
    });
    for (const v of verses) {
      _flexIndex.add(v.id, v.text);
    }
    _flexReady = true;
    log(`📚 Search index ready (${verses.length} verses)`, 'dl-miss');
  } catch (err) {
    console.warn('Search index init failed:', err);
    log('📚 Search index unavailable — context search limited', 'dl-err');
  }
}

async function searchLocal(snippet) {
  if (!_flexReady || !_flexIndex) return [];

  const queryWords = cleanWords(snippet).join(' ');
  if (queryWords.length < 3) return [];

  try {
    const ids = _flexIndex.search(queryWords, { limit: 10 });
    return ids.map(id => {
      const v = _flexVerses.get(id);
      if (!v) return null;
      return {
        ref: v.ref,
        book: v.book,
        chapter: v.chapter,
        verse: v.verse,
        text: v.text,
        preview: v.text.split(/\s+/).slice(0, 10).join(' ') + '…',
        confidence: scoreConfidence(snippet, v.text),
        tier: 2,
      };
    }).filter(r => r && r.confidence >= 30);
  } catch { return []; }
}
```

**Step 2: Test** — open in browser, wait for "Search index ready" in the debug log. Then:

```javascript
searchLocal("For God so loved the world").then(r => console.log(r));
```

**Step 3: Commit**

```bash
git add "bible-verse-projector (20).html"
git commit -m "feat: add Tier 2 FlexSearch local KJV index with IndexedDB caching"
```

---

## Task 8: Implement Tier 3 — Claude Haiku Search (`searchClaude`)

**Files:**
- Modify: `bible-verse-projector (20).html` — insert after `searchLocal`

**Step 1: Add Claude Haiku search function**

```javascript
// ═══════════════════════════════════════════════════════════════════════════════
// CONTEXTUAL SEARCH — TIER 3: CLAUDE HAIKU (PARAPHRASES & NARRATIVES)
// ═══════════════════════════════════════════════════════════════════════════════
async function searchClaude(snippet, trans) {
  const key = getApiKey();
  if (!key) return [];

  const recentVerses = sessionHistory.slice(-5).map(h => h.full).join(', ') || 'none';

  const systemPrompt = `You are a Bible verse identifier. Given a speech transcript snippet, identify which Bible verse(s) are being quoted, paraphrased, or referenced. Consider direct quotes, paraphrases, and narrative references.

Return JSON only, no explanation:
{"results":[{"ref":"John 3:16","book":"John","chapter":"3","verse":"16","confidence":92,"preview":"For God so loved the world..."}]}

Rules:
- confidence is 0-100 based on how certain you are
- Return up to 4 results max, sorted by confidence
- If no Bible verse is being referenced, return: {"results":[]}
- preview should be the first 8-10 words of the actual verse text`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':         'application/json',
        'x-api-key':            key,
        'anthropic-version':    '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model:      'claude-haiku-4-5-20241022',
        max_tokens: 512,
        system:     systemPrompt,
        messages:   [{ role: 'user', content: `Speech: "${snippet}"\nLast verses shown: [${recentVerses}]\nTranslation: ${trans || 'KJV'}` }],
      }),
      signal: AbortSignal.timeout(6000),
    });

    if (!response.ok) return [];
    const data = await response.json();
    const raw = data.content?.[0]?.text || '';
    const clean = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    return (parsed.results || []).map(r => ({
      ref: r.ref,
      book: r.book || r.ref.split(/\s+\d/)[0],
      chapter: r.chapter || r.ref.match(/(\d+):/)?.[1] || '1',
      verse: r.verse || r.ref.match(/:(\d+)/)?.[1] || '1',
      text: '',
      preview: r.preview || r.ref,
      confidence: r.confidence || 50,
      tier: 3,
    }));
  } catch (err) {
    console.warn('Claude context search failed:', err);
    return [];
  }
}
```

**Step 2: Test** (only if API key is configured):

```javascript
searchClaude("when the angel of the Lord appeared unto Mary", "KJV").then(r => console.log(r));
```

Expected: Array with Luke 1:26-28 or similar.

**Step 3: Commit**

```bash
git add "bible-verse-projector (20).html"
git commit -m "feat: add Tier 3 Claude Haiku contextual search"
```

---

## Task 9: Implement Context Picker UI (`showContextPicker`, `hideContextPicker`)

**Files:**
- Modify: `bible-verse-projector (20).html` — insert after `searchClaude`

**Step 1: Add picker rendering functions**

```javascript
// ═══════════════════════════════════════════════════════════════════════════════
// CONTEXTUAL SEARCH — PICKER UI
// ═══════════════════════════════════════════════════════════════════════════════
let _ctxDismissTimer = null;

function showContextPicker(results) {
  const picker = $('ctxPicker');
  const rowsEl = $('ctxRows');
  rowsEl.innerHTML = '';

  // Sort by confidence descending, take top 4
  const sorted = results.sort((a, b) => b.confidence - a.confidence).slice(0, 4);

  for (const r of sorted) {
    const row = document.createElement('div');
    row.className = 'ctx-row';

    row.innerHTML = `
      <span class="ctx-row-ref">${r.ref}</span>
      <span class="ctx-row-preview">"${r.preview}"</span>
      <span class="ctx-row-conf">${r.confidence}%</span>
      <button class="ctx-row-play" title="Display this verse">▶</button>
    `;

    // One-click display
    row.querySelector('.ctx-row-play').addEventListener('click', (e) => {
      e.stopPropagation();
      const parsed = parseRefString(r.ref);
      if (parsed) {
        displayVerse(parsed, $('trans').value);
        log(`💬 Context: operator picked ${r.ref} [${r.confidence}%]`, 'dl-detected');
      }
      hideContextPicker();
    });

    // Clicking the whole row also displays
    row.addEventListener('click', () => {
      const parsed = parseRefString(r.ref);
      if (parsed) {
        displayVerse(parsed, $('trans').value);
        log(`💬 Context: operator picked ${r.ref} [${r.confidence}%]`, 'dl-detected');
      }
      hideContextPicker();
    });

    rowsEl.appendChild(row);
  }

  picker.classList.add('on');

  // Auto-dismiss after 20 seconds
  clearTimeout(_ctxDismissTimer);
  _ctxDismissTimer = setTimeout(hideContextPicker, 20000);
}

function hideContextPicker() {
  $('ctxPicker').classList.remove('on');
  clearTimeout(_ctxDismissTimer);
}

// Parse a reference string like "John 3:16" into the ref object displayVerse expects
function parseRefString(refStr) {
  // Try extractRef first (it handles book name normalization)
  const parsed = extractRef(refStr + ' ');
  if (parsed) return parsed;

  // Fallback: manual parse
  const m = refStr.match(/^(.+?)\s+(\d+):(\d+)/);
  if (!m) return null;
  return { book: m[1], chapter: m[2], verse: m[3], full: refStr };
}

// Wire up dismiss button
document.addEventListener('DOMContentLoaded', () => {
  const dismissBtn = $('ctxDismiss');
  if (dismissBtn) dismissBtn.addEventListener('click', hideContextPicker);
});
```

**Step 2: Verify** — open in browser, call from console:

```javascript
showContextPicker([
  { ref: 'John 3:16', confidence: 92, preview: 'For God so loved the world that he gave…' },
  { ref: '1 John 4:9', confidence: 71, preview: 'In this was manifested the love of God…' },
]);
```

Expected: Picker appears in left panel with 2 rows.

**Step 3: Commit**

```bash
git add "bible-verse-projector (20).html"
git commit -m "feat: add context picker UI with one-click display"
```

---

## Task 10: Implement Main Orchestrator (`contextualSearch`, `debounceContextSearch`)

**Files:**
- Modify: `bible-verse-projector (20).html` — insert after the picker functions

**Step 1: Add orchestrator with debounce, caching, and tier coordination**

```javascript
// ═══════════════════════════════════════════════════════════════════════════════
// CONTEXTUAL SEARCH — MAIN ORCHESTRATOR
// ═══════════════════════════════════════════════════════════════════════════════
let _ctxDebounceTimer = null;
let _ctxLastSearchTime = 0;
const _ctxCache = new Map(); // snippet → results

function debounceContextSearch(transcript) {
  clearTimeout(_ctxDebounceTimer);
  _ctxDebounceTimer = setTimeout(() => {
    contextualSearch(transcript);
  }, 1500);
}

async function contextualSearch(snippet) {
  // Guard: cooldown (10 seconds between searches)
  const now = Date.now();
  if (now - _ctxLastSearchTime < 10000) return;
  _ctxLastSearchTime = now;

  // Normalize snippet for caching
  const cacheKey = cleanWords(snippet).join(' ');
  if (cacheKey.length < 10) return;

  // Check cache
  if (_ctxCache.has(cacheKey)) {
    const cached = _ctxCache.get(cacheKey);
    if (cached.length > 0) handleContextResults(cached, snippet);
    return;
  }

  log(`💬 Context search: "${snippet.slice(0, 50)}…"`, 'dl-miss');

  // Fire Tier 1 + Tier 2 in parallel
  const trans = $('trans').value;
  const [bollsResults, localResults] = await Promise.all([
    searchBolls(snippet, trans).catch(() => []),
    searchLocal(snippet).catch(() => []),
  ]);

  // Merge & deduplicate (keep highest confidence per reference)
  let merged = deduplicateResults([...bollsResults, ...localResults]);
  merged = applyContextBoost(merged);
  merged.sort((a, b) => b.confidence - a.confidence);

  const topConf = merged.length > 0 ? merged[0].confidence : 0;

  // Decision tree
  if (topConf >= 85) {
    // High confidence — auto-display top + show picker with alternatives
    _ctxCache.set(cacheKey, merged);
    const top = merged[0];
    const parsed = parseRefString(top.ref);
    if (parsed) {
      log(`💬 Context: ${top.ref} [${top.confidence}%] ✓ auto`, 'dl-detected');
      displayVerse(parsed, trans);
    }
    if (merged.length > 1) showContextPicker(merged.slice(1));
  } else if (topConf >= 70) {
    // Medium-high — show picker + fire Tier 3 in background
    _ctxCache.set(cacheKey, merged);
    showContextPicker(merged);
    // Fire Tier 3 in background to potentially improve results
    searchClaude(snippet, trans).then(claudeResults => {
      if (claudeResults.length > 0) {
        const allMerged = applyContextBoost(deduplicateResults([...merged, ...claudeResults]));
        allMerged.sort((a, b) => b.confidence - a.confidence);
        _ctxCache.set(cacheKey, allMerged);
        showContextPicker(allMerged); // re-render with enriched results
      }
    }).catch(() => {});
  } else if (topConf >= 50) {
    // Medium — fire Tier 3, wait, then decide
    const claudeResults = await searchClaude(snippet, trans).catch(() => []);
    const allMerged = applyContextBoost(deduplicateResults([...merged, ...claudeResults]));
    allMerged.sort((a, b) => b.confidence - a.confidence);
    _ctxCache.set(cacheKey, allMerged);
    if (allMerged.length > 0 && allMerged[0].confidence >= 50) {
      handleContextResults(allMerged, snippet);
    } else {
      log(`💬 Context: "${snippet.slice(0, 40)}…" → no match`, 'dl-miss');
    }
  } else {
    // All < 50 from Tiers 1+2 — try Tier 3 as last resort
    const claudeResults = await searchClaude(snippet, trans).catch(() => []);
    if (claudeResults.length > 0) {
      const allMerged = applyContextBoost(deduplicateResults([...merged, ...claudeResults]));
      allMerged.sort((a, b) => b.confidence - a.confidence);
      _ctxCache.set(cacheKey, allMerged);
      if (allMerged[0].confidence >= 50) {
        handleContextResults(allMerged, snippet);
        return;
      }
    }
    log(`💬 Context: "${snippet.slice(0, 40)}…" → no match`, 'dl-miss');
  }
}

function handleContextResults(results, snippet) {
  const top = results[0];
  if (top.confidence >= 85) {
    const parsed = parseRefString(top.ref);
    if (parsed) {
      log(`💬 Context: ${top.ref} [${top.confidence}%] ✓ auto`, 'dl-detected');
      displayVerse(parsed, $('trans').value);
    }
    if (results.length > 1) showContextPicker(results.slice(1));
  } else {
    log(`💬 Context: ${top.ref} [${top.confidence}%] ? suggested`, 'dl-detected');
    showContextPicker(results);
  }
}

function deduplicateResults(results) {
  const best = new Map();
  for (const r of results) {
    const key = r.ref.toLowerCase().replace(/\s+/g, '');
    if (!best.has(key) || r.confidence > best.get(key).confidence) {
      best.set(key, r);
    }
  }
  return Array.from(best.values());
}
```

**Step 2: Test in console**

```javascript
contextualSearch("For God so loved the world that he gave his only begotten son");
```

Expected: Picker appears or verse auto-displays depending on confidence.

**Step 3: Commit**

```bash
git add "bible-verse-projector (20).html"
git commit -m "feat: add contextual search orchestrator with 3-tier parallel search"
```

---

## Task 11: Wire Into Speech Recognition Handler

**Files:**
- Modify: `bible-verse-projector (20).html:3246-3248` (the "no match" branch in `onresult`)

**Step 1: Add contextual search trigger**

Find line 3246 (inside the `debounceTimer` callback, after all CASE A/B/C/D blocks):

```javascript
      if (!ref && !rangeMatch && !transMatch && finalChunk.trim()) {
        log(`· No verse/translation in: "${finalChunk.trim()}"`, 'dl-miss');
      }
```

Replace with:

```javascript
      if (!ref && !rangeMatch && !transMatch && finalChunk.trim()) {
        log(`· No verse/translation in: "${finalChunk.trim()}"`, 'dl-miss');
        // Contextual search — detect quotes/paraphrases without explicit references
        const words = fullText.trim().split(/\s+/);
        if (words.length >= 8) {
          debounceContextSearch(fullText.trim());
        }
      }
```

**Step 2: Verify** — speak or type something that's a Bible quote without a reference. The contextual search should trigger after 1.5s.

**Step 3: Commit**

```bash
git add "bible-verse-projector (20).html"
git commit -m "feat: wire contextual search into speech recognition handler"
```

---

## Task 12: Wire `initSearchIndex()` Into Startup

**Files:**
- Modify: `bible-verse-projector (20).html:3784` (inside the `startup()` IIFE)

**Step 1: Add search index initialization**

Find line 3784 (`warmMemoryCacheFromIDB();`) and add after it:

```javascript
  // Initialize contextual search index (non-blocking)
  initSearchIndex();
```

The startup function should now look like:

```javascript
(async function startup() {
  // Apply current network status immediately
  applyNetworkStatus(navigator.onLine);

  // Warm memory cache from IndexedDB (non-blocking)
  warmMemoryCacheFromIDB();

  // Initialize contextual search index (non-blocking)
  initSearchIndex();

  // Update cache count display
  updateCacheUI();
})();
```

**Step 2: Verify** — reload the page. The debug log should show:
```
📚 Downloading Bible search index…
📚 Cached 31102 verses for search
📚 Search index ready (31102 verses)
```
(On subsequent loads, it should show "Search index loaded from cache" instead.)

**Step 3: Commit**

```bash
git add "bible-verse-projector (20).html"
git commit -m "feat: initialize search index on startup"
```

---

## Task 13: End-to-End Testing

**Files:** No code changes — testing only.

**Step 1: Test direct quote detection**

Open the app, allow mic, and clearly say:
> "For God so loved the world that he gave his only begotten Son"

Expected: John 3:16 should auto-display or appear in the picker.

**Step 2: Test fuzzy/partial quote**

Say: "The Lord is my shepherd I shall not want"

Expected: Psalm 23:1 should appear with high confidence.

**Step 3: Test paraphrase (requires API key)**

Open Settings, enter your Anthropic API key. Say:
> "when the angel of the Lord appeared unto Mary the mother of Jesus"

Expected: Luke 1:26 or similar should appear in the picker (via Claude Haiku).

**Step 4: Test picker interaction**

When the picker shows multiple results, click the `▶` button on a non-top result. Verify the verse displays correctly.

**Step 5: Test explicit reference still works**

Say: "John 3:16"

Expected: The existing pipeline handles this — no contextual search triggered.

**Step 6: Test offline**

Disconnect from internet. After the search index has been cached (from a prior online session), speak a quote.

Expected: FlexSearch (Tier 2) returns results. Debug log does NOT show errors for Tier 1/3 failures.

**Step 7: Commit final state**

```bash
git add "bible-verse-projector (20).html"
git commit -m "feat: contextual Bible verse search — complete implementation"
```

---

## Summary of All File Changes

| Line(s) | What Changed |
|---|---|
| After line 7 | Added `<script>` for FlexSearch CDN |
| Lines 416-417 | Added ~60 lines of CSS for context picker |
| After line 484 | Added picker HTML (`#ctxPicker`) — 5 lines |
| After line 2895 | Added `CTX_STOPWORDS`, `cleanWords()`, `scoreConfidence()` — ~45 lines |
| After scoring | Added `applyContextBoost()` — ~15 lines |
| After boost | Added `searchBolls()` — ~35 lines |
| After bolls | Added `initSearchIndex()`, `searchLocal()` — ~100 lines |
| After local | Added `searchClaude()` — ~50 lines |
| After claude | Added `showContextPicker()`, `hideContextPicker()`, `parseRefString()` — ~60 lines |
| After picker | Added `contextualSearch()`, `debounceContextSearch()`, helpers — ~90 lines |
| Line 3246-3248 | Modified: added 4 lines to trigger contextual search |
| Line 3784 | Added 1 line: `initSearchIndex();` |

**Total new code:** ~460 lines
**Existing code modified:** 5 lines
**External dependencies added:** FlexSearch (~6KB), KJV JSON (~4-5MB, cached)
