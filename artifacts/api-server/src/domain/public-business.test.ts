import { describe, expect, it } from "vitest";
import type { Business } from "@workspace/db";
import { toPublicBusiness } from "./public-business";

const business: Business = {
  id: "00000000-0000-0000-0000-000000000001",
  slug: "sample-place",
  name: "Sample Place",
  category: "Food",
  categoryId: null,
  tags: ["Live Music"],
  neighborhood: "Old Fourth Ward",
  areaId: null,
  description: "A sample public listing.",
  address: "123 Atlanta Ave, Atlanta, GA",
  image: null,
  contactName: "Internal Contact",
  stampName: "Sample Place",
  stampColor: "#123456",
  icon: "📍",
  latitude: 33.75,
  longitude: -84.38,
  mapReadiness: "unverified",
  publicStatus: "published",
  isStampStop: true,
  priorityListing: false,
  priorityRank: 0,
  detailPageEnabled: false,
  entitlementStartsAt: null,
  entitlementEndsAt: null,
  hasPublicOffer: false,
  publicUpdatedAt: new Date("2026-07-29T12:00:00.000Z"),
  isActive: true,
};

describe("public business mapper", () => {
  it("returns the canonical public contract and excludes internal contact data", () => {
    const result = toPublicBusiness(business);

    expect(result).toMatchObject({
      category: "Restaurant",
      categoryId: "restaurant",
      tags: ["live-music"],
      areaId: "old-fourth-ward",
      mapReadiness: "coordinates-present",
      sortKey: "sample place:sample-place",
    });
    expect(result).not.toHaveProperty("contactName");
  });

  it("turns off paid entitlements after their end date", () => {
    const result = toPublicBusiness({
      ...business,
      priorityListing: true,
      detailPageEnabled: true,
      entitlementEndsAt: new Date("2020-01-01T00:00:00.000Z"),
    });

    expect(result.priorityListing).toBe(false);
    expect(result.detailPageEnabled).toBe(false);
  });
});
