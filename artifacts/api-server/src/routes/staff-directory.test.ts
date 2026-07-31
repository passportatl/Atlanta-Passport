// Integration coverage for the staff directory admin endpoints, exercised
// with a staff-session cookie only (no legacy x-admin-key) — proving that a
// staff-authenticated admin can read and edit the directory.
//
// Runs against the dev database (DATABASE_URL) through the real crm router
// and requireAdmin middleware; test rows are created and cleaned up here.

import { createHash, randomBytes } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import express from "express";
import cookieParser from "cookie-parser";
import request from "supertest";
import { db, staffUsersTable, staffSessionsTable, appConfigTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import crmRouter from "./crm";

const TEST_USERNAME = "__test_staff_directory__";
let sessionToken = "";
let staffId = "";
let savedDirectoryValue: string | null = null;

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use((req, _res, next) => {
    (req as unknown as { log: { info: () => void; error: () => void } }).log = {
      info: () => {},
      error: () => {},
    };
    next();
  });
  app.use("/api", crmRouter);
  return app;
}

const app = makeApp();
const asStaff = () => `staff_session=${sessionToken}`;

beforeAll(async () => {
  // Preserve any real directory value so the test never clobbers it.
  const [existing] = await db
    .select()
    .from(appConfigTable)
    .where(eq(appConfigTable.key, "crm_staff_directory"));
  savedDirectoryValue = existing?.value ?? null;

  const [user] = await db
    .insert(staffUsersTable)
    .values({
      username: TEST_USERNAME,
      passwordHash: "x",
      mustChangePassword: false,
      status: "active",
    })
    .returning();
  staffId = user!.id;
  sessionToken = randomBytes(32).toString("hex");
  await db.insert(staffSessionsTable).values({
    tokenHash: createHash("sha256").update(sessionToken).digest("hex"),
    staffId,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
  });
});

afterAll(async () => {
  await db.delete(staffSessionsTable).where(eq(staffSessionsTable.staffId, staffId));
  await db.delete(staffUsersTable).where(eq(staffUsersTable.id, staffId));
  if (savedDirectoryValue === null) {
    await db.delete(appConfigTable).where(eq(appConfigTable.key, "crm_staff_directory"));
  } else {
    await db
      .update(appConfigTable)
      .set({ value: savedDirectoryValue })
      .where(eq(appConfigTable.key, "crm_staff_directory"));
  }
});

describe("staff directory endpoints (staff-session auth only)", () => {
  it("rejects unauthenticated requests", async () => {
    const res = await request(app).get("/api/admin/staff-directory");
    expect([401, 503]).toContain(res.status);
  });

  it("staff session can read the directory", async () => {
    const res = await request(app).get("/api/admin/staff-directory").set("Cookie", asStaff());
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.entries)).toBe(true);
  });

  it("staff session can replace the directory; entries are cleaned and deduped", async () => {
    const res = await request(app)
      .put("/api/admin/staff-directory")
      .set("Cookie", asStaff())
      .send({
        entries: [
          { name: "  Alice ", email: "alice@example.com" },
          { name: "alice", email: "dupe@example.com" }, // dropped: duplicate name
          { name: "   ", email: "blank@example.com" }, // dropped: blank name
          { name: "Bob", email: "bob@example.com" },
        ],
      });
    expect(res.status).toBe(200);
    expect(res.body.entries).toEqual([
      { name: "Alice", email: "alice@example.com" },
      { name: "Bob", email: "bob@example.com" },
    ]);

    const read = await request(app).get("/api/admin/staff-directory").set("Cookie", asStaff());
    expect(read.body.entries).toEqual(res.body.entries);
  });

  it("rejects invalid payloads", async () => {
    const res = await request(app)
      .put("/api/admin/staff-directory")
      .set("Cookie", asStaff())
      .send({ entries: [{ name: "NoEmail" }] });
    expect(res.status).toBe(400);
  });
});
