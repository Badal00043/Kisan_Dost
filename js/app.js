/* ============================================================
   Kisan Dost — Main App Controller
   SPA router, rendering, onboarding, and coordination
   ============================================================ */

const App = (() => {
  let currentTab = 'home';
  let weatherData = null;
  let advisoryData = [];
  let schemesData = [];
  let profileData = null;
  let forecastData = null;
  let userLocation = null;
  let alertSubTab = 'all'; // 'all' | 'weather' | 'schemes'

  // ---- SVG Icon Library ---- //
  const SVG = {
    logo: `<svg viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="48" fill="#2D6A4F"/><path d="M50 20c-2 0-4 1-5 3L30 55c-2 4 1 8 5 8h30c4 0 7-4 5-8L55 23c-1-2-3-3-5-3z" fill="#95D5B2"/><circle cx="50" cy="48" r="8" fill="#FEFAE0"/><path d="M35 68c0-8 7-15 15-15s15 7 15 15" stroke="#D8F3DC" stroke-width="3" fill="none"/><circle cx="38" cy="72" r="3" fill="#F4A261"/><circle cx="62" cy="72" r="3" fill="#F4A261"/><path d="M44 78c0 0 3 4 6 4s6-4 6-4" stroke="#D8F3DC" stroke-width="2" fill="none"/></svg>`,
    home: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
    alerts: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`,
    settings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72 1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`,
    pin: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
    gps: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/></svg>`,
    search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
    humidity: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>`,
    wind: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/></svg>`,
    thermometer: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg>`,
    clock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    globe: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
    bell: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`,
    mic: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>`,
    info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
    chevron: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>`,
    // Weather condition icons (SVG)
    sun: `<svg viewBox="0 0 80 80" fill="none"><circle cx="40" cy="40" r="16" fill="#F4A261" stroke="#E76F51" stroke-width="2"/><g stroke="#F4A261" stroke-width="3" stroke-linecap="round"><line x1="40" y1="8" x2="40" y2="16"/><line x1="40" y1="64" x2="40" y2="72"/><line x1="8" y1="40" x2="16" y2="40"/><line x1="64" y1="40" x2="72" y2="40"/><line x1="17.3" y1="17.3" x2="22.9" y2="22.9"/><line x1="57.1" y1="57.1" x2="62.7" y2="62.7"/><line x1="17.3" y1="62.7" x2="22.9" y2="57.1"/><line x1="57.1" y1="22.9" x2="62.7" y2="17.3"/></g></svg>`,
    cloud: `<svg viewBox="0 0 80 80" fill="none"><path d="M22 56a12 12 0 0 1-1-24h1a16 16 0 0 1 31-4 12 12 0 0 1 5 23H22z" fill="#D8F3DC" stroke="#95D5B2" stroke-width="2"/></svg>`,
    rain: `<svg viewBox="0 0 80 80" fill="none"><path d="M22 44a12 12 0 0 1-1-24h1a16 16 0 0 1 31-4 12 12 0 0 1 5 23H22z" fill="#B7D9C9" stroke="#95D5B2" stroke-width="2"/><g stroke="#5B9BD5" stroke-width="2" stroke-linecap="round"><line x1="24" y1="52" x2="20" y2="64"/><line x1="36" y1="52" x2="32" y2="64"/><line x1="48" y1="52" x2="44" y2="64"/></g></svg>`,
    storm: `<svg viewBox="0 0 80 80" fill="none"><path d="M22 40a12 12 0 0 1-1-24h1a16 16 0 0 1 31-4 12 12 0 0 1 5 23H22z" fill="#8FAAA0" stroke="#6B8C7E" stroke-width="2"/><polygon points="38,44 32,58 40,56 36,72 50,52 42,54" fill="#F4A261" stroke="#E76F51" stroke-width="1"/></svg>`,
    cloudSun: `<svg viewBox="0 0 80 80" fill="none"><circle cx="56" cy="28" r="12" fill="#F4A261" stroke="#E76F51" stroke-width="2"/><g stroke="#F4A261" stroke-width="2" stroke-linecap="round"><line x1="56" y1="10" x2="56" y2="14"/><line x1="56" y1="42" x2="56" y2="46"/><line x1="38" y1="28" x2="42" y2="28"/><line x1="70" y1="28" x2="74" y2="28"/></g><path d="M18 58a12 12 0 0 1-1-24h1a16 16 0 0 1 31-4 12 12 0 0 1 5 23H18z" fill="#D8F3DC" stroke="#95D5B2" stroke-width="2"/></svg>`,
    snow: `<svg viewBox="0 0 80 80" fill="none"><path d="M22 44a12 12 0 0 1-1-24h1a16 16 0 0 1 31-4 12 12 0 0 1 5 23H22z" fill="#D8F3DC" stroke="#95D5B2" stroke-width="2"/><g fill="#5B9BD5"><circle cx="24" cy="56" r="3"/><circle cx="40" cy="54" r="3"/><circle cx="56" cy="58" r="3"/><circle cx="32" cy="66" r="3"/><circle cx="48" cy="68" r="3"/></g></svg>`,
    mist: `<svg viewBox="0 0 80 80" fill="none"><g stroke="#95D5B2" stroke-width="3" stroke-linecap="round"><line x1="12" y1="28" x2="68" y2="28"/><line x1="20" y1="38" x2="60" y2="38"/><line x1="16" y1="48" x2="64" y2="48"/><line x1="24" y1="58" x2="56" y2="58"/></g></svg>`,
    // Advisory icons
    heat: `<svg viewBox="0 0 24 24" fill="none" stroke="#E76F51" stroke-width="2"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg>`,
    cold: `<svg viewBox="0 0 24 24" fill="none" stroke="#5B9BD5" stroke-width="2"><line x1="12" y1="2" x2="12" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="5.6" y1="5.6" x2="18.4" y2="18.4"/><line x1="18.4" y1="5.6" x2="5.6" y2="18.4"/></svg>`,
    bug: `<svg viewBox="0 0 24 24" fill="none" stroke="#6B8C7E" stroke-width="2"><rect x="8" y="6" width="8" height="14" rx="4"/><line x1="12" y1="6" x2="12" y2="2"/><line x1="6" y1="10" x2="2" y2="8"/><line x1="18" y1="10" x2="22" y2="8"/><line x1="6" y1="16" x2="2" y2="18"/><line x1="18" y1="16" x2="22" y2="18"/></svg>`,
    water: `<svg viewBox="0 0 24 24" fill="none" stroke="#5B9BD5" stroke-width="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>`,
    spray: `<svg viewBox="0 0 24 24" fill="none" stroke="#F4A261" stroke-width="2"><path d="M12 3v10M8 7l-3-2M16 7l3-2M6 14a6 6 0 0 0 12 0"/></svg>`,
    check: `<svg viewBox="0 0 24 24" fill="none" stroke="#2D6A4F" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>`,
    plant: `<svg viewBox="0 0 120 120" fill="none"><rect x="20" y="80" width="80" height="30" rx="8" fill="#8B6914" opacity="0.3"/><path d="M60 85V45" stroke="#2D6A4F" stroke-width="3"/><ellipse cx="60" cy="30" rx="20" ry="18" fill="#95D5B2"/><ellipse cx="42" cy="55" rx="14" ry="12" fill="#95D5B2" transform="rotate(-20 42 55)"/><ellipse cx="78" cy="55" rx="14" ry="12" fill="#95D5B2" transform="rotate(20 78 55)"/><circle cx="60" cy="30" r="5" fill="#F4A261"/><path d="M30 100c10-5 20-2 30-2s20-3 30 2" stroke="#6B3A0A" stroke-width="2" opacity="0.3"/></svg>`
  };

  /** Get weather SVG based on condition code */
  function getWeatherIcon(iconCode) {
    if (!iconCode) return SVG.sun;
    const code = iconCode.substring(0, 2);
    const map = {
      '01': SVG.sun,
      '02': SVG.cloudSun,
      '03': SVG.cloud,
      '04': SVG.cloud,
      '09': SVG.rain,
      '10': SVG.rain,
      '11': SVG.storm,
      '13': SVG.snow,
      '50': SVG.mist
    };
    return map[code] || SVG.cloud;
  }

  /** Get advisory icon SVG */
  function getAdvisoryIcon(iconName) {
    return SVG[iconName] || SVG.info;
  }

  // ---- INITIALIZATION ---- //
  async function init() {
    // 1. Init DB
    await KisanDB.openDB();

    // 2. Init i18n
    await I18n.init();

    // 3. Init notifications
    Notifications.init();

    // 4. Init theme
    initTheme();

    // 5. Auth check — show auth screen if not logged in
    setupAuth();
    if (!Auth.isLoggedIn()) {
      document.getElementById('auth-screen')?.classList.remove('hidden');
      return; // Don't load app until logged in
    }
    document.getElementById('auth-screen')?.classList.add('hidden');

    // 6. Continue app boot
    await bootApp();
  }

  async function bootApp() {
    // 6. Check onboarding status
    const prefs = await KisanDB.get(KisanDB.STORES.preferences, 'onboarded');
    if (prefs && prefs.value) {
      hideOnboarding();
      await loadAppData();
    } else {
      showOnboarding();
    }

    // 7. Set up connectivity listeners
    window.addEventListener('online', onConnectivityChange);
    window.addEventListener('offline', onConnectivityChange);
    updateConnectivityBadge();

    // 8. Tab bar
    setupTabBar();

    // 9. Render current language text
    renderStaticText();

    // 11. Voice assistant FAB
    setupVoiceAssistant();

    // 12. Preload Whisper model in background (non-blocking)
    Speech.preloadWhisper((info) => {
      updateWhisperStatus(info);
    });
  }

  // ---- AUTH SETUP ---- //
  function setupAuth() {
    // Tab switching
    document.querySelectorAll('.auth-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const isLogin = tab.dataset.tab === 'login';
        document.getElementById('login-form').classList.toggle('hidden', !isLogin);
        document.getElementById('register-form').classList.toggle('hidden', isLogin);
      });
    });

    // Login form
    document.getElementById('login-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const phone = document.getElementById('login-phone').value.trim();
      const password = document.getElementById('login-password').value;
      const errEl = document.getElementById('login-error');
      const result = Auth.login(phone, password);
      if (result.success) {
        errEl.classList.add('hidden');
        document.getElementById('auth-screen')?.classList.add('hidden');
        await bootApp();
      } else {
        errEl.textContent = result.message;
        errEl.classList.remove('hidden');
      }
    });

    document.getElementById('demo-mode-btn')?.addEventListener('click', async () => {
      const errEl = document.getElementById('login-error');
      const result = Auth.login('admin', 'farmer123');
      if (result.success) {
        errEl.classList.add('hidden');
        document.getElementById('auth-screen')?.classList.add('hidden');
        await bootApp();
      }
    });

    // Register form
    document.getElementById('register-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('register-name').value.trim();
      const phone = document.getElementById('register-phone').value.trim();
      const password = document.getElementById('register-password').value;
      const errEl = document.getElementById('register-error');
      const result = Auth.register(name, phone, password);
      if (result.success) {
        errEl.classList.add('hidden');
        document.getElementById('auth-screen')?.classList.add('hidden');
        await bootApp();
      } else {
        errEl.textContent = result.message;
        errEl.classList.remove('hidden');
      }
    });
  }



  // ---- THEME TOGGLE ---- //
  function initTheme() {
    const saved = localStorage.getItem('kd_theme');
    if (saved) {
      document.documentElement.setAttribute('data-theme', saved);
    }
    updateThemeIcon();

    const toggle = document.getElementById('theme-toggle');
    if (toggle) {
      toggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const isDark = current === 'dark' || (!current && window.matchMedia('(prefers-color-scheme: dark)').matches);
        const newTheme = isDark ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('kd_theme', newTheme);
        updateThemeIcon();
      });
    }
  }

  function updateThemeIcon() {
    const iconEl = document.getElementById('theme-icon');
    if (!iconEl) return;
    const theme = document.documentElement.getAttribute('data-theme');
    const isDark = theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    // Moon for light mode (click to go dark), Sun for dark mode (click to go light)
    iconEl.innerHTML = isDark
      ? '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>'
      : '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
  }

  // ---- ONBOARDING ---- //
  function showOnboarding() {
    const el = document.getElementById('onboarding');
    el.classList.remove('hidden');
    renderOnboardingStep1();
  }

  function hideOnboarding() {
    const el = document.getElementById('onboarding');
    el.classList.add('hidden');
  }

  function renderOnboardingStep1() {
    const step1 = document.getElementById('onboarding-step-1');
    const step2 = document.getElementById('onboarding-step-2');
    step1.classList.add('active');
    step2.classList.remove('active');

    // Render language cards
    const grid = document.getElementById('lang-grid');
    grid.innerHTML = '';
    I18n.SUPPORTED.forEach(code => {
      const card = document.createElement('button');
      card.className = 'lang-card';
      card.dataset.lang = code;
      card.innerHTML = `
        <span class="lang-card__script">${I18n.getLangScript(code)}</span>
        <span class="lang-card__name">${I18n.getLangName(code)}</span>
      `;
      card.addEventListener('click', () => {
        grid.querySelectorAll('.lang-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        I18n.setLanguage(code).then(() => renderStaticText());
      });
      grid.appendChild(card);
    });

    // Select current language
    const currentCard = grid.querySelector(`[data-lang="${I18n.getLang()}"]`);
    if (currentCard) currentCard.classList.add('selected');

    // Next button
    const nextBtn = document.getElementById('onboarding-next');
    nextBtn.onclick = () => {
      renderOnboardingStep2();
    };
  }

  function renderOnboardingStep2() {
    const step1 = document.getElementById('onboarding-step-1');
    const step2 = document.getElementById('onboarding-step-2');
    step1.classList.remove('active');
    step2.classList.add('active');

    // Update text
    document.getElementById('ob-location-title').textContent = I18n.t('select_location');
    document.getElementById('ob-gps-text').textContent = I18n.t('use_gps');
    document.getElementById('ob-or-text').textContent = I18n.t('or');
    document.getElementById('ob-city-input').placeholder = I18n.t('enter_city');
    document.getElementById('ob-start-btn-text').textContent = I18n.t('get_started');

    // GPS button
    document.getElementById('ob-gps-btn').onclick = async () => {
      const btn = document.getElementById('ob-gps-btn');
      btn.innerHTML = `<div class="spinner"></div> ${I18n.t('loading')}`;
      try {
        const pos = await getGPSLocation();
        userLocation = { lat: pos.coords.latitude, lon: pos.coords.longitude, city: '' };
        await KisanDB.put(KisanDB.STORES.preferences, { id: 'location', ...userLocation });
        completeOnboarding();
      } catch (e) {
        btn.innerHTML = `${SVG.gps} ${I18n.t('use_gps')}`;
        Notifications.showToast(I18n.t('error_location'), 'warning');
      }
    };

    // City search
    document.getElementById('ob-city-form').onsubmit = async (e) => {
      e.preventDefault();
      const input = document.getElementById('ob-city-input');
      const city = input.value.trim();
      if (!city) return;

      // Use geocoding API or default coords
      const coords = await geocodeCity(city);
      userLocation = { lat: coords.lat, lon: coords.lon, city };
      await KisanDB.put(KisanDB.STORES.preferences, { id: 'location', ...userLocation });
      completeOnboarding();
    };
  }

  async function completeOnboarding() {
    await KisanDB.put(KisanDB.STORES.preferences, { id: 'onboarded', value: true });
    await Notifications.requestPermission();
    hideOnboarding();
    await loadAppData();
  }

  // ---- GPS & GEOCODING ---- //
  function getGPSLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error('No geolocation'));
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000
      });
    });
  }

  async function geocodeCity(city) {
    // Try OpenWeatherMap geocoding
    try {
      if (Weather.hasAPIKey()) {
        const resp = await fetch(
          `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)},IN&limit=1&appid=YOUR_OPENWEATHER_API_KEY`
        );
        const data = await resp.json();
        if (data && data.length > 0) {
          return { lat: data[0].lat, lon: data[0].lon };
        }
      }
    } catch (e) { /* fallback */ }

    // Fallback — popular Indian city coords
    const cityMap = {
      'delhi': { lat: 28.61, lon: 77.23 },
      'mumbai': { lat: 19.07, lon: 72.87 },
      'kolkata': { lat: 22.57, lon: 88.36 },
      'chennai': { lat: 13.08, lon: 80.27 },
      'bangalore': { lat: 12.97, lon: 77.59 },
      'hyderabad': { lat: 17.38, lon: 78.48 },
      'pune': { lat: 18.52, lon: 73.85 },
      'nagpur': { lat: 21.14, lon: 79.08 },
      'jaipur': { lat: 26.91, lon: 75.78 },
      'lucknow': { lat: 26.84, lon: 80.94 },
      'patna': { lat: 25.59, lon: 85.13 },
      'bhopal': { lat: 23.25, lon: 77.41 },
      'indore': { lat: 22.71, lon: 75.85 },
      'kanpur': { lat: 26.44, lon: 80.35 },
      'varanasi': { lat: 25.31, lon: 83.01 },
      'agra': { lat: 27.17, lon: 78.01 },
      'raipur': { lat: 21.25, lon: 81.63 },
      'ranchi': { lat: 23.34, lon: 85.30 },
      'guwahati': { lat: 26.14, lon: 91.73 },
      'chandigarh': { lat: 30.73, lon: 76.77 }
    };
    const key = city.toLowerCase();
    return cityMap[key] || { lat: 20.59, lon: 78.96 }; // Center of India
  }

  // ---- DATA LOADING ---- //
  async function loadAppData() {
    showSkeletons();

    // Load location
    const locPref = await KisanDB.get(KisanDB.STORES.preferences, 'location');
    if (locPref) {
      userLocation = { lat: locPref.lat, lon: locPref.lon, city: locPref.city };
    }

    // Load weather + forecast
    if (userLocation) {
      if (Weather.hasAPIKey()) {
        weatherData = await Weather.getWeather(userLocation.lat, userLocation.lon);
        forecastData = await Weather.getForecast(userLocation.lat, userLocation.lon);
      }
      if (!weatherData) {
        weatherData = Weather.getDemoWeather();
        forecastData = Weather.getDemoForecast();
        if (userLocation.city) {
          weatherData.city = userLocation.city;
          forecastData.city = userLocation.city;
        }
      }
      if (!forecastData) {
        forecastData = Weather.getDemoForecast();
      }
    } else {
      weatherData = Weather.getDemoWeather();
      forecastData = Weather.getDemoForecast();
    }

    // Cache if demo
    if (weatherData && weatherData._demo) {
      await KisanDB.put(KisanDB.STORES.weather, weatherData);
    }

    // Generate advisories
    advisoryData = await Advisory.getAdvisories(weatherData);

    // Load schemes
    try {
      const resp = await fetch('data/schemes.json');
      schemesData = await resp.json();
    } catch (e) {
      schemesData = [];
    }

    // Load profile
    try {
      const profResp = await fetch('data/profile.json');
      profileData = await profResp.json();
    } catch (e) {
      profileData = null;
    }

    // Render
    renderHome();
    renderAlerts();
    renderAIView();
    renderProfile();
    renderSettings();

    // Process alerts (toasts + native notifications) — only for non-demo warnings
    if (weatherData && !weatherData._demo) {
      await Notifications.processWeatherAlerts(weatherData, advisoryData);
    }
  }

  // ---- SKELETON SCREENS ---- //
  function showSkeletons() {
    const homeView = document.getElementById('view-home');
    homeView.innerHTML = `
      <div class="skeleton skeleton-weather"></div>
      <div class="section-title" style="margin-top:1.5rem">
        <div class="skeleton skeleton-text skeleton-text--short"></div>
      </div>
      <div class="skeleton skeleton-action"></div>
      <div class="skeleton skeleton-action"></div>
      <div class="skeleton skeleton-action"></div>
    `;
  }

  // ---- RENDERING — HOME ---- //
  function renderHome() {
    const view = document.getElementById('view-home');
    if (!weatherData) {
      view.innerHTML = `<div class="empty-state">${SVG.cloud}<p class="empty-state__title">${I18n.t('error_weather')}</p></div>`;
      return;
    }

    const w = weatherData;
    const timeAgo = w._timestamp ? formatTimeAgo(w._timestamp) : '';
    const staleTag = w._stale ? `<span style="color:#F4A261;font-size:0.7rem">• ${I18n.t('stale_data')}</span>` : '';


    let html = `
      <!-- Weather Card -->
      <div class="weather-card" id="weather-card">
        <div class="weather-card__location">
          ${SVG.pin}
          <span>${w.city || 'Unknown'}${w.country ? ', ' + w.country : ''}</span>
          ${staleTag}
        </div>
        <div class="weather-card__main">
          <div>
            <div class="weather-card__temp">${w.temp}°C</div>
            <div class="weather-card__condition">${capitalizeFirst(w.description)}</div>
            <div style="font-size:0.75rem;opacity:0.7;margin-top:4px">${I18n.t('feels_like', { value: w.feels_like })}</div>
          </div>
          <div class="weather-card__icon">${getWeatherIcon(w.icon)}</div>
        </div>
        <div class="weather-card__details">
          <div class="weather-detail">
            ${SVG.thermometer}
            <span class="weather-detail__value">${w.temp}°</span>
            <span class="weather-detail__label">${I18n.t('temperature')}</span>
          </div>
          <div class="weather-detail">
            ${SVG.humidity}
            <span class="weather-detail__value">${w.humidity}%</span>
            <span class="weather-detail__label">${I18n.t('humidity')}</span>
          </div>
          <div class="weather-detail">
            ${SVG.wind}
            <span class="weather-detail__value">${w.wind_speed}</span>
            <span class="weather-detail__label">${I18n.t('wind')} km/h</span>
          </div>
        </div>
        ${timeAgo ? `<div class="weather-card__updated">${SVG.clock} <span>${I18n.t('last_updated', { value: timeAgo })}</span></div>` : ''}

      </div>

      <!-- Action Items -->
      <div class="section-title">
        ${SVG.check}
        <span>${I18n.t('action_items')}</span>
      </div>
    `;

    if (advisoryData.length === 0) {
      html += `<div class="empty-state" style="padding:2rem"><p class="empty-state__desc">${I18n.t('no_actions')}</p></div>`;
    } else {
      html += `<div class="action-list">`;
      advisoryData.forEach(adv => {
        html += `
          <div class="action-card action-card--${adv.severity}">
            <div class="action-card__icon">${getAdvisoryIcon(adv.icon)}</div>
            <div class="action-card__content">
              <div class="action-card__title">${I18n.t(adv.titleKey, adv.params)}</div>
              <div class="action-card__desc">${I18n.t(adv.descKey, adv.params)}</div>
            </div>
          </div>
        `;
      });
      html += `</div>`;
    }

    // 5-Day Forecast Strip
    if (forecastData && forecastData.days && forecastData.days.length > 0) {

      html += `
        <div class="section-title" style="margin-top:var(--sp-6)">
          ${SVG.clock}
          <span>${I18n.t('forecast_title')}</span>
        </div>
        <div class="forecast-strip">
      `;
      forecastData.days.forEach((day, i) => {
        const todayClass = i === 0 ? ' forecast-card--today' : '';
        const rainLabel = day.rainProb > 20 ? `<div class="forecast-card__rain">💧 ${day.rainProb}%</div>` : '';
        html += `
          <div class="forecast-card${todayClass}">
            <div class="forecast-card__day">${day.dayName}</div>
            <div class="forecast-card__icon">${getWeatherIcon(day.icon)}</div>
            <div class="forecast-card__temp">${day.tempHigh}° <span class="forecast-card__temp-low">${day.tempLow}°</span></div>
            ${rainLabel}
          </div>
        `;
      });
      html += `</div>`;
    }

    view.innerHTML = html;
  }

  // ---- RENDERING — ALERTS ---- //
  function renderAlerts() {
    const view = document.getElementById('view-alerts');
    const lang = I18n.getLang();

    let html = `
      <div class="alert-tabs">
        <button class="alert-tab ${alertSubTab === 'all' ? 'active' : ''}" data-subtab="all">${I18n.t('all_alerts')}</button>
        <button class="alert-tab ${alertSubTab === 'weather' ? 'active' : ''}" data-subtab="weather">${I18n.t('weather_alerts')}</button>
        <button class="alert-tab ${alertSubTab === 'schemes' ? 'active' : ''}" data-subtab="schemes">${I18n.t('govt_schemes')}</button>
      </div>
      <div id="alert-content"></div>
    `;

    view.innerHTML = html;

    // Sub-tab click handlers
    view.querySelectorAll('.alert-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        alertSubTab = tab.dataset.subtab;
        view.querySelectorAll('.alert-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        renderAlertContent(lang);
      });
    });

    renderAlertContent(lang);
  }

  function renderAlertContent(lang) {
    const container = document.getElementById('alert-content');
    let html = '';

    // Weather alerts from advisories
    if (alertSubTab === 'all' || alertSubTab === 'weather') {
      const weatherAlerts = advisoryData.filter(a => a.severity === 'danger' || a.severity === 'warning');
      if (weatherAlerts.length === 0 && alertSubTab === 'weather') {
        html += `<div class="empty-state"><p class="empty-state__desc">${I18n.t('no_alerts')}</p></div>`;
      }
      weatherAlerts.forEach((alert, i) => {
        const badgeClass = alert.severity === 'danger' ? 'danger' : 'warning';
        html += `
          <div class="alert-card" style="animation-delay:${i * 0.05}s">
            <div class="alert-card__header">
              <span class="alert-card__badge alert-card__badge--${badgeClass}">${alert.severity.toUpperCase()}</span>
              <span class="alert-card__time">${I18n.t('weather')}</span>
            </div>
            <div class="alert-card__title">${I18n.t(alert.titleKey, alert.params)}</div>
            <div class="alert-card__body">${I18n.t(alert.descKey, alert.params)}</div>
          </div>
        `;
      });
    }

    // Government schemes
    if (alertSubTab === 'all' || alertSubTab === 'schemes') {
      if (schemesData.length === 0 && alertSubTab === 'schemes') {
        html += `<div class="empty-state"><p class="empty-state__desc">${I18n.t('no_schemes')}</p></div>`;
      }
      schemesData.forEach((scheme, i) => {
        const title = scheme.title[lang] || scheme.title.en;
        const desc = scheme.description[lang] || scheme.description.en;
        const elig = scheme.eligibility[lang] || scheme.eligibility.en;
        html += `
          <div class="alert-card" style="animation-delay:${i * 0.05}s">
            <div class="alert-card__header">
              <span class="alert-card__badge alert-card__badge--scheme">${I18n.t('govt_schemes')}</span>
            </div>
            <div class="alert-card__title">${title}</div>
            <div class="alert-card__body">${desc}</div>
            <div class="alert-card__body" style="margin-top:8px;font-weight:600"><strong>${I18n.t('eligible')}:</strong> ${elig}</div>
            ${scheme.link ? `<a href="${scheme.link}" target="_blank" rel="noopener" class="alert-card__link">${I18n.t('learn_more')}</a>` : ''}
          </div>
        `;
      });
    }

    if (!html) {
      html = `<div class="empty-state"><p class="empty-state__desc">${I18n.t('no_alerts')}</p></div>`;
    }

    container.innerHTML = html;
  }

  // ---- RENDERING — PROFILE ---- //
  function renderProfile() {
    const view = document.getElementById('view-profile');
    if (!profileData) {
      view.innerHTML = `<div class="empty-state"><p class="empty-state__title">Profile not available</p></div>`;
      return;
    }

    const p = profileData;
    const sowingDate = formatDateReadable(p.crop?.sowingDate);
    const lastIrrigation = formatDateReadable(p.crop?.lastIrrigation);
    const farmLocation = [p.farm?.village, p.farm?.district, p.farm?.state].filter(Boolean).join(', ');

    const statusPill = (enabled) => {
      const cls = enabled ? 'profile-status--enabled' : 'profile-status--disabled';
      const label = enabled ? 'Enabled' : 'Disabled';
      return `<span class="profile-status ${cls}"><span class="profile-status__dot"></span> ${label}</span>`;
    };

    const user = Auth.getCurrentUser() || {};
    
    view.innerHTML = `
      <!-- Profile Header -->
      <div class="profile-header">
        <div class="profile-avatar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </div>
        <div class="profile-name">${user.name || 'Farmer'}</div>
        <div class="profile-welcome">Welcome back! Here's your farm dashboard.</div>
      </div>

      <!-- Personal Information -->
      <div class="profile-section">
        <div class="profile-section__title">
          ${SVG.info}
          <span>Personal Information</span>
        </div>
        <div class="profile-card">
          <div class="profile-detail">
            <span class="profile-detail__label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              Name
            </span>
            <span class="profile-detail__value">${user.name || p.name || '—'}</span>
          </div>
          <div class="profile-detail">
            <span class="profile-detail__label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              Phone
            </span>
            <span class="profile-detail__value">${user.phone || p.phone || '—'}</span>
          </div>
          <div class="profile-detail">
            <span class="profile-detail__label">
              ${SVG.globe}
              Preferred Language
            </span>
            <span class="profile-detail__value">${p.preferredLanguage || '—'}</span>
          </div>
        </div>
      </div>

      <!-- Farm Details -->
      <div class="profile-section">
        <div class="profile-section__title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          <span>Farm Details</span>
        </div>
        <div class="profile-card">
          <div class="profile-detail">
            <span class="profile-detail__label">
              ${SVG.pin}
              Location
            </span>
            <span class="profile-detail__value">${farmLocation || '—'}</span>
          </div>
          <div class="profile-detail">
            <span class="profile-detail__label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
              Farm Size
            </span>
            <span class="profile-detail__value">${p.farm?.size || '—'}</span>
          </div>
          <div class="profile-detail">
            <span class="profile-detail__label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              Soil Type
            </span>
            <span class="profile-detail__value">${p.farm?.soilType || '—'}</span>
          </div>
          <div class="profile-detail">
            <span class="profile-detail__label">
              ${SVG.humidity}
              Irrigation Type
            </span>
            <span class="profile-detail__value">${p.farm?.irrigationType || '—'}</span>
          </div>
        </div>
      </div>

      <!-- Crop Management -->
      <div class="profile-section">
        <div class="profile-section__title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22c-4 0-8-2-8-6 0-3 2-5 4-6 1-1 2-2 2-4 0 3 1 5 4 7 3-2 4-4 4-7 0 2 1 3 2 4 2 1 4 3 4 6 0 4-4 6-8 6z"/><line x1="12" y1="22" x2="12" y2="15"/></svg>
          <span>Crop Management</span>
        </div>
        <div class="profile-crop-card">
          <div class="profile-crop-header">
            <span class="profile-crop-name">🌿 ${p.crop?.name || 'N/A'}</span>
            <span class="profile-crop-badge">${p.crop?.stage || 'Unknown'}</span>
          </div>
          <div class="profile-detail">
            <span class="profile-detail__label">Sowing Date</span>
            <span class="profile-detail__value">${sowingDate}</span>
          </div>
          <div class="profile-detail">
            <span class="profile-detail__label">Last Irrigation</span>
            <span class="profile-detail__value">${lastIrrigation}</span>
          </div>
        </div>
      </div>

      <!-- App Settings -->
      <div class="profile-section">
        <div class="profile-section__title">
          ${SVG.settings}
          <span>App Settings</span>
        </div>
        <div class="profile-card">
          <div class="profile-detail">
            <span class="profile-detail__label">
              ${SVG.mic}
              Voice Assistant
            </span>
            <span class="profile-detail__value">${statusPill(p.settings?.voiceAssistant)}</span>
          </div>
          <div class="profile-detail">
            <span class="profile-detail__label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Offline Access
            </span>
            <span class="profile-detail__value">${statusPill(p.settings?.offlineAccess)}</span>
          </div>
        </div>
      </div>
    `;
  }

  /** Format ISO date to readable string (e.g., June 10, 2026) */
  function formatDateReadable(isoStr) {
    if (!isoStr) return '—';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) {
      return isoStr;
    }
  }

  // ---- RENDERING — SETTINGS ---- //
  function renderSettings() {
    const view = document.getElementById('view-settings');
    const lang = I18n.getLang();

    view.innerHTML = `
      <div class="settings-group">
        <div class="settings-group__title">${I18n.t('settings')}</div>

        <!-- Language -->
        <div class="settings-item" id="setting-language">
          <div class="settings-item__left">
            <div class="settings-item__icon">${SVG.globe}</div>
            <div>
              <div class="settings-item__label">${I18n.t('language')}</div>
              <div class="settings-item__value">${I18n.getLangName(lang)}</div>
            </div>
          </div>
          <select class="lang-select" id="settings-lang-select">
            ${I18n.SUPPORTED.map(c => `<option value="${c}" ${c === lang ? 'selected' : ''}>${I18n.getLangName(c)}</option>`).join('')}
          </select>
        </div>

        <!-- Location -->
        <div class="settings-item" id="setting-location">
          <div class="settings-item__left">
            <div class="settings-item__icon">${SVG.pin}</div>
            <div>
              <div class="settings-item__label">${I18n.t('location')}</div>
              <div class="settings-item__value">${userLocation?.city || (weatherData?.city || '—')}</div>
            </div>
          </div>
          <span style="width:20px;height:20px;min-width:20px;opacity:0.4">${SVG.chevron}</span>
        </div>

        <!-- Notifications -->
        <div class="settings-item" id="setting-notifications">
          <div class="settings-item__left">
            <div class="settings-item__icon">${SVG.bell}</div>
            <div>
              <div class="settings-item__label">${I18n.t('notifications_toggle')}</div>
            </div>
          </div>
          <div class="toggle ${Notification.permission === 'granted' ? 'active' : ''}" id="toggle-notifications"></div>
        </div>

        <!-- Voice Commands -->
        <div class="settings-item" id="setting-voice">
          <div class="settings-item__left">
            <div class="settings-item__icon">${SVG.mic}</div>
            <div>
              <div class="settings-item__label">${I18n.t('voice_commands')}</div>
              <div class="settings-item__value">${Speech.isSupported() ? '' : 'Not supported'}</div>
            </div>
          </div>
          <div class="toggle" id="toggle-voice"></div>
        </div>
      </div>

      <div class="settings-group">
        <div class="settings-group__title">${I18n.t('about')}</div>
        <div class="settings-item">
          <div class="settings-item__left">
            <div class="settings-item__icon">${SVG.info}</div>
            <div>
              <div class="settings-item__label">${I18n.t('app_title')}</div>
              <div class="settings-item__value">${I18n.t('version')}</div>
            </div>
          </div>
        </div>
      </div>
      
      <div style="padding: 0 var(--sp-4) var(--sp-6) var(--sp-4);">
        <button id="logout-btn" style="width:100%; padding:var(--sp-3); border-radius:var(--radius-lg); background:rgba(255,107,107,0.1); color:#ff6b6b; border:1px solid rgba(255,107,107,0.2); font-weight:600; cursor:pointer;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18" style="vertical-align:middle; margin-right:8px;"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Logout / लॉग आउट
        </button>
      </div>
    `;

    // Logout handler
    document.getElementById('logout-btn')?.addEventListener('click', () => {
      Auth.logout();
      window.location.reload();
    });

    // Language change handler
    document.getElementById('settings-lang-select').addEventListener('change', async (e) => {
      await I18n.setLanguage(e.target.value);
      renderStaticText();
      renderHome();
      renderAlerts();
      renderSettings();
    });

    // Notification toggle
    document.getElementById('toggle-notifications').addEventListener('click', async (e) => {
      const toggle = e.currentTarget;
      if (toggle.classList.contains('active')) {
        toggle.classList.remove('active');
      } else {
        const granted = await Notifications.requestPermission();
        if (granted) toggle.classList.add('active');
      }
    });

    // Voice toggle
    document.getElementById('toggle-voice').addEventListener('click', (e) => {
      const toggle = e.currentTarget;
      if (!Speech.isSupported()) {
        Notifications.showToast('Voice commands not supported in this browser', 'warning');
        return;
      }
      toggle.classList.toggle('active');
      if (toggle.classList.contains('active')) {
        Speech.startListening((transcript) => {
          Notifications.showToast(`🎤 "${transcript}"`, 'info');
        });
      } else {
        Speech.stopListening();
      }
    });

    // Location change (re-run onboarding step 2 flow)
    document.getElementById('setting-location').addEventListener('click', () => {
      // Simple prompt-based location change
      const city = prompt(I18n.t('enter_city'));
      if (city && city.trim()) {
        geocodeCity(city.trim()).then(async (coords) => {
          userLocation = { lat: coords.lat, lon: coords.lon, city: city.trim() };
          await KisanDB.put(KisanDB.STORES.preferences, { id: 'location', ...userLocation });
          await loadAppData();
        });
      }
    });
  }

  // ---- TAB BAR ---- //
  function setupTabBar() {
    document.querySelectorAll('.tab-bar__item').forEach(item => {
      item.addEventListener('click', () => {
        const tab = item.dataset.tab;
        switchTab(tab);
      });
    });
  }

  function switchTab(tab) {
    currentTab = tab;
    // Update tab bar
    document.querySelectorAll('.tab-bar__item').forEach(item => {
      item.classList.toggle('active', item.dataset.tab === tab);
    });
    // Show correct view
    document.querySelectorAll('.view').forEach(v => {
      v.classList.toggle('active', v.id === `view-${tab}`);
    });
  }

  // ---- STATIC TEXT ---- //
  function renderStaticText() {
    const el = (id) => document.getElementById(id);
    // Header
    const titleEl = el('header-title');
    if (titleEl) titleEl.textContent = I18n.t('app_title');

    // Tab bar
    const tabHome = el('tab-home-label');
    const tabAlerts = el('tab-alerts-label');
    const tabAi = el('tab-ai-label');
    const tabProfile = el('tab-profile-label');
    const tabSettings = el('tab-settings-label');
    if (tabHome) tabHome.textContent = I18n.t('home');
    if (tabAlerts) tabAlerts.textContent = I18n.t('alerts');
    if (tabAi) tabAi.textContent = I18n.t('ai_tab');
    if (tabProfile) tabProfile.textContent = I18n.t('profile');
    if (tabSettings) tabSettings.textContent = I18n.t('settings');

    // Onboarding
    const obTitle = el('ob-title');
    const obSub = el('ob-subtitle');
    const obLangTitle = el('ob-lang-title');
    const obNext = el('onboarding-next-text');
    if (obTitle) obTitle.textContent = I18n.t('onboarding_title');
    if (obSub) obSub.textContent = I18n.t('onboarding_subtitle');
    if (obLangTitle) obLangTitle.textContent = I18n.t('select_language');
    if (obNext) obNext.textContent = I18n.t('next');
  }

  // ---- CONNECTIVITY ---- //
  function onConnectivityChange() {
    updateConnectivityBadge();
    if (navigator.onLine) {
      Notifications.showToast(I18n.t('online'), 'info', 2000);
      // Refresh data when back online
      loadAppData();
    } else {
      Notifications.showToast(I18n.t('offline_mode'), 'warning', 3000);
    }
  }

  function updateConnectivityBadge() {
    const badge = document.getElementById('status-badge');
    if (!badge) return;
    const online = navigator.onLine;
    badge.className = `status-badge ${online ? 'status-badge--online' : 'status-badge--offline'}`;
    badge.innerHTML = `<span class="status-badge__dot"></span> ${online ? I18n.t('online') : I18n.t('offline')}`;
  }

  // ---- HELPERS ---- //
  function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function formatTimeAgo(timestamp) {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  // ---- AI VIEW RENDERING ---- //
  async function renderAIView() {
    const view = document.getElementById('view-ai');
    if (!view) return;

    // Show loading
    view.innerHTML = `
      <div class="ai-section">
        <div class="ai-section__header">
          <div>
            <div class="ai-section__title">${I18n.t('ai_insights_title')}</div>
            <div class="ai-section__subtitle">${I18n.t('ai_powered')}</div>
          </div>
          <button class="ai-refresh-btn" id="ai-refresh">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
            ${I18n.t('ai_refresh')}
          </button>
        </div>
        <div id="ai-insights-container">
          <div class="ai-loading-card">
            <div class="ai-loading-card__spinner"></div>
            <div class="ai-loading-card__text">${I18n.t('ai_loading')}</div>
          </div>
        </div>
      </div>

      <!-- Crop Disease Scanner -->
      <div class="crop-scanner">
        <div class="ai-section__header">
          <div>
            <div class="ai-section__title">${I18n.t('crop_scanner_title')}</div>
            <div class="ai-section__subtitle">${I18n.t('crop_scanner_subtitle')}</div>
          </div>
        </div>
        <div class="crop-scanner__actions">
          <button class="crop-action-btn" id="crop-camera-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            ${I18n.t('crop_take_photo')}
          </button>
          <button class="crop-action-btn" id="crop-upload-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            ${I18n.t('crop_upload_photo')}
          </button>
        </div>
        <input type="file" accept="image/*" class="hidden-input" id="crop-file-input">
        <button class="btn-secondary" id="crop-demo-scan" style="width:100%;margin-bottom:var(--sp-3)">🔬 Demo Scan (Test without camera)</button>
        <div id="crop-result-container"></div>
      </div>

      <!-- Voice Chat History -->
      <div class="ai-section">
        <div class="ai-section__header">
          <div>
            <div class="ai-section__title">${I18n.t('voice_title')}</div>
            <div class="ai-section__subtitle">${I18n.t('voice_subtitle')}</div>
          </div>
        </div>
        <div class="demo-qa-section">
          <div class="demo-qa-title">💬 Try asking (Demo):</div>
          <div class="demo-qa-grid" id="demo-qa-grid">
            <button class="demo-qa-btn" data-q="गेहूं में पानी कब दें">🌾 गेहूं सिंचाई</button>
            <button class="demo-qa-btn" data-q="टमाटर में रोग">🍅 टमाटर रोग</button>
            <button class="demo-qa-btn" data-q="धान की बुवाई कब करें">🌾 धान बुवाई</button>
            <button class="demo-qa-btn" data-q="जैविक खाद कैसे बनाएं">🌱 जैविक खाद</button>
          </div>
        </div>
        <div id="voice-chat-container" class="voice-chat"></div>
        <button class="btn-primary" id="ai-voice-btn" style="width:100%">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>
          ${I18n.t('voice_start')}
        </button>
      </div>
    `;

    // Load AI insights
    loadAIInsights();

    // Setup crop scanner buttons
    setupCropScanner();

    // AI refresh button
    document.getElementById('ai-refresh')?.addEventListener('click', () => {
      const btn = document.getElementById('ai-refresh');
      btn.classList.add('spinning');
      localStorage.removeItem('kd_ai_insights');
      loadAIInsights().then(() => btn.classList.remove('spinning'));
    });

    // Voice button in AI tab
    document.getElementById('ai-voice-btn')?.addEventListener('click', openVoiceModal);

    // Demo Q&A buttons
    document.querySelectorAll('.demo-qa-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const query = btn.dataset.q;
        const lang = I18n.getLang();
        const response = GeminiAI.getMockVoiceResponse(query, lang);
        addVoiceChatItem(query, response);
        // Also speak it
        if (Speech.isTTSSupported()) Speech.speak(response);
      });
    });

    // Demo Scan button
    document.getElementById('crop-demo-scan')?.addEventListener('click', async () => {
      const container = document.getElementById('crop-result-container');
      container.innerHTML = `<div class="ai-loading-card"><div class="ai-loading-card__spinner"></div><div class="ai-loading-card__text">${I18n.t('crop_analyzing')}</div></div>`;
      // Simulate delay
      await new Promise(r => setTimeout(r, 1500));
      const result = GeminiAI.getMockDiseaseResult(I18n.getLang());
      showCropResult(result, '');
    });
  }

  async function loadAIInsights() {
    const container = document.getElementById('ai-insights-container');
    if (!container) return;

    container.innerHTML = `<div class="ai-loading-card"><div class="ai-loading-card__spinner"></div><div class="ai-loading-card__text">${I18n.t('ai_loading')}</div></div>`;

    try {
      const insights = await GeminiAI.getDailyInsights(weatherData, forecastData, I18n.getLang());
      if (!insights || insights.length === 0) {
        container.innerHTML = `<div class="ai-loading-card"><div class="ai-loading-card__text">${I18n.t('ai_error')}</div></div>`;
        return;
      }
      let html = '';
      insights.forEach(item => {
        const p = item.priority || 'medium';
        html += `
          <div class="ai-insight-card ai-insight-card--${p}">
            <div class="ai-insight-card__header">
              <div class="ai-insight-card__title">${item.title || item.icon || ''}</div>
              <span class="ai-insight-card__priority ai-insight-card__priority--${p}">${p}</span>
            </div>
            <div class="ai-insight-card__desc">${item.description || ''}</div>
          </div>`;
      });
      container.innerHTML = html;
    } catch (e) {
      console.error('[AI] Insights error:', e);
      container.innerHTML = `<div class="ai-loading-card"><div class="ai-loading-card__text">${I18n.t('ai_error')}</div></div>`;
    }
  }

  // ---- CROP SCANNER ---- //
  function setupCropScanner() {
    document.getElementById('crop-camera-btn')?.addEventListener('click', async () => {
      if (!CropScanner.isCameraSupported()) {
        Notifications.showToast(I18n.t('crop_camera_error'), 'warning');
        return;
      }
      const modal = document.getElementById('camera-modal');
      const video = document.getElementById('camera-video');
      const preview = document.getElementById('camera-preview');
      modal.classList.remove('hidden');
      preview.classList.add('hidden');
      video.classList.remove('hidden');
      try {
        const stream = await CropScanner.openCamera();
        video.srcObject = stream;
      } catch (e) {
        Notifications.showToast(I18n.t('crop_camera_error'), 'warning');
        modal.classList.add('hidden');
      }
    });

    document.getElementById('crop-upload-btn')?.addEventListener('click', () => {
      document.getElementById('crop-file-input')?.click();
    });

    document.getElementById('crop-file-input')?.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const img = await CropScanner.processUpload(file);
        showCropAnalyzing(img.dataUrl);
        const result = await CropScanner.analyze(I18n.getLang());
        showCropResult(result, img.dataUrl);
      } catch (err) {
        Notifications.showToast(I18n.t('crop_analysis_error'), 'warning');
      }
    });

    // Camera modal controls
    document.getElementById('camera-close')?.addEventListener('click', closeCameraModal);
    document.getElementById('camera-capture')?.addEventListener('click', () => {
      const video = document.getElementById('camera-video');
      const preview = document.getElementById('camera-preview');
      const img = CropScanner.captureFrame(video);
      preview.src = img.dataUrl;
      preview.classList.remove('hidden');
      video.classList.add('hidden');
      CropScanner.closeCamera();
    });
    document.getElementById('camera-analyze')?.addEventListener('click', async () => {
      closeCameraModal();
      const img = CropScanner.getCapturedImage();
      if (!img) return;
      showCropAnalyzing(img.dataUrl);
      try {
        const result = await CropScanner.analyze(I18n.getLang());
        showCropResult(result, img.dataUrl);
      } catch (err) {
        Notifications.showToast(I18n.t('crop_analysis_error'), 'warning');
      }
    });
    document.getElementById('camera-retake')?.addEventListener('click', async () => {
      const video = document.getElementById('camera-video');
      const preview = document.getElementById('camera-preview');
      preview.classList.add('hidden');
      video.classList.remove('hidden');
      try {
        const stream = await CropScanner.openCamera();
        video.srcObject = stream;
      } catch (e) { /* ignore */ }
    });
  }

  function closeCameraModal() {
    CropScanner.closeCamera();
    document.getElementById('camera-modal')?.classList.add('hidden');
  }

  function showCropAnalyzing(imgUrl) {
    const container = document.getElementById('crop-result-container');
    if (!container) return;
    container.innerHTML = `
      <div class="crop-preview"><img src="${imgUrl}" alt="Crop"></div>
      <div class="ai-loading-card"><div class="ai-loading-card__spinner"></div><div class="ai-loading-card__text">${I18n.t('crop_analyzing')}</div></div>`;
  }

  function showCropResult(result, imgUrl) {
    const container = document.getElementById('crop-result-container');
    if (!container) return;
    const isHealthy = (result.status || '').toLowerCase().includes('healthy') || (result.status || '').toLowerCase().includes('स्वस्थ');
    const sevClass  = (result.severity || '').toLowerCase().includes('severe') ? 'severe' : (result.severity || '').toLowerCase().includes('moderate') ? 'moderate' : 'mild';

    /* Source badge */
    const sourceLabel = result.source === 'backend' ? '🧠 EfficientNetB4 AI'
                      : result.source === 'gemini'  ? '✨ Gemini Vision AI'
                      :                               '🔬 Demo Mode';
    const sourceClass = result.source === 'backend' ? 'source-backend'
                      : result.source === 'gemini'  ? 'source-gemini'
                      :                               'source-demo';

    /* Top-3 predictions from EfficientNet */
    let topPredHtml = '';
    if (result.top_predictions && result.top_predictions.length > 1) {
      topPredHtml = `
        <div class="crop-result__section-title">Top Predictions</div>
        ${result.top_predictions.slice(0, 3).map(p => `
          <div class="crop-top-pred">
            <span class="crop-top-pred__label">${p.class || '—'}</span>
            <div class="crop-top-pred__bar-wrap">
              <div class="crop-top-pred__bar" style="width:${Math.min(p.confidence || 0, 100)}%"></div>
            </div>
            <span class="crop-top-pred__pct">${(p.confidence || 0).toFixed(1)}%</span>
          </div>`).join('')}`;
    }

    container.innerHTML = `
      ${imgUrl ? `<div class="crop-preview"><img src="${imgUrl}" alt="Crop"></div>` : ''}
      <div class="crop-result">
        <div class="crop-result__header">
          <span class="crop-result__badge ${isHealthy ? 'crop-result__badge--healthy' : 'crop-result__badge--diseased'}">${result.status || 'N/A'}</span>
          <span class="crop-result__confidence">${I18n.t('crop_confidence')}: ${result.confidence || 0}%</span>
        </div>
        <div class="crop-result__row"><span class="crop-result__label">${I18n.t('crop_name')}</span><span class="crop-result__value">${result.crop || 'N/A'}</span></div>
        <div class="crop-result__row"><span class="crop-result__label">${I18n.t('crop_disease')}</span><span class="crop-result__value">${result.disease || 'N/A'}</span></div>
        <div class="crop-result__row"><span class="crop-result__label">${I18n.t('crop_severity')}</span><span class="crop-result__value"><span class="crop-severity-badge crop-severity-badge--${sevClass}">${result.severity || 'N/A'}</span></span></div>
        <div class="crop-result__row"><span class="crop-result__label">${I18n.t('crop_symptoms')}</span><span class="crop-result__value">${result.symptoms || 'N/A'}</span></div>
        <div class="crop-result__row"><span class="crop-result__label">${I18n.t('crop_treatment')}</span><span class="crop-result__value">${result.treatment || 'N/A'}</span></div>
        <div class="crop-result__row"><span class="crop-result__label">${I18n.t('crop_prevention')}</span><span class="crop-result__value">${result.prevention || 'N/A'}</span></div>
      </div>
      <button class="btn-secondary" style="width:100%;margin-top:var(--sp-3)" onclick="document.getElementById('crop-result-container').innerHTML=''">${I18n.t('crop_scan_again')}</button>`;
  }

  // ---- VOICE ASSISTANT ---- //
  // Track whether we are currently recording (to toggle button)
  let _voiceRecording = false;
  let _voiceListenHandle = null; // { promise, stop }

  function setupVoiceAssistant() {
    document.getElementById('voice-fab')?.addEventListener('click', openVoiceModal);
    document.getElementById('voice-modal-close')?.addEventListener('click', closeVoiceModal);
    document.getElementById('voice-start-btn')?.addEventListener('click', handleVoiceButtonClick);

    // Register status updates from Whisper engine
    Speech.onStatus((status) => {
      const statusEl = document.getElementById('voice-status');
      const modal = document.getElementById('voice-modal');
      const btnText = document.getElementById('voice-btn-text');
      if (!statusEl) return;
      if (status === 'recording') {
        _voiceRecording = true;
        modal?.classList.add('listening');
        statusEl.textContent = '🔴 ' + (I18n.t('voice_listening') || 'Listening...');
        if (btnText) btnText.textContent = I18n.t('voice_stop') || 'Stop';
      } else if (status === 'processing') {
        _voiceRecording = false;
        modal?.classList.remove('listening');
        statusEl.textContent = '⚙️ ' + (I18n.t('voice_processing') || 'Processing...');
        if (btnText) btnText.textContent = I18n.t('voice_start') || 'Start';
      } else if (status === 'ready') {
        _voiceRecording = false;
        if (btnText) btnText.textContent = I18n.t('voice_start') || 'Start';
      } else if (status === 'error') {
        _voiceRecording = false;
        modal?.classList.remove('listening');
        statusEl.textContent = I18n.t('voice_tap_to_speak') || 'Tap to speak';
        if (btnText) btnText.textContent = I18n.t('voice_start') || 'Start';
      }
    });
  }

  /** Update Whisper model download progress in voice modal */
  function updateWhisperStatus(info) {
    const el = document.getElementById('whisper-model-status');
    if (!el) return;
    if (info.type === 'MODEL_LOADING') {
      const pct = info.progress || 0;
      el.innerHTML = `
        <div class="whisper-download">
          <div class="whisper-download__label">🧠 Downloading Whisper AI model… ${pct}%</div>
          <div class="whisper-download__bar"><div class="whisper-download__fill" style="width:${pct}%"></div></div>
          <div class="whisper-download__sub">One-time download (~40MB). Required for offline voice recognition.</div>
        </div>`;
      el.classList.remove('hidden');
    } else if (info.type === 'MODEL_READY') {
      el.innerHTML = `<div class="whisper-ready">✅ Whisper AI ready — offline voice works!</div>`;
      setTimeout(() => el.classList.add('hidden'), 3000);
    } else if (info.type === 'ERROR') {
      el.innerHTML = `<div class="whisper-error">⚠️ Whisper model failed. Using online mode as fallback.</div>`;
      setTimeout(() => el.classList.add('hidden'), 4000);
    }
  }

  function openVoiceModal() {
    const modal = document.getElementById('voice-modal');
    modal?.classList.remove('hidden');
    // Reset UI
    const statusEl = document.getElementById('voice-status');
    if (statusEl) statusEl.textContent = I18n.t('voice_tap_to_speak');
    document.getElementById('voice-transcript')?.classList.remove('visible');
    document.getElementById('voice-response')?.classList.remove('visible');
    const btnText = document.getElementById('voice-btn-text');
    if (btnText) btnText.textContent = I18n.t('voice_start');

    // Show engine info badge
    const badge = document.getElementById('voice-engine-badge');
    if (badge) {
      if (Speech.whisperAvailable) {
        badge.textContent = '🎙️ Whisper AI (Offline)';
        badge.className = 'voice-engine-badge voice-engine-badge--whisper';
      } else if (Speech.browserSRAvailable) {
        badge.textContent = '🌐 Browser Voice (Online)';
        badge.className = 'voice-engine-badge voice-engine-badge--browser';
      } else {
        badge.textContent = '❌ No voice input available';
        badge.className = 'voice-engine-badge voice-engine-badge--none';
      }
      badge.classList.remove('hidden');
    }
  }

  function closeVoiceModal() {
    document.getElementById('voice-modal')?.classList.add('hidden');
    // Stop any in-progress listening
    if (_voiceListenHandle) {
      _voiceListenHandle.stop();
      _voiceListenHandle = null;
    }
    Speech.stopListening();
    Speech.stopSpeaking();
    _voiceRecording = false;
    document.getElementById('voice-modal')?.classList.remove('listening');
  }

  /** Toggle record/stop on button click */
  async function handleVoiceButtonClick() {
    if (_voiceRecording) {
      // User tapped Stop — trigger Whisper stop → auto-transcribes asynchronously
      if (_voiceListenHandle) {
        _voiceListenHandle.stop();
        _voiceListenHandle = null;
        // UI updates come via Speech.onStatus callback ('processing' → 'ready')
      }
      return;
    }
    await runVoiceAssistant();
  }

  async function runVoiceAssistant() {
    if (!Speech.isSupported()) {
      Notifications.showToast(I18n.t('voice_not_supported') || 'Voice not supported', 'warning');
      return;
    }
    // Whisper works OFFLINE — no internet check needed for recording.
    // Gemini AI response needs internet; mock fallback handles offline case.

    const modal       = document.getElementById('voice-modal');
    const transcriptEl = document.getElementById('voice-transcript');
    const responseEl   = document.getElementById('voice-response');

    transcriptEl?.classList.remove('visible');
    responseEl?.classList.remove('visible');

    Speech.setWeatherContext(weatherData);

    // startAssistant() now returns { promise, stop }
    const assistantHandle = Speech.startAssistant();
    _voiceListenHandle = assistantHandle; // allow Stop button to cancel

    try {
      const result = await assistantHandle.promise;
      _voiceListenHandle = null;
      _voiceRecording    = false;
      modal?.classList.remove('listening');

      const statusEl = document.getElementById('voice-status');
      const btnText  = document.getElementById('voice-btn-text');
      if (statusEl) statusEl.textContent = I18n.t('voice_tap_to_speak');
      if (btnText)  btnText.textContent  = I18n.t('voice_start');

      if (result.query) {
        transcriptEl.textContent = '🗣️ ' + result.query;
        transcriptEl.classList.add('visible');
      }
      if (result.response) {
        responseEl.textContent = '🤖 ' + result.response;
        responseEl.classList.add('visible');
        addVoiceChatItem(result.query, result.response);
      }
    } catch (e) {
      _voiceListenHandle = null;
      _voiceRecording    = false;
      modal?.classList.remove('listening');
      const statusEl = document.getElementById('voice-status');
      const btnText  = document.getElementById('voice-btn-text');
      if (statusEl) statusEl.textContent = I18n.t('voice_tap_to_speak');
      if (btnText)  btnText.textContent  = I18n.t('voice_start');
    }
  }

  function addVoiceChatItem(query, response) {
    const container = document.getElementById('voice-chat-container');
    if (!container) return;
    const html = `
      <div class="voice-chat__item"><div class="voice-chat__avatar voice-chat__avatar--user">🗣️</div><div class="voice-chat__bubble voice-chat__bubble--user">${query}</div></div>
      <div class="voice-chat__item"><div class="voice-chat__avatar voice-chat__avatar--ai">🤖</div><div class="voice-chat__bubble voice-chat__bubble--ai">${response}</div></div>`;
    container.innerHTML = html + container.innerHTML;
  }

  return { init };
})();

// ---- BOOT ---- //
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
