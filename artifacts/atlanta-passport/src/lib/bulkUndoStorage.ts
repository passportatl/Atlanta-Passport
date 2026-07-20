// Bulk-undo persistence for the admin panels (events ops + content page).
// The undo window survives a page refresh via sessionStorage; expired or
// corrupt payloads are ignored and removed so a stale undo can never be
// replayed against rows someone else has since edited.
//
// Each panel uses its own storage key so one panel's undo never leaks into
// another. The key defaults to the events panel's for backwards compatibility.

export const UNDO_STORAGE_KEY = "adminBulkUndo";
export const CONTENT_UNDO_STORAGE_KEY = "adminContentBulkUndo";

export type PriorStatusEntry = { id: string; status: string };

export interface PersistedUndo {
  entries: PriorStatusEntry[];
  appliedStatus: string;
  expiresAt: number;
}

export function persistUndo(
  entries: PriorStatusEntry[],
  appliedStatus: string,
  expiresAt: number,
  key: string = UNDO_STORAGE_KEY,
) {
  try {
    sessionStorage.setItem(key, JSON.stringify({ entries, appliedStatus, expiresAt }));
  } catch {
    // Storage unavailable/full — undo still works in-memory for this session
  }
}

export function clearPersistedUndo(key: string = UNDO_STORAGE_KEY) {
  try {
    sessionStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function readPersistedUndo(key: string = UNDO_STORAGE_KEY): PersistedUndo | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PersistedUndo>;
    if (
      !Array.isArray(parsed.entries) ||
      parsed.entries.length === 0 ||
      typeof parsed.appliedStatus !== "string" ||
      typeof parsed.expiresAt !== "number" ||
      parsed.expiresAt <= Date.now()
    ) {
      clearPersistedUndo(key);
      return null;
    }
    return parsed as PersistedUndo;
  } catch {
    clearPersistedUndo(key);
    return null;
  }
}
