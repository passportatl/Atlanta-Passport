import { describe, expect, it } from "vitest";
import {
  normalizeLocationTags,
  resolveLocationCategory,
  slugifyLocationValue,
} from "./location-taxonomy";

describe("location taxonomy", () => {
  it.each([
    ["Food", "restaurant", "Restaurant"],
    ["Drink", "bar-lounge", "Bar & Lounge"],
    ["Retail", "retail-shopping", "Retail & Shopping"],
    ["Parks", "outdoor-recreation", "Outdoor & Recreation"],
    ["Public Art", "art-gallery", "Art Gallery"],
  ])("maps legacy category %s to a canonical category", (legacy, id, name) => {
    expect(resolveLocationCategory(legacy)).toMatchObject({
      id,
      name,
      legacyValue: legacy,
    });
  });

  it("preserves an already canonical category", () => {
    expect(resolveLocationCategory("Museum & Cultural")).toEqual({
      id: "museum-cultural",
      name: "Museum & Cultural",
    });
  });

  it("falls back safely for an unknown category", () => {
    expect(resolveLocationCategory("Uninvented Category")).toEqual({
      id: "other",
      name: "Other",
      legacyValue: "Uninvented Category",
    });
  });

  it("creates stable IDs and de-duplicates tags", () => {
    expect(slugifyLocationValue("Old Fourth Ward")).toBe("old-fourth-ward");
    expect(
      normalizeLocationTags(["Live Music", "live music", "MARTA Accessible"]),
    ).toEqual(["live-music", "marta-accessible"]);
  });
});
