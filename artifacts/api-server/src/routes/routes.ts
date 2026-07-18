import { Router } from "express";
import { db, masterRoutesTable, routeStopsTable } from "@workspace/db";
import { eq, and, ilike, or, sql } from "drizzle-orm";

const router = Router();

const ADMIN_KEY = process.env["ADMIN_KEY"] ?? "atlanta2026";

function requireAdmin(
  req: import("express").Request,
  res: import("express").Response,
  next: import("express").NextFunction,
) {
  const key = (req.headers["x-admin-key"] as string | undefined) ?? (req.query["_k"] as string | undefined);
  if (key !== ADMIN_KEY) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

// ── Completeness scoring ──────────────────────────────────────────────────────

function computeCompleteness(
  route: typeof masterRoutesTable.$inferSelect,
  stopCount: number,
): number {
  let score = 0;
  if (route.name) score += 15;
  if (route.vibe) score += 15;
  if (route.description) score += 10;
  if (route.heroImage) score += 10;
  if (route.area) score += 5;
  if (route.startMartaName && route.startMartaLat && route.startMartaLng)
    score += 15;
  if (route.startParkingName) score += 5;
  if (stopCount >= 3) score += 15;
  else if (stopCount >= 1) score += 7;
  if (route.durationMinutes) score += 5;
  if (route.pace) score += 5;
  return Math.min(100, score);
}

// ── Slug helpers ──────────────────────────────────────────────────────────────

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  let slug = base;
  let n = 1;
  for (;;) {
    const rows = await db
      .select({ id: masterRoutesTable.id })
      .from(masterRoutesTable)
      .where(eq(masterRoutesTable.slug, slug));
    if (!rows.length || (excludeId && rows[0]?.id === excludeId)) return slug;
    slug = `${base}-${n++}`;
  }
}

// ── Public endpoints ──────────────────────────────────────────────────────────

router.get("/routes", async (_req, res) => {
  try {
    const routes = await db
      .select()
      .from(masterRoutesTable)
      .where(eq(masterRoutesTable.workflowStatus, "published"))
      .orderBy(masterRoutesTable.isFeatured, masterRoutesTable.name);

    const withStops = await Promise.all(
      routes.map(async (r) => {
        const stops = await db
          .select()
          .from(routeStopsTable)
          .where(eq(routeStopsTable.routeId, r.id))
          .orderBy(routeStopsTable.orderIndex);
        return { ...r, stops };
      }),
    );
    res.json(withStops);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.get("/routes/:slug", async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(masterRoutesTable)
      .where(eq(masterRoutesTable.slug, req.params.slug));
    if (!rows.length) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const route = rows[0]!;
    const stops = await db
      .select()
      .from(routeStopsTable)
      .where(eq(routeStopsTable.routeId, route.id))
      .orderBy(routeStopsTable.orderIndex);
    res.json({ ...route, stops });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── Admin — list / search ─────────────────────────────────────────────────────

router.get("/admin/routes", requireAdmin, async (req, res) => {
  try {
    const { status, search, area, pace, featured } = req.query as Record<
      string,
      string | undefined
    >;

    const conditions = [];
    if (status && status !== "all")
      conditions.push(eq(masterRoutesTable.workflowStatus, status));
    if (area)
      conditions.push(ilike(masterRoutesTable.area, `%${area}%`));
    if (pace)
      conditions.push(eq(masterRoutesTable.pace, pace));
    if (featured === "true")
      conditions.push(eq(masterRoutesTable.isFeatured, true));
    if (search)
      conditions.push(
        or(
          ilike(masterRoutesTable.name, `%${search}%`),
          ilike(masterRoutesTable.vibe, `%${search}%`),
          ilike(masterRoutesTable.area, `%${search}%`),
        )!,
      );

    const routes =
      conditions.length > 0
        ? await db
            .select()
            .from(masterRoutesTable)
            .where(and(...conditions))
            .orderBy(masterRoutesTable.updatedAt)
        : await db
            .select()
            .from(masterRoutesTable)
            .orderBy(masterRoutesTable.updatedAt);

    const withStops = await Promise.all(
      routes.map(async (r) => {
        const stops = await db
          .select()
          .from(routeStopsTable)
          .where(eq(routeStopsTable.routeId, r.id))
          .orderBy(routeStopsTable.orderIndex);
        return { ...r, stops };
      }),
    );
    res.json(withStops);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── Admin — create ─────────────────────────────────────────────────────────────

router.post("/admin/routes", requireAdmin, async (req, res) => {
  try {
    const body = req.body as Record<string, unknown>;
    const name = String(body.name ?? "Untitled Route");
    const baseSlug = toSlug(name);
    const slug = await uniqueSlug(baseSlug);

    const [route] = await db
      .insert(masterRoutesTable)
      .values({
        slug,
        name,
        area: body.area as string | undefined,
        vibe: body.vibe as string | undefined,
        description: body.description as string | undefined,
        heroImage: body.heroImage as string | undefined,
        color: (body.color as string | undefined) ?? "yellow",
        pace: (body.pace as string | undefined) ?? "Walkable",
        transportationVariants: body.transportationVariants as
          | string[]
          | undefined,
        durationMinutes: body.durationMinutes
          ? Number(body.durationMinutes)
          : undefined,
        distanceMiles: body.distanceMiles as string | undefined,
        ageGuidance: body.ageGuidance as string | undefined,
        timeOfDayGuidance: body.timeOfDayGuidance as string | undefined,
        startMartaName: body.startMartaName as string | undefined,
        startMartaLat: body.startMartaLat
          ? Number(body.startMartaLat)
          : undefined,
        startMartaLng: body.startMartaLng
          ? Number(body.startMartaLng)
          : undefined,
        startParkingName: body.startParkingName as string | undefined,
        startParkingLat: body.startParkingLat
          ? Number(body.startParkingLat)
          : undefined,
        startParkingLng: body.startParkingLng
          ? Number(body.startParkingLng)
          : undefined,
        workflowStatus: "draft",
        isFeatured: Boolean(body.isFeatured),
        isSponsored: Boolean(body.isSponsored),
        sponsorName: body.sponsorName as string | undefined,
        sponsorTier: body.sponsorTier as string | undefined,
        sponsorId: body.sponsorId as string | undefined,
        relatedExperienceSlug: body.relatedExperienceSlug as
          | string
          | undefined,
        relatedEventIds: body.relatedEventIds as string[] | undefined,
        relatedLocationSlugs: body.relatedLocationSlugs as
          | string[]
          | undefined,
        relatedLegendSlugs: body.relatedLegendSlugs as string[] | undefined,
        relatedStampSlugs: body.relatedStampSlugs as string[] | undefined,
        relatedRewardIds: body.relatedRewardIds as string[] | undefined,
        adminNotes: body.adminNotes as string | undefined,
        seoTitle: body.seoTitle as string | undefined,
        seoDescription: body.seoDescription as string | undefined,
      })
      .returning();

    res.status(201).json(route);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── Admin — update ─────────────────────────────────────────────────────────────

router.patch("/admin/routes/:id", requireAdmin, async (req, res) => {
  try {
    const body = req.body as Record<string, unknown>;
    const id = req.params.id;

    const updateData: Partial<typeof masterRoutesTable.$inferInsert> = {};

    const textFields = [
      "name","area","vibe","description","heroImage","color","pace",
      "distanceMiles","ageGuidance","timeOfDayGuidance","startMartaName",
      "startParkingName","workflowStatus","sponsorName","sponsorTier",
      "sponsorId","relatedExperienceSlug","adminNotes","seoTitle","seoDescription",
      "duplicateOfId",
    ] as const;

    for (const f of textFields) {
      if (f in body) (updateData as Record<string, unknown>)[f] = body[f];
    }

    if ("durationMinutes" in body)
      updateData.durationMinutes = body.durationMinutes != null
        ? Number(body.durationMinutes)
        : undefined;
    if ("startMartaLat" in body)
      updateData.startMartaLat = body.startMartaLat != null
        ? Number(body.startMartaLat)
        : undefined;
    if ("startMartaLng" in body)
      updateData.startMartaLng = body.startMartaLng != null
        ? Number(body.startMartaLng)
        : undefined;
    if ("startParkingLat" in body)
      updateData.startParkingLat = body.startParkingLat != null
        ? Number(body.startParkingLat)
        : undefined;
    if ("startParkingLng" in body)
      updateData.startParkingLng = body.startParkingLng != null
        ? Number(body.startParkingLng)
        : undefined;
    if ("isFeatured" in body)
      updateData.isFeatured = Boolean(body.isFeatured);
    if ("isSponsored" in body)
      updateData.isSponsored = Boolean(body.isSponsored);
    if ("isDuplicate" in body)
      updateData.isDuplicate = Boolean(body.isDuplicate);
    if ("transportationVariants" in body)
      updateData.transportationVariants = body.transportationVariants as string[];
    if ("relatedEventIds" in body)
      updateData.relatedEventIds = body.relatedEventIds as string[];
    if ("relatedLocationSlugs" in body)
      updateData.relatedLocationSlugs = body.relatedLocationSlugs as string[];
    if ("relatedLegendSlugs" in body)
      updateData.relatedLegendSlugs = body.relatedLegendSlugs as string[];
    if ("relatedStampSlugs" in body)
      updateData.relatedStampSlugs = body.relatedStampSlugs as string[];
    if ("relatedRewardIds" in body)
      updateData.relatedRewardIds = body.relatedRewardIds as string[];

    // Status-specific timestamps
    if (updateData.workflowStatus === "published" && !updateData.publishedAt)
      updateData.publishedAt = new Date();
    if (updateData.workflowStatus === "archived" && !updateData.archivedAt)
      updateData.archivedAt = new Date();

    updateData.updatedAt = new Date();

    // Recompute completeness after save
    const stops = await db
      .select()
      .from(routeStopsTable)
      .where(eq(routeStopsTable.routeId, id));

    const existing = await db
      .select()
      .from(masterRoutesTable)
      .where(eq(masterRoutesTable.id, id));

    if (!existing.length) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const merged = { ...existing[0]!, ...updateData };
    updateData.completenessScore = computeCompleteness(
      merged as typeof masterRoutesTable.$inferSelect,
      stops.length,
    );

    const [updated] = await db
      .update(masterRoutesTable)
      .set(updateData)
      .where(eq(masterRoutesTable.id, id))
      .returning();

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── Admin — delete (soft archive) ─────────────────────────────────────────────

router.delete("/admin/routes/:id", requireAdmin, async (req, res) => {
  try {
    await db
      .update(masterRoutesTable)
      .set({ workflowStatus: "archived", archivedAt: new Date(), updatedAt: new Date() })
      .where(eq(masterRoutesTable.id, req.params.id));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── Admin — duplicate ─────────────────────────────────────────────────────────

router.post("/admin/routes/:id/duplicate", requireAdmin, async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(masterRoutesTable)
      .where(eq(masterRoutesTable.id, req.params.id));
    if (!rows.length) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const orig = rows[0]!;
    const newSlug = await uniqueSlug(`${orig.slug}-copy`);

    const { id: _id, createdAt: _c, updatedAt: _u, publishedAt: _p, archivedAt: _a, ...rest } = orig;
    const [dup] = await db
      .insert(masterRoutesTable)
      .values({
        ...rest,
        slug: newSlug,
        name: `${orig.name} (Copy)`,
        workflowStatus: "draft",
        publishedAt: undefined,
        archivedAt: undefined,
        scheduledPublishAt: undefined,
      })
      .returning();

    // Duplicate stops
    const stops = await db
      .select()
      .from(routeStopsTable)
      .where(eq(routeStopsTable.routeId, orig.id))
      .orderBy(routeStopsTable.orderIndex);

    if (stops.length > 0 && dup) {
      await db.insert(routeStopsTable).values(
        stops.map(({ id: _sid, createdAt: _sc, routeId: _rid, ...s }) => ({
          ...s,
          routeId: dup.id,
        })),
      );
    }

    res.status(201).json(dup);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── Admin — stops CRUD ────────────────────────────────────────────────────────

router.get("/admin/routes/:id/stops", requireAdmin, async (req, res) => {
  try {
    const stops = await db
      .select()
      .from(routeStopsTable)
      .where(eq(routeStopsTable.routeId, req.params.id))
      .orderBy(routeStopsTable.orderIndex);
    res.json(stops);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.post("/admin/routes/:id/stops", requireAdmin, async (req, res) => {
  try {
    const body = req.body as Record<string, unknown>;
    const [stop] = await db
      .insert(routeStopsTable)
      .values({
        routeId: req.params.id,
        businessSlug: body.businessSlug as string | undefined,
        orderIndex: body.orderIndex != null ? Number(body.orderIndex) : 0,
        morningOrder: body.morningOrder != null ? Number(body.morningOrder) : undefined,
        noonOrder: body.noonOrder != null ? Number(body.noonOrder) : undefined,
        nightOrder: body.nightOrder != null ? Number(body.nightOrder) : undefined,
        customName: body.customName as string | undefined,
        customDescription: body.customDescription as string | undefined,
        stopNote: body.stopNote as string | undefined,
        visitMinutesOverride: body.visitMinutesOverride != null
          ? Number(body.visitMinutesOverride)
          : undefined,
        hasStamp: Boolean(body.hasStamp),
      })
      .returning();
    res.status(201).json(stop);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.patch(
  "/admin/routes/:id/stops/:stopId",
  requireAdmin,
  async (req, res) => {
    try {
      const body = req.body as Record<string, unknown>;
      const update: Partial<typeof routeStopsTable.$inferInsert> = {};
      if ("businessSlug" in body) update.businessSlug = body.businessSlug as string;
      if ("orderIndex" in body) update.orderIndex = Number(body.orderIndex);
      if ("morningOrder" in body)
        update.morningOrder = body.morningOrder != null ? Number(body.morningOrder) : undefined;
      if ("noonOrder" in body)
        update.noonOrder = body.noonOrder != null ? Number(body.noonOrder) : undefined;
      if ("nightOrder" in body)
        update.nightOrder = body.nightOrder != null ? Number(body.nightOrder) : undefined;
      if ("customName" in body) update.customName = body.customName as string;
      if ("customDescription" in body) update.customDescription = body.customDescription as string;
      if ("stopNote" in body) update.stopNote = body.stopNote as string;
      if ("visitMinutesOverride" in body)
        update.visitMinutesOverride = body.visitMinutesOverride != null
          ? Number(body.visitMinutesOverride)
          : undefined;
      if ("hasStamp" in body) update.hasStamp = Boolean(body.hasStamp);

      const [updated] = await db
        .update(routeStopsTable)
        .set(update)
        .where(
          and(
            eq(routeStopsTable.id, req.params.stopId),
            eq(routeStopsTable.routeId, req.params.id),
          ),
        )
        .returning();
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  },
);

router.delete(
  "/admin/routes/:id/stops/:stopId",
  requireAdmin,
  async (req, res) => {
    try {
      await db
        .delete(routeStopsTable)
        .where(
          and(
            eq(routeStopsTable.id, req.params.stopId),
            eq(routeStopsTable.routeId, req.params.id),
          ),
        );
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  },
);

router.post(
  "/admin/routes/:id/stops/reorder",
  requireAdmin,
  async (req, res) => {
    try {
      const { order } = req.body as { order: Array<{ id: string; orderIndex: number }> };
      await Promise.all(
        order.map(({ id, orderIndex }) =>
          db
            .update(routeStopsTable)
            .set({ orderIndex })
            .where(
              and(
                eq(routeStopsTable.id, id),
                eq(routeStopsTable.routeId, req.params.id),
              ),
            ),
        ),
      );
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  },
);

// ── Admin — migrate from sample data ─────────────────────────────────────────

const SAMPLE_ROUTES = [
  {
    id: "nakato-route",
    name: "Nakato Route",
    area: "Midtown → Cheshire Bridge",
    pace: "Bike Friendly",
    color: "red",
    vibe: "A Midtown-to-Cheshire-Bridge ride built around a legendary teppanyaki dinner at third-generation Nakato — with a pub, bowling, and live music along the way.",
    description: "This route is recommended for biking or driving. Start from the MARTA Midtown station and loop back to it when you're done.",
    starts: {
      marta: { name: "MARTA Midtown Station", lat: 33.78112, lng: -84.38637 },
      parking: { name: "Cheshire Bridge parking", lat: 33.8044, lng: -84.365 },
    },
    stopNotes: {
      "smiths-old-bar": "We're at a fork in the road — do we want the classic Smith's Olde Bar, or push on?",
    } as Record<string, string>,
    byTime: {
      morning: ["liddel-house","six-feet-under","midtown-bowl","nakato-japanese-restaurant","smiths-old-bar","felixs-atlanta"],
      noon: ["liddel-house","six-feet-under","midtown-bowl","nakato-japanese-restaurant","smiths-old-bar","felixs-atlanta"],
      night: ["liddel-house","six-feet-under","midtown-bowl","nakato-japanese-restaurant","smiths-old-bar","felixs-atlanta"],
    },
  },
  {
    id: "varasanos-route",
    name: "Varasano's Route",
    area: "Lindbergh → Buckhead",
    pace: "Bike Friendly",
    color: "lime",
    vibe: "An Armour/Ottley ride capped by a wood-fired pie at Varasano's: a pickleball stop, an ASW Distillery tasting, then late drinks at Tongue & Groove.",
    description: "This route is recommended for biking. Start at Lindbergh Center — grab a Zipcar there if you'd rather drive between stops.",
    starts: {
      marta: { name: "Lindbergh Center", lat: 33.82318, lng: -84.36944 },
      parking: { name: "Armour Dr parking", lat: 33.8115, lng: -84.388 },
    },
    stopNotes: {} as Record<string, string>,
    byTime: {
      morning: ["the-painted-pickle","asw-distillery","varasanos","tongue-and-groove"],
      noon: ["the-painted-pickle","asw-distillery","varasanos","tongue-and-groove"],
      night: ["the-painted-pickle","asw-distillery","varasanos","tongue-and-groove"],
    },
  },
  {
    id: "wheelhaus-route",
    name: "Wheelhaus Route",
    area: "Glenwood → Grant Park",
    pace: "Bike Friendly",
    color: "sky",
    vibe: "Rent a set of wheels at founding sponsor Wheelhaus and ride the Southeast BeltLine through Grant Park and Zoo Atlanta — with a Waffle House detour to debate.",
    description: "This route is recommended for biking. Pick up your bike at Wheelhaus, and get it back to drop off before they close at 7pm.",
    starts: {
      marta: { name: "King Memorial Station", lat: 33.7489, lng: -84.3722 },
      parking: { name: "Wheelhaus (Glenwood)", lat: 33.7401, lng: -84.349 },
    },
    stopNotes: {
      "vickerys-bar-grill": "Take the Southeast Trail of the BeltLine and go north onto Boulevard.",
      "zoo-atlanta": "Leave the zoo, exit Grant Park, and continue onto Boulevard. Turn right at the CVS onto Hansell St SE.",
      "waffle-house": "We're at a fork in the road — do we want the iconic Waffle House, or push on?",
    } as Record<string, string>,
    byTime: {
      morning: ["wheelhaus-bikes","vickerys-bar-grill","grant-park","zoo-atlanta","waffle-house","chick-fil-a"],
      noon: ["wheelhaus-bikes","vickerys-bar-grill","grant-park","zoo-atlanta","waffle-house","chick-fil-a"],
      night: ["wheelhaus-bikes","vickerys-bar-grill","grant-park","zoo-atlanta","waffle-house","chick-fil-a"],
    },
  },
  {
    id: "trap-music-museum-route",
    name: "Trap Music Museum Route",
    area: "West End → Westside BeltLine",
    pace: "Bike Friendly",
    color: "yellow",
    vibe: "A Westside BeltLine ride through Black ATL's culture core: brunch at The Westwood, the Trap Music Museum and its Tiny Door, the MLK mural at Trap City Cafe, Nappy Roots' Atlantucky brews, the Hammond's House and Spelman art museums, and a finish at BoxCar at Hop City.",
    description: "This route is recommended for biking. Begin at the West End MARTA station, where an ATL Spoke shuttle can take you to the Lee + White BeltLine access point — then follow the Westside BeltLine trail to Lucile Ave SW and turn left.",
    starts: {
      marta: { name: "West End Station", lat: 33.73676, lng: -84.41376 },
      parking: { name: "Lee + White lot", lat: 33.748, lng: -84.413 },
    },
    stopNotes: {
      "the-westwood": "Get back on the Westside BeltLine connector.",
      "tiny-door-atl-26": "At the same address is another cool spot to check out.",
      "mlk-mural-at-trap-city-cafe": "From here you can either take MARTA to Vine City station or bike directly to the next stop.",
      "atlantucky-brewing": "While you're here, walk across the street to The Bookstore Gallery.",
      "boxcar-at-hop-city": "When you're done, take the ATL Spoke shuttle back to the West End MARTA.",
    } as Record<string, string>,
    byTime: {
      morning: ["the-westwood","trap-museum","tiny-door-atl-26","mlk-mural-at-trap-city-cafe","atlantucky-brewing","hammonds-house-museum","spelman-college-museum-of-fine-art","boxcar-at-hop-city"],
      noon: ["the-westwood","trap-museum","tiny-door-atl-26","mlk-mural-at-trap-city-cafe","atlantucky-brewing","hammonds-house-museum","spelman-college-museum-of-fine-art","boxcar-at-hop-city"],
      night: ["the-westwood","trap-museum","tiny-door-atl-26","mlk-mural-at-trap-city-cafe","atlantucky-brewing","hammonds-house-museum","spelman-college-museum-of-fine-art","boxcar-at-hop-city"],
    },
  },
  {
    id: "peachtree-wellness-route",
    name: "Peachtree Wellness Route",
    area: "Oakland → Cabbagetown",
    pace: "Walkable",
    color: "orange",
    vibe: "A walkable Southeast BeltLine wander from Oakland Cemetery through Cabbagetown — the Krog St Tunnel and Tiny Door #1, a skatepark, Hop City, and a patio beer at 97 Estoria.",
    description: "This route is recommended for walking. Start at King Memorial Station and follow the Southeast BeltLine trail through Cabbagetown.",
    starts: {
      marta: { name: "King Memorial Station", lat: 33.7489, lng: -84.3722 },
      parking: { name: "Oakland Ave parking", lat: 33.747, lng: -84.369 },
    },
    stopNotes: {
      "oakland-cemetery": "Go all the way through the cemetery and say hi to Peachtree Wellness across the street.",
      "la-semilla": "After this stop, take the Southeast Trail at Memorial & Bill Kennedy, then left onto Wylie St SE.",
      "krog-street-tunnel": "You'll find Tiny Door #1 off the Atlanta BeltLine SE Trail.",
    } as Record<string, string>,
    byTime: {
      morning: ["oakland-cemetery","la-semilla","krog-street-tunnel","thomas-taylor-memorial-skatepark","hop-city-at-krog-st-market","97-estoria","peachtree-wellness"],
      noon: ["oakland-cemetery","la-semilla","krog-street-tunnel","thomas-taylor-memorial-skatepark","hop-city-at-krog-st-market","97-estoria","peachtree-wellness"],
      night: ["oakland-cemetery","la-semilla","krog-street-tunnel","thomas-taylor-memorial-skatepark","hop-city-at-krog-st-market","97-estoria","peachtree-wellness"],
    },
  },
];

router.post("/admin/routes/migrate-sample", requireAdmin, async (req, res) => {
  try {
    const report: Array<{
      slug: string;
      name: string;
      status: "migrated" | "skipped" | "error";
      reason?: string;
      stopsInserted?: number;
    }> = [];

    for (const sr of SAMPLE_ROUTES) {
      // Check if already exists
      const existing = await db
        .select({ id: masterRoutesTable.id })
        .from(masterRoutesTable)
        .where(eq(masterRoutesTable.slug, sr.id));

      if (existing.length) {
        report.push({ slug: sr.id, name: sr.name, status: "skipped", reason: "Already migrated" });
        continue;
      }

      try {
        const [route] = await db
          .insert(masterRoutesTable)
          .values({
            slug: sr.id,
            name: sr.name,
            area: sr.area,
            vibe: sr.vibe,
            description: sr.description,
            color: sr.color,
            pace: sr.pace,
            workflowStatus: "published",
            publishedAt: new Date(),
            isFeatured: true,
            startMartaName: sr.starts.marta.name,
            startMartaLat: sr.starts.marta.lat,
            startMartaLng: sr.starts.marta.lng,
            startParkingName: sr.starts.parking.name,
            startParkingLat: sr.starts.parking.lat,
            startParkingLng: sr.starts.parking.lng,
          })
          .returning();

        if (!route) throw new Error("Insert returned no row");

        // Build stop rows with time-of-day orders
        const allSlugs = Array.from(
          new Set([
            ...sr.byTime.morning,
            ...sr.byTime.noon,
            ...sr.byTime.night,
          ]),
        );

        const stopRows = allSlugs.map((slug, idx) => ({
          routeId: route.id,
          businessSlug: slug,
          orderIndex: idx,
          morningOrder: sr.byTime.morning.indexOf(slug) >= 0
            ? sr.byTime.morning.indexOf(slug) + 1
            : undefined,
          noonOrder: sr.byTime.noon.indexOf(slug) >= 0
            ? sr.byTime.noon.indexOf(slug) + 1
            : undefined,
          nightOrder: sr.byTime.night.indexOf(slug) >= 0
            ? sr.byTime.night.indexOf(slug) + 1
            : undefined,
          stopNote: sr.stopNotes[slug] as string | undefined,
        }));

        await db.insert(routeStopsTable).values(stopRows);

        // Update completeness
        await db
          .update(masterRoutesTable)
          .set({ completenessScore: computeCompleteness(route, stopRows.length) })
          .where(eq(masterRoutesTable.id, route.id));

        report.push({
          slug: sr.id,
          name: sr.name,
          status: "migrated",
          stopsInserted: stopRows.length,
        });
      } catch (err) {
        report.push({ slug: sr.id, name: sr.name, status: "error", reason: String(err) });
      }
    }

    const migrated = report.filter((r) => r.status === "migrated").length;
    const skipped = report.filter((r) => r.status === "skipped").length;
    const errors = report.filter((r) => r.status === "error").length;

    res.json({ migrated, skipped, errors, total: SAMPLE_ROUTES.length, report });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── Admin — CSV export ────────────────────────────────────────────────────────

router.get("/admin/routes/export.csv", requireAdmin, async (_req, res) => {
  try {
    const routes = await db.select().from(masterRoutesTable).orderBy(masterRoutesTable.name);

    const header = [
      "slug","name","area","vibe","pace","color","workflowStatus",
      "isFeatured","isSponsored","sponsorName","sponsorTier",
      "startMartaName","startMartaLat","startMartaLng",
      "startParkingName","startParkingLat","startParkingLng",
      "durationMinutes","distanceMiles","ageGuidance","timeOfDayGuidance",
      "description","adminNotes","createdAt","publishedAt",
    ];

    const escape = (v: unknown) => {
      const s = v == null ? "" : String(v);
      return s.includes(",") || s.includes('"') || s.includes("\n")
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    };

    const rows = routes.map((r) =>
      [
        r.slug, r.name, r.area, r.vibe, r.pace, r.color, r.workflowStatus,
        r.isFeatured, r.isSponsored, r.sponsorName, r.sponsorTier,
        r.startMartaName, r.startMartaLat, r.startMartaLng,
        r.startParkingName, r.startParkingLat, r.startParkingLng,
        r.durationMinutes, r.distanceMiles, r.ageGuidance, r.timeOfDayGuidance,
        r.description, r.adminNotes, r.createdAt?.toISOString(), r.publishedAt?.toISOString(),
      ]
        .map(escape)
        .join(","),
    );

    const csv = [header.join(","), ...rows].join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="routes.csv"');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── Admin — CSV import ────────────────────────────────────────────────────────

router.post("/admin/routes/bulk-import", requireAdmin, async (req, res) => {
  try {
    const { routes: rows } = req.body as {
      routes: Array<Record<string, string>>;
    };

    const results: Array<{
      rowIndex: number;
      name: string;
      status: "inserted" | "duplicate" | "error";
      error?: string;
    }> = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]!;
      const name = row.name?.trim();
      if (!name) {
        results.push({ rowIndex: i, name: "", status: "error", error: "Missing name" });
        continue;
      }

      const baseSlug = row.slug?.trim() || toSlug(name);

      // Duplicate check by name
      const dup = await db
        .select({ id: masterRoutesTable.id })
        .from(masterRoutesTable)
        .where(sql`lower(${masterRoutesTable.name}) = lower(${name})`);

      if (dup.length) {
        results.push({ rowIndex: i, name, status: "duplicate" });
        continue;
      }

      try {
        const slug = await uniqueSlug(baseSlug);
        await db.insert(masterRoutesTable).values({
          slug,
          name,
          area: row.area || undefined,
          vibe: row.vibe || undefined,
          description: row.description || undefined,
          color: row.color || "yellow",
          pace: row.pace || "Walkable",
          workflowStatus: row.workflowStatus || "draft",
          isFeatured: row.isFeatured === "true",
          isSponsored: row.isSponsored === "true",
          sponsorName: row.sponsorName || undefined,
          sponsorTier: row.sponsorTier || undefined,
          startMartaName: row.startMartaName || undefined,
          startMartaLat: row.startMartaLat ? Number(row.startMartaLat) : undefined,
          startMartaLng: row.startMartaLng ? Number(row.startMartaLng) : undefined,
          startParkingName: row.startParkingName || undefined,
          startParkingLat: row.startParkingLat ? Number(row.startParkingLat) : undefined,
          startParkingLng: row.startParkingLng ? Number(row.startParkingLng) : undefined,
          durationMinutes: row.durationMinutes ? Number(row.durationMinutes) : undefined,
          distanceMiles: row.distanceMiles || undefined,
          ageGuidance: row.ageGuidance || undefined,
          timeOfDayGuidance: row.timeOfDayGuidance || undefined,
          adminNotes: row.adminNotes || undefined,
        });
        results.push({ rowIndex: i, name, status: "inserted" });
      } catch (err) {
        results.push({ rowIndex: i, name, status: "error", error: String(err) });
      }
    }

    res.json({
      inserted: results.filter((r) => r.status === "inserted").length,
      duplicates: results.filter((r) => r.status === "duplicate").length,
      errors: results.filter((r) => r.status === "error").length,
      rows: results,
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
