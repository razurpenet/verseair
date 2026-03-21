/**
 * Vosk Speech Recognition Polyfill
 *
 * Replaces webkitSpeechRecognition / SpeechRecognition with an offline
 * Vosk-based implementation. The existing app code doesn't need to change —
 * this polyfill provides the same event interface (onstart, onresult,
 * onerror, onend, start(), stop()).
 *
 * Loaded BEFORE the app's speech code so window.SpeechRecognition points here.
 */
(function () {
  'use strict';

  const MODEL_URL = '/models/vosk-model-small-en-us.tar.gz';
  let voskModel = null;
  let modelLoading = false;
  let modelLoadPromise = null;

  // Status element for loading feedback
  function showModelStatus(msg) {
    const el = document.getElementById('micStatus');
    if (el) el.textContent = msg;
  }

  async function ensureModel() {
    if (voskModel) return voskModel;
    if (modelLoadPromise) return modelLoadPromise;

    modelLoading = true;
    showModelStatus('Loading speech model…');

    modelLoadPromise = (async () => {
      try {
        // vosk-browser is loaded via a separate <script> tag as Vosk global
        if (typeof Vosk === 'undefined') {
          throw new Error('Vosk library not loaded');
        }
        const model = await Vosk.createModel(MODEL_URL);
        voskModel = model;
        modelLoading = false;
        showModelStatus('✓ Mic ready — click to start');
        return model;
      } catch (err) {
        modelLoading = false;
        modelLoadPromise = null;
        showModelStatus('⚠ Speech model failed to load');
        throw err;
      }
    })();

    return modelLoadPromise;
  }

  /**
   * VoskSpeechRecognition — drop-in replacement for webkitSpeechRecognition
   */
  class VoskSpeechRecognition {
    constructor() {
      this.continuous = false;
      this.interimResults = false;
      this.lang = 'en-US';
      this.maxAlternatives = 1;

      // Event handlers (same interface as native SpeechRecognition)
      this.onstart = null;
      this.onresult = null;
      this.onerror = null;
      this.onend = null;
      this.onaudiostart = null;
      this.onaudioend = null;

      this._recognizer = null;
      this._audioContext = null;
      this._mediaStream = null;
      this._sourceNode = null;
      this._processorNode = null;
      this._running = false;
      this._resultIndex = 0;
    }

    async start() {
      if (this._running) return;

      try {
        const model = await ensureModel();

        // Get microphone stream
        this._mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            channelCount: 1,
            sampleRate: 16000
          }
        });

        // Create audio processing pipeline
        this._audioContext = new AudioContext({ sampleRate: 16000 });
        this._sourceNode = this._audioContext.createMediaStreamSource(this._mediaStream);

        // Create Vosk recognizer at the AudioContext's actual sample rate
        const sampleRate = this._audioContext.sampleRate;
        this._recognizer = new model.KaldiRecognizer(sampleRate);
        this._recognizer.setWords(true);

        // Listen for results from Vosk
        this._recognizer.on('result', (message) => {
          if (!this._running) return;
          const text = message.result?.text;
          if (text && this.onresult) {
            this._fireResult(text, true);
          }
        });

        this._recognizer.on('partialresult', (message) => {
          if (!this._running || !this.interimResults) return;
          const partial = message.result?.partial;
          if (partial && this.onresult) {
            this._fireResult(partial, false);
          }
        });

        // Use ScriptProcessorNode to capture audio chunks
        // (AudioWorklet would be better but requires a separate file)
        const bufferSize = 4096;
        this._processorNode = this._audioContext.createScriptProcessor(bufferSize, 1, 1);
        this._processorNode.onaudioprocess = (event) => {
          if (!this._running || !this._recognizer) return;
          const audioData = event.inputBuffer;
          this._recognizer.acceptWaveform(audioData);
        };

        this._sourceNode.connect(this._processorNode);
        this._processorNode.connect(this._audioContext.destination);

        this._running = true;
        this._resultIndex = 0;

        if (this.onaudiostart) this.onaudiostart(new Event('audiostart'));
        if (this.onstart) this.onstart(new Event('start'));

      } catch (err) {
        const errorEvent = { error: 'not-allowed', message: err.message };
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          errorEvent.error = 'not-allowed';
        } else if (err.message?.includes('model')) {
          errorEvent.error = 'service-not-allowed';
        } else {
          errorEvent.error = 'audio-capture';
        }
        if (this.onerror) this.onerror(errorEvent);
        if (this.onend) this.onend(new Event('end'));
      }
    }

    stop() {
      if (!this._running) return;
      this._running = false;

      // Get any remaining audio
      if (this._recognizer) {
        try { this._recognizer.retrieveFinalResult(); } catch (e) {}
      }

      this._cleanup();

      if (this.onaudioend) this.onaudioend(new Event('audioend'));
      if (this.onend) this.onend(new Event('end'));
    }

    abort() {
      this._running = false;
      this._cleanup();
      if (this.onend) this.onend(new Event('end'));
    }

    _cleanup() {
      if (this._processorNode) {
        this._processorNode.disconnect();
        this._processorNode = null;
      }
      if (this._sourceNode) {
        this._sourceNode.disconnect();
        this._sourceNode = null;
      }
      if (this._audioContext && this._audioContext.state !== 'closed') {
        this._audioContext.close().catch(() => {});
        this._audioContext = null;
      }
      // Don't stop the media stream — the app manages sharedStream separately
    }

    /**
     * Fire an onresult event that matches the native SpeechRecognition format:
     *   event.results[i][0].transcript
     *   event.results[i].isFinal
     *   event.resultIndex
     */
    _fireResult(text, isFinal) {
      const resultItem = {
        0: { transcript: text, confidence: isFinal ? 0.9 : 0.5 },
        length: 1,
        isFinal: isFinal
      };

      // Build results array — for continuous mode, accumulate
      const resultIndex = this._resultIndex;
      const results = {
        length: resultIndex + 1,
        [resultIndex]: resultItem
      };

      const event = {
        type: 'result',
        resultIndex: resultIndex,
        results: results
      };

      if (isFinal) {
        this._resultIndex++;
      }

      this.onresult(event);
    }
  }

  // Override the native SpeechRecognition with our Vosk polyfill
  window.SpeechRecognition = VoskSpeechRecognition;
  window.webkitSpeechRecognition = VoskSpeechRecognition;

  // Pre-load the model in the background so it's ready when the user clicks mic
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(ensureModel, 1000));
  } else {
    setTimeout(ensureModel, 1000);
  }

  console.log('[VerseAir] Vosk offline speech recognition polyfill loaded');
})();
