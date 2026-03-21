/**
 * Azure Speech Recognition Polyfill
 *
 * Replaces webkitSpeechRecognition / SpeechRecognition with Azure Cognitive
 * Services Speech SDK for real-time streaming speech recognition.
 *
 * - Real-time word-by-word results (interim + final) — same as Web Speech API
 * - Streaming via WebSocket — no chunking delay
 * - API key stored securely in Electron's userData (never hardcoded)
 * - Same event interface as native SpeechRecognition
 *
 * Requires: azure-speech-sdk.js loaded first (provides window.SpeechSDK)
 */
(function () {
  'use strict';

  const AZURE_REGION = 'uksouth';

  let speechConfig = null;
  let configLoaded = false;
  let configPromise = null;
  let keyDialogOpen = false;

  // ── Azure output cleaning ──
  // Azure Speech adds sentence punctuation and formatting that the verse
  // detection parsers don't expect. Clean it before firing events.
  function cleanAzureText(text) {
    let t = text;
    // Strip trailing sentence punctuation (Azure adds "." to final results)
    t = t.replace(/[.!?;]+$/g, '');
    // Remove commas not between digits
    t = t.replace(/(\D),\s*/g, '$1 ');
    t = t.replace(/,(\D)/g, ' $1');
    // Normalize fancy quotes/dashes
    t = t.replace(/[\u2018\u2019\u201C\u201D]/g, "'");
    t = t.replace(/[\u2013\u2014]/g, '-');
    // Collapse whitespace
    t = t.replace(/\s+/g, ' ');
    return t.trim();
  }

  function showStatus(msg) {
    const el = document.getElementById('micStatus');
    if (el) el.textContent = msg;
  }

  // ── Custom key-entry dialog (Electron blocks window.prompt) ──
  function showKeyDialog() {
    return new Promise((resolve) => {
      if (keyDialogOpen) { resolve(null); return; }
      keyDialogOpen = true;

      const overlay = document.createElement('div');
      overlay.id = 'va-key-overlay';
      overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.75);';

      overlay.innerHTML = `
        <div style="background:#1a1b1e;border:1px solid #333;border-radius:12px;padding:28px 32px;max-width:460px;width:90%;font-family:system-ui,sans-serif;color:#e0e0e0;">
          <h2 style="margin:0 0 8px;font-size:18px;color:#fff;">VerseAir Speech Setup</h2>
          <p style="margin:0 0 16px;font-size:13px;color:#999;line-height:1.5;">
            Enter your Azure Speech API key to enable voice recognition.<br>
            <span style="color:#666;">Get a free key at portal.azure.com &rarr; Speech &rarr; Keys and Endpoint</span>
          </p>
          <input id="va-key-input" type="password" placeholder="Paste your API key here"
            style="width:100%;padding:10px 12px;font-size:14px;background:#111;border:1px solid #444;border-radius:6px;color:#fff;outline:none;box-sizing:border-box;margin-bottom:16px;" />
          <div style="display:flex;gap:10px;justify-content:flex-end;">
            <button id="va-key-cancel" style="padding:8px 18px;font-size:13px;background:transparent;border:1px solid #555;border-radius:6px;color:#aaa;cursor:pointer;">Cancel</button>
            <button id="va-key-save" style="padding:8px 18px;font-size:13px;background:#2563eb;border:none;border-radius:6px;color:#fff;cursor:pointer;font-weight:600;">Save & Connect</button>
          </div>
        </div>`;

      document.body.appendChild(overlay);

      const input = document.getElementById('va-key-input');
      const saveBtn = document.getElementById('va-key-save');
      const cancelBtn = document.getElementById('va-key-cancel');

      input.focus();

      function cleanup(value) {
        keyDialogOpen = false;
        overlay.remove();
        resolve(value);
      }

      saveBtn.addEventListener('click', () => {
        const key = input.value.trim();
        if (key) cleanup(key);
      });

      cancelBtn.addEventListener('click', () => cleanup(null));

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const key = input.value.trim();
          if (key) cleanup(key);
        } else if (e.key === 'Escape') {
          cleanup(null);
        }
      });
    });
  }

  // ── Load Azure credentials from main process ──
  async function ensureConfig() {
    if (configLoaded && speechConfig && speechConfig.key) return speechConfig;
    if (configPromise) return configPromise;

    configPromise = (async () => {
      if (!window.verseairAPI || !window.verseairAPI.getSpeechConfig) {
        throw new Error('verseairAPI not available');
      }

      let config = await window.verseairAPI.getSpeechConfig();

      // First-run or invalid key: show dialog
      if (!config || !config.key) {
        showStatus('⚙ Enter your API key to start...');
        const key = await showKeyDialog();

        if (!key) {
          configPromise = null;
          throw new Error('No API key provided');
        }

        await window.verseairAPI.setSpeechConfig(key, AZURE_REGION);
        config = { key, region: AZURE_REGION };
      }

      speechConfig = config;
      configLoaded = true;
      return config;
    })();

    return configPromise;
  }

  /**
   * AzureSpeechRecognition — drop-in replacement for webkitSpeechRecognition
   */
  class AzureSpeechRecognition {
    constructor() {
      this.continuous = false;
      this.interimResults = false;
      this.lang = 'en-US';
      this.maxAlternatives = 1;

      this.onstart = null;
      this.onresult = null;
      this.onerror = null;
      this.onend = null;
      this.onaudiostart = null;
      this.onaudioend = null;
      this.deviceId = '';  // set by caller to use a specific mic

      this._running = false;
      this._recognizer = null;
      this._resultIndex = 0;
    }

    async start() {
      if (this._running) {
        console.log('[VerseAir] Already running, skipping start');
        return;
      }

      console.log('[VerseAir] Starting Azure Speech recognition...');

      // Close previous recognizer if restarting (keep-alive pattern)
      if (this._recognizer) {
        try { this._recognizer.close(); } catch (_) {}
        this._recognizer = null;
      }

      try {
        const config = await ensureConfig();
        console.log('[VerseAir] Config loaded, region:', config.region);
        const sdk = window.SpeechSDK;

        if (!sdk) {
          throw new Error('Azure Speech SDK not loaded');
        }

        // Create speech config
        const azureConfig = sdk.SpeechConfig.fromSubscription(config.key, config.region);
        azureConfig.speechRecognitionLanguage = this.lang || 'en-US';

        // Use selected microphone (or default if none specified)
        console.log('[VerseAir] Device ID:', this.deviceId || '(default)');
        const audioConfig = this.deviceId
          ? sdk.AudioConfig.fromMicrophoneInput(this.deviceId)
          : sdk.AudioConfig.fromDefaultMicrophoneInput();

        // Create recognizer
        this._recognizer = new sdk.SpeechRecognizer(azureConfig, audioConfig);

        // ── INTERIM results (recognizing) ──
        // Fires continuously as the user speaks — word by word, like Web Speech API
        this._recognizer.recognizing = (sender, e) => {
          if (!this._running || !this.onresult) return;
          if (e.result.reason === sdk.ResultReason.RecognizingSpeech) {
            const text = e.result.text;
            if (text) {
              this._fireResult(cleanAzureText(text), false); // interim
            }
          }
        };

        // ── FINAL results (recognized) ──
        // Fires when Azure finalizes a phrase/sentence
        this._recognizer.recognized = (sender, e) => {
          if (!this._running || !this.onresult) return;
          if (e.result.reason === sdk.ResultReason.RecognizedSpeech) {
            const text = e.result.text;
            if (text) {
              const cleaned = cleanAzureText(text);
              if (cleaned) {
                console.log('[VerseAir] Azure heard:', JSON.stringify(text), '→', JSON.stringify(cleaned));
                this._fireResult(cleaned, true); // final
              }
            }
          }
        };

        // ── Error handling ──
        this._recognizer.canceled = (sender, e) => {
          if (e.reason === sdk.CancellationReason.Error) {
            console.error('[VerseAir] Azure Speech error:', e.errorDetails);

            // If auth fails, clear stored key so user can re-enter on next attempt
            if (e.errorCode === sdk.CancellationErrorCode.AuthenticationFailure) {
              configLoaded = false;
              configPromise = null;
              speechConfig = null;
              window.verseairAPI.setSpeechConfig('', '');
              showStatus('⚠ Invalid API key — click mic to re-enter');
            }

            if (this.onerror) {
              this.onerror({
                error: e.errorCode === sdk.CancellationErrorCode.AuthenticationFailure
                  ? 'not-allowed' : 'network',
                message: e.errorDetails
              });
            }
          }

          if (this._running) {
            this._running = false;
            if (this.onaudioend) this.onaudioend(new Event('audioend'));
            if (this.onend) this.onend(new Event('end'));
          }
        };

        // ── Session events ──
        this._recognizer.sessionStopped = (sender, e) => {
          if (this._running) {
            this._running = false;
            if (this.onaudioend) this.onaudioend(new Event('audioend'));
            if (this.onend) this.onend(new Event('end'));
          }
        };

        // Start continuous recognition
        this._running = true;
        this._resultIndex = 0;

        await new Promise((resolve, reject) => {
          this._recognizer.startContinuousRecognitionAsync(
            () => resolve(),
            (err) => reject(new Error(err))
          );
        });

        console.log('[VerseAir] Azure recognition started successfully');
        if (this.onaudiostart) this.onaudiostart(new Event('audiostart'));
        if (this.onstart) this.onstart(new Event('start'));

        showStatus('● Listening…');

      } catch (err) {
        console.error('[VerseAir] Azure Speech start error:', err);
        const errorEvent = { error: 'audio-capture', message: err.message };
        if (err.message.includes('API key') || err.message.includes('auth')) {
          errorEvent.error = 'not-allowed';
        }
        if (this.onerror) this.onerror(errorEvent);
        if (this.onend) this.onend(new Event('end'));
      }
    }

    stop() {
      if (!this._running) return;
      this._running = false;

      if (this._recognizer) {
        this._recognizer.stopContinuousRecognitionAsync(
          () => {
            if (this.onaudioend) this.onaudioend(new Event('audioend'));
            if (this.onend) this.onend(new Event('end'));
          },
          (err) => {
            console.error('[VerseAir] Stop error:', err);
            if (this.onend) this.onend(new Event('end'));
          }
        );
      }
    }

    abort() {
      this._running = false;
      if (this._recognizer) {
        this._recognizer.stopContinuousRecognitionAsync(() => {}, () => {});
        this._recognizer.close();
        this._recognizer = null;
      }
      if (this.onend) this.onend(new Event('end'));
    }

    _fireResult(text, isFinal) {
      const resultItem = {
        0: { transcript: text, confidence: 0.95 },
        length: 1,
        isFinal: isFinal
      };

      const resultIndex = this._resultIndex;

      const results = {
        length: resultIndex + 1,
        [resultIndex]: resultItem
      };

      this.onresult({
        type: 'result',
        resultIndex: resultIndex,
        results: results
      });

      if (isFinal) this._resultIndex++;
    }
  }

  // Override native SpeechRecognition
  window.SpeechRecognition = AzureSpeechRecognition;
  window.webkitSpeechRecognition = AzureSpeechRecognition;

  // Pre-check for stored config
  if (window.verseairAPI && window.verseairAPI.hasSpeechConfig) {
    window.verseairAPI.hasSpeechConfig().then(hasKey => {
      if (hasKey) {
        showStatus('✓ Mic ready — click to start');
      } else {
        showStatus('⚙ Click mic to set up speech recognition');
      }
    });
  }

  console.log('[VerseAir] Azure Speech recognition polyfill loaded');
})();
