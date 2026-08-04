import type { Business } from "@workspace/db";
import {
  normalizeLocationTags,
  resolveLocationCategory,
  slugifyLocationValue,
} from "./location-taxonomy";

export function toPublicBusiness(row: Business) {
  const category = resolveLocationCategory(row.categoryId || row.category);
  const latitude = row.latitude ?? null;
  const longitude = row.longitude ?? null;
  const now = Date.now();
  const entitlementActive =
    (!row.entitlementStartsAt || row.entitlementStartsAt.getTime() <= now) &&
    (!row.entitlementEndsAt || row.entitlementEndsAt.getTime() >= now);

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: category.name,
    categoryId: category.id,
    tags: normalizeLocationTags(row.tags),
    neighborhood: row.neighborhood,
    areaId: row.areaId || slugifyLocationValue(row.neighborhood),
    description: row.description,
    address: row.address,
    image: row.image,
    stampName: row.stampName,
    stampColor: row.stampColor,
    icon: row.icon,
    latitude,
    longitude,
    mapReadiness:
      row.mapReadiness === "verified" && latitude !== null && longitude !== null
        ? "verified"
        : latitude !== null && longitude !== null
          ? "coordinates-present"
          : "missing-coordinates",
    publicStatus: row.publicStatus,
    isStampStop: row.isStampStop,
    priorityListing: row.priorityListing && entitlementActive,
    priorityRank: row.priorityRank,
    detailPageEnabled: row.detailPageEnabled && entitlementActive,
    entitlementStartsAt: row.entitlementStartsAt?.toISOString() ?? null,
    entitlementEndsAt: row.entitlementEndsAt?.toISOString() ?? null,
    hasPublicOffer: row.hasPublicOffer,
    publicUpdatedAt: row.publicUpdatedAt.toISOString(),
    isActive: row.isActive,
    sortKey: `${row.name.toLocaleLowerCase("en-US")}:${row.slug}`,
  };
}
