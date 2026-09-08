// Local persistence layer. Everything lives in localStorage as one JSON document.
// This is intentionally the *only* place that talks to storage — swapping this
// module for a real backend later shouldn't require touching UI code, since
// AppContext is the only consumer.

const STORAGE_KEY = "aht:db:v1";

export function createDefaultDB() {
  return {
    version: 1,
    user: null,
    habits: [],
    checkins: [],
    adjustments: [],
    coachMessages: [],
    buddies: [],
    settings: {
      notificationsEnabled: false,
      reminderTime: "20:00",
    },
  };
}

export function loadDB() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultDB();
    const parsed = JSON.parse(raw);
    return { ...createDefaultDB(), ...parsed };
  } catch {
    return createDefaultDB();
  }
}

export function saveDB(db) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    // storage unavailable (private browsing, quota) — app still works for this session
  }
}

export function resetDB() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function newId() {
  return crypto.randomUUID();
}
