// @vitest-environment jsdom
//
// Verifies that a second bulk action fired while the first undo window is
// still open REPLACES the previous undo state entirely: the persisted
// adminContentBulkUndo entry holds only the second action's prior statuses,
// Undo restores only those, and the first action's expiry timer never
// clears or expires the new undo window early.
// Pattern mirrors admin-content.undo-expiry.test.tsx.

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
import { LocationsTab } from "./admin-content";
import { CONTENT_UNDO_STORAGE_KEY, type PersistedUndo } from "@/lib/bulkUndoStorage";

const ADMIN_KEY = "test-admin-key";
const UNDO_WINDOW_MS = 20000;

type FetchCall = { url: string; method: string; body: unknown };

let fetchCalls: FetchCall[] = [];
let locations: Record<string, unknown>[] = [];

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function makeLocation(id: string, name: string, workflowStatus: string) {
  return {
    id,
    name,
    primaryCategory: "Shopping",
    tags: null,
    address: "675 Ponce De Leon Ave NE",
    neighborhood: "Old Fourth Ward",
    website: null,
    reviewsLink: null,
    phone: null,
    hours: null,
    ageRestriction: null,
    priceRange: null,
    martaAccess: null,
    martaDetails: null,
    parkingNotes: null,
    accessibility: null,
    description: null,
    featuredItems: null,
    eventCalendar: null,
    heroImage: null,
    galleryImages: null,
    passportSummary: null,
    insiderTips: null,
    isStampStop: null,
    isFeaturedInterest: null,
    isSponsoredInterest: null,
    listingTier: "free",
    contactName: "Jane Doe",
    contactEmail: "jane@example.com",
    contactPhone: null,
    notes: null,
    workflowStatus,
    assignedTo: null,
    completenessScore: 70,
    adminNotes: null,
    isDuplicate: null,
    duplicateOfId: null,
    importSource: null,
    createdAt: "2026-07-01T00:00:00.000Z",
    reviewedAt: null,
    publishedAt: null,
    promotedBusinessId: null,
    promotedAt: null,
  };
}

function restoreCalls() {
  return fetchCalls.filter(
    (c) =>
      c.method === "PATCH" &&
      c.url.includes("/admin/location-submissions/bulk-status") &&
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

      if (url.includes("/admin/location-submissions/bulk-status") && method === "PATCH") {
        const payload = body as {
          ids?: string[];
          status?: string;
          restore?: { id: string; status: string; expected?: string }[];
        };
        if (payload.restore) {
          for (const entry of payload.restore) {
            const loc = locations.find((l) => l.id === entry.id);
            if (loc) loc.workflowStatus = entry.status;
          }
          return jsonResponse({ updated: payload.restore.length, skipped: 0 });
        }
        const ids = payload.ids ?? [];
        // Capture the prior (current) statuses before applying, like the real server
        const prior = ids.map((id) => ({
          id,
          status: locations.find((l) => l.id === id)?.workflowStatus as string,
        }));
        for (const loc of locations) {
          if (ids.includes(loc.id as string)) loc.workflowStatus = payload.status;
        }
        return jsonResponse({ updated: ids.length, prior });
      }
      if (url.includes("/admin/location-submissions")) {
        return jsonResponse(locations);
      }
      return jsonResponse([]);
    }),
  );
}

function readStoredUndo(): PersistedUndo | null {
  const raw = sessionStorage.getItem(CONTENT_UNDO_STORAGE_KEY);
  return raw ? (JSON.parse(raw) as PersistedUndo) : null;
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  sessionStorage.clear();
  fetchCalls = [];
  locations = [
    makeLocation("loc-1", "Ponce City Market", "pending"),
    makeLocation("loc-2", "Krog Street Market", "needs_info"),
  ];
  installFetchMock();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

async function runBulkAction(actionLabel: RegExp, expectedMsg: string) {
  fireEvent.click(screen.getByRole("button", { name: /select all/i }));
  fireEvent.click(screen.getByRole("button", { name: actionLabel }));
  await screen.findByText(expectedMsg);
  await screen.findByRole("button", { name: /undo/i });
}

describe("Content page: fresh bulk action replaces the old undo window", () => {
  it("second bulk action mid-countdown replaces the persisted entry and undo restores only the second action's prior statuses", async () => {
    render(<LocationsTab adminKey={ADMIN_KEY} />);
    await screen.findByText("Ponce City Market");

    // First bulk action: approve both (prior: pending / needs_info)
    await runBulkAction(/approve all/i, '✅ 2 locations updated to "approved".');
    const firstStored = readStoredUndo();
    expect(firstStored?.appliedStatus).toBe("approved");
    expect(firstStored?.entries).toEqual(
      expect.arrayContaining([
        { id: "loc-1", status: "pending" },
        { id: "loc-2", status: "needs_info" },
      ]),
    );

    // 15s into the 20s window, fire a second bulk action: reject both
    act(() => {
      vi.advanceTimersByTime(15000);
    });
    await runBulkAction(/reject all/i, '✅ 2 locations updated to "rejected".');

    // The persisted entry must now hold ONLY the second action's prior statuses
    // (both were "approved" at that point) — no stale first-action entries mixed in.
    const secondStored = readStoredUndo();
    expect(secondStored?.appliedStatus).toBe("rejected");
    expect(secondStored?.entries).toEqual(
      expect.arrayContaining([
        { id: "loc-1", status: "approved" },
        { id: "loc-2", status: "approved" },
      ]),
    );
    expect(secondStored?.entries).toHaveLength(2);
    expect(secondStored?.entries).not.toEqual(
      expect.arrayContaining([{ id: "loc-1", status: "pending" }]),
    );

    // Advance past the point where the FIRST action's timer would have fired
    // (20s after the first action = 5s after the second). The new undo window
    // must still be open and its persisted entry intact.
    act(() => {
      vi.advanceTimersByTime(6000);
    });
    expect(screen.getByRole("button", { name: /undo/i })).toBeTruthy();
    expect(readStoredUndo()?.appliedStatus).toBe("rejected");

    // Undo now restores only the second action's prior statuses
    fireEvent.click(screen.getByRole("button", { name: /undo/i }));
    await screen.findByText(/↩️ Undone — 2 locations restored to their previous status\./);

    expect(restoreCalls()).toHaveLength(1);
    const restore = (restoreCalls()[0].body as {
      restore: { id: string; status: string; expected: string }[];
    }).restore;
    expect(restore).toEqual(
      expect.arrayContaining([
        { id: "loc-1", status: "approved", expected: "rejected" },
        { id: "loc-2", status: "approved", expected: "rejected" },
      ]),
    );
    expect(restore).toHaveLength(2);
    // Never restores back to the first action's prior statuses
    expect(restore.some((e) => e.status === "pending" || e.status === "needs_info")).toBe(false);
    expect(sessionStorage.getItem(CONTENT_UNDO_STORAGE_KEY)).toBeNull();
  });

  it("the second undo window expires on its own schedule, not the first action's", async () => {
    render(<LocationsTab adminKey={ADMIN_KEY} />);
    await screen.findByText("Ponce City Market");

    await runBulkAction(/approve all/i, '✅ 2 locations updated to "approved".');

    act(() => {
      vi.advanceTimersByTime(15000);
    });
    await runBulkAction(/reject all/i, '✅ 2 locations updated to "rejected".');

    // 19s after the second action (34s after the first): still open
    act(() => {
      vi.advanceTimersByTime(19000);
    });
    expect(screen.getByRole("button", { name: /undo/i })).toBeTruthy();
    expect(readStoredUndo()?.appliedStatus).toBe("rejected");

    // Past the second window (20s + margin): now it expires and clears storage
    act(() => {
      vi.advanceTimersByTime(UNDO_WINDOW_MS - 19000 + 1000);
    });
    expect(screen.queryByRole("button", { name: /undo/i })).toBeNull();
    expect(sessionStorage.getItem(CONTENT_UNDO_STORAGE_KEY)).toBeNull();
    expect(restoreCalls()).toHaveLength(0);
  });
});
