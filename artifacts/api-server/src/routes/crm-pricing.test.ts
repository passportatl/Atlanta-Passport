// Regression coverage for server-side pricing enforcement + CRM behavior:
//   - POST /applications, /events, /location-submissions reject invalid
//     packages/add-ons and always compute prices server-side (client prices
//     ignored).
//   - PATCH /admin/crm/:recordType/:id updates fields; follow-up buckets
//     (overdue/upcoming/unassigned/paid) reflect the patch.
//   - PATCH /visitors/:id/preferences returns 403 for cross-user updates on
//     Clerk-linked visitors.
//   - GET /admin/newsletter-export contains only opted-in visitors.
//
// Runs against the dev database (DATABASE_URL). Emails are disabled by
// clearing RESEND_API_KEY for the process — mailer reads it at call time.

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import express from "express";
import request from "supertest";
import { clerkMiddleware } from "@clerk/express";
import { inArray, eq } from "drizzle-orm";
import {
  db,
  applicationsTable,
  eventsTable,
  locationSubmissionsTable,
  visitorsTable,
} from "@workspace/db";
import { computeQuote } from "@workspace/pricing";
import applicationsRouter from "./applications";
import eventsRouter from "./events";
import locationSubmissionsRouter from "./location-submissions";
import crmRouter from "./crm";
import visitorsRouter from "./visitors";

// Never send real email from tests.
delete process.env.RESEND_API_KEY;

const ADMIN_KEY = process.env.ADMIN_SECRET ?? "";
const TEST_PREFIX = "__test_crm_pricing__";

function makeApp() {
  const app = express();
  app.use(express.json({ limit: "5mb" }));
  app.use((req, _res, next) => {
    (req as unknown as { log: { error: () => void; info: () => void } }).log = {
      error: () => {},
      info: () => {},
    };
    next();
  });
  // visitors router uses getAuth(); mount the real Clerk middleware so an
  // unauthenticated request resolves to userId=null instead of throwing.
  app.use(clerkMiddleware());
  app.use("/api", applicationsRouter);
  app.use("/api", eventsRouter);
  app.use("/api", locationSubmissionsRouter);
  app.use("/api", crmRouter);
  app.use("/api", visitorsRouter);
  return app;
}

const app = makeApp();

const createdApplicationIds: string[] = [];
const createdEventIds: string[] = [];
const createdLocationIds: string[] = [];
const createdVisitorIds: string[] = [];

beforeAll(() => {
  expect(ADMIN_KEY, "ADMIN_SECRET must be set to run this test").not.toBe("");
});

afterAll(async () => {
  if (createdApplicationIds.length > 0)
    await db.delete(applicationsTable).where(inArray(applicationsTable.id, createdApplicationIds));
  if (createdEventIds.length > 0)
    await db.delete(eventsTable).where(inArray(eventsTable.id, createdEventIds));
  if (createdLocationIds.length > 0)
    await db
      .delete(locationSubmissionsTable)
      .where(inArray(locationSubmissionsTable.id, createdLocationIds));
  if (createdVisitorIds.length > 0)
    await db.delete(visitorsTable).where(inArray(visitorsTable.id, createdVisitorIds));
});

// ── Application intake pricing ───────────────────────────────────────────────

const baseApplication = {
  submissionType: "business" as const,
  businessName: `${TEST_PREFIX}Biz`,
  contactName: "Test Person",
  email: "test@example.com",
  phone: "404-555-0100",
  category: ["Food"],
  neighborhood: "Midtown",
  address: "123 Test St, Atlanta, GA",
  offer: "A tasty test offer",
};

describe("POST /applications pricing enforcement", () => {
  it("rejects an invalid add-on for the submission kind", async () => {
    const res = await request(app)
      .post("/api/applications")
      .send({ ...baseApplication, package: "starter", addOns: ["newsletter"] });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/add-on/i);
  });

  it("rejects an unknown package via schema or quote validation", async () => {
    const res = await request(app)
      .post("/api/applications")
      .send({ ...baseApplication, package: "platinum" });
    expect(res.status).toBe(400);
  });

  it("computes the price server-side for a valid package", async () => {
    const expected = computeQuote("business", "starter", []);
    expect(expected.valid).toBe(true);
    const res = await request(app)
      .post("/api/applications")
      .send({ ...baseApplication, package: "starter", listingPrice: 1 });
    expect(res.status).toBe(200);
    createdApplicationIds.push(res.body.id);
    const [row] = await db
      .select()
      .from(applicationsTable)
      .where(eq(applicationsTable.id, res.body.id));
    expect(row!.listingPrice).toBe(expected.total);
    expect(row!.package).toBe("starter");
  });
});

// ── Event intake pricing ─────────────────────────────────────────────────────

const baseEvent = {
  name: `${TEST_PREFIX}Event`,
  contactName: "Test Person",
  contactEmail: "test@example.com",
  contactPhone: "404-555-0100",
  date: "December 1, 2026",
  venue: "Test Venue",
  neighborhood: "Midtown",
};

describe("POST /events pricing enforcement", () => {
  it("rejects an unknown listing package", async () => {
    const res = await request(app)
      .post("/api/events")
      .send({ ...baseEvent, listingPackage: "gold" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/package/i);
  });

  it("rejects add-ons that don't apply to events", async () => {
    const res = await request(app)
      .post("/api/events")
      .send({ ...baseEvent, listingPackage: "basic", addOns: ["not-a-real-addon"] });
    expect(res.status).toBe(400);
  });

  it("ignores the client-supplied price and computes package + add-ons server-side", async () => {
    const expected = computeQuote("event", "basic", ["newsletter"]);
    expect(expected.valid).toBe(true);
    const res = await request(app)
      .post("/api/events")
      .send({ ...baseEvent, listingPackage: "basic", addOns: ["newsletter"], listingPrice: 1 });
    expect(res.status).toBe(201);
    createdEventIds.push(res.body.id);
    const [row] = await db.select().from(eventsTable).where(eq(eventsTable.id, res.body.id));
    expect(row!.listingPrice).toBe(expected.total);
    expect(row!.tier).toBe("paid");
  });
});

// ── Location intake pricing ──────────────────────────────────────────────────

const baseLocation = {
  name: `${TEST_PREFIX}Location`,
  primaryCategory: "Museum",
  address: "456 Test Ave, Atlanta, GA",
  neighborhood: "Downtown",
  contactName: "Test Person",
  contactEmail: "test@example.com",
};

describe("POST /location-submissions pricing enforcement", () => {
  it("rejects an unknown listing tier", async () => {
    const res = await request(app)
      .post("/api/location-submissions")
      .send({ ...baseLocation, listingTier: "diamond" });
    expect(res.status).toBe(400);
  });

  it("computes the tier price server-side, ignoring any client price", async () => {
    const expected = computeQuote("location", "starter", []);
    expect(expected.valid).toBe(true);
    const res = await request(app)
      .post("/api/location-submissions")
      .send({ ...baseLocation, listingTier: "starter", listingPrice: 1 });
    expect(res.status).toBe(201);
    const id = res.body.id as string;
    createdLocationIds.push(id);
    const [row] = await db
      .select()
      .from(locationSubmissionsTable)
      .where(eq(locationSubmissionsTable.id, id));
    expect(row!.listingPrice).toBe(expected.total);
  });
});

// ── CRM patch + follow-up buckets ────────────────────────────────────────────

describe("PATCH /admin/crm/:recordType/:id + buckets", () => {
  let eventId: string;

  beforeAll(async () => {
    const [row] = await db
      .insert(eventsTable)
      .values({
        name: `${TEST_PREFIX}CrmEvent`,
        source: "web_form",
        workflowStatus: "pending",
        listingPackage: "basic",
        listingPrice: 149,
      })
      .returning({ id: eventsTable.id });
    eventId = row!.id;
    createdEventIds.push(eventId);
  });

  const patchCrm = (recordType: string, id: string, body: unknown) =>
    request(app)
      .patch(`/api/admin/crm/${recordType}/${id}`)
      .set("x-admin-key", ADMIN_KEY)
      .send(body as object);

  const records = (query: Record<string, string>) =>
    request(app).get("/api/admin/crm/records").set("x-admin-key", ADMIN_KEY).query(query);

  it("requires admin auth", async () => {
    const res = await request(app)
      .patch(`/api/admin/crm/event/${eventId}`)
      .send({ salesStage: "contacted" });
    expect(res.status).toBe(401);
  });

  it("rejects an empty patch and unknown record types", async () => {
    const empty = await patchCrm("event", eventId, {});
    expect(empty.status).toBe(400);
    const unknown = await patchCrm("widget", eventId, { salesStage: "contacted" });
    expect(unknown.status).toBe(400);
  });

  it("404s for a missing record", async () => {
    const res = await patchCrm("event", "00000000-0000-0000-0000-000000000000", {
      salesStage: "contacted",
    });
    expect(res.status).toBe(404);
  });

  it("puts an overdue follow-up into the overdue bucket", async () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const res = await patchCrm("event", eventId, {
      salesStage: "contacted",
      nextFollowUpAt: yesterday,
      assignedTo: null,
    });
    expect(res.status).toBe(200);
    expect(res.body.salesStage).toBe("contacted");

    const overdue = await records({ bucket: "overdue" });
    expect(overdue.status).toBe(200);
    expect(overdue.body.some((r: { id: string }) => r.id === eventId)).toBe(true);

    const unassigned = await records({ bucket: "unassigned" });
    expect(unassigned.body.some((r: { id: string }) => r.id === eventId)).toBe(true);
  });

  it("moves a future follow-up into the upcoming bucket and out of overdue", async () => {
    const inTwoDays = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
    const res = await patchCrm("event", eventId, {
      nextFollowUpAt: inTwoDays,
      assignedTo: "Test Staffer",
    });
    expect(res.status).toBe(200);

    const upcoming = await records({ bucket: "upcoming" });
    expect(upcoming.body.some((r: { id: string }) => r.id === eventId)).toBe(true);
    const overdue = await records({ bucket: "overdue" });
    expect(overdue.body.some((r: { id: string }) => r.id === eventId)).toBe(false);
    const unassigned = await records({ bucket: "unassigned" });
    expect(unassigned.body.some((r: { id: string }) => r.id === eventId)).toBe(false);
  });

  it("excludes closed records from follow-up buckets", async () => {
    const res = await patchCrm("event", eventId, { salesStage: "closed-won" });
    expect(res.status).toBe(200);
    const upcoming = await records({ bucket: "upcoming" });
    expect(upcoming.body.some((r: { id: string }) => r.id === eventId)).toBe(false);
  });

  it("marks paid and shows the record in the paid bucket", async () => {
    const res = await patchCrm("event", eventId, { paymentStatus: "paid" });
    expect(res.status).toBe(200);
    expect(res.body.paymentStatus).toBe("paid");
    const paid = await records({ bucket: "paid" });
    expect(paid.body.some((r: { id: string }) => r.id === eventId)).toBe(true);
  });
});

// ── Visitor preference ownership ─────────────────────────────────────────────

describe("PATCH /visitors/:id/preferences ownership", () => {
  let linkedId: string;
  let anonId: string;

  beforeAll(async () => {
    const inserted = await db
      .insert(visitorsTable)
      .values([
        {
          firstName: "LinkedTest",
          email: `${TEST_PREFIX}linked@example.com`,
          clerkUserId: `${TEST_PREFIX}user_abc`,
        },
        { firstName: "AnonTest", email: `${TEST_PREFIX}anon@example.com` },
      ])
      .returning({ id: visitorsTable.id });
    linkedId = inserted[0]!.id;
    anonId = inserted[1]!.id;
    createdVisitorIds.push(linkedId, anonId);
  });

  it("403s when an unauthenticated request targets a Clerk-linked visitor", async () => {
    const res = await request(app)
      .patch(`/api/visitors/${linkedId}/preferences`)
      .send({ promoOptIn: true });
    expect(res.status).toBe(403);
    const [row] = await db.select().from(visitorsTable).where(eq(visitorsTable.id, linkedId));
    expect(row!.promoOptIn).toBe(false);
  });

  it("allows updating an unlinked (anonymous) visitor", async () => {
    const res = await request(app)
      .patch(`/api/visitors/${anonId}/preferences`)
      .send({ promoOptIn: true });
    expect(res.status).toBe(200);
    expect(res.body.promoOptIn).toBe(true);
  });

  it("404s for an unknown visitor", async () => {
    const res = await request(app)
      .patch("/api/visitors/00000000-0000-0000-0000-000000000000/preferences")
      .send({ promoOptIn: true });
    expect(res.status).toBe(404);
  });
});

// ── Newsletter export consent filter ─────────────────────────────────────────

describe("GET /admin/newsletter-export", () => {
  let optedInId: string;
  let optedOutId: string;
  const optedInEmail = `${TEST_PREFIX}optin@example.com`;
  const optedOutEmail = `${TEST_PREFIX}optout@example.com`;

  beforeAll(async () => {
    const inserted = await db
      .insert(visitorsTable)
      .values([
        { firstName: "OptIn", email: optedInEmail, promoOptIn: true, promoOptInAt: new Date() },
        { firstName: "OptOut", email: optedOutEmail, promoOptIn: false },
      ])
      .returning({ id: visitorsTable.id });
    optedInId = inserted[0]!.id;
    optedOutId = inserted[1]!.id;
    createdVisitorIds.push(optedInId, optedOutId);
  });

  it("requires admin auth", async () => {
    const res = await request(app).get("/api/admin/newsletter-export");
    expect(res.status).toBe(401);
  });

  it("contains only opted-in visitors", async () => {
    const res = await request(app)
      .get("/api/admin/newsletter-export")
      .set("x-admin-key", ADMIN_KEY);
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/text\/csv/);
    expect(res.text).toContain(optedInEmail);
    expect(res.text).not.toContain(optedOutEmail);
  });
});
