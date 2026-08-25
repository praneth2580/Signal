const DEFAULT_NAMESPACE = "signal";

function canUseStorage() {
  try {
    const probe = "__signal_storage_probe__";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

/**
 * Create a namespaced localStorage helper that can store any JSON-serializable value.
 *
 * @param {string} [namespace="signal"]
 * @returns {{
 *   get: (key: string, fallback?: any) => any,
 *   set: (key: string, value: any) => boolean,
 *   remove: (key: string) => void,
 *   has: (key: string) => boolean,
 *   keys: () => string[],
 *   clear: () => void,
 *   namespace: string
 * }}
 */
export function createStorage(namespace = DEFAULT_NAMESPACE) {
  const prefix = `${namespace}:`;
  const available = typeof window !== "undefined" && canUseStorage();

  function fullKey(key) {
    return `${prefix}${key}`;
  }

  function get(key, fallback = null) {
    if (!available) return fallback;

    try {
      const raw = window.localStorage.getItem(fullKey(key));
      if (raw === null) return fallback;
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  function set(key, value) {
    if (!available) return false;

    try {
      window.localStorage.setItem(fullKey(key), JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  function remove(key) {
    if (!available) return;
    window.localStorage.removeItem(fullKey(key));
  }

  function has(key) {
    if (!available) return false;
    return window.localStorage.getItem(fullKey(key)) !== null;
  }

  function keys() {
    if (!available) return [];

    const found = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const entry = window.localStorage.key(i);
      if (entry?.startsWith(prefix)) {
        found.push(entry.slice(prefix.length));
      }
    }
    return found;
  }

  function clear() {
    keys().forEach(remove);
  }

  return {
    namespace,
    get,
    set,
    remove,
    has,
    keys,
    clear,
  };
}

/** Default app storage (`signal:*` keys). */
export const storage = createStorage(DEFAULT_NAMESPACE);
