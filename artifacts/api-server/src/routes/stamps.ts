import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, stampsTable, businessesTable, visitorsTable } from "@workspace/db";
import { CollectStampBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/stamps", async (req, res) => {
  const parsed = CollectStampBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", issues: parsed.error.issues });
    return;
  }
  const { visitorId, businessSlug } = parsed.data;

  const visitorRows = await db
    .select()
    .from(visitorsTable)
    .where(eq(visitorsTable.id, visitorId));
  if (!visitorRows[0]) {
    res.status(404).json({ error: "Visitor not found" });
    return;
  }

  const bizRows = await db
    .select()
    .from(businessesTable)
    .where(eq(businessesTable.slug, businessSlug));
  const business = bizRows[0];
  if (!business) {
    res.status(404).json({ error: "Business not found" });
    return;
  }

  const existing = await db
    .select()
    .from(stampsTable)
    .where(
      and(eq(stampsTable.visitorId, visitorId), eq(stampsTable.businessId, business.id)),
    );

  if (existing[0]) {
    res.json({ stamp: existing[0], alreadyCollected: true });
    return;
  }

  const [stamp] = await db
    .insert(stampsTable)
    .values({
      visitorId,
      businessId: business.id,
      businessSlug: business.slug,
      stampName: business.stampName,
      neighborhood: business.neighborhood,
      category: business.category,
    })
    .returning();
  res.json({ stamp, alreadyCollected: false });
});

router.get("/visitors/:id/stamps", async (req, res) => {
  const id = req.params.id;
  if (!id) {
    res.status(400).json({ error: "Missing id" });
    return;
  }
  const rows = await db
    .select()
    .from(stampsTable)
    .where(eq(stampsTable.visitorId, id))
    .orderBy(desc(stampsTable.collectedAt));
  res.json(rows);
});

export default router;
