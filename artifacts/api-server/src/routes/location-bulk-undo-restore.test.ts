// Integration coverage for the admin content page's bulk Undo path
// (location submissions), mirroring bulk-undo-restore.test.ts for events:
//   bulk update → persisted-undo payload round-trip (sessionStorage JSON) →
//   restore with one row changed out-of-band → that row is skipped, the rest
//   are restored to their prior statuses.
//
// Runs against the dev database (DATABASE_URL) through the real
// location-submissions router and requireAdmin middleware; test rows are
// created and cleaned up here.

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import express from "express";
import request from "supertest";
import { db, locationSubmissionsTable } from "@workspace/db";
import { inArray, eq } from "drizzle-orm";
import locationSubmissionsRouter from "./location-submissions";

const ADMIN_KEY = process.env.ADMIN_SECRET ?? "";

function makeApp() {
  const app = express();
  app.use(express.json({ limit: "5mb" }));
  app.use((req, _res, next) => {
    (req as unknown as { log: { error: () => void } }).log = { error: () => {} };
    next();
  });
  app.use("/api", locationSubmissionsRouter);
  return app;
}

const app = makeApp();
const patchBulk = (body: unknown) =>
  request(app)
    .patch("/api/admin/location-submissions/bulk-status")
    .set("x-admin-key", ADMIN_KEY)
    .send(body as object);

const TEST_PREFIX = "__test_loc_bulk_undo__";
let ids: string[] = [];

function testRow(name: string, workflowStatus: string) {
  return {
    name: `${TEST_PREFIX}${name}`,
    primaryCategory: "Test",
    address: "123 Test St",
    neighborhood: "Testville",
    contactName: "Test Contact",
    contactEmail: "test@example.com",
    workflowStatus,
  };
}

async function statusesById(): Promise<Map<string, string>> {
  const rows = await db
    .select({ id: locationSubmissionsTable.id, status: locationSubmissionsTable.workflowStatus })
    .from(locationSubmissionsTable)
    .where(inArray(locationSubmissionsTable.id, ids));
  return new Map(rows.map((r) => [r.id, r.status]));
}

beforeAll(async () => {
  expect(ADMIN_KEY, "ADMIN_SECRET must be set to run this test").not.toBe("");
  const inserted = await db
    .insert(locationSubmissionsTable)
    .values([testRow("A", "pending"), testRow("B", "approved"), testRow("C", "pending")])
    .returning({ id: locationSubmissionsTable.id });
  ids = inserted.map((r) => r.id);
});

afterAll(async () => {
  if (ids.length > 0) {
    await db.delete(locationSubmissionsTable).where(inArray(locationSubmissionsTable.id, ids));
  }
});

describe("content page: bulk update → persisted undo → restore with out-of-band edit", () => {
  it("skips the conflicted row and restores the rest", async () => {
    // 1. Bulk-archive all three locations (what the admin's bulk action does)
    const bulkRes = await patchBulk({ ids, status: "archived" });
    expect(bulkRes.status).toBe(200);
    expect(bulkRes.body.updated).toBe(3);
    const prior = bulkRes.body.prior as { id: string; status: string }[];
    expect(prior).toHaveLength(3);
    const priorById = new Map(prior.map((p) => [p.id, p.status]));
    expect(priorById.get(ids[0]!)).toBe("pending");
    expect(priorById.get(ids[1]!)).toBe("approved");
    expect(priorById.get(ids[2]!)).toBe("pending");

    // 2. Simulate the sessionStorage persist → page refresh → read-back:
    //    the undo payload survives only as JSON, exactly as the frontend
    //    stores it under the "adminContentBulkUndo" key.
    const persisted = JSON.stringify({
      entries: prior,
      appliedStatus: "archived",
      expiresAt: Date.now() + 20000,
    });
    const readBack = JSON.parse(persisted) as {
      entries: { id: string; status: string }[];
      appliedStatus: string;
      expiresAt: number;
    };
    expect(readBack.expiresAt).toBeGreaterThan(Date.now());

    // 3. Out-of-band change during the gap: another admin publishes location B
    await db
      .update(locationSubmissionsTable)
      .set({ workflowStatus: "published" })
      .where(eq(locationSubmissionsTable.id, ids[1]!));

    // 4. Undo from the persisted payload — the frontend attaches
    //    expected = appliedStatus to every entry (doUndoBulkAction)
    const restore = readBack.entries.map((e) => ({
      ...e,
      expected: readBack.appliedStatus,
    }));
    const undoRes = await patchBulk({ restore });
    expect(undoRes.status).toBe(200);
    expect(undoRes.body.skipped).toBe(1);
    expect(undoRes.body.updated).toBe(2);

    // 5. The conflicted row keeps the other admin's change; the rest are
    //    restored to their pre-bulk statuses.
    const after = await statusesById();
    expect(after.get(ids[0]!)).toBe("pending");
    expect(after.get(ids[1]!)).toBe("published");
    expect(after.get(ids[2]!)).toBe("pending");
  });

  it("restores everything when nothing changed out-of-band", async () => {
    const bulkRes = await patchBulk({ ids, status: "rejected" });
    expect(bulkRes.status).toBe(200);
    const prior = bulkRes.body.prior as { id: string; status: string }[];

    const restore = prior.map((e) => ({ ...e, expected: "rejected" }));
    const undoRes = await patchBulk({ restore });
    expect(undoRes.status).toBe(200);
    expect(undoRes.body.skipped).toBe(0);
    expect(undoRes.body.updated).toBe(3);

    const after = await statusesById();
    const priorById = new Map(prior.map((p) => [p.id, p.status]));
    for (const id of ids) {
      expect(after.get(id)).toBe(priorById.get(id));
    }
  });

  it("restores unconditionally when entries carry no expected status (older clients)", async () => {
    const bulkRes = await patchBulk({ ids, status: "archived" });
    expect(bulkRes.status).toBe(200);
    const prior = bulkRes.body.prior as { id: string; status: string }[];

    // Out-of-band change — but the restore has no `expected`, so it is applied anyway
    await db
      .update(locationSubmissionsTable)
      .set({ workflowStatus: "published" })
      .where(eq(locationSubmissionsTable.id, ids[0]!));

    const undoRes = await patchBulk({ restore: prior });
    expect(undoRes.status).toBe(200);
    expect(undoRes.body.skipped).toBe(0);
    expect(undoRes.body.updated).toBe(3);

    const after = await statusesById();
    const priorById = new Map(prior.map((p) => [p.id, p.status]));
    for (const id of ids) {
      expect(after.get(id)).toBe(priorById.get(id));
    }
  });

  it("rejects an empty restore payload", async () => {
    const res = await patchBulk({ restore: [] });
    expect(res.status).toBe(400);
  });

  it("requires the admin key", async () => {
    const res = await request(app)
      .patch("/api/admin/location-submissions/bulk-status")
      .send({ ids, status: "archived" });
    expect(res.status).toBe(401);
  });
});
