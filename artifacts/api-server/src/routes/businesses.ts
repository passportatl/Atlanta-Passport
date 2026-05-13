import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, businessesTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/businesses", async (_req, res) => {
  const rows = await db
    .select()
    .from(businessesTable)
    .where(eq(businessesTable.isActive, true));
  res.json(rows);
});

router.get("/businesses/:slug", async (req, res) => {
  const slug = req.params.slug;
  if (!slug) {
    res.status(400).json({ error: "Missing slug" });
    return;
  }
  const rows = await db
    .select()
    .from(businessesTable)
    .where(and(eq(businessesTable.slug, slug), eq(businessesTable.isActive, true)));
  const business = rows[0];
  if (!business) {
    res.status(404).json({ error: "Business not found" });
    return;
  }
  res.json(business);
});

export default router;
