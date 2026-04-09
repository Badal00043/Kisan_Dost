/* ============================================================
   Kisan Dost — Notification Engine
   Real-time alerts, irrigation reminders, in-app toasts
   ============================================================ */

const Notifications = (() => {
  let permissionGranted = false;

  /** Request notification permission */
  async function requestPermission() {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') {
      permissionGranted = true;
      return true;
    }
    if (Notification.permission === 'denied') return false;

    const result = await Notification.requestPermission();
    permissionGranted = result === 'granted';
    return permissionGranted;
  }

  /** Send a native notification (if permitted) */
  function sendNative(title, body, icon = 'icons/icon-192.png') {
    if (!permissionGranted) return;
    try {
      const n = new Notification(title, {
        body,
        icon,
        badge: 'icons/icon-192.png',
        vibrate: [200, 100, 200],
        tag: 'kisan-dost-alert',
        renotify: true
      });
      // Auto-close after 6 seconds
      setTimeout(() => n.close(), 6000);
    } catch (e) {
      console.warn('[Notify] Native notification failed:', e);
    }
  }

  /** Show an in-app toast notification */
  function showToast(message, type = 'info', duration = 4000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `
      <div class="toast__icon">${getToastIcon(type)}</div>
      <span class="toast__msg">${message}</span>
      <button class="toast__close" aria-label="Close">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    `;

    const closeBtn = toast.querySelector('.toast__close');
    closeBtn.addEventListener('click', () => removeToast(toast));

    container.appendChild(toast);

    // Auto-remove
    setTimeout(() => removeToast(toast), duration);
  }

  function removeToast(el) {
    if (!el || !el.parentNode) return;
    el.classList.add('removing');
    setTimeout(() => el.remove(), 300);
  }

  function getToastIcon(type) {
    const icons = {
      info: `<svg viewBox="0 0 24 24" fill="none" stroke="#2D6A4F" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
      warning: `<svg viewBox="0 0 24 24" fill="none" stroke="#F4A261" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
      danger: `<svg viewBox="0 0 24 24" fill="none" stroke="#E63946" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`
    };
    return icons[type] || icons.info;
  }

  /**
   * Process weather data and trigger relevant alerts.
   * Called after each weather fetch.
   */
  async function processWeatherAlerts(weather, advisories) {
    if (!weather) return;

    const alertRecords = [];

    for (const adv of advisories) {
      if (adv.severity === 'danger' || adv.severity === 'warning') {
        const title = I18n.t(adv.titleKey, adv.params);
        const desc = I18n.t(adv.descKey, adv.params);

        // In-app toast
        showToast(title, adv.severity === 'danger' ? 'danger' : 'warning');

        // Native notification for danger-level
        if (adv.severity === 'danger') {
          sendNative(title, desc);
        }

        // Store alert record
        alertRecords.push({
          id: `alert-${adv.type}-${Date.now()}`,
          type: adv.type,
          severity: adv.severity,
          titleKey: adv.titleKey,
          descKey: adv.descKey,
          params: adv.params || {},
          timestamp: Date.now()
        });
      }
    }

    // Save alerts to db
    for (const record of alertRecords) {
      try {
        await KisanDB.put(KisanDB.STORES.alerts, record);
      } catch (e) { /* ignore */ }
    }
  }

  /** Get all stored alerts, newest first */
  async function getAlertHistory() {
    try {
      const all = await KisanDB.getAll(KisanDB.STORES.alerts);
      return all.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    } catch (e) {
      return [];
    }
  }

  /** Init — check permission status */
  function init() {
    if ('Notification' in window && Notification.permission === 'granted') {
      permissionGranted = true;
    }
  }

  return {
    init,
    requestPermission,
    sendNative,
    showToast,
    processWeatherAlerts,
    getAlertHistory
  };
})();
