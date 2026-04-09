/* ============================================================
   Kisan Dost — Voice + TTS Module  v3.0
   
   Engines:
   ─ WhisperEngine   : offline speech-to-text via Web Worker
   ─ BrowserSREngine : online fallback (webkitSpeechRecognition)
   ─ TTSEngine       : browser speechSynthesis with voice preload
                       + Chrome resume-bug workaround
   ============================================================ */

const Speech = (() => {

  /* ── state ── */
  let _isListening    = false;
  let _weatherContext = null;
  let _statusCb       = null;
  let _resultCb       = null;

  const LANG_BCP47   = { en: 'en-IN', hi: 'hi-IN', mr: 'mr-IN', bn: 'bn-IN' };
  const WHISPER_LANG = { en: 'english', hi: 'hindi', mr: 'marathi', bn: 'bengali' };

  function _lang() {
    return (typeof I18n !== 'undefined') ? I18n.getLang() : 'hi';
  }
  function _emit(status) { if (_statusCb) _statusCb(status); }

  /* ================================================================
     1. TTS ENGINE  — robust voice loading with Chrome fixes
     ================================================================ */
  const TTSEngine = (() => {
    let _voices        = [];
    let _voicesLoaded  = false;
    let _resumeTimer   = null;

    function isSupported() { return 'speechSynthesis' in window; }

    /* Load voices — may be async in Chrome */
    function _loadVoices() {
      if (!isSupported()) return;
      const list = window.speechSynthesis.getVoices();
      if (list.length > 0) {
        _voices       = list;
        _voicesLoaded = true;
        console.log('[TTS] Voices loaded:', list.length,
          list.slice(0, 5).map(v => `${v.lang}:${v.name}`).join(', '));
      }
    }

    /* Init: try immediately, then wait for voiceschanged */
    function init() {
      if (!isSupported()) return;
      _loadVoices();
      if (!_voicesLoaded) {
        window.speechSynthesis.addEventListener('voiceschanged', () => {
          _loadVoices();
        });
        /* Fallback poll for Firefox / Edge timing */
        const poll = setInterval(() => {
          _loadVoices();
          if (_voicesLoaded) clearInterval(poll);
        }, 200);
        setTimeout(() => clearInterval(poll), 3000);
      }
    }

    /* Pick the best voice for a BCP-47 lang tag */
    function _pickVoice(bcp47) {
      if (!_voicesLoaded) _loadVoices();
      const prefix = bcp47.split('-')[0];               // 'hi', 'en', …

      /* Priority order */
      return (
        _voices.find(v => v.lang === bcp47)           ||  // exact:  hi-IN
        _voices.find(v => v.lang.startsWith(prefix + '-')) || // hi-*
        _voices.find(v => v.lang.startsWith(prefix))  ||  // hi*
        null
      );
    }

    /* Speak text — fixes Chrome's pause-after-15s bug */
    function speak(text, lang) {
      if (!isSupported() || !text) return;

      /* Stop any previous speech */
      stop();

      const bcp47 = LANG_BCP47[lang || _lang()] || 'hi-IN';

      /* Small delay ensures cancel() takes effect in Chrome */
      setTimeout(() => {
        const utt   = new SpeechSynthesisUtterance(text);
        utt.lang    = bcp47;
        utt.rate    = 0.88;
        utt.pitch   = 1;
        utt.volume  = 1;

        const voice = _pickVoice(bcp47);
        if (voice) {
          utt.voice = voice;
          console.log('[TTS] Using voice:', voice.name, voice.lang);
        } else {
          console.warn('[TTS] No matching voice for', bcp47, '— using browser default');
        }

        utt.onstart = () => {
          console.log('[TTS] Speaking started');
          /* Chrome bug: speechSynthesis stops after ~15 s; keep it alive */
          _resumeTimer = setInterval(() => {
            if (window.speechSynthesis.speaking && window.speechSynthesis.paused) {
              window.speechSynthesis.resume();
            }
          }, 5000);
        };
        utt.onend  = () => { clearInterval(_resumeTimer); console.log('[TTS] Done'); };
        utt.onerror = (e) => {
          clearInterval(_resumeTimer);
          console.warn('[TTS] Error:', e.error);

          /* 'not-allowed' usually means no user gesture yet — retry after 300 ms */
          if (e.error === 'not-allowed') {
            console.warn('[TTS] Not-allowed — queuing retry after user interaction');
          }
        };

        window.speechSynthesis.speak(utt);
      }, 120);
    }

    function stop() {
      clearInterval(_resumeTimer);
      if (isSupported()) {
        try { window.speechSynthesis.cancel(); } catch (_) {}
      }
    }

    return { isSupported, init, speak, stop };
  })();

  /* Initialise TTS voice list as early as possible */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => TTSEngine.init());
  } else {
    TTSEngine.init();
  }

  /* ================================================================
     2. WHISPER ENGINE  — singleton Web Worker + ScriptProcessor mic
     ================================================================ */
  const WhisperEngine = (() => {
    let _worker       = null;
    let _modelReady   = false;
    let _modelLoading = false;
    let _progressCb   = null;
    let _pendingId    = 0;
    let _pendingRes   = null;
    let _pendingRej   = null;

    /* Mic recording */
    let _stream    = null;
    let _audioCtx  = null;
    let _source    = null;
    let _processor = null;
    let _chunks    = [];
    let _recording = false;

    function isSupported() {
      return (
        typeof Worker !== 'undefined' &&
        typeof WebAssembly !== 'undefined' &&
        !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) &&
        (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined')
      );
    }

    function _getWorker() {
      if (_worker) return _worker;
      try {
        _worker = new Worker('js/whisper-worker.js', { type: 'module' });
        _worker.onmessage = _onMsg;
        _worker.onerror   = (e) => {
          console.error('[Whisper] Worker error:', e.message);
          _worker       = null;
          _modelReady   = false;
          _modelLoading = false;
          if (_pendingRej) { _pendingRej(new Error(e.message)); _pendingRej = null; }
          if (_progressCb) _progressCb({ type: 'ERROR', message: e.message });
        };
      } catch (e) {
        console.warn('[Whisper] Cannot create worker:', e.message);
        _worker = null;
      }
      return _worker;
    }

    function _onMsg(e) {
      const { type, progress, file, text, message } = e.data;
      if (type === 'MODEL_LOADING') {
        _modelLoading = true;
        if (_progressCb) _progressCb({ type, progress, file });
      } else if (type === 'MODEL_READY') {
        _modelReady   = true;
        _modelLoading = false;
        if (_progressCb) _progressCb({ type: 'MODEL_READY' });
      } else if (type === 'TRANSCRIBE_RESULT') {
        if (_pendingRes) { _pendingRes(text || ''); _pendingRes = null; _pendingRej = null; }
      } else if (type === 'ERROR') {
        if (_pendingRej) { _pendingRej(new Error(message)); _pendingRes = null; _pendingRej = null; }
        if (_progressCb) _progressCb({ type: 'ERROR', message });
      }
    }

    function preload(onProgress) {
      _progressCb = onProgress;
      if (!isSupported()) return;
      const w = _getWorker();
      if (!w) return;
      if (_modelReady) { if (onProgress) onProgress({ type: 'MODEL_READY' }); return; }
      if (!_modelLoading) w.postMessage({ type: 'LOAD_MODEL' });
    }

    async function startRecording() {
      if (_recording) return;
      _chunks = [];
      _stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, sampleRate: 16000, echoCancellation: true, noiseSuppression: true },
        video: false
      });
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      _audioCtx  = new AudioCtx({ sampleRate: 16000 });
      _source    = _audioCtx.createMediaStreamSource(_stream);
      _processor = _audioCtx.createScriptProcessor(4096, 1, 1);
      _processor.onaudioprocess = (e) => {
        if (_recording) _chunks.push(new Float32Array(e.inputBuffer.getChannelData(0)));
      };
      _source.connect(_processor);
      _processor.connect(_audioCtx.destination);
      _recording = true;
    }

    async function stopRecording() {
      if (!_recording) throw new Error('Not recording');
      _recording = false;
      try {
        _processor?.disconnect();
        _source?.disconnect();
        _stream?.getTracks().forEach(t => t.stop());
        await _audioCtx?.close();
      } catch (_) {}

      const total  = _chunks.reduce((a, c) => a + c.length, 0);
      const audio  = new Float32Array(total);
      let   offset = 0;
      for (const c of _chunks) { audio.set(c, offset); offset += c.length; }
      _chunks = [];
      return audio;
    }

    function transcribeAudio(audioData, lang) {
      return new Promise((resolve, reject) => {
        const w = _getWorker();
        if (!w) { reject(new Error('Whisper worker unavailable')); return; }
        _pendingRes = resolve;
        _pendingRej = reject;
        _pendingId++;
        const id      = _pendingId;
        const payload = { audioData, language: WHISPER_LANG[lang] || 'hindi' };

        const _send = () =>
          w.postMessage({ type: 'TRANSCRIBE', id, payload }, [audioData.buffer]);

        if (_modelReady) {
          _send();
        } else {
          const origCb = _progressCb;
          _progressCb = (info) => {
            if (origCb) origCb(info);
            if (info.type === 'MODEL_READY') { _progressCb = origCb; _send(); }
          };
          if (!_modelLoading) w.postMessage({ type: 'LOAD_MODEL' });
        }
        setTimeout(() => {
          if (_pendingRej) {
            _pendingRej(new Error('Whisper timeout')); _pendingRes = null; _pendingRej = null;
          }
        }, 60000);
      });
    }

    function isRecording()  { return _recording;  }
    function isModelReady() { return _modelReady;  }

    return { isSupported, preload, startRecording, stopRecording, transcribeAudio, isRecording, isModelReady };
  })();

  /* ================================================================
     3. BROWSER SR ENGINE  — online fallback
     ================================================================ */
  const BrowserSREngine = (() => {
    let _rec    = null;
    let _active = false;
    function isSupported() { return !!(window.SpeechRecognition || window.webkitSpeechRecognition); }
    function listen(lang) {
      return new Promise((resolve, reject) => {
        if (!isSupported()) { reject(new Error('Browser SR not supported')); return; }
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        _rec = new SR();
        _rec.continuous      = false;
        _rec.interimResults  = false;
        _rec.lang            = LANG_BCP47[lang] || 'hi-IN';
        _rec.maxAlternatives = 1;
        _rec.onresult  = (e) => { _active = false; resolve(e.results[0][0].transcript); };
        _rec.onerror   = (e) => { _active = false; reject(new Error('SR:' + e.error)); };
        _rec.onend     = () => { _active = false; };
        try { _rec.start(); _active = true; } catch (e) { reject(e); }
      });
    }
    function stop() { if (_rec && _active) { try { _rec.stop(); } catch (_) {} _active = false; } }
    return { isSupported, listen, stop };
  })();

  /* ================================================================
     4. RECORDING SESSION MANAGER
     ================================================================ */
  let _stopRecordingFn = null;

  /* ================================================================
     5. PUBLIC API
     ================================================================ */

  function isSupported() { return WhisperEngine.isSupported() || BrowserSREngine.isSupported(); }
  function isTTSSupported() { return TTSEngine.isSupported(); }

  function preloadWhisper(onProgress) {
    if (WhisperEngine.isSupported()) WhisperEngine.preload(onProgress);
  }

  function onStatus(cb)           { _statusCb = cb; }
  function setWeatherContext(d)   { _weatherContext = d; }
  function getIsListening()       { return _isListening; }

  /* speak() — exposed for external use */
  function speak(text, lang)  { TTSEngine.speak(text, lang || _lang()); }
  function stopSpeaking()     { TTSEngine.stop(); }

  /**
   * listen(lang) — returns { promise: Promise<string>, stop: fn }
   */
  function listen(lang) {
    const currentLang = lang || _lang();

    /* ── Whisper path ── */
    if (WhisperEngine.isSupported()) {
      let _resolved = false;
      let _stopFn   = null;

      const promise = new Promise(async (resolve, reject) => {
        try {
          _isListening = true;
          _emit('recording');
          await WhisperEngine.startRecording();

          _stopFn = _stopRecordingFn = async () => {
            if (_resolved) return;
            _resolved        = true;
            _stopRecordingFn = null;
            try {
              _isListening = false;
              _emit('processing');
              const audioData  = await WhisperEngine.stopRecording();
              const transcript = await WhisperEngine.transcribeAudio(audioData, currentLang);
              _emit('ready');
              if (_resultCb) _resultCb(transcript);
              resolve(transcript);
            } catch (err) {
              _emit('error');
              reject(err);
            }
          };

          /* Auto-stop after 15 s */
          setTimeout(() => { if (!_resolved && _stopRecordingFn) _stopRecordingFn(); }, 15000);
        } catch (err) {
          _resolved    = true;
          _isListening = false;
          _emit('error');
          reject(err);
        }
      });

      return { promise, stop: () => { if (_stopFn) _stopFn(); } };
    }

    /* ── Browser SR fallback ── */
    let _stopped = false;
    const promise = BrowserSREngine.listen(currentLang)
      .then(t  => { _isListening = false; if (_resultCb) _resultCb(t); return t; })
      .catch(e => { _isListening = false; throw e; });
    _isListening = true;
    return { promise, stop: () => { if (!_stopped) { _stopped = true; BrowserSREngine.stop(); } } };
  }

  function stopListening() {
    _isListening = false;
    if (_stopRecordingFn) { _stopRecordingFn(); }
    else if (WhisperEngine.isRecording()) { WhisperEngine.stopRecording().catch(() => {}); }
    BrowserSREngine.stop();
  }

  /**
   * startAssistant() — full pipeline: listen → Gemini AI → speak
   * Returns { promise: Promise<{query, response}>, stop: fn }
   */
  function startAssistant() {
    const currentLang         = _lang();
    const { promise: listenP, stop } = listen(currentLang);

    const fullPromise = listenP
      .then(async (transcript) => {
        if (!transcript || !transcript.trim()) {
          const msg = currentLang === 'en'
            ? 'Could not hear you clearly. Please try again.'
            : 'आवाज़ स्पष्ट नहीं सुनाई दी। कृपया दोबारा बोलें।';
          speak(msg, currentLang);
          return { query: '', response: msg };
        }
        const resp = await GeminiAI.getVoiceResponse(transcript, _weatherContext, currentLang);
        speak(resp, currentLang);
        return { query: transcript, response: resp };
      })
      .catch(err => {
        console.error('[Speech] Assistant error:', err);
        const fb = currentLang === 'en'
          ? 'Sorry, I could not process your request.'
          : 'माफ करें, मैं आपका अनुरोध संसाधित नहीं कर सका।';
        speak(fb, currentLang);
        return { query: '', response: fb };
      });

    return { promise: fullPromise, stop };
  }

  /* ── Legacy shim ── */
  function startListening(callback) {
    if (!isSupported()) return false;
    _resultCb = callback;
    listen().promise.catch(() => {});
    return true;
  }

  return {
    isSupported, isTTSSupported,
    preloadWhisper,
    listen, startListening, stopListening,
    speak, stopSpeaking,
    onStatus, setWeatherContext, startAssistant, getIsListening,
    get whisperAvailable()    { return WhisperEngine.isSupported(); },
    get browserSRAvailable()  { return BrowserSREngine.isSupported(); },
    get whisperModelReady()   { return WhisperEngine.isModelReady(); }
  };
})();
