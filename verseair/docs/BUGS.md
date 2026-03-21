# VerseAir Bug History

Resolved bugs documented for reference. Most recent first.

---

## BUG-017: Search Index Loading from CDN (2026-03-21)
**Symptom**: "Search index unavailable — context search limited" on every app start
**Root cause**: `initSearchIndex()` downloaded 66 books from `cdn.jsdelivr.net` instead of using the bundled `kjv-full.json`
**Fix**: Rewired to `fetch('/kjv-full.json')` — instant, no network needed

## BUG-016: CSP Blocking Azure WebSocket (2026-03-20)
**Symptom**: Mic button clicks but speech recognition never starts
**Root cause**: CSP `connect-src` didn't include Azure WebSocket endpoints; `script-src` didn't include `blob:` for Azure Web Workers
**Fix**: Added `wss://*.speech.microsoft.com`, `wss://*.stt.speech.microsoft.com`, `https://*.cognitiveservices.azure.com` to connect-src; added `blob:` to script-src

## BUG-015: Browser-Style Permission Dialogs in Electron (2026-03-20)
**Symptom**: App shows browser microphone permission prompt
**Root cause**: Only `setPermissionRequestHandler` was set — missing `setPermissionCheckHandler` caused `navigator.permissions.query()` to return `'prompt'`
**Fix**: Added `setPermissionCheckHandler` to auto-approve mic checks; removed browser permission logic from renderer

## BUG-014: Mic Conflict Between getUserMedia and Azure SDK (2026-03-20)
**Symptom**: "Click to start listening" button doesn't work after adding mic dropdown
**Root cause**: `acquireMicStream()` held the mic via getUserMedia, then Azure SDK tried to open the same mic
**Fix**: Removed sharedStream/acquireMicStream; Azure SDK manages its own mic. Added `deviceId` property to polyfill

## BUG-013: recognition.start() Not Awaited (2026-03-20)
**Symptom**: Errors silently swallowed when speech recognition fails to start
**Root cause**: Azure polyfill `start()` is async but was called without `await`
**Fix**: Added `await recognition.start()` in startListening() and keep-alive onend handler

## BUG-012: Duplicate Verse Detection on Interim Results (2026-03-19)
**Symptom**: Same verse detected and displayed multiple times rapidly
**Root cause**: `lastDetectedFull` was reset to null immediately
**Fix**: Added timed reset window to prevent re-fires from rapid interim updates

## BUG-011: Translation Switch Bug (2026-03-19)
**Symptom**: Voice command "amplified bible" doesn't switch translation
**Root cause**: Condition checked `finalCode !== transMatch.code` (always false) instead of `finalCode !== prevCode`
**Fix**: Corrected comparison to check against previous translation code

## BUG-010: Merged Number Parsing (2026-03-19)
**Symptom**: "John 316" not detected (Azure outputs digits without separator)
**Root cause**: No pattern for 3-5 digit merged numbers
**Fix**: Added `MERGED_NUM_RE` to contextually split merged digits (e.g., 316 → 3:16)

## BUG-009: Slash Separator Not Recognized (2026-03-19)
**Symptom**: "Romans 11/3" not detected as verse reference
**Root cause**: Only `:` recognized as chapter:verse separator
**Fix**: Added `/` → `:` normalization in `preNormalise()`

## BUG-008: Voice Mode Blocking All Detection (2026-03-19)
**Symptom**: No verses detected while voice-guided reading mode is active
**Root cause**: `return` statement in voice mode handler blocked ALL verse detection
**Fix**: Allow detection to run and break out of voice mode when new reference spoken

## BUG-007: Apocryphal Book Numbers from Bolls.life (2026-03-19)
**Symptom**: "Book 71" displayed instead of verse text
**Root cause**: Bolls.life returned book number 71 (Sirach), outside 66-book Protestant canon
**Fix**: Filter results to valid Protestant book numbers only (1-66)

## BUG-006: Contextual Search Snippet Pollution (2026-03-19)
**Symptom**: Contextual search returns irrelevant results
**Root cause**: 600-char accumulated speech window mixed old phrases with current quote
**Fix**: Pass only the latest `finalChunk` to contextual search

## BUG-005: FlexSearch Index Never Built (2026-03-19)
**Symptom**: Tier 2 search always returns empty
**Root cause**: Code iterated array of book name strings but treated them as objects with `.name` property
**Fix**: Corrected iteration logic

## BUG-004: Bolls.life API Response Parsing (2026-03-19)
**Symptom**: Contextual search shows HTML tags in results
**Root cause**: API returns `{"results": [...]}` not `[...]`; text contains `<S>` and `<mark>` tags; book field is number not name
**Fix**: Unwrap response, reverse book lookup, strip HTML tags

## BUG-003: IDB Version Conflict (2026-03-19)
**Symptom**: IndexedDB errors on app start
**Root cause**: `idbOpen()` hardcoded version 1 after upgrade to v2 for search store
**Fix**: Open without version number + connection recovery logic

## BUG-002: IDB Race Condition (2026-03-19)
**Symptom**: Intermittent IndexedDB transaction failures
**Root cause**: `warmMemoryCacheFromIDB()` opened DB at v1, then `initSearchIndex()` closed it and reopened at v2, killing in-flight transactions
**Fix**: Added 2-second delay before search index init

## BUG-001: ELECTRON_RUN_AS_NODE Breaking Electron (2026-03-18)
**Symptom**: App crashes when launched from VSCode terminal
**Root cause**: VSCode/Claude Code sets `ELECTRON_RUN_AS_NODE=1`, forcing Electron to run as plain Node.js
**Fix**: Created `launch.js` that deletes the env var before spawning Electron
