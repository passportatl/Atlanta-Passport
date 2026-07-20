// @vitest-environment jsdom
//
// Verifies that a FAILED Undo (server error on the restore PATCH) tells the
// admin via the error banner instead of silently losing the change, that the
// Undo button stays available so the admin can retry, and that a retry after
// a transient failure succeeds.

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { EventsOpsPanel } from "./admin-applications";

const ADMIN_KEY = "test-admin-key";
const FLAGGED_ID = "evt-flagged-1";
const PRIOR_STATUS = "possible_duplicate";

type FetchCall = { url: string; method: string; body: unknown };

let fetchCalls: FetchCall[] = [];
let duplicatePairs: unknown[] = [];
let restoreResponses: (() => Response)[] = [];

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
          status?: string;
          restore?: { id: string; status: string; expected: string }[];
        };
        if (payload.restore) {
          const next = restoreResponses.shift();
          if (next) return next();
          return jsonResponse({ updated: payload.restore.length, skipped: 0 });
        }
        duplicatePairs = [];
        return jsonResponse({
          updated: payload.ids?.length ?? 0,
          prior: (payload.ids ?? []).map((id) => ({ id, status: PRIOR_STATUS })),
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
  sessionStorage.clear();
  fetchCalls = [];
  duplicatePairs = [{ flagged: makeFlaggedEvent(), original: null }];
  restoreResponses = [];
  installFetchMock();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

/** Resolve the flagged duplicate so an undo entry is registered. */
async function applyStatusChange() {
  renderPanel();
  fireEvent.click(screen.getByRole("button", { name: /duplicates/i }));
  await screen.findByText("Midtown Music Fest");
  fireEvent.click(screen.getByRole("button", { name: /not a duplicate — send to review/i }));
  await screen.findByText('✅ 1 event updated to "pending".');
  return screen.findByRole("button", { name: /undo \(\d+s\)/i });
}

function countRestoreCalls() {
  return fetchCalls.filter(
    (c) =>
      c.method === "PATCH" &&
      c.url.includes("/admin/events/bulk-status") &&
      (c.body as { restore?: unknown }).restore,
  ).length;
}

describe("Failed Undo", () => {
  it("shows an error banner when the restore PATCH fails with a server error", async () => {
    restoreResponses = [() => jsonResponse({ error: "boom" }, 500)];
    const undoButton = await applyStatusChange();

    fireEvent.click(undoButton);
    await screen.findByText(/❌ Undo failed: 500/);

    // No false success message
    expect(screen.queryByText(/↩️ Undone/)).toBeNull();
    expect(countRestoreCalls()).toBe(1);
  });

  it("shows an error banner when the restore PATCH fails with a network error", async () => {
    restoreResponses = [
      () => {
        throw new Error("Network request failed");
      },
    ];
    const undoButton = await applyStatusChange();

    fireEvent.click(undoButton);
    await screen.findByText(/❌ Network request failed/);
    expect(screen.queryByText(/↩️ Undone/)).toBeNull();
  });

  it("keeps the Undo button available for retry after a failure, without clearing the persisted undo entry", async () => {
    restoreResponses = [() => jsonResponse({ error: "boom" }, 500)];
    const undoButton = await applyStatusChange();

    fireEvent.click(undoButton);
    await screen.findByText(/❌ Undo failed: 500/);

    // The undo window is NOT consumed by a failure: the button remains
    // enabled and the sessionStorage entry survives for a refresh.
    const retryButton = screen.getByRole("button", { name: /undo \(\d+s\)/i });
    expect((retryButton as HTMLButtonElement).disabled).toBe(false);
    const raw = sessionStorage.getItem("adminBulkUndo");
    expect(raw).toBeTruthy();
    const persisted = JSON.parse(raw!) as { entries: unknown; appliedStatus: string };
    expect(persisted.entries).toEqual([{ id: FLAGGED_ID, status: PRIOR_STATUS }]);
    expect(persisted.appliedStatus).toBe("pending");
  });

  it("lets a retry succeed after a transient failure and only then consumes the undo window", async () => {
    restoreResponses = [() => jsonResponse({ error: "boom" }, 500)];
    const undoButton = await applyStatusChange();

    // First attempt fails
    fireEvent.click(undoButton);
    await screen.findByText(/❌ Undo failed: 500/);

    // Retry succeeds (mock queue is empty → default success response)
    fireEvent.click(screen.getByRole("button", { name: /undo \(\d+s\)/i }));
    await screen.findByText(/↩️ Undone — 1 event restored to their previous status\./);

    // Both attempts carried the exact same restore payload
    const restores = fetchCalls.filter(
      (c) =>
        c.method === "PATCH" &&
        c.url.includes("/admin/events/bulk-status") &&
        (c.body as { restore?: unknown }).restore,
    );
    expect(restores).toHaveLength(2);
    for (const call of restores) {
      expect(call.body).toEqual({
        restore: [{ id: FLAGGED_ID, status: PRIOR_STATUS, expected: "pending" }],
      });
    }

    // Now the undo window is consumed
    expect(screen.queryByRole("button", { name: /undo \(\d+s\)/i })).toBeNull();
    expect(sessionStorage.getItem("adminBulkUndo")).toBeNull();
  });
});
