import type { Area, Item } from "../types";

const STORAGE_KEY = "life-os-v1-state";

export type PersistedState = {
  items: Item[];
  areas: Area[];
};

export function loadState(fallback: PersistedState): PersistedState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return fallback;
    const parsed = JSON.parse(stored) as Partial<PersistedState>;
    if (!Array.isArray(parsed.items) || !Array.isArray(parsed.areas)) return fallback;
    return { items: parsed.items, areas: parsed.areas };
  } catch {
    return fallback;
  }
}

export function saveState(state: PersistedState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function clearState() {
  localStorage.removeItem(STORAGE_KEY);
}
