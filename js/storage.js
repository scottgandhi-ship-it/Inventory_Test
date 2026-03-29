/* Storage Layer - localStorage with JSON serialization */
const Storage = {
  KEYS: {
    ITEMS: 'inventory_items',
    TRANSACTIONS: 'inventory_transactions',
    SETTINGS: 'inventory_settings'
  },

  save(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (e) {
      return false;
    }
  },

  load(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  },

  remove(key) {
    localStorage.removeItem(key);
  }
};
