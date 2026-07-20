// @vitest-environment jsdom
//
// Verifies that a duplicate-resolution action on the Duplicates tab
// (Send to Review / Confirm Duplicate — Archive) registers an undo entry,
// that the Undo banner stays visible when switching ops tabs, and that
// pressing Undo restores the exact prior status via the restore endpoint.

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor, fireEvent, cleanup, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { EventsOpsPanel } from "./admin-applications";

const ADMIN_KEY = "test-admin-key";
const FLAGGED_ID = "evt-flagged-1";
const PRIOR_STATUS = "possible_duplicate";

type FetchCall = { url: string; method: string; body: unknown };

let fetchCalls: FetchCall[] = [];
let duplicatePairs: { flagged: { id: string }; original: unknown }[] = [];
let priorById: Record<string, string> = {};
let restoreResponse: ((restore: { id: string }[]) => { updated: number; skipped: number }) | null = null;

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
        const payload = body as { ids?: string[]; status?: string; restore?: { id: string; status: string; expected: string }[] };
        if (payload.restore) {
          const result = restoreResponse
            ? restoreResponse(payload.restore)
            : { updated: payload.restore.length, skipped: 0 };
          return jsonResponse(result);
        }
        // Status change applied — the resolved pair disappears from the duplicates list
        const ids = payload.ids ?? [];
        duplicatePairs = duplicatePairs.filter((p) => !ids.includes(p.flagged.id));
        return jsonResponse({
          updated: ids.length,
          prior: ids.map((id) => ({ id, status: priorById[id] ?? PRIOR_STATUS })),
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
  priorById = {};
  restoreResponse = null;
  installFetchMock();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

async function resolveFromDuplicatesTab(buttonText: RegExp, appliedStatus: string) {
  renderPanel();

  // Go to the Duplicates tab and wait for the flagged pair to load
  fireEvent.click(screen.getByRole("button", { name: /duplicates/i }));
  await screen.findByText("Midtown Music Fest");

  // Perform the duplicate-resolution status change
  fireEvent.click(screen.getByRole("button", { name: buttonText }));

  // The undo banner appears with a live countdown button
  await screen.findByText(`✅ 1 event updated to "${appliedStatus}".`);
  const undoButton = await screen.findByRole("button", { name: /undo \(\d+s\)/i });
  expect(undoButton).toBeTruthy();

  // The status-change request targeted the flagged event
  const patch = fetchCalls.find(
    (c) => c.method === "PATCH" && c.url.includes("/admin/events/bulk-status") && !(c.body as { restore?: unknown }).restore,
  );
  expect(patch?.body).toMatchObject({ ids: [FLAGGED_ID], status: appliedStatus });

  return { appliedStatus };
}

describe("Undo from the Duplicates tab", () => {
  it("Send to Review registers an undo entry, survives a tab switch, and restores the prior status", async () => {
    await resolveFromDuplicatesTab(/not a duplicate — send to review/i, "pending");

    // Switch to another ops tab — the banner and Undo button must remain
    fireEvent.click(screen.getByRole("button", { name: /^events$/i }));
    expect(screen.getByText('✅ 1 event updated to "pending".')).toBeTruthy();
    const undoButton = screen.getByRole("button", { name: /undo \(\d+s\)/i });

    // Press Undo — the restore call must carry the exact prior status and
    // the applied status as the optimistic-concurrency `expected` value
    fireEvent.click(undoButton);
    await screen.findByText(/↩️ Undone — 1 event restored to their previous status\./);

    const restore = fetchCalls.find(
      (c) => c.method === "PATCH" && c.url.includes("/admin/events/bulk-status") && (c.body as { restore?: unknown }).restore,
    );
    expect(restore?.body).toEqual({
      restore: [{ id: FLAGGED_ID, status: PRIOR_STATUS, expected: "pending" }],
    });

    // Undo window is consumed — the button disappears and storage is cleared
    expect(screen.queryByRole("button", { name: /undo \(\d+s\)/i })).toBeNull();
    expect(sessionStorage.getItem("adminBulkUndo")).toBeNull();
  });

  it("Confirm Duplicate — Archive also restores the exact prior status on Undo", async () => {
    await resolveFromDuplicatesTab(/confirm duplicate — archive/i, "archived");

    // Undo directly from the Duplicates tab (banner renders above all tabs)
    fireEvent.click(screen.getByRole("button", { name: /undo \(\d+s\)/i }));
    await screen.findByText(/↩️ Undone — 1 event restored to their previous status\./);

    const restore = fetchCalls.find(
      (c) => c.method === "PATCH" && c.url.includes("/admin/events/bulk-status") && (c.body as { restore?: unknown }).restore,
    );
    expect(restore?.body).toEqual({
      restore: [{ id: FLAGGED_ID, status: PRIOR_STATUS, expected: "archived" }],
    });
  });

  it("two back-to-back resolutions: Undo reflects and restores only the second event", async () => {
    const SECOND_ID = "evt-flagged-2";
    const SECOND_PRIOR = "needs_verification";
    duplicatePairs = [
      { flagged: makeFlaggedEvent(), original: null },
      {
        flagged: {
          ...makeFlaggedEvent(),
          id: SECOND_ID,
          name: "Buckhead Art Walk",
          workflowStatus: SECOND_PRIOR,
        },
        original: null,
      },
    ];
    priorById = { [FLAGGED_ID]: PRIOR_STATUS, [SECOND_ID]: SECOND_PRIOR };

    renderPanel();
    fireEvent.click(screen.getByRole("button", { name: /duplicates/i }));
    await screen.findByText("Midtown Music Fest");
    await screen.findByText("Buckhead Art Walk");

    // Resolve pair A: Send to Review on the first flagged event
    const cardA = screen.getByText("Midtown Music Fest").closest(".card-pop") as HTMLElement;
    fireEvent.click(within(cardA).getByRole("button", { name: /not a duplicate — send to review/i }));
    await screen.findByText('✅ 1 event updated to "pending".');

    // Immediately resolve pair B: Archive on the second flagged event
    const cardB = screen.getByText("Buckhead Art Walk").closest(".card-pop") as HTMLElement;
    fireEvent.click(within(cardB).getByRole("button", { name: /confirm duplicate — archive/i }));
    await screen.findByText('✅ 1 event updated to "archived".');

    // The undo entry (and its persisted copy) must now hold only the second action
    const persisted = JSON.parse(sessionStorage.getItem("adminBulkUndo")!) as {
      entries: unknown;
      appliedStatus: string;
    };
    expect(persisted.entries).toEqual([{ id: SECOND_ID, status: SECOND_PRIOR }]);
    expect(persisted.appliedStatus).toBe("archived");

    // Press Undo — the restore call must target the second event only,
    // with its exact prior status; the first event must never be replayed
    fireEvent.click(screen.getByRole("button", { name: /undo \(\d+s\)/i }));
    await screen.findByText(/↩️ Undone — 1 event restored to their previous status\./);

    const restores = fetchCalls.filter(
      (c) => c.method === "PATCH" && c.url.includes("/admin/events/bulk-status") && (c.body as { restore?: unknown }).restore,
    );
    expect(restores).toHaveLength(1);
    expect(restores[0].body).toEqual({
      restore: [{ id: SECOND_ID, status: SECOND_PRIOR, expected: "archived" }],
    });
    const restoredIds = (restores[0].body as { restore: { id: string }[] }).restore.map((r) => r.id);
    expect(restoredIds).not.toContain(FLAGGED_ID);

    // Undo window fully consumed — no second undo is possible
    expect(screen.queryByRole("button", { name: /undo \(\d+s\)/i })).toBeNull();
    expect(sessionStorage.getItem("adminBulkUndo")).toBeNull();
  });

  it("shows the skipped explanation and still clears undo when the restore reports skipped > 0", async () => {
    restoreResponse = () => ({ updated: 0, skipped: 1 });

    await resolveFromDuplicatesTab(/not a duplicate — send to review/i, "pending");

    fireEvent.click(screen.getByRole("button", { name: /undo \(\d+s\)/i }));
    await screen.findByText(
      /↩️ Undone — 0 events restored to their previous status; 1 skipped because its status was changed by someone else after the bulk action\./,
    );

    // Undo state is still cleared after the partial restore
    expect(screen.queryByRole("button", { name: /undo \(\d+s\)/i })).toBeNull();
    expect(sessionStorage.getItem("adminBulkUndo")).toBeNull();

    // The restore call carried the optimistic-concurrency `expected` value —
    // the server (not the client) decided to skip, so nothing was overwritten
    const restores = fetchCalls.filter(
      (c) => c.method === "PATCH" && c.url.includes("/admin/events/bulk-status") && (c.body as { restore?: unknown }).restore,
    );
    expect(restores).toHaveLength(1);
    expect(restores[0].body).toEqual({
      restore: [{ id: FLAGGED_ID, status: PRIOR_STATUS, expected: "pending" }],
    });
  });

  it("uses the plural skipped message when multiple events were changed by someone else", async () => {
    const SECOND_ID = "evt-flagged-2";
    duplicatePairs = [
      { flagged: makeFlaggedEvent(), original: null },
      {
        flagged: { ...makeFlaggedEvent(), id: SECOND_ID, name: "Buckhead Art Walk" },
        original: null,
      },
    ];
    priorById = { [FLAGGED_ID]: PRIOR_STATUS, [SECOND_ID]: PRIOR_STATUS };
    restoreResponse = () => ({ updated: 1, skipped: 2 });

    renderPanel();
    fireEvent.click(screen.getByRole("button", { name: /duplicates/i }));
    await screen.findByText("Midtown Music Fest");

    const cardA = screen.getByText("Midtown Music Fest").closest(".card-pop") as HTMLElement;
    fireEvent.click(within(cardA).getByRole("button", { name: /not a duplicate — send to review/i }));
    await screen.findByText('✅ 1 event updated to "pending".');

    fireEvent.click(screen.getByRole("button", { name: /undo \(\d+s\)/i }));
    await screen.findByText(
      /↩️ Undone — 1 event restored to their previous status; 2 skipped because their statuses were changed by someone else after the bulk action\./,
    );

    expect(screen.queryByRole("button", { name: /undo \(\d+s\)/i })).toBeNull();
    expect(sessionStorage.getItem("adminBulkUndo")).toBeNull();
  });

  it("persists the undo entry to sessionStorage so it survives a refresh", async () => {
    await resolveFromDuplicatesTab(/not a duplicate — send to review/i, "pending");

    const raw = sessionStorage.getItem("adminBulkUndo");
    expect(raw).toBeTruthy();
    const persisted = JSON.parse(raw!) as { entries: unknown; appliedStatus: string };
    expect(persisted.entries).toEqual([{ id: FLAGGED_ID, status: PRIOR_STATUS }]);
    expect(persisted.appliedStatus).toBe("pending");
  });
});
