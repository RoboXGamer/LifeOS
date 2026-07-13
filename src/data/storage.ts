import { migrateAppState, validateAppState } from "../schemas";
import type { AppState } from "../types";

const STORAGE_KEY = "life-os-v1-state";

export type SaveResult = { ok: true } | { ok: false; message: string };

export function loadState(fallback: AppState): AppState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? migrateAppState(JSON.parse(stored), fallback) : fallback;
  } catch {
    return fallback;
  }
}

export function saveState(state: AppState): SaveResult {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(validateAppState(state)));
    return { ok: true };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Could not save local data." };
  }
}

export function clearState() {
  localStorage.removeItem(STORAGE_KEY);
}
