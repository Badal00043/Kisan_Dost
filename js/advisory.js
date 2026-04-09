/* ============================================================
   Kisan Dost — Farming Advisory Engine
   Rule-based actionable insights from weather data
   ============================================================ */

const Advisory = (() => {
  const TTL = 6 * 60 * 60 * 1000; // 6 hours
  const CACHE_KEY = 'current-advisories';

  /**
   * Generate advisories from weather data.
   * Returns array of action objects with type, severity, icon, and message keys.
   */
  function generateAdvisories(weather) {
    if (!weather) return [];

    const actions = [];
    const { temp, humidity, wind_speed, condition, rain_1h, clouds } = weather;

    // ---- Temperature-based ----
    if (temp >= 42) {
      actions.push({
        type: 'heatwave',
        severity: 'danger',
        icon: 'heat',
        titleKey: 'adv_heatwave_title',
        descKey: 'adv_heatwave_desc',
        params: { temp }
      });
    } else if (temp >= 38) {
      actions.push({
        type: 'heat_stress',
        severity: 'warning',
        icon: 'heat',
        titleKey: 'adv_heat_stress_title',
        descKey: 'adv_heat_stress_desc',
        params: { temp }
      });
    }

    if (temp <= 5) {
      actions.push({
        type: 'frost',
        severity: 'danger',
        icon: 'cold',
        titleKey: 'adv_frost_title',
        descKey: 'adv_frost_desc',
        params: { temp }
      });
    } else if (temp <= 10) {
      actions.push({
        type: 'cold_stress',
        severity: 'warning',
        icon: 'cold',
        titleKey: 'adv_cold_stress_title',
        descKey: 'adv_cold_stress_desc',
        params: { temp }
      });
    }

    // Good temperature range
    if (temp >= 20 && temp <= 35) {
      actions.push({
        type: 'good_temp',
        severity: 'info',
        icon: 'check',
        titleKey: 'adv_good_temp_title',
        descKey: 'adv_good_temp_desc',
        params: { temp }
      });
    }

    // ---- Humidity-based ----
    if (humidity >= 85) {
      actions.push({
        type: 'fungal_risk',
        severity: 'danger',
        icon: 'bug',
        titleKey: 'adv_fungal_high_title',
        descKey: 'adv_fungal_high_desc',
        params: { humidity }
      });
    } else if (humidity >= 70) {
      actions.push({
        type: 'fungal_watch',
        severity: 'warning',
        icon: 'bug',
        titleKey: 'adv_fungal_watch_title',
        descKey: 'adv_fungal_watch_desc',
        params: { humidity }
      });
    }

    if (humidity <= 30) {
      actions.push({
        type: 'irrigation',
        severity: 'warning',
        icon: 'water',
        titleKey: 'adv_irrigation_title',
        descKey: 'adv_irrigation_desc',
        params: { humidity }
      });
    }

    // ---- Rain-based ----
    const isRaining = condition === 'Rain' || condition === 'Drizzle' || rain_1h > 0;
    const isThunder = condition === 'Thunderstorm';

    if (isThunder) {
      actions.push({
        type: 'thunderstorm',
        severity: 'danger',
        icon: 'storm',
        titleKey: 'adv_thunderstorm_title',
        descKey: 'adv_thunderstorm_desc'
      });
    } else if (isRaining) {
      actions.push({
        type: 'rain',
        severity: 'info',
        icon: 'rain',
        titleKey: 'adv_rain_title',
        descKey: 'adv_rain_desc'
      });
    }

    if (isRaining || rain_1h > 0) {
      actions.push({
        type: 'delay_spray',
        severity: 'warning',
        icon: 'spray',
        titleKey: 'adv_delay_spray_title',
        descKey: 'adv_delay_spray_desc'
      });
    }

    // ---- Wind-based ----
    if (wind_speed >= 40) {
      actions.push({
        type: 'high_wind',
        severity: 'danger',
        icon: 'wind',
        titleKey: 'adv_high_wind_title',
        descKey: 'adv_high_wind_desc',
        params: { wind_speed }
      });
    } else if (wind_speed >= 25) {
      actions.push({
        type: 'wind_caution',
        severity: 'warning',
        icon: 'wind',
        titleKey: 'adv_wind_caution_title',
        descKey: 'adv_wind_caution_desc',
        params: { wind_speed }
      });
    }

    // ---- Clear sky opportunity ----
    if (clouds <= 20 && !isRaining && temp >= 20 && temp <= 38) {
      actions.push({
        type: 'good_conditions',
        severity: 'info',
        icon: 'sun',
        titleKey: 'adv_good_conditions_title',
        descKey: 'adv_good_conditions_desc'
      });
    }

    return actions;
  }

  /**
   * Get advisories — uses cached if within TTL.
   */
  async function getAdvisories(weather) {
    // Check cache
    try {
      const cached = await KisanDB.getWithTTL(
        KisanDB.STORES.advisories,
        CACHE_KEY,
        TTL
      );
      if (cached && cached.items) {
        return cached.items;
      }
    } catch (e) { /* continue */ }

    const items = generateAdvisories(weather);

    // Cache
    try {
      await KisanDB.put(KisanDB.STORES.advisories, {
        id: CACHE_KEY,
        items
      });
    } catch (e) { /* ignore */ }

    return items;
  }

  return { getAdvisories, generateAdvisories };
})();
