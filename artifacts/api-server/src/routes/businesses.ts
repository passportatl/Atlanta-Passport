import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, businessesTable } from "@workspace/db";
import { toPublicBusiness } from "../domain/public-business";

const router: IRouter = Router();

router.get("/businesses", async (_req, res) => {
  const rows = await db
    .select()
    .from(businessesTable)
    .where(
      and(
        eq(businessesTable.isActive, true),
        eq(businessesTable.publicStatus, "published"),
      ),
    );
  res.json(rows.map(toPublicBusiness));
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
    .where(
      and(
        eq(businessesTable.slug, slug),
        eq(businessesTable.isActive, true),
        eq(businessesTable.publicStatus, "published"),
      ),
    );
  const business = rows[0];
  if (!business) {
    res.status(404).json({ error: "Business not found" });
    return;
  }
  res.json(toPublicBusiness(business));
});

export default router;
