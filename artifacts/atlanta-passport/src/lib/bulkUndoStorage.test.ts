import { beforeEach, describe, expect, it } from "vitest";
import {
  UNDO_STORAGE_KEY,
  persistUndo,
  readPersistedUndo,
  clearPersistedUndo,
} from "./bulkUndoStorage";

// Minimal sessionStorage stub for the node test environment
function makeStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => void store.set(k, String(v)),
    removeItem: (k: string) => void store.delete(k),
    clear: () => void store.clear(),
    key: (i: number) => [...store.keys()][i] ?? null,
    get length() {
      return store.size;
    },
  } as Storage;
}

beforeEach(() => {
  (globalThis as { sessionStorage: Storage }).sessionStorage = makeStorage();
});

describe("bulk undo persistence", () => {
  it("round-trips a persisted undo payload (persist → read back)", () => {
    const entries = [
      { id: "a", status: "pending" },
      { id: "b", status: "approved" },
    ];
    const expiresAt = Date.now() + 20000;
    persistUndo(entries, "archived", expiresAt);

    const read = readPersistedUndo();
    expect(read).not.toBeNull();
    expect(read!.entries).toEqual(entries);
    expect(read!.appliedStatus).toBe("archived");
    expect(read!.expiresAt).toBe(expiresAt);
  });

  it("returns null when nothing is stored", () => {
    expect(readPersistedUndo()).toBeNull();
  });

  it("ignores and removes an expired payload", () => {
    persistUndo([{ id: "a", status: "pending" }], "archived", Date.now() - 1);
    expect(readPersistedUndo()).toBeNull();
    expect(sessionStorage.getItem(UNDO_STORAGE_KEY)).toBeNull();
  });

  it("ignores and removes corrupt JSON", () => {
    sessionStorage.setItem(UNDO_STORAGE_KEY, "{not json");
    expect(readPersistedUndo()).toBeNull();
    expect(sessionStorage.getItem(UNDO_STORAGE_KEY)).toBeNull();
  });

  it.each([
    ["missing entries", { appliedStatus: "archived", expiresAt: Date.now() + 9999 }],
    ["empty entries", { entries: [], appliedStatus: "archived", expiresAt: Date.now() + 9999 }],
    ["entries not an array", { entries: "nope", appliedStatus: "archived", expiresAt: Date.now() + 9999 }],
    ["missing appliedStatus", { entries: [{ id: "a", status: "pending" }], expiresAt: Date.now() + 9999 }],
    ["missing expiresAt", { entries: [{ id: "a", status: "pending" }], appliedStatus: "archived" }],
    ["expiresAt not a number", { entries: [{ id: "a", status: "pending" }], appliedStatus: "archived", expiresAt: "soon" }],
  ])("ignores and removes malformed payload: %s", (_label, payload) => {
    sessionStorage.setItem(UNDO_STORAGE_KEY, JSON.stringify(payload));
    expect(readPersistedUndo()).toBeNull();
    expect(sessionStorage.getItem(UNDO_STORAGE_KEY)).toBeNull();
  });

  it("clearPersistedUndo removes the stored payload", () => {
    persistUndo([{ id: "a", status: "pending" }], "archived", Date.now() + 9999);
    clearPersistedUndo();
    expect(sessionStorage.getItem(UNDO_STORAGE_KEY)).toBeNull();
  });

  it("does not throw when sessionStorage is unavailable", () => {
    (globalThis as { sessionStorage?: Storage }).sessionStorage = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
      removeItem: () => {
        throw new Error("blocked");
      },
    } as unknown as Storage;
    expect(() => persistUndo([{ id: "a", status: "x" }], "y", 1)).not.toThrow();
    expect(readPersistedUndo()).toBeNull();
    expect(() => clearPersistedUndo()).not.toThrow();
  });
});
