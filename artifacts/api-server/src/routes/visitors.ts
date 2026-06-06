import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { getAuth, clerkClient } from "@clerk/express";
import { db, visitorsTable } from "@workspace/db";
import { CreateVisitorBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/visitors/link", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const existing = await db
    .select()
    .from(visitorsTable)
    .where(eq(visitorsTable.clerkUserId, userId));
  if (existing[0]) {
    res.json(existing[0]);
    return;
  }

  const user = await clerkClient.users.getUser(userId);
  const email =
    user.primaryEmailAddress?.emailAddress ??
    user.emailAddresses[0]?.emailAddress ??
    `${userId}@passport.local`;
  const firstName = user.firstName?.trim() || "Friend";

  const [created] = await db
    .insert(visitorsTable)
    .values({ firstName, email, clerkUserId: userId })
    .onConflictDoNothing({ target: visitorsTable.clerkUserId })
    .returning();

  if (created) {
    res.json(created);
    return;
  }

  const rows = await db
    .select()
    .from(visitorsTable)
    .where(eq(visitorsTable.clerkUserId, userId));
  if (rows[0]) {
    res.json(rows[0]);
    return;
  }
  res.status(500).json({ error: "Failed to link visitor" });
});

router.post("/visitors", async (req, res) => {
  const parsed = CreateVisitorBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", issues: parsed.error.issues });
    return;
  }
  const { firstName, email, phone } = parsed.data;
  const [visitor] = await db
    .insert(visitorsTable)
    .values({ firstName, email, phone: phone ?? null })
    .returning();
  res.json(visitor);
});

router.get("/visitors/:id", async (req, res) => {
  const id = req.params.id;
  if (!id) {
    res.status(400).json({ error: "Missing id" });
    return;
  }
  const rows = await db.select().from(visitorsTable).where(eq(visitorsTable.id, id));
  const visitor = rows[0];
  if (!visitor) {
    res.status(404).json({ error: "Visitor not found" });
    return;
  }
  res.json(visitor);
});

export default router;
