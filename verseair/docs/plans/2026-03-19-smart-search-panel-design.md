# Smart Bible Search Panel + Verse Navigation — Design Document

**Date:** 2026-03-19
**Status:** Approved, ready for implementation
**Goal:** Replace the basic Manual Lookup with a smart search panel featuring autocomplete, browsable chapter/verse grids, and add next/previous verse navigation arrows to the verse display.

---

## Problem Statement

VerseAir's current Manual Lookup is a plain text input with a "Look Up" button. The operator must type an exact reference like "John 3:16" and click the button. There is no autocomplete, no browsing capability, no way to explore chapters/verses when the operator doesn't know the exact reference. Additionally, once a verse is displayed, there's no way to quickly step forward or backward through verses without typing a new reference.

---

## Design: Three Components

### Component 1: Smart Search Bar (replaces Manual Lookup)

A single input field that auto-detects intent:

- **Reference mode**: typing "John 3:16", "Ps 23:1", "1 Cor 13" → parsed as a reference, displayed immediately on Enter
- **Keyword mode**: typing "For God so loved" (no book name match) → searches verse text, shows results in a dropdown

**Detection logic:** If the first word(s) match a Bible book name or alias (including Nigerian accent variants already in `BOOK_MAP`), treat as reference. Otherwise, treat as keyword search using the existing FlexSearch index (Tier 2 from contextual search).

**Autocomplete dropdown** appears below the input as the operator types:
- Shows matching book names first (e.g., typing "Jo" → John, Joshua, Job, Joel, Jonah)
- If in keyword mode, shows matching verses (up to 6 results) with reference + preview text
- Arrow keys to navigate, Enter to select
- Dropdown dismisses on selection or Escape

**No separate "Look Up" button** — Enter key triggers lookup.

---

### Component 2: Cascading Chapter → Verse Grid

When the operator selects a book (from autocomplete or types a valid book name), a compact grid appears below the search bar.

**Chapter grid:**
- Small numbered buttons in a wrapping grid (e.g., Genesis shows buttons 1–50)
- Buttons are ~32px squares, gold border, dark background
- Current/selected chapter gets gold fill
- Grid scrolls if the book has many chapters (max-height ~120px)
- Label above: "Genesis — Select Chapter"

**Verse grid (replaces chapter grid after chapter tap):**
- Same style numbered buttons, now showing verse numbers for that chapter
- Label above: "Genesis 1 — Select Verse" with a back arrow to return to chapter grid
- Tapping a verse calls `displayVerse()` and collapses the grid
- Grid auto-collapses after selection to save space

**Collapse behaviour:**
- Grid is hidden by default — only appears after book selection
- Collapses after verse is displayed
- Small "Browse ▾" toggle button to re-expand if needed
- Typing a new query in the search bar resets/collapses the grid

---

### Component 3: Next/Previous Verse Navigation Arrows

Persistent navigation arrows on the center verse display panel, visible whenever a verse is currently displayed.

**Placement:**
- Left arrow (←) on the left edge of the verse panel, vertically centered
- Right arrow (→) on the right edge of the verse panel, vertically centered
- Semi-transparent by default, brighten on hover

**Behaviour:**
- **Next (→):** advances to the next verse in the same chapter. If at the last verse of a chapter, wraps to chapter+1 verse 1. If at the last verse of the last chapter of the book, does nothing (subtle shake animation).
- **Previous (←):** goes to the previous verse. If at verse 1, wraps to the last verse of the previous chapter. If at chapter 1 verse 1 of the book, does nothing.
- Uses the existing `BOOK_NUMBERS` data to know verse/chapter bounds
- Calls `displayVerse()` with the computed next/previous reference
- Updates session history with each navigation
- Works regardless of how the verse was originally displayed (speech, manual lookup, contextual search, or grid selection)

**Styling:**
- 40px circular buttons, `var(--gold)` border, transparent background
- Hover: gold fill, scale up slightly
- Hidden when no verse is displayed (empty state showing)
- Hidden when range bar is active (range bar has its own prev/next)

**Keyboard shortcut:** Left/Right arrow keys when no input field is focused.

---

## Integration: What Gets Modified

### Replaced
- `#manInput` text input → new smart search input with autocomplete
- `#manBtn` "Look Up" button → removed (Enter key replaces it)

### New Code (additive)

| Component | Purpose |
|---|---|
| Smart search input + autocomplete dropdown | HTML/CSS in left panel replacing Manual Lookup |
| `handleSearchInput(query)` | Detects reference vs keyword, triggers autocomplete |
| `showBookAutocomplete(query)` | Filters `BOOK_MAP` entries, renders dropdown |
| `showKeywordResults(query)` | Queries FlexSearch index, renders verse results in dropdown |
| `showChapterGrid(book)` | Renders chapter number buttons for selected book |
| `showVerseGrid(book, chapter)` | Renders verse number buttons for selected chapter |
| `navigateVerse(direction)` | Computes next/prev verse, calls `displayVerse()` |
| Nav arrow HTML | Two buttons added to verse panel |
| Nav arrow CSS | Styling for arrows, hover, hidden states |
| Grid CSS | Styling for chapter/verse grids |
| Autocomplete CSS | Styling for dropdown |

### Untouched (zero changes)
- `displayVerse()` — called as-is with a reference
- `renderVerseContent()` — unchanged
- `fetchVerse()` — unchanged
- `extractRef()` — unchanged
- Range bar and its own prev/next buttons — unchanged
- Contextual search panel — unchanged
- All existing verse panel CSS — unchanged

### Data Sources (all existing, no new dependencies)
- Book names: existing `BOOK_MAP` (200+ aliases including Nigerian accent variants)
- Chapter/verse counts: existing `BOOK_NUMBERS` object
- Keyword search: existing FlexSearch index (Tier 2 from contextual search)
- Translation: reads from existing `#trans` dropdown

**Zero new external dependencies.**

---

## UI Mockup: Left Panel (Manual Lookup section)

```
┌──────────────────────────────────┐
│ 🔍 Search                       │
│ ┌──────────────────────────────┐ │
│ │ Jo                        ↵  │ │
│ └──────────────────────────────┘ │
│ ┌──────────────────────────────┐ │
│ │  📖 John                     │ │
│ │  📖 Joshua                   │ │
│ │  📖 Job                      │ │
│ │  📖 Joel                     │ │
│ │  📖 Jonah                    │ │
│ └──────────────────────────────┘ │
└──────────────────────────────────┘

After selecting "John":

┌──────────────────────────────────┐
│ 🔍 Search                       │
│ ┌──────────────────────────────┐ │
│ │ John                      ↵  │ │
│ └──────────────────────────────┘ │
│ John — Select Chapter            │
│ ┌──┬──┬──┬──┬──┬──┬──┬──┬──┐   │
│ │ 1│ 2│ 3│ 4│ 5│ 6│ 7│ 8│ 9│   │
│ ├──┼──┼──┼──┼──┼──┼──┼──┼──┤   │
│ │10│11│12│13│14│15│16│17│18│   │
│ ├──┼──┼──┼──┼──┼──┤           │
│ │19│20│21│              │      │
│ └──┴──┴──┘              │      │
└──────────────────────────────────┘

After selecting Chapter 3:

┌──────────────────────────────────┐
│ ← John 3 — Select Verse         │
│ ┌──┬──┬──┬──┬──┬──┬──┬──┬──┐   │
│ │ 1│ 2│ 3│ 4│ 5│ 6│ 7│ 8│ 9│   │
│ ├──┼──┼──┼──┼──┼──┼──┼──┼──┤   │
│ │10│11│12│13│14│15│16│17│18│   │
│ ├──┼──┼──┼──┼──┼──┼──┼──┼──┤   │
│ │19│20│21│22│23│24│25│26│27│   │
│ ├──┼──┼──┼──┼──┼──┼──┼──┼──┤   │
│ │28│29│30│31│32│33│34│35│36│   │
│ └──┴──┴──┴──┴──┘               │
└──────────────────────────────────┘
```

## UI Mockup: Verse Panel Nav Arrows

```
┌──────────────────────────────────────────┐
│                                          │
│  ←                                   →   │
│       JOHN 3:16                          │
│       ─────────                          │
│       "For God so loved the world,       │
│        that he gave his only begotten    │
│        Son, that whosoever believeth     │
│        in him should not perish, but     │
│        have everlasting life."           │
│                                          │
│       King James Version                 │
│                                          │
└──────────────────────────────────────────┘
```

---

*This document was approved during a brainstorming session on 2026-03-19. Proceed with writing-plans skill for implementation planning.*
