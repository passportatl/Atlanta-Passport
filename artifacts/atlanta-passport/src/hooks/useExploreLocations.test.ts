import { describe, expect, it } from "vitest";
import type { Business } from "@workspace/api-client-react";
import {
  isCanonicalExploreEnabled,
  mergeCanonicalExploreLocations,
} from "./useExploreLocations";

function canonical(overrides: Partial<Business> = {}): Business {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    slug: "atlantucky",
    name: "Atlantucky Brewing",
    category: "Restaurant",
    categoryId: "restaurant",
    tags: ["live-music"],
    neighborhood: "Castleberry Hill",
    areaId: "castleberry-hill",
    description: "Canonical description",
    address: "170 Northside Dr SW, Suite 96, Atlanta, GA 30313",
    image: null,
    stampName: "Atlantucky Brewing",
    stampColor: "#123456",
    icon: "beer",
    latitude: 33.75,
    longitude: -84.4,
    mapReadiness: "verified",
    publicStatus: "published",
    isStampStop: true,
    priorityListing: true,
    priorityRank: 100,
    detailPageEnabled: true,
    entitlementStartsAt: null,
    entitlementEndsAt: null,
    hasPublicOffer: true,
    publicUpdatedAt: "2026-07-29T12:00:00.000Z",
    sortKey: "atlantucky brewing:atlantucky",
    isActive: true,
    ...overrides,
  };
}

describe("Explore canonical location compatibility adapter", () => {
  it("overlays a canonical record without changing its legacy map identity", () => {
    const result = mergeCanonicalExploreLocations([canonical()]);
    const location = result.locations.find(
      (candidate) => candidate.id === "atlantucky-brewing",
    );

    expect(location).toMatchObject({
      id: "atlantucky-brewing",
      canonicalSlug: "atlantucky",
      categoryId: "restaurant",
      description: "Canonical description",
      isStampStop: true,
      priorityListing: true,
      priorityRank: 100,
      detailPageEnabled: true,
      locationSource: "canonical",
    });
    expect(result.matchedCanonicalCount).toBe(1);
  });

  it("keeps unmatched static locations as a controlled fallback", () => {
    const result = mergeCanonicalExploreLocations([canonical()]);
    const unmatched = result.locations.find(
      (candidate) => candidate.id === "peachtree-wellness",
    );

    expect(unmatched).toMatchObject({
      locationSource: "static-fallback",
      priorityListing: false,
      priorityRank: 0,
      detailPageEnabled: true,
    });
  });

  it("reports canonical records that do not yet map to static identities", () => {
    const result = mergeCanonicalExploreLocations([
      canonical({ id: "unmatched", slug: "unmatched", name: "New Place" }),
    ]);

    expect(result.matchedCanonicalCount).toBe(0);
    expect(result.unmatchedCanonicalCount).toBe(1);
  });
});

describe("Explore canonical feature flag", () => {
  it("is opt-in and accepts only the explicit true value", () => {
    expect(isCanonicalExploreEnabled("true")).toBe(true);
    expect(isCanonicalExploreEnabled("false")).toBe(false);
    expect(isCanonicalExploreEnabled("1")).toBe(false);
    expect(isCanonicalExploreEnabled(undefined)).toBe(false);
  });
});
