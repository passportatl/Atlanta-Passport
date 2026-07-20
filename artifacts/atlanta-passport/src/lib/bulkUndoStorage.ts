// Bulk-undo persistence for the admin events panel.
// The undo window survives a page refresh via sessionStorage; expired or
// corrupt payloads are ignored and removed so a stale undo can never be
// replayed against events someone else has since edited.

export const UNDO_STORAGE_KEY = "adminBulkUndo";

export type PriorStatusEntry = { id: string; status: string };

export interface PersistedUndo {
  entries: PriorStatusEntry[];
  appliedStatus: string;
  expiresAt: number;
}

export function persistUndo(entries: PriorStatusEntry[], appliedStatus: string, expiresAt: number) {
  try {
    sessionStorage.setItem(UNDO_STORAGE_KEY, JSON.stringify({ entries, appliedStatus, expiresAt }));
  } catch {
    // Storage unavailable/full — undo still works in-memory for this session
  }
}

export function clearPersistedUndo() {
  try {
    sessionStorage.removeItem(UNDO_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function readPersistedUndo(): PersistedUndo | null {
  try {
    const raw = sessionStorage.getItem(UNDO_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PersistedUndo>;
    if (
      !Array.isArray(parsed.entries) ||
      parsed.entries.length === 0 ||
      typeof parsed.appliedStatus !== "string" ||
      typeof parsed.expiresAt !== "number" ||
      parsed.expiresAt <= Date.now()
    ) {
      clearPersistedUndo();
      return null;
    }
    return parsed as PersistedUndo;
  } catch {
    clearPersistedUndo();
    return null;
  }
}
