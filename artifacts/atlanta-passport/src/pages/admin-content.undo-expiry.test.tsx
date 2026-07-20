// @vitest-environment jsdom
//
// Verifies the content page's bulk-undo window hard-expires: once
// UNDO_WINDOW_MS elapses the Undo button disappears, the persisted
// adminContentBulkUndo sessionStorage entry is cleared, and no restore
// PATCH can ever be sent afterwards. Mirrors admin-applications.undo-expiry.test.tsx.

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
import { LocationsTab } from "./admin-content";
import { CONTENT_UNDO_STORAGE_KEY } from "@/lib/bulkUndoStorage";

const ADMIN_KEY = "test-admin-key";
const LOCATION_ID = "loc-1";
const PRIOR_STATUS = "pending";
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

function makeLocation() {
  return {
    id: LOCATION_ID,
    name: "Ponce City Market",
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
    workflowStatus: PRIOR_STATUS,
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
          return jsonResponse({ updated: payload.restore.length, skipped: 0 });
        }
        const ids = payload.ids ?? [];
        for (const loc of locations) {
          if (ids.includes(loc.id as string)) loc.workflowStatus = payload.status;
        }
        return jsonResponse({
          updated: ids.length,
          prior: ids.map((id) => ({ id, status: PRIOR_STATUS })),
        });
      }
      if (url.includes("/admin/location-submissions")) {
        return jsonResponse(locations);
      }
      return jsonResponse([]);
    }),
  );
}

function renderPanel() {
  return render(<LocationsTab adminKey={ADMIN_KEY} />);
}

beforeEach(() => {
  // shouldAdvanceTime keeps async waits (findBy*) working while still letting
  // us jump the clock past the undo window deterministically.
  vi.useFakeTimers({ shouldAdvanceTime: true });
  sessionStorage.clear();
  fetchCalls = [];
  locations = [makeLocation()];
  installFetchMock();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

async function openUndoWindow() {
  renderPanel();
  await screen.findByText("Ponce City Market");
  fireEvent.click(screen.getByRole("button", { name: /select all/i }));
  fireEvent.click(screen.getByRole("button", { name: /approve all/i }));
  await screen.findByText('✅ 1 location updated to "approved".');
  await screen.findByRole("button", { name: /undo/i });
  expect(sessionStorage.getItem(CONTENT_UNDO_STORAGE_KEY)).toBeTruthy();
}

describe("Content page undo window expiry", () => {
  it("removes the Undo button and clears sessionStorage once the window elapses", async () => {
    await openUndoWindow();

    act(() => {
      vi.advanceTimersByTime(UNDO_WINDOW_MS + 1000);
    });

    expect(screen.queryByRole("button", { name: /undo/i })).toBeNull();
    expect(sessionStorage.getItem(CONTENT_UNDO_STORAGE_KEY)).toBeNull();
    expect(restoreCalls()).toHaveLength(0);
  });

  it("never sends a restore PATCH after expiry, even if a click lands on the last-known button position", async () => {
    await openUndoWindow();

    // Grab a handle to the button before expiry — simulates a click that was
    // dispatched at the last moment but processed after the window closed.
    const undoButton = screen.getByRole("button", { name: /undo/i });

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
    expect(sessionStorage.getItem(CONTENT_UNDO_STORAGE_KEY)).toBeNull();
  });

  it("does not resurrect an expired persisted entry after a remount (refresh)", async () => {
    await openUndoWindow();

    act(() => {
      vi.advanceTimersByTime(UNDO_WINDOW_MS + 1000);
    });
    cleanup();

    // Simulate an expired payload that somehow survived (e.g. tab restored)
    sessionStorage.setItem(
      CONTENT_UNDO_STORAGE_KEY,
      JSON.stringify({
        entries: [{ id: LOCATION_ID, status: PRIOR_STATUS }],
        appliedStatus: "approved",
        expiresAt: Date.now() - 1,
      }),
    );

    renderPanel();
    await screen.findByText("Ponce City Market");

    expect(screen.queryByRole("button", { name: /undo/i })).toBeNull();
    expect(sessionStorage.getItem(CONTENT_UNDO_STORAGE_KEY)).toBeNull();
    expect(restoreCalls()).toHaveLength(0);
  });
});
