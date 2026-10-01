const memoryFallback = new Map();

function canUseStorage() {
  try {
    const key = '__mk_test__';
    window.localStorage.setItem(key, '1');
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

const enabled = typeof window !== 'undefined' && canUseStorage();

export const storage = {
  get(key, fallback = null) {
    try {
      const raw = enabled ? window.localStorage.getItem(key) : memoryFallback.get(key);
      if (raw == null) return fallback;
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    const raw = JSON.stringify(value);
    if (enabled) window.localStorage.setItem(key, raw);
    else memoryFallback.set(key, raw);
    return value;
  },
  remove(key) {
    if (enabled) window.localStorage.removeItem(key);
    else memoryFallback.delete(key);
  },
};
