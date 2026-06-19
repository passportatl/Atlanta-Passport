import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import {
  db,
  stampsTable,
  visitorsTable,
  redemptionsTable,
  businessesTable,
} from "@workspace/db";
import { RedeemPrizeBody } from "@workspace/api-zod";
import { isWithin, geofenceDisabled } from "../lib/geofence";

const router: IRouter = Router();

// Valid prize-tier stamp costs — mirror of PRIZE_TIERS thresholds on the client
// (src/components/PrizesSection.tsx). A tier's stamp cost is also its identity.
const PRIZE_TIER_STAMPS = [3, 7, 10, 13, 15];

// All prize redemptions happen at the Peachtree Wellness front desk.
const REDEMPTION_SLUG = "peachtree-wellness";

router.post("/redemptions", async (req, res) => {
  const parsed = RedeemPrizeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", issues: parsed.error.issues });
    return;
  }
  const { visitorId, tier, latitude, longitude } = parsed.data;

  if (!PRIZE_TIER_STAMPS.includes(tier)) {
    res.status(404).json({ error: "Unknown prize tier" });
    return;
  }

  const visitorRows = await db
    .select()
    .from(visitorsTable)
    .where(eq(visitorsTable.id, visitorId));
  if (!visitorRows[0]) {
    res.status(404).json({ error: "Visitor not found" });
    return;
  }

  // Location lock: must be at Peachtree Wellness to redeem.
  const anchorRows = await db
    .select()
    .from(businessesTable)
    .where(eq(businessesTable.slug, REDEMPTION_SLUG));
  const anchor = anchorRows[0];
  if (!anchor || anchor.latitude == null || anchor.longitude == null) {
    res.status(404).json({ error: "Redemption location not configured" });
    return;
  }
  if (!geofenceDisabled()) {
    if (latitude == null || longitude == null) {
      res
        .status(422)
        .json({ error: "location_required", message: "Location is required to redeem a prize." });
      return;
    }
    if (!isWithin(latitude, longitude, anchor.latitude, anchor.longitude)) {
      res
        .status(422)
        .json({ error: "too_far", message: "You must be at Peachtree Wellness to redeem this prize." });
      return;
    }
  }

  // Already redeemed this tier?
  const existing = await db
    .select()
    .from(redemptionsTable)
    .where(
      and(
        eq(redemptionsTable.visitorId, visitorId),
        eq(redemptionsTable.tierStamps, tier),
      ),
    );
  if (existing[0]) {
    res.status(409).json({ error: "Tier already redeemed" });
    return;
  }

  // Effective balance = total stamps collected − sum of already-redeemed costs.
  const stampRows = await db
    .select()
    .from(stampsTable)
    .where(eq(stampsTable.visitorId, visitorId));
  const priorRedemptions = await db
    .select()
    .from(redemptionsTable)
    .where(eq(redemptionsTable.visitorId, visitorId));
  const spent = priorRedemptions.reduce((s, r) => s + r.tierStamps, 0);
  const effectiveBalance = stampRows.length - spent;

  if (effectiveBalance < tier) {
    res
      .status(422)
      .json({ error: "insufficient_stamps", message: "Not enough stamps to redeem this prize." });
    return;
  }

  const [redemption] = await db
    .insert(redemptionsTable)
    .values({ visitorId, tierStamps: tier })
    .returning();

  res.json({ redemption, effectiveBalance: effectiveBalance - tier });
});

router.get("/visitors/:id/redemptions", async (req, res) => {
  const id = req.params.id;
  if (!id) {
    res.status(400).json({ error: "Missing id" });
    return;
  }
  const rows = await db
    .select()
    .from(redemptionsTable)
    .where(eq(redemptionsTable.visitorId, id))
    .orderBy(desc(redemptionsTable.redeemedAt));
  res.json(rows);
});

export default router;
