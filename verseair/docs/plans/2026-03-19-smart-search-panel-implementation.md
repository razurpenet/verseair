# Smart Bible Search Panel + Verse Navigation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace VerseAir's basic Manual Lookup with a smart search panel (autocomplete + chapter/verse grids) and add next/previous verse navigation arrows to the verse display panel.

**Architecture:** Three additive components built into the existing single-file app. Component 1 (smart search bar with autocomplete dropdown) replaces the existing `#manInput`/`#manBtn`. Component 2 (cascading chapter → verse grid) appears below the search bar on book selection. Component 3 (nav arrows) adds two buttons to the verse display panel. All components call the existing `displayVerse(ref, trans)` function with a `{ book, chapter, verse, full }` ref object.

**Tech Stack:** Vanilla HTML/CSS/JS (no new dependencies). Reuses existing `BOOK_MAP`, `BOOK_NUMBERS`, `BIBLE_VERSE_COUNTS`, `_flexIndex`/`_flexVerses` (FlexSearch), and `displayVerse()`.

---

## Context for All Tasks

**File to modify:** `bible-verse-projector_6.html` (root of `verseair/` directory, ~4200 lines)

**Key existing data structures:**
- `BOOK_MAP` (line ~791) — object mapping lowercase aliases → canonical book names. 200+ entries including abbreviations and Nigerian accent variants. Example: `{ 'genesis': 'Genesis', 'gen': 'Genesis', 'jn': 'John', ... }`
- `BOOK_NUMBERS` (line ~2255) — object mapping canonical book names → numbers 1-66. Example: `{ 'Genesis': 1, 'Exodus': 2, ..., 'Revelation': 66 }`
- `BIBLE_VERSE_COUNTS` (line ~2803) — object mapping canonical book names → arrays of verse counts per chapter. Example: `{ 'Genesis': [31,25,24,...], ... }` — `BIBLE_VERSE_COUNTS['Genesis'][0]` = 31 means Genesis chapter 1 has 31 verses.
- `currentRef` (declared line ~2763) — `null` or `{ book: string, chapter: string, verse: string, full: string }` for the currently displayed verse.
- `rangeState` (line ~1565) — `null` when no range is active, object when range playback is in progress.
- `_flexIndex` (line ~3980) — FlexSearch.Index instance for full-text KJV search. May be `null` if not yet loaded.
- `_flexVerses` (line ~3981) — `Map<id, { ref, book, chapter, verse, text }>` of all KJV verses. May be `null`.
- `_flexReady` (line ~3982) — boolean, `true` when FlexSearch index is built and ready.
- `displayVerse(ref, trans, force=false)` (line ~2899) — async function that fetches and displays a verse. `ref` is `{ book, chapter, verse, full }`. `trans` is a translation code string from `$('trans').value`.
- `extractRef(text)` (line ~1239) — parses text into a ref object or returns `null`.
- `extractRange(text)` — parses text into a range object or returns `null`.
- `$()` helper (shortcut for `document.getElementById()`).
- `log(msg, className)` — logs to the detection debug box.

**Existing Manual Lookup HTML (lines 429-435):**
```html
<div>
  <div class="sec-label">Manual Lookup</div>
  <div class="row">
    <input class="sinput" id="manInput" type="text" placeholder="e.g. John 3:16 or Psalm 23 1"/>
    <button class="btn" id="manBtn">Look Up</button>
  </div>
</div>
```

**Existing Manual Lookup JS (lines 3379-3405):**
```javascript
// 8. MANUAL LOOKUP
$('manBtn').addEventListener('click', () => {
  const val = $('manInput').value.trim();
  if (!val) return;
  const rangeRef = extractRange(val + ' ');
  if (rangeRef) {
    displayRange(rangeRef, $('trans').value);
    $('manInput').value = '';
    return;
  }
  const ref = extractRef(val + ' ');
  if (ref) {
    displayVerse(ref, $('trans').value);
    $('manInput').value = '';
  } else {
    log(`❌ Manual parse failed: "${val}"`, 'dl-err');
    showErr(`Can't parse "${val}" — try: John 3:16, Romans 8:28, John 3:1-6, John 3:1 to 6`);
    $('emptyState').classList.remove('hidden');
  }
});
$('manInput').addEventListener('keydown', e => { if (e.key === 'Enter') $('manBtn').click(); });
```

**Existing Verse Panel HTML (lines 461-510):**
```html
<div class="verse-panel" id="versePanel">
  <div class="cross-wm">✝</div>
  <div class="empty-state" id="emptyState">...</div>
  <div class="spinner" id="spinner"></div>
  <div class="errmsg" id="errmsg"></div>
  <div class="verse-content" id="vcontent" style="display:none">
    <div class="vref" id="vref"></div>
    <div class="vdiv" id="vdiv"></div>
    <div class="vline" id="vline"></div>
    <div class="vtrans" id="vtrans"></div>
  </div>
  <!-- ... range bar, countdown, voice bar, listen button, fullscreen button, toast ... -->
  <button class="fs-btn" id="fsBtn">⛶ Fullscreen</button>
  ...
</div>
```

**CSS variables (lines 11-15):**
```css
--bg:#0b0c0f; --panel:#111318; --border:#1e2028;
--gold:#c9a84c; --gold-light:#e8c97a; --gold-dim:rgba(201,168,76,0.1);
--text:#e8e4d8; --muted:#5a5950; --red:#c0392b; --orange:#e67e22;
--green:#27ae60; --radius:10px;
```

---

## Task 1: Add CSS for Smart Search, Grids, and Nav Arrows

**Files:**
- Modify: `bible-verse-projector_6.html` — append new CSS block after the existing `.btn-sm:hover` rule (line ~81)

**What to do:**

Add a new CSS block right after line 81 (after `.btn-sm:hover{...}`) with all styles for the three new components. This keeps all new styles in one place.

**Step 1: Add the CSS block**

Find this exact string:
```css
.btn-sm:hover{border-color:var(--red);color:var(--red);background:transparent;transform:none}
```

Insert AFTER it (on a new line):

```css

/* ── SMART SEARCH PANEL ───────────────────────────────────────────────────── */
.search-wrap{position:relative}
.search-input{width:100%;background:var(--bg);border:1px solid var(--border);color:var(--text);font-family:'EB Garamond',serif;font-size:0.9rem;padding:9px 12px;border-radius:7px;outline:none;transition:border-color 0.2s}
.search-input::placeholder{color:var(--muted)}
.search-input:focus{border-color:var(--gold)}
.search-dd{position:absolute;left:0;right:0;top:100%;margin-top:3px;background:var(--panel);border:1px solid var(--border);border-radius:7px;max-height:220px;overflow-y:auto;z-index:50;display:none}
.search-dd.open{display:block}
.search-dd-item{display:flex;align-items:center;gap:8px;padding:7px 12px;cursor:pointer;font-size:0.85rem;color:var(--text);transition:background 0.12s}
.search-dd-item:hover,.search-dd-item.active{background:var(--gold-dim)}
.search-dd-item .dd-icon{color:var(--gold);font-size:0.75rem;flex-shrink:0;width:16px;text-align:center}
.search-dd-item .dd-ref{color:var(--gold);font-family:'Cinzel',serif;font-size:0.72rem;letter-spacing:0.06em;min-width:90px;flex-shrink:0}
.search-dd-item .dd-preview{color:var(--muted);font-size:0.78rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

/* ── CHAPTER / VERSE GRID ─────────────────────────────────────────────────── */
.grid-wrap{display:none;margin-top:8px}
.grid-wrap.open{display:block}
.grid-hdr{display:flex;align-items:center;gap:6px;margin-bottom:6px}
.grid-hdr-back{background:none;border:none;color:var(--gold);cursor:pointer;font-size:0.85rem;padding:2px 4px;border-radius:4px;transition:background 0.12s}
.grid-hdr-back:hover{background:var(--gold-dim)}
.grid-hdr-label{font-family:'Cinzel',serif;font-size:0.6rem;letter-spacing:0.12em;color:var(--muted);text-transform:uppercase}
.grid-body{display:grid;grid-template-columns:repeat(auto-fill,minmax(32px,1fr));gap:3px;max-height:120px;overflow-y:auto;padding:2px}
.grid-cell{width:100%;aspect-ratio:1;display:flex;align-items:center;justify-content:center;background:var(--bg);border:1px solid var(--border);border-radius:5px;color:var(--text);font-size:0.75rem;font-family:'Cinzel',serif;cursor:pointer;transition:all 0.12s}
.grid-cell:hover{border-color:var(--gold);color:var(--gold);background:var(--gold-dim)}
.grid-cell.sel{background:var(--gold);color:#0b0c0f;border-color:var(--gold);font-weight:700}
.grid-toggle{background:none;border:1px solid var(--border);color:var(--muted);font-size:0.65rem;font-family:'Cinzel',serif;letter-spacing:0.06em;padding:3px 10px;border-radius:5px;cursor:pointer;margin-top:6px;transition:all 0.12s;width:100%;text-align:center}
.grid-toggle:hover{border-color:var(--gold);color:var(--gold)}

/* ── VERSE NAV ARROWS ─────────────────────────────────────────────────────── */
.verse-nav{position:absolute;top:50%;transform:translateY(-50%);width:40px;height:40px;border-radius:50%;border:1px solid rgba(201,168,76,0.3);background:transparent;color:var(--gold);font-size:1.1rem;cursor:pointer;display:none;align-items:center;justify-content:center;transition:all 0.18s;z-index:10;opacity:0.5}
.verse-nav:hover{opacity:1;background:var(--gold-dim);border-color:var(--gold);transform:translateY(-50%) scale(1.08)}
.verse-nav.show{display:flex}
.verse-nav.left{left:20px}
.verse-nav.right{right:20px}
@keyframes vnavShake{0%,100%{transform:translateY(-50%) translateX(0)}25%{transform:translateY(-50%) translateX(-4px)}75%{transform:translateY(-50%) translateX(4px)}}
.verse-nav.shake{animation:vnavShake 0.3s ease}
```

**Step 2: Verify**

Open the file in a browser. The page should load without CSS errors. No visual change yet since no HTML uses these classes.

**Step 3: Commit**

```bash
git add "bible-verse-projector_6.html"
git commit -m "style: add CSS for smart search panel, grids, and verse nav arrows"
```

---

## Task 2: Replace Manual Lookup HTML with Smart Search + Grid

**Files:**
- Modify: `bible-verse-projector_6.html` — replace the Manual Lookup `<div>` block (lines ~429-435)

**What to do:**

Find this exact HTML block:
```html
    <div>
      <div class="sec-label">Manual Lookup</div>
      <div class="row">
        <input class="sinput" id="manInput" type="text" placeholder="e.g. John 3:16 or Psalm 23 1"/>
        <button class="btn" id="manBtn">Look Up</button>
      </div>
    </div>
```

Replace it with:
```html
    <div>
      <div class="sec-label">Search</div>
      <div class="search-wrap">
        <input class="search-input" id="searchInput" type="text" placeholder="e.g. John 3:16 or &quot;For God so loved&quot;" autocomplete="off" spellcheck="false"/>
        <div class="search-dd" id="searchDd"></div>
      </div>
      <div class="grid-wrap" id="gridWrap">
        <div class="grid-hdr">
          <button class="grid-hdr-back" id="gridBack" style="display:none" title="Back to chapters">←</button>
          <div class="grid-hdr-label" id="gridLabel"></div>
        </div>
        <div class="grid-body" id="gridBody"></div>
      </div>
      <button class="grid-toggle" id="gridToggle" style="display:none">Browse ▾</button>
    </div>
```

**Step 2: Verify**

Open in browser. The left panel should now show "Search" label with an input field, no "Look Up" button, and no grid visible yet. The old `#manInput` and `#manBtn` elements should no longer exist.

**Step 3: Commit**

```bash
git add "bible-verse-projector_6.html"
git commit -m "feat: replace Manual Lookup HTML with smart search + grid structure"
```

---

## Task 3: Add Verse Navigation Arrow HTML to the Verse Panel

**Files:**
- Modify: `bible-verse-projector_6.html` — add two buttons inside `#versePanel` (after line ~465, the `errmsg` div)

**What to do:**

Find this exact string:
```html
    <div class="errmsg" id="errmsg"></div>
```

Insert AFTER it (on a new line):
```html
    <button class="verse-nav left" id="vnavPrev" title="Previous verse">←</button>
    <button class="verse-nav right" id="vnavNext" title="Next verse">→</button>
```

**Step 2: Verify**

Open in browser. The arrows should not be visible yet (they need the `.show` class to appear, which CSS defaults to `display:none`).

**Step 3: Commit**

```bash
git add "bible-verse-projector_6.html"
git commit -m "feat: add verse nav arrow HTML to verse panel"
```

---

## Task 4: Build the Canonical Book List Utility

**Files:**
- Modify: `bible-verse-projector_6.html` — add a new JS section after the `BIBLE_VERSE_COUNTS` aliases block (after line ~2877)

**What to do:**

We need an ordered array of the 66 canonical book names for autocomplete and for next/prev book navigation. Derive it from `BOOK_NUMBERS`.

Find this exact string:
```javascript
BIBLE_VERSE_COUNTS['Revelation of John']  = BIBLE_VERSE_COUNTS['Revelation'];
```

Insert AFTER it (on a new line):

```javascript

// ── Canonical book list (ordered by BOOK_NUMBERS) ────────────────────────────
const CANON_BOOKS = Object.entries(BOOK_NUMBERS)
  .filter(([,n], _i, arr) => arr.findIndex(([,m]) => m === n) === arr.indexOf(arr.find(([,m]) => m === n)))
  .sort((a, b) => a[1] - b[1])
  .map(([name]) => name);
// Deduplicate: BOOK_NUMBERS has 'Psalms':19 AND 'Psalm':19 — keep only the first per number
// CANON_BOOKS = ['Genesis','Exodus',...,'Revelation'] — 66 entries

// Reverse lookup: build a Set of canonical names for fast matching
const CANON_SET = new Set(CANON_BOOKS);
```

**Important:** The deduplication above is needed because `BOOK_NUMBERS` has both `'Psalms':19` and `'Psalm':19`. We only want one entry per book number.

Actually, a simpler approach that's more readable:

Find this exact string:
```javascript
BIBLE_VERSE_COUNTS['Revelation of John']  = BIBLE_VERSE_COUNTS['Revelation'];
```

Insert AFTER it:

```javascript

// ── Canonical book list (ordered Genesis → Revelation) ───────────────────────
const CANON_BOOKS = [];
(function() {
  const seen = new Set();
  const entries = Object.entries(BOOK_NUMBERS).sort((a,b) => a[1] - b[1]);
  for (const [name, num] of entries) {
    if (!seen.has(num)) { seen.add(num); CANON_BOOKS.push(name); }
  }
})();
const CANON_SET = new Set(CANON_BOOKS);
```

**Step 2: Verify**

Open browser console. Type `CANON_BOOKS.length` — should be `66`. Type `CANON_BOOKS[0]` — should be `'Genesis'`. Type `CANON_BOOKS[65]` — should be `'Revelation'`. Type `CANON_SET.has('John')` — should be `true`.

**Step 3: Commit**

```bash
git add "bible-verse-projector_6.html"
git commit -m "feat: add CANON_BOOKS ordered book list derived from BOOK_NUMBERS"
```

---

## Task 5: Build the Smart Search JS — Autocomplete Logic

**Files:**
- Modify: `bible-verse-projector_6.html` — replace the existing Manual Lookup JS section (lines ~3379-3405)

**What to do:**

Find and replace the entire Manual Lookup section. Find this exact block:

```javascript
// ═══════════════════════════════════════════════════════════════════════════════
// 8. MANUAL LOOKUP
// ═══════════════════════════════════════════════════════════════════════════════
$('manBtn').addEventListener('click', () => {
  const val = $('manInput').value.trim();
  if (!val) return;

  \ Check for range first (e.g. "John 3:1-6" or "John 3:1 to 6")
  const rangeRef = extractRange(val + ' ');
  if (rangeRef) {
    displayRange(rangeRef, $('trans').value);
    $('manInput').value = '';
    return;
  }

  const ref = extractRef(val + ' ');
  if (ref) {
    displayVerse(ref, $('trans').value);
    $('manInput').value = '';
  } else {
    log(`❌ Manual parse failed: "${val}"`, 'dl-err');
    showErr(`Can't parse "${val}" — try: John 3:16, Romans 8:28, John 3:1-6, John 3:1 to 6`);
    $('emptyState').classList.remove('hidden');
  }
});
$('manInput').addEventListener('keydown', e => { if (e.key === 'Enter') $('manBtn').click(); });
```

Replace it with:

```javascript
// ═══════════════════════════════════════════════════════════════════════════════
// 8. SMART SEARCH PANEL
// ═══════════════════════════════════════════════════════════════════════════════

let _searchDdIdx = -1;   // currently highlighted dropdown index
let _searchBook = null;   // selected book for grid browsing
let _searchChapter = null; // selected chapter for grid browsing
let _searchDebounce = null;

// ── Resolve typed text to a canonical book name ──────────────────────────────
function resolveBook(text) {
  const t = text.toLowerCase().trim();
  if (!t) return null;
  // Direct match in BOOK_MAP
  if (BOOK_MAP[t]) return BOOK_MAP[t];
  // Prefix match — find canonical books whose lowercase name starts with t
  for (const name of CANON_BOOKS) {
    if (name.toLowerCase().startsWith(t)) return name;
  }
  // Prefix match against aliases
  for (const [alias, canonical] of Object.entries(BOOK_MAP)) {
    if (alias.startsWith(t) && t.length >= 2) return canonical;
  }
  return null;
}

// ── Get unique canonical books matching a query ──────────────────────────────
function matchBooks(query) {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  const matched = new Set();
  const results = [];
  // Canonical name prefix matches first (higher priority)
  for (const name of CANON_BOOKS) {
    if (name.toLowerCase().startsWith(q) && !matched.has(name)) {
      matched.add(name);
      results.push(name);
    }
  }
  // Alias matches second
  for (const [alias, canonical] of Object.entries(BOOK_MAP)) {
    if (alias.startsWith(q) && !matched.has(canonical)) {
      matched.add(canonical);
      results.push(canonical);
    }
  }
  return results.slice(0, 8);
}

// ── Render the autocomplete dropdown ─────────────────────────────────────────
function renderSearchDd(items) {
  const dd = $('searchDd');
  if (!items || items.length === 0) {
    dd.classList.remove('open');
    dd.innerHTML = '';
    _searchDdIdx = -1;
    return;
  }
  dd.innerHTML = items.map((item, i) => {
    if (item.type === 'book') {
      return `<div class="search-dd-item${i === _searchDdIdx ? ' active' : ''}" data-idx="${i}" data-type="book" data-book="${item.name}">
        <span class="dd-icon">📖</span><span>${item.name}</span>
      </div>`;
    } else {
      // keyword result
      return `<div class="search-dd-item${i === _searchDdIdx ? ' active' : ''}" data-idx="${i}" data-type="verse" data-ref="${item.ref}">
        <span class="dd-ref">${item.ref}</span>
        <span class="dd-preview">${item.preview}</span>
      </div>`;
    }
  }).join('');
  dd.classList.add('open');

  // Click handlers for each item
  dd.querySelectorAll('.search-dd-item').forEach(el => {
    el.addEventListener('click', () => {
      const type = el.dataset.type;
      if (type === 'book') {
        selectBook(el.dataset.book);
      } else {
        selectVerseFromDd(el.dataset.ref);
      }
    });
  });
}

// ── Select a book from the dropdown → show chapter grid ──────────────────────
function selectBook(bookName) {
  $('searchInput').value = bookName;
  $('searchDd').classList.remove('open');
  _searchDdIdx = -1;
  showChapterGrid(bookName);
}

// ── Select a verse from keyword search dropdown → display it ─────────────────
function selectVerseFromDd(refStr) {
  $('searchDd').classList.remove('open');
  _searchDdIdx = -1;
  $('searchInput').value = '';
  // Parse the refStr (e.g., "John 3:16") into a ref object
  const ref = extractRef(refStr + ' ');
  if (ref) {
    displayVerse(ref, $('trans').value);
  }
}

// ── Keyword search using FlexSearch ──────────────────────────────────────────
function searchKeywords(query) {
  if (!_flexReady || !_flexIndex || !_flexVerses) {
    return [];
  }
  try {
    const ids = _flexIndex.search(query, { limit: 6 });
    return ids.map(id => {
      const v = _flexVerses.get(id);
      if (!v) return null;
      return {
        type: 'verse',
        ref: v.ref,
        preview: v.text.length > 60 ? v.text.substring(0, 57) + '…' : v.text
      };
    }).filter(Boolean);
  } catch(e) {
    return [];
  }
}

// ── Main input handler — detect intent and show dropdown ─────────────────────
function handleSearchInput() {
  const val = $('searchInput').value.trim();
  if (!val) {
    renderSearchDd([]);
    return;
  }

  // Try to detect if this starts with a book name
  // Split to get the first 1-3 words for book matching (handles "1 Corinthians", "Song of Solomon")
  const words = val.split(/\s+/);

  // Try matching against books
  const bookMatches = matchBooks(val);

  // If we have book matches and the input looks like a book name (not a full reference with numbers)
  // show book suggestions
  const hasNumbers = /\d/.test(val);

  if (bookMatches.length > 0 && !hasNumbers) {
    renderSearchDd(bookMatches.map(name => ({ type: 'book', name })));
    return;
  }

  // If input has numbers, try parsing as a reference directly (no dropdown, just Enter to submit)
  if (hasNumbers && resolveBook(words.slice(0, 3).join(' '))) {
    renderSearchDd([]); // close dropdown, user can hit Enter
    return;
  }

  // Otherwise, keyword search
  clearTimeout(_searchDebounce);
  _searchDebounce = setTimeout(() => {
    const results = searchKeywords(val);
    if (results.length > 0) {
      renderSearchDd(results);
    } else {
      renderSearchDd([]);
    }
  }, 250);
}

// ── Submit on Enter — parse reference or select highlighted item ─────────────
function handleSearchSubmit() {
  const dd = $('searchDd');

  // If dropdown is open and an item is highlighted, select it
  if (dd.classList.contains('open') && _searchDdIdx >= 0) {
    const items = dd.querySelectorAll('.search-dd-item');
    if (items[_searchDdIdx]) {
      items[_searchDdIdx].click();
      return;
    }
  }

  const val = $('searchInput').value.trim();
  if (!val) return;

  // Close dropdown
  dd.classList.remove('open');
  _searchDdIdx = -1;

  // Try range parse first
  const rangeRef = extractRange(val + ' ');
  if (rangeRef) {
    displayRange(rangeRef, $('trans').value);
    $('searchInput').value = '';
    collapseGrid();
    return;
  }

  // Try single reference parse
  const ref = extractRef(val + ' ');
  if (ref) {
    displayVerse(ref, $('trans').value);
    $('searchInput').value = '';
    collapseGrid();
    return;
  }

  // If nothing parsed, check if it's a book name alone → show chapter grid
  const book = resolveBook(val);
  if (book) {
    selectBook(book);
    return;
  }

  // Nothing matched — show error
  log(`❌ Search parse failed: "${val}"`, 'dl-err');
  showErr(`Can't find "${val}" — try: John 3:16, Psalm 23, or a quote like "For God so loved"`);
}

// ── Wire up the search input ─────────────────────────────────────────────────
$('searchInput').addEventListener('input', handleSearchInput);
$('searchInput').addEventListener('keydown', e => {
  const dd = $('searchDd');
  const items = dd.querySelectorAll('.search-dd-item');
  const count = items.length;

  if (e.key === 'Enter') {
    e.preventDefault();
    handleSearchSubmit();
  } else if (e.key === 'Escape') {
    dd.classList.remove('open');
    _searchDdIdx = -1;
    $('searchInput').blur();
  } else if (e.key === 'ArrowDown' && dd.classList.contains('open')) {
    e.preventDefault();
    _searchDdIdx = (_searchDdIdx + 1) % count;
    items.forEach((el, i) => el.classList.toggle('active', i === _searchDdIdx));
  } else if (e.key === 'ArrowUp' && dd.classList.contains('open')) {
    e.preventDefault();
    _searchDdIdx = (_searchDdIdx - 1 + count) % count;
    items.forEach((el, i) => el.classList.toggle('active', i === _searchDdIdx));
  }
});

// Close dropdown when clicking outside
document.addEventListener('click', e => {
  if (!e.target.closest('.search-wrap')) {
    $('searchDd').classList.remove('open');
    _searchDdIdx = -1;
  }
});
```

**Step 2: Verify**

Open in browser. Type "Jo" in the search input — should see a dropdown with John, Joshua, Job, Joel, Jonah. Type "John 3:16" and press Enter — should display John 3:16. Type "For God so loved" — should see keyword results (if FlexSearch is loaded). Press Escape — dropdown should close.

**Step 3: Commit**

```bash
git add "bible-verse-projector_6.html"
git commit -m "feat: implement smart search input with autocomplete and keyword search"
```

---

## Task 6: Build the Chapter/Verse Grid JS

**Files:**
- Modify: `bible-verse-projector_6.html` — add grid functions right after the search input event listeners (after the `document.addEventListener('click', ...)` block added in Task 5)

**What to do:**

Insert after the click-outside handler added in Task 5:

```javascript

// ── Chapter / Verse Grid ─────────────────────────────────────────────────────

function showChapterGrid(bookName) {
  _searchBook = bookName;
  _searchChapter = null;
  const counts = BIBLE_VERSE_COUNTS[bookName];
  if (!counts) return;
  const totalChapters = counts.length;

  $('gridLabel').textContent = `${bookName} — Select Chapter`;
  $('gridBack').style.display = 'none';
  $('gridBody').innerHTML = '';

  for (let ch = 1; ch <= totalChapters; ch++) {
    const cell = document.createElement('button');
    cell.className = 'grid-cell';
    cell.textContent = ch;
    cell.addEventListener('click', () => showVerseGrid(bookName, ch));
    $('gridBody').appendChild(cell);
  }

  $('gridWrap').classList.add('open');
  $('gridToggle').style.display = 'none';
}

function showVerseGrid(bookName, chapter) {
  _searchBook = bookName;
  _searchChapter = chapter;
  const counts = BIBLE_VERSE_COUNTS[bookName];
  if (!counts || chapter < 1 || chapter > counts.length) return;
  const totalVerses = counts[chapter - 1];

  $('gridLabel').textContent = `${bookName} ${chapter} — Select Verse`;
  $('gridBack').style.display = '';
  $('gridBody').innerHTML = '';

  for (let vs = 1; vs <= totalVerses; vs++) {
    const cell = document.createElement('button');
    cell.className = 'grid-cell';
    cell.textContent = vs;
    cell.addEventListener('click', () => {
      const ref = {
        book: bookName,
        chapter: String(chapter),
        verse: String(vs),
        full: `${bookName} ${chapter}:${vs}`
      };
      displayVerse(ref, $('trans').value);
      $('searchInput').value = '';
      collapseGrid();
    });
    $('gridBody').appendChild(cell);
  }

  $('gridWrap').classList.add('open');
}

function collapseGrid() {
  $('gridWrap').classList.remove('open');
  // Show the Browse toggle if a book was selected (so user can re-expand)
  if (_searchBook) {
    $('gridToggle').style.display = '';
    $('gridToggle').textContent = `Browse ${_searchBook} ▾`;
  } else {
    $('gridToggle').style.display = 'none';
  }
}

// Back button — return to chapter grid from verse grid
$('gridBack').addEventListener('click', () => {
  if (_searchBook) showChapterGrid(_searchBook);
});

// Browse toggle — re-expand the grid
$('gridToggle').addEventListener('click', () => {
  if ($('gridWrap').classList.contains('open')) {
    collapseGrid();
  } else if (_searchChapter && _searchBook) {
    showVerseGrid(_searchBook, _searchChapter);
  } else if (_searchBook) {
    showChapterGrid(_searchBook);
  }
  // Toggle the arrow direction
  const btn = $('gridToggle');
  btn.textContent = $('gridWrap').classList.contains('open')
    ? `Browse ${_searchBook} ▴`
    : `Browse ${_searchBook} ▾`;
});
```

**Step 2: Verify**

Open in browser. Type "Genesis" in search, select it from dropdown → should see chapter grid with 50 buttons. Click chapter 1 → should see verse grid with 31 buttons. Back arrow (←) should return to chapter grid. Click verse 1 → should display Genesis 1:1 and collapse the grid. "Browse Genesis ▾" button should appear — clicking it should re-expand the grid.

**Step 3: Commit**

```bash
git add "bible-verse-projector_6.html"
git commit -m "feat: implement cascading chapter/verse grid with collapse and browse toggle"
```

---

## Task 7: Build the Verse Navigation Arrows JS

**Files:**
- Modify: `bible-verse-projector_6.html` — add navigation functions after the grid code (after Task 6's code)

**What to do:**

Insert after the grid toggle click handler:

```javascript

// ═══════════════════════════════════════════════════════════════════════════════
// 8b. VERSE NAVIGATION ARROWS
// ═══════════════════════════════════════════════════════════════════════════════

function updateNavArrows() {
  const show = currentRef && !rangeState && $('vcontent').style.display !== 'none';
  $('vnavPrev').classList.toggle('show', !!show);
  $('vnavNext').classList.toggle('show', !!show);
}

function navigateVerse(direction) {
  if (!currentRef || rangeState) return;

  const book = currentRef.book;
  let ch = parseInt(currentRef.chapter, 10);
  let vs = parseInt(currentRef.verse, 10);
  const counts = BIBLE_VERSE_COUNTS[book];
  if (!counts) return;

  if (direction === 1) {
    // Next verse
    const maxVs = counts[ch - 1];
    if (vs < maxVs) {
      vs++;
    } else if (ch < counts.length) {
      ch++;
      vs = 1;
    } else {
      // Last verse of last chapter — shake the button
      $('vnavNext').classList.add('shake');
      setTimeout(() => $('vnavNext').classList.remove('shake'), 350);
      return;
    }
  } else {
    // Previous verse
    if (vs > 1) {
      vs--;
    } else if (ch > 1) {
      ch--;
      vs = counts[ch - 1]; // last verse of previous chapter
    } else {
      // First verse of first chapter — shake the button
      $('vnavPrev').classList.add('shake');
      setTimeout(() => $('vnavPrev').classList.remove('shake'), 350);
      return;
    }
  }

  const ref = {
    book,
    chapter: String(ch),
    verse: String(vs),
    full: `${book} ${ch}:${vs}`
  };
  displayVerse(ref, $('trans').value);
}

// Click handlers
$('vnavPrev').addEventListener('click', () => navigateVerse(-1));
$('vnavNext').addEventListener('click', () => navigateVerse(1));

// Keyboard shortcuts — Left/Right arrows when no input is focused
document.addEventListener('keydown', e => {
  // Don't intercept if an input/select/textarea is focused
  const tag = document.activeElement?.tagName;
  if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
  // Don't intercept during range playback (range bar has its own arrows)
  if (rangeState) return;

  if (e.key === 'ArrowLeft') {
    e.preventDefault();
    navigateVerse(-1);
  } else if (e.key === 'ArrowRight') {
    e.preventDefault();
    navigateVerse(1);
  }
});
```

**Step 2: Verify**

Open in browser. Display any verse (e.g., type "John 3:16" and press Enter). Left and right arrow buttons should appear on the verse panel edges. Click right arrow → should show John 3:17. Click left arrow → should go back to John 3:16. Press keyboard left/right arrows → should navigate. Navigate to Genesis 1:1, then click left arrow → should shake (no previous verse). Navigate to Revelation 22:21, then click right arrow → should shake (no next verse).

**Step 3: Commit**

```bash
git add "bible-verse-projector_6.html"
git commit -m "feat: implement verse nav arrows with keyboard shortcuts and boundary shake"
```

---

## Task 8: Hook Nav Arrows into displayVerse and clearDisplay

**Files:**
- Modify: `bible-verse-projector_6.html` — add `updateNavArrows()` calls in 3 places

**What to do:**

The nav arrows need to show/hide based on whether a verse is displayed. We need to call `updateNavArrows()` after:
1. A verse is successfully displayed
2. The display is cleared
3. A range starts or ends

**Modification 1:** In `renderVerseContent()` (line ~1697), add `updateNavArrows()` at the end.

Find:
```javascript
  requestAnimationFrame(() => {
    $('vref').classList.add('show');
    $('vdiv').classList.add('show');
    $('vline').classList.add('show');
    $('vtrans').classList.add('show');
  });
}
```

(This is the closing `}` of `renderVerseContent`)

Replace with:
```javascript
  requestAnimationFrame(() => {
    $('vref').classList.add('show');
    $('vdiv').classList.add('show');
    $('vline').classList.add('show');
    $('vtrans').classList.add('show');
  });
  updateNavArrows();
}
```

**Modification 2:** In the clear display handler. Find the section that sets `currentRef = null` (line ~3412):

Find:
```javascript
  currentRef = null; lastDetectedFull = null; accumulated = '';
```

Add after it on a new line:
```javascript
  if (typeof updateNavArrows === 'function') updateNavArrows();
```

**Modification 3:** In `clearRange()` function — find where `rangeBar` is hidden. Find:

```javascript
  $('rangeBar').classList.remove('active');
```

Add after it on a new line:
```javascript
  if (typeof updateNavArrows === 'function') updateNavArrows();
```

**Step 2: Verify**

Open in browser. Display a verse → arrows appear. Clear display → arrows disappear. Start a range (e.g., type "John 3:1-3") → arrows should be hidden while range is active. When range finishes or is cleared → arrows should reappear if a verse is still displayed.

**Step 3: Commit**

```bash
git add "bible-verse-projector_6.html"
git commit -m "feat: hook nav arrows into displayVerse, clearDisplay, and clearRange"
```

---

## Task 9: Update the Clear Button to Reference New Search Input

**Files:**
- Modify: `bible-verse-projector_6.html` — update the clear handler that referenced `$('manInput')`

**What to do:**

Search for any remaining references to `manInput` or `manBtn` in the JS. These need to be updated to `searchInput`.

Find all occurrences. There may be references in:
- The clear display handler (line ~3408-3420)

Find:
```javascript
  $('manInput').value = '';
```

If this line exists, replace with:
```javascript
  $('searchInput').value = '';
```

**Also check:** any other `$('manInput')` or `$('manBtn')` references throughout the file. Replace all `$('manInput')` with `$('searchInput')` and remove any `$('manBtn')` references.

**Step 2: Verify**

Open browser console. Type `$('manInput')` — should return `null` (no longer exists). Type `$('searchInput')` — should return the input element. Click "Clear Display" button — search input should be cleared, no console errors.

**Step 3: Commit**

```bash
git add "bible-verse-projector_6.html"
git commit -m "fix: update clear handler to use new searchInput instead of removed manInput"
```

---

## Task 10: Final Integration Testing

**Files:**
- No code changes — testing only

**Test Plan:**

1. **Smart search — book autocomplete:**
   - Type "Jo" → dropdown shows John, Joshua, Job, Joel, Jonah
   - Type "ps" → dropdown shows Psalms
   - Type "1 co" → dropdown shows 1 Corinthians
   - Use arrow keys to navigate dropdown, Enter to select
   - Press Escape to dismiss

2. **Smart search — reference mode:**
   - Type "John 3:16" and press Enter → displays John 3:16
   - Type "Psalm 23 1" and press Enter → displays Psalm 23:1
   - Type "Romans 8:28" and press Enter → displays Romans 8:28
   - Type "John 3:1-6" and press Enter → starts range playback

3. **Smart search — keyword mode:**
   - Type "For God so loved" → dropdown shows verse results (if FlexSearch loaded)
   - Click a result → displays that verse

4. **Chapter/verse grid:**
   - Type "Genesis", select from dropdown → chapter grid appears (1-50)
   - Click chapter 1 → verse grid appears (1-31), back arrow visible
   - Click back arrow → returns to chapter grid
   - Click chapter 1 again, click verse 1 → displays Genesis 1:1, grid collapses
   - "Browse Genesis ▾" button appears → click to re-expand
   - Select a new verse → grid collapses again

5. **Verse navigation arrows:**
   - Display John 3:16 → left and right arrows visible on verse panel
   - Click right → shows John 3:17
   - Click left → shows John 3:16 again
   - Navigate to Genesis 1:1 → click left arrow → button shakes
   - Navigate to Revelation 22:21 → click right arrow → button shakes
   - Start a range → arrows disappear
   - Clear range → arrows reappear

6. **Keyboard shortcuts:**
   - Display a verse, click away from inputs → press Right arrow → next verse
   - Press Left arrow → previous verse
   - Focus search input → arrow keys should NOT navigate verses (should navigate dropdown instead)

7. **Clear button:**
   - Display a verse, click "Clear Display" → verse clears, arrows disappear, search input clears, no console errors

8. **Existing speech detection:**
   - Turn on microphone, say "John 3:16" → verse displays as before (speech pipeline unchanged)
   - Say a quote without reference → contextual search should still work (unchanged)

**Step 2: Fix any issues found during testing**

**Step 3: Commit any fixes**

```bash
git add "bible-verse-projector_6.html"
git commit -m "fix: address issues found during smart search integration testing"
```

---

## Summary

| Task | Component | Type |
|------|-----------|------|
| 1 | CSS for all three components | Style |
| 2 | Smart search HTML (replaces Manual Lookup) | HTML |
| 3 | Nav arrow HTML in verse panel | HTML |
| 4 | CANON_BOOKS utility array | JS data |
| 5 | Smart search JS — autocomplete + keyboard | JS logic |
| 6 | Chapter/verse grid JS | JS logic |
| 7 | Verse nav arrows JS | JS logic |
| 8 | Hook nav arrows into existing display lifecycle | JS integration |
| 9 | Update clear handler for renamed input | JS fix |
| 10 | End-to-end testing | Testing |

**Total: 10 tasks.** Tasks 1-3 are HTML/CSS (can be done in any order). Task 4 must come before 5. Tasks 5-7 depend on 1-4. Task 8 depends on 7. Task 9 depends on 2. Task 10 is last.
