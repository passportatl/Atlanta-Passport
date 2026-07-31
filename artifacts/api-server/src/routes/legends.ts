import { Router, type IRouter } from "express";
import { and, desc, eq, ilike, lte, or } from "drizzle-orm";
import { db, legendsPostsTable } from "@workspace/db";
import { toLegendSummary, toPublicLegend } from "../domain/public-legend";
import { requireAdmin } from "../lib/admin-auth";

const router: IRouter = Router();

const LEGEND_STATUSES = new Set([
  "draft",
  "in_review",
  "approved",
  "scheduled",
  "published",
  "archived",
]);

function optionalString(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return typeof value === "string" ? value.trim() || null : undefined;
}

function stringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return [
    ...new Set(
      value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

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
    .orderBy(
      desc(legendsPostsTable.isFeatured),
      desc(legendsPostsTable.publishedAt),
    );

  res.json(rows.filter((post) => post.slug).map(toLegendSummary));
});

router.get("/legends/:slug", async (req, res) => {
  const slug = Array.isArray(req.params.slug)
    ? req.params.slug[0]
    : req.params.slug;
  if (!slug) {
    res.status(400).json({ error: "Missing legend slug" });
    return;
  }

  const rows = await db
    .select()
    .from(legendsPostsTable)
    .where(and(publishedLegendConditions(), eq(legendsPostsTable.slug, slug)))
    .limit(1);

  const post = rows[0];
  if (!post) {
    res.status(404).json({ error: "Legend not found" });
    return;
  }

  res.json(toPublicLegend(post));
});

router.get("/admin/legends", requireAdmin, async (_req, res) => {
  const rows = await db
    .select()
    .from(legendsPostsTable)
    .orderBy(desc(legendsPostsTable.updatedAt));
  res.json(rows);
});

router.post("/admin/legends", requireAdmin, async (req, res) => {
  const title = optionalString(req.body?.title);
  if (!title) {
    res.status(400).json({ error: "Title is required" });
    return;
  }

  const requestedSlug = optionalString(req.body?.slug);
  const slug = slugify(requestedSlug ?? title);
  if (!slug) {
    res.status(400).json({ error: "A valid slug is required" });
    return;
  }

  const [post] = await db
    .insert(legendsPostsTable)
    .values({
      title,
      slug,
      subtitle: optionalString(req.body?.subtitle),
      excerpt: optionalString(req.body?.excerpt),
      body: optionalString(req.body?.body),
      category: optionalString(req.body?.category) ?? "guide",
      tags: stringArray(req.body?.tags) ?? [],
      authorName: optionalString(req.body?.authorName),
      authorBio: optionalString(req.body?.authorBio),
      authorImage: optionalString(req.body?.authorImage),
      heroImage: optionalString(req.body?.heroImage),
      galleryImages: stringArray(req.body?.galleryImages) ?? [],
      status: "draft",
      readingTimeMinutes:
        typeof req.body?.readingTimeMinutes === "number"
          ? Math.max(1, Math.round(req.body.readingTimeMinutes))
          : null,
      seoTitle: optionalString(req.body?.seoTitle),
      seoDescription: optionalString(req.body?.seoDescription),
      socialPreviewImage: optionalString(req.body?.socialPreviewImage),
      isFeatured: Boolean(req.body?.isFeatured),
      isHero: Boolean(req.body?.isHero),
      adminNotes: optionalString(req.body?.adminNotes),
    })
    .returning();

  res.status(201).json(post);
});

router.patch("/admin/legends/:id", requireAdmin, async (req, res) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!id) {
    res.status(400).json({ error: "Missing legend ID" });
    return;
  }

  const [current] = await db
    .select()
    .from(legendsPostsTable)
    .where(eq(legendsPostsTable.id, id))
    .limit(1);
  if (!current) {
    res.status(404).json({ error: "Legend not found" });
    return;
  }

  const requestedStatus = optionalString(req.body?.status);
  if (requestedStatus && !LEGEND_STATUSES.has(requestedStatus)) {
    res.status(400).json({ error: "Invalid workflow status" });
    return;
  }

  const title = optionalString(req.body?.title);
  const body = optionalString(req.body?.body);
  const excerpt = optionalString(req.body?.excerpt);
  const heroImage = optionalString(req.body?.heroImage);
  const nextStatus = requestedStatus ?? current.status;
  const nextTitle = title === undefined ? current.title : title;
  const nextBody = body === undefined ? current.body : body;
  const nextExcerpt = excerpt === undefined ? current.excerpt : excerpt;
  const nextHeroImage = heroImage === undefined ? current.heroImage : heroImage;

  if (!nextTitle) {
    res.status(400).json({ error: "Title is required" });
    return;
  }
  if (
    nextStatus === "published" &&
    (!nextBody || !nextExcerpt || !nextHeroImage)
  ) {
    res.status(400).json({
      error: "Published Legends require a body, excerpt, and hero image",
    });
    return;
  }

  const scheduledPublishAt =
    req.body?.scheduledPublishAt === undefined
      ? current.scheduledPublishAt
      : req.body.scheduledPublishAt
        ? new Date(req.body.scheduledPublishAt)
        : null;
  if (
    nextStatus === "scheduled" &&
    (!scheduledPublishAt ||
      Number.isNaN(scheduledPublishAt.getTime()) ||
      scheduledPublishAt <= new Date())
  ) {
    res.status(400).json({
      error: "Scheduled Legends require a future publication date",
    });
    return;
  }

  const requestedSlug = optionalString(req.body?.slug);
  const nextSlug = slugify(requestedSlug ?? current.slug ?? nextTitle);

  const update: Partial<typeof legendsPostsTable.$inferInsert> = {
    updatedAt: new Date(),
    title: nextTitle,
    slug: nextSlug,
    status: nextStatus,
    scheduledPublishAt: nextStatus === "scheduled" ? scheduledPublishAt : null,
    publishedAt:
      nextStatus === "published"
        ? (current.publishedAt ?? new Date())
        : current.publishedAt,
  };

  const textFields = [
    "subtitle",
    "excerpt",
    "body",
    "authorName",
    "authorBio",
    "authorImage",
    "heroImage",
    "seoTitle",
    "seoDescription",
    "socialPreviewImage",
    "adminNotes",
  ] as const;
  for (const field of textFields) {
    const value = optionalString(req.body?.[field]);
    if (value !== undefined) update[field] = value;
  }
  const category = optionalString(req.body?.category);
  if (category) update.category = category;

  const arrayFields = [
    "tags",
    "galleryImages",
    "relatedLocationSlugs",
    "relatedEventIds",
    "relatedRouteSlugs",
    "relatedExperienceSlugs",
  ] as const;
  for (const field of arrayFields) {
    const value = stringArray(req.body?.[field]);
    if (value !== undefined) update[field] = value;
  }

  if (typeof req.body?.isFeatured === "boolean")
    update.isFeatured = req.body.isFeatured;
  if (typeof req.body?.isHero === "boolean") update.isHero = req.body.isHero;
  if (typeof req.body?.readingTimeMinutes === "number") {
    update.readingTimeMinutes = Math.max(
      1,
      Math.round(req.body.readingTimeMinutes),
    );
  }

  const [post] = await db
    .update(legendsPostsTable)
    .set(update)
    .where(eq(legendsPostsTable.id, id))
    .returning();

  res.json(post);
});

export default router;
