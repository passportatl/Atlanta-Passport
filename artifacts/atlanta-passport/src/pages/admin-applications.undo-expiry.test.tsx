// @vitest-environment jsdom
//
// Verifies the undo window hard-expires: once UNDO_WINDOW_MS elapses the
// Undo button disappears, the persisted sessionStorage entry is cleared,
// and no restore PATCH can ever be sent afterwards.

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { EventsOpsPanel } from "./admin-applications";

const ADMIN_KEY = "test-admin-key";
const FLAGGED_ID = "evt-flagged-1";
const PRIOR_STATUS = "possible_duplicate";
const UNDO_WINDOW_MS = 20000;

type FetchCall = { url: string; method: string; body: unknown };

let fetchCalls: FetchCall[] = [];
let duplicatePairs: { flagged: { id: string }; original: unknown }[] = [];

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const summary = {
  total: 1,
  pending: 0,
  needsVerification: 0,
  approved: 0,
  published: 0,
  rejected: 0,
  archived: 0,
  possibleDuplicates: 1,
  avgCompleteness: 80,
};

function makeFlaggedEvent() {
  return {
    id: FLAGGED_ID,
    name: "Midtown Music Fest",
    venue: "Piedmont Park",
    date: "2026-08-01",
    neighborhood: "Midtown",
    source: "ical",
    workflowStatus: PRIOR_STATUS,
    duplicateConfidence: 90,
  };
}

function restoreCalls() {
  return fetchCalls.filter(
    (c) =>
      c.method === "PATCH" &&
      c.url.includes("/admin/events/bulk-status") &&
      Boolean((c.body as { restore?: unknown }).restore),
  );
}

function installFetchMock() {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      const method = (init?.method ?? "GET").toUpperCase();
      let body: unknown = null;
      if (init?.body && typeof init.body === "string") body = JSON.parse(init.body);
      fetchCalls.push({ url, method, body });

      if (url.includes("/admin/events/duplicates")) {
        return jsonResponse(duplicatePairs);
      }
      if (url.includes("/admin/events/bulk-status") && method === "PATCH") {
        const payload = body as {
          ids?: string[];
          restore?: { id: string; status: string; expected: string }[];
        };
        if (payload.restore) {
          return jsonResponse({ updated: payload.restore.length, skipped: 0 });
        }
        const ids = payload.ids ?? [];
        duplicatePairs = duplicatePairs.filter((p) => !ids.includes(p.flagged.id));
        return jsonResponse({
          updated: ids.length,
          prior: ids.map((id) => ({ id, status: PRIOR_STATUS })),
        });
      }
      if (url.includes("/admin/events/summary")) return jsonResponse(summary);
      if (url.includes("/admin/notifications")) return jsonResponse([]);
      if (url.includes("/admin/sources")) return jsonResponse([]);
      if (url.includes("/admin/events")) return jsonResponse([]);
      return jsonResponse([]);
    }),
  );
}

function renderPanel() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, refetchInterval: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <EventsOpsPanel adminKey={ADMIN_KEY} />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  // shouldAdvanceTime keeps async waits (findBy*, react-query) working while
  // still letting us jump the clock past the undo window deterministically.
  vi.useFakeTimers({ shouldAdvanceTime: true });
  sessionStorage.clear();
  fetchCalls = [];
  duplicatePairs = [{ flagged: makeFlaggedEvent(), original: null }];
  installFetchMock();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

async function openUndoWindow() {
  renderPanel();
  fireEvent.click(screen.getByRole("button", { name: /duplicates/i }));
  await screen.findByText("Midtown Music Fest");
  fireEvent.click(screen.getByRole("button", { name: /not a duplicate — send to review/i }));
  await screen.findByText('✅ 1 event updated to "pending".');
  await screen.findByRole("button", { name: /undo \(\d+s\)/i });
  expect(sessionStorage.getItem("adminBulkUndo")).toBeTruthy();
}

describe("Undo window expiry", () => {
  it("removes the Undo button and clears sessionStorage once the window elapses", async () => {
    await openUndoWindow();

    act(() => {
      vi.advanceTimersByTime(UNDO_WINDOW_MS + 1000);
    });

    expect(screen.queryByRole("button", { name: /undo \(\d+s\)/i })).toBeNull();
    expect(sessionStorage.getItem("adminBulkUndo")).toBeNull();
    expect(restoreCalls()).toHaveLength(0);
  });

  it("never sends a restore PATCH after expiry, even if a click lands on the last-known button position", async () => {
    await openUndoWindow();

    // Grab a handle to the button before expiry — simulates a click that was
    // dispatched at the last moment but processed after the window closed.
    const undoButton = screen.getByRole("button", { name: /undo \(\d+s\)/i });

    act(() => {
      vi.advanceTimersByTime(UNDO_WINDOW_MS + 1000);
    });

    // The stale handle is detached from the DOM; firing a click on it must be a no-op.
    fireEvent.click(undoButton);
    await act(async () => {
      await Promise.resolve();
    });

    expect(restoreCalls()).toHaveLength(0);
    expect(screen.queryByText(/↩️ Undone/)).toBeNull();
    expect(sessionStorage.getItem("adminBulkUndo")).toBeNull();
  });

  it("does not resurrect an expired persisted entry after a remount (refresh)", async () => {
    await openUndoWindow();

    act(() => {
      vi.advanceTimersByTime(UNDO_WINDOW_MS + 1000);
    });
    cleanup();

    // Simulate an expired payload that somehow survived (e.g. tab restored)
    sessionStorage.setItem(
      "adminBulkUndo",
      JSON.stringify({
        entries: [{ id: FLAGGED_ID, status: PRIOR_STATUS }],
        appliedStatus: "pending",
        expiresAt: Date.now() - 1,
      }),
    );

    renderPanel();
    await screen.findByRole("button", { name: /duplicates/i });

    expect(screen.queryByRole("button", { name: /undo \(\d+s\)/i })).toBeNull();
    expect(sessionStorage.getItem("adminBulkUndo")).toBeNull();
    expect(restoreCalls()).toHaveLength(0);
  });
});
