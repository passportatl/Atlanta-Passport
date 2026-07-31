import { Router, type IRouter } from "express";
import { and, desc, eq, ilike, lte, or } from "drizzle-orm";
import { db, legendsPostsTable } from "@workspace/db";
import { toLegendSummary, toPublicLegend } from "../domain/public-legend";

const router: IRouter = Router();

function publishedLegendConditions() {
  return and(
    eq(legendsPostsTable.status, "published"),
    lte(legendsPostsTable.publishedAt, new Date()),
  );
}

router.get("/legends", async (req, res) => {
  const search =
    typeof req.query.search === "string" ? req.query.search.trim() : "";
  const category =
    typeof req.query.category === "string" ? req.query.category.trim() : "";

  const filters = [
    publishedLegendConditions(),
    category ? eq(legendsPostsTable.category, category) : undefined,
    search
      ? or(
          ilike(legendsPostsTable.title, `%${search}%`),
          ilike(legendsPostsTable.subtitle, `%${search}%`),
          ilike(legendsPostsTable.excerpt, `%${search}%`),
        )
      : undefined,
  ].filter(Boolean);

  const rows = await db
    .select()
    .from(legendsPostsTable)
    .where(and(...filters))
    .orderBy(desc(legendsPostsTable.isFeatured), desc(legendsPostsTable.publishedAt));

  res.json(rows.filter((post) => post.slug).map(toLegendSummary));
});

router.get("/legends/:slug", async (req, res) => {
  const slug = req.params.slug;
  if (!slug) {
    res.status(400).json({ error: "Missing legend slug" });
    return;
  }

  const rows = await db
    .select()
    .from(legendsPostsTable)
    .where(
      and(
        publishedLegendConditions(),
        eq(legendsPostsTable.slug, slug),
      ),
    )
    .limit(1);

  const post = rows[0];
  if (!post) {
    res.status(404).json({ error: "Legend not found" });
    return;
  }

  res.json(toPublicLegend(post));
});

export default router;
