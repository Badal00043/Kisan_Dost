/* ============================================================
   Kisan Dost — IndexedDB Wrapper
   Handles all persistent storage with TTL support
   ============================================================ */

const KisanDB = (() => {
  const DB_NAME = 'kisan-dost-db';
  const DB_VERSION = 1;
  const STORES = {
    weather: 'weather',
    advisories: 'advisories',
    preferences: 'preferences',
    alerts: 'alerts',
    schemes: 'schemes'
  };

  let dbInstance = null;

  /** Open or create the database */
  function openDB() {
    if (dbInstance) return Promise.resolve(dbInstance);

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        Object.values(STORES).forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, { keyPath: 'id' });
          }
        });
      };

      request.onsuccess = (e) => {
        dbInstance = e.target.result;
        resolve(dbInstance);
      };

      request.onerror = (e) => {
        console.error('[DB] Open failed:', e.target.error);
        reject(e.target.error);
      };
    });
  }

  /** Generic put (upsert) */
  async function put(storeName, data) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      // Stamp every record with a timestamp
      const record = { ...data, _timestamp: Date.now() };
      const req = store.put(record);
      req.onsuccess = () => resolve(record);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  /** Generic get by key */
  async function get(storeName, key) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  /** Get with TTL check — returns null if expired */
  async function getWithTTL(storeName, key, ttlMs) {
    const record = await get(storeName, key);
    if (!record) return null;
    const age = Date.now() - (record._timestamp || 0);
    if (age > ttlMs) return null; // expired
    return record;
  }

  /** Get all records from a store */
  async function getAll(storeName) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  /** Delete a record */
  async function remove(storeName, key) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = (e) => reject(e.target.error);
    });
  }

  /** Clear all records in a store */
  async function clear(storeName) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = (e) => reject(e.target.error);
    });
  }

  return { STORES, openDB, put, get, getWithTTL, getAll, remove, clear };
})();
