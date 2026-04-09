/* ============================================================
   Kisan Dost — Enhanced Voice Assistant
   Speech Recognition + Gemini AI + Text-to-Speech
   ============================================================ */

const Speech = (() => {
  let recognition = null;
  let isListening = false;
  let onResultCallback = null;
  let _weatherContext = null;

  // Map language codes to BCP-47 speech codes
  const LANG_MAP = {
    en: 'en-IN',
    hi: 'hi-IN',
    mr: 'mr-IN',
    bn: 'bn-IN'
  };

  /** Check browser support */
  function isSupported() {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  }

  function isTTSSupported() {
    return 'speechSynthesis' in window;
  }

  /** Initialize speech recognition */
  function initRecognition() {
    if (!isSupported()) return null;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = LANG_MAP[I18n.getLang()] || 'hi-IN';

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      console.log('[Speech] Recognized:', transcript);
      if (onResultCallback) onResultCallback(transcript);
    };

    recognition.onerror = (event) => {
      console.warn('[Speech] Error:', event.error);
      isListening = false;
    };

    recognition.onend = () => {
      isListening = false;
    };

    return recognition;
  }

  /** Start listening for voice commands */
  function startListening(callback) {
    if (!isSupported()) {
      console.warn('[Speech] Not supported in this browser');
      return false;
    }

    if (!recognition) initRecognition();

    // Update language
    recognition.lang = LANG_MAP[I18n.getLang()] || 'hi-IN';

    onResultCallback = callback;
    isListening = true;

    try {
      recognition.start();
      return true;
    } catch (e) {
      console.warn('[Speech] Start failed:', e);
      isListening = false;
      return false;
    }
  }

  /** Stop listening */
  function stopListening() {
    if (recognition && isListening) {
      recognition.stop();
      isListening = false;
    }
  }

  /**
   * Speak text aloud using TTS.
   * Uses current i18n language.
   */
  function speak(text) {
    if (!isTTSSupported()) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = LANG_MAP[I18n.getLang()] || 'hi-IN';
    utterance.rate = 0.9;
    utterance.pitch = 1;

    window.speechSynthesis.speak(utterance);
  }

  /** Stop speaking */
  function stopSpeaking() {
    if (isTTSSupported()) {
      window.speechSynthesis.cancel();
    }
  }

  /** Set weather context for AI responses */
  function setWeatherContext(data) {
    _weatherContext = data;
  }

  /**
   * Full voice assistant flow:
   * 1. Listen for voice input
   * 2. Send to Gemini AI with weather context
   * 3. Speak the response aloud
   * @returns {Promise<{query: string, response: string}>}
   */
  function startAssistant() {
    return new Promise((resolve, reject) => {
      if (!isSupported()) {
        reject(new Error('Speech recognition not supported'));
        return;
      }

      startListening(async (transcript) => {
        try {
          const lang = I18n.getLang();
          const aiResponse = await GeminiAI.getVoiceResponse(
            transcript,
            _weatherContext,
            lang
          );
          
          // Speak the response
          speak(aiResponse);
          
          resolve({ query: transcript, response: aiResponse });
        } catch (err) {
          console.error('[Speech] Assistant error:', err);
          const fallback = I18n.getLang() === 'en'
            ? 'Sorry, I could not process your request.'
            : 'माफ करें, मैं आपका अनुरोध संसाधित नहीं कर सका।';
          speak(fallback);
          resolve({ query: transcript, response: fallback });
        }
      });
    });
  }

  /** Get listening state */
  function getIsListening() { return isListening; }

  return {
    isSupported,
    isTTSSupported,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    setWeatherContext,
    startAssistant,
    getIsListening
  };
})();
