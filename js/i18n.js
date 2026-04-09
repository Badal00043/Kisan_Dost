/* ============================================================
   Kisan Dost — i18n (Internationalization) Module
   Supports: EN, HI, MR, BN
   ============================================================ */

const I18n = (() => {
  const SUPPORTED = ['en', 'hi', 'mr', 'bn'];
  const DEFAULT_LANG = 'hi';
  let currentLang = DEFAULT_LANG;
  let translations = {};
  let loadedLangs = {};

  /** Load a language file */
  async function loadLanguage(code) {
    if (loadedLangs[code]) {
      translations = loadedLangs[code];
      currentLang = code;
      return;
    }

    try {
      const resp = await fetch(`lang/${code}.json`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      loadedLangs[code] = data;
      translations = data;
      currentLang = code;
    } catch (err) {
      console.error(`[i18n] Failed to load "${code}":`, err);
      // Fall back to English if available
      if (code !== 'en' && loadedLangs['en']) {
        translations = loadedLangs['en'];
        currentLang = 'en';
      }
    }
  }

  /**
   * Translate a key. Supports interpolation:
   *   t('temp_is', { value: 32 }) → "तापमान 32°C है"
   *   Placeholders in JSON: "तापमान {{value}}°C है"
   */
  function t(key, params) {
    let str = translations[key] || key;
    if (params) {
      Object.keys(params).forEach(k => {
        str = str.replace(new RegExp(`{{${k}}}`, 'g'), params[k]);
      });
    }
    return str;
  }

  /** Set language and persist preference */
  async function setLanguage(code) {
    if (!SUPPORTED.includes(code)) {
      console.warn(`[i18n] Unsupported language: ${code}`);
      return;
    }
    await loadLanguage(code);
    // Persist to IndexedDB
    try {
      await KisanDB.put(KisanDB.STORES.preferences, {
        id: 'language',
        value: code
      });
    } catch (e) { /* ignore if DB not ready */ }
    // Update HTML lang attribute
    document.documentElement.lang = code;
  }

  /** Initialize — load saved preference or default */
  async function init() {
    let savedLang = DEFAULT_LANG;
    try {
      const pref = await KisanDB.get(KisanDB.STORES.preferences, 'language');
      if (pref && pref.value) savedLang = pref.value;
    } catch (e) { /* use default */ }
    await loadLanguage(savedLang);
  }

  /** Get current language code */
  function getLang() { return currentLang; }

  /** Get language display name */
  function getLangName(code) {
    const names = {
      en: 'English',
      hi: 'हिन्दी',
      mr: 'मराठी',
      bn: 'বাংলা'
    };
    return names[code] || code;
  }

  /** Get native script sample for onboarding */
  function getLangScript(code) {
    const scripts = {
      en: 'Aa',
      hi: 'अ',
      mr: 'अ',
      bn: 'অ'
    };
    return scripts[code] || code;
  }

  return {
    SUPPORTED,
    init,
    t,
    setLanguage,
    getLang,
    getLangName,
    getLangScript,
    loadLanguage
  };
})();
