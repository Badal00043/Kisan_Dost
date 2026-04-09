/* ============================================================
   Kisan Dost — Weather Module
   Current weather + 5-day forecast from OpenWeatherMap
   ============================================================ */

const Weather = (() => {
  // ----------------------------------------------------------------
  // 🔑  CONFIGURATION — Replace with your own OpenWeatherMap API key
  // ----------------------------------------------------------------
  const API_KEY = '591e27a7805081e6bf5434a2a22e81e9';

  const BASE_URL = 'https://api.openweathermap.org/data/2.5';
  const TTL = 30 * 60 * 1000;           // 30 min for current weather
  const FORECAST_TTL = 60 * 60 * 1000;  // 1 hour for forecast
  const CACHE_KEY = 'current';
  const FORECAST_KEY = 'forecast';

  // ---- CURRENT WEATHER ---- //
  async function getWeather(lat, lon) {
    // 1. Check cache
    try {
      const cached = await KisanDB.getWithTTL(KisanDB.STORES.weather, CACHE_KEY, TTL);
      if (cached) { console.log('[Weather] Serving from cache'); return cached; }
    } catch (e) { /* cache miss */ }

    // 2. Offline fallback
    if (!navigator.onLine) {
      const stale = await KisanDB.get(KisanDB.STORES.weather, CACHE_KEY);
      if (stale) { stale._stale = true; return stale; }
      return null;
    }

    // 3. Fetch fresh
    try {
      const url = `${BASE_URL}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const raw = await resp.json();
      const parsed = parseWeather(raw, lat, lon);
      await KisanDB.put(KisanDB.STORES.weather, parsed);
      console.log('[Weather] Fresh data cached');
      return parsed;
    } catch (err) {
      console.error('[Weather] Fetch failed:', err);
      const stale = await KisanDB.get(KisanDB.STORES.weather, CACHE_KEY);
      if (stale) { stale._stale = true; return stale; }
      return null;
    }
  }

  function parseWeather(raw, lat, lon) {
    return {
      id: CACHE_KEY,
      lat, lon,
      temp: Math.round(raw.main?.temp ?? 0),
      feels_like: Math.round(raw.main?.feels_like ?? 0),
      humidity: raw.main?.humidity ?? 0,
      pressure: raw.main?.pressure ?? 0,
      wind_speed: Math.round((raw.wind?.speed ?? 0) * 3.6),
      wind_deg: raw.wind?.deg ?? 0,
      condition: raw.weather?.[0]?.main ?? 'Unknown',
      description: raw.weather?.[0]?.description ?? '',
      icon: raw.weather?.[0]?.icon ?? '01d',
      city: raw.name ?? '',
      country: raw.sys?.country ?? '',
      sunrise: raw.sys?.sunrise ?? 0,
      sunset: raw.sys?.sunset ?? 0,
      visibility: raw.visibility ?? 10000,
      clouds: raw.clouds?.all ?? 0,
      rain_1h: raw.rain?.['1h'] ?? 0,
      _stale: false,
      _timestamp: Date.now()
    };
  }

  // ---- 5-DAY FORECAST ---- //
  async function getForecast(lat, lon) {
    // 1. Check cache
    try {
      const cached = await KisanDB.getWithTTL(KisanDB.STORES.weather, FORECAST_KEY, FORECAST_TTL);
      if (cached) { console.log('[Weather] Forecast from cache'); return cached; }
    } catch (e) { /* cache miss */ }

    // 2. Offline fallback
    if (!navigator.onLine) {
      const stale = await KisanDB.get(KisanDB.STORES.weather, FORECAST_KEY);
      if (stale) { stale._stale = true; return stale; }
      return null;
    }

    // 3. Fetch
    try {
      const url = `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const raw = await resp.json();
      const parsed = parseForecast(raw);
      await KisanDB.put(KisanDB.STORES.weather, parsed);
      console.log('[Weather] Forecast cached');
      return parsed;
    } catch (err) {
      console.error('[Weather] Forecast fetch failed:', err);
      const stale = await KisanDB.get(KisanDB.STORES.weather, FORECAST_KEY);
      if (stale) { stale._stale = true; return stale; }
      return null;
    }
  }

  /** Aggregate 3-hour intervals into daily summaries */
  function parseForecast(raw) {
    const dailyMap = {};

    (raw.list || []).forEach(item => {
      const date = item.dt_txt?.split(' ')[0]; // "2026-04-10"
      if (!date) return;

      if (!dailyMap[date]) {
        dailyMap[date] = {
          date,
          temps: [],
          humidity: [],
          wind: [],
          rain: 0,
          conditions: [],
          icons: [],
          pop: []       // probability of precipitation
        };
      }

      const d = dailyMap[date];
      d.temps.push(item.main?.temp ?? 0);
      d.humidity.push(item.main?.humidity ?? 0);
      d.wind.push((item.wind?.speed ?? 0) * 3.6);
      d.rain += (item.rain?.['3h'] ?? 0);
      d.conditions.push(item.weather?.[0]?.main ?? '');
      d.icons.push(item.weather?.[0]?.icon ?? '01d');
      d.pop.push((item.pop ?? 0) * 100);
    });

    // Convert to array of daily summaries
    const days = Object.values(dailyMap).map(d => {
      const tempHigh = Math.round(Math.max(...d.temps));
      const tempLow = Math.round(Math.min(...d.temps));
      const avgHumidity = Math.round(d.humidity.reduce((a, b) => a + b, 0) / d.humidity.length);
      const avgWind = Math.round(d.wind.reduce((a, b) => a + b, 0) / d.wind.length);
      const rainProb = Math.round(Math.max(...d.pop));

      // Dominant condition = most frequent
      const condCount = {};
      d.conditions.forEach(c => { condCount[c] = (condCount[c] || 0) + 1; });
      const dominant = Object.entries(condCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Clear';

      // Pick midday icon (index 4 = noon) or the most common
      const midIcon = d.icons[4] || d.icons[Math.floor(d.icons.length / 2)] || '01d';

      return {
        date: d.date,
        dayName: getDayName(d.date),
        tempHigh,
        tempLow,
        humidity: avgHumidity,
        wind: avgWind,
        rain: Math.round(d.rain * 10) / 10,
        rainProb,
        condition: dominant,
        icon: midIcon
      };
    });

    return {
      id: FORECAST_KEY,
      city: raw.city?.name || '',
      country: raw.city?.country || '',
      days: days.slice(0, 5),  // Max 5 days
      _stale: false,
      _timestamp: Date.now()
    };
  }

  function getDayName(dateStr) {
    const d = new Date(dateStr + 'T12:00:00');
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return d.toLocaleDateString('en-US', { weekday: 'short' });
  }

  // ---- DEMO DATA ---- //
  function getDemoWeather() {
    const now = Math.floor(Date.now() / 1000);
    return {
      id: CACHE_KEY,
      lat: 20.59, lon: 78.96,
      temp: 34, feels_like: 37, humidity: 62, pressure: 1008,
      wind_speed: 14, wind_deg: 220,
      condition: 'Clouds', description: 'scattered clouds', icon: '03d',
      city: 'Nagpur', country: 'IN',
      sunrise: now - 3600 * 6, sunset: now + 3600 * 6,
      visibility: 8000, clouds: 40, rain_1h: 0,
      _stale: false, _demo: true, _timestamp: Date.now()
    };
  }

  function getDemoForecast() {
    const today = new Date();
    const days = [];
    const conditions = ['Clear', 'Clouds', 'Rain', 'Clear', 'Clouds'];
    const icons = ['01d', '03d', '10d', '01d', '04d'];
    const temps = [[36, 24], [34, 23], [30, 22], [33, 21], [35, 23]];

    for (let i = 0; i < 5; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      days.push({
        date: dateStr,
        dayName: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' }),
        tempHigh: temps[i][0],
        tempLow: temps[i][1],
        humidity: 55 + i * 5,
        wind: 10 + i * 3,
        rain: i === 2 ? 12.5 : 0,
        rainProb: i === 2 ? 82 : i === 4 ? 35 : 10,
        condition: conditions[i],
        icon: icons[i]
      });
    }

    return {
      id: FORECAST_KEY,
      city: 'Nagpur', country: 'IN',
      days,
      _stale: false, _demo: true, _timestamp: Date.now()
    };
  }

  function hasAPIKey() {
    return API_KEY && API_KEY !== 'YOUR_OPENWEATHER_API_KEY';
  }

  return { getWeather, getForecast, getDemoWeather, getDemoForecast, hasAPIKey, TTL };
})();
