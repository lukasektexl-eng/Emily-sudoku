/** localStorage wrapped so private mode or a full disk never crashes the game. */
const PREFIX = 'emily-sudoku:';

export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function save(key: string, value: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

/** The stored text exactly as it is, without parsing (null if missing). */
export function loadRaw(key: string): string | null {
  try {
    return localStorage.getItem(PREFIX + key);
  } catch {
    return null;
  }
}

export function saveRaw(key: string, value: string): void {
  try {
    localStorage.setItem(PREFIX + key, value);
  } catch {
    /* ignore */
  }
}

export function remove(key: string): void {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    /* ignore */
  }
}

/**
 * Bump this to wipe every saved game and all progress on every phone, once,
 * the next time the app is opened with the new version. Never lower it.
 *   1: fresh start for Emily (11 Nov 2026)
 */
export const RESET_EPOCH = 1;

/** Clears everything saved by this app if it was saved before the current epoch. */
export function resetIfOutdated(store: Storage | undefined = globalThis.localStorage): boolean {
  try {
    if (!store) return false;
    const key = PREFIX + 'epoch';
    if (Number(store.getItem(key)) >= RESET_EPOCH) return false;
    const doomed: string[] = [];
    for (let i = 0; i < store.length; i++) {
      const k = store.key(i);
      if (k && k.startsWith(PREFIX)) doomed.push(k);
    }
    doomed.forEach((k) => store.removeItem(k));
    store.setItem(key, String(RESET_EPOCH));
    return doomed.length > 0;
  } catch {
    return false;
  }
}
