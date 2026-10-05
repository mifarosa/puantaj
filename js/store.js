// localStorage helpers; storage can be unavailable (private mode), so every
// access is guarded and the app keeps working in memory.

const MATCH_KEY = 'puantaj.match';
const HISTORY_KEY = 'puantaj.history';
const PREFS_KEY = 'puantaj.prefs';

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* storage unavailable */ }
}

export const loadMatch = () => read(MATCH_KEY, null);
export const saveMatch = (m) => write(MATCH_KEY, m);

export function loadHistory() {
  const list = read(HISTORY_KEY, []);
  return Array.isArray(list) ? list : [];
}

export function addHistory(entry) {
  write(HISTORY_KEY, [entry, ...loadHistory()].slice(0, 100));
}

export const clearHistory = () => write(HISTORY_KEY, []);

export const loadPrefs = () => read(PREFS_KEY, {});
export const savePrefs = (p) => write(PREFS_KEY, p);
