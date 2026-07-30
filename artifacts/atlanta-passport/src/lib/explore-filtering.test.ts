import { describe, expect, it } from "vitest";
import { businesses } from "@/data/sample-data";
import type { ExploreLocation } from "@/hooks/useExploreLocations";
import {
  getExploreFilterOptions,
  matchesExploreFilters,
} from "./explore-filtering";

const location: ExploreLocation = {
  ...businesses[0]!,
  categoryId: "restaurant",
  areaId: "castleberry-hill",
  tags: ["live-music", "black-owned"],
};

describe("Explore canonical filtering", () => {
  it("combines query, area, category, and tag filters", () => {
    expect(
      matchesExploreFilters(location, {
        query: "music",
        areaIds: ["castleberry-hill"],
        categoryIds: ["restaurant"],
        tagIds: ["black-owned"],
      }),
    ).toBe(true);

    expect(
      matchesExploreFilters(location, {
        query: "",
        areaIds: [],
        categoryIds: ["museum-cultural"],
        tagIds: [],
      }),
    ).toBe(false);
  });

  it("builds alphabetized options with result counts", () => {
    const options = getExploreFilterOptions([location]);

    expect(options.areas).toEqual([
      { id: "castleberry-hill", name: "Castleberry Hill", count: 1 },
    ]);
    expect(options.categories).toEqual([
      { id: "restaurant", name: "Restaurant", count: 1 },
    ]);
    expect(options.tags).toEqual([
      { id: "black-owned", name: "Black-Owned", count: 1 },
      { id: "live-music", name: "Live Music", count: 1 },
    ]);
  });
});
