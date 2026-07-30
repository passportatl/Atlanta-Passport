import { describe, expect, it } from "vitest";
import { businesses } from "@/data/sample-data";
import type { ExploreLocation } from "@/hooks/useExploreLocations";
import { rankExploreLocations } from "./explore-ranking";

function location(
  id: string,
  overrides: Partial<ExploreLocation> = {},
): ExploreLocation {
  return {
    ...businesses[0],
    id,
    name: id,
    sortKey: `${id}:${id}`,
    isStampStop: false,
    priorityListing: false,
    priorityRank: 0,
    ...overrides,
  };
}

describe("Explore ranking", () => {
  it("ranks stamp locations first and paid priority locations second", () => {
    const ranked = rankExploreLocations(
      [
        location("standard"),
        location("priority", { priorityListing: true }),
        location("stamp", { isStampStop: true }),
      ],
      "test-seed",
    );

    expect(ranked.map((candidate) => candidate.id)).toEqual([
      "stamp",
      "priority",
      "standard",
    ]);
  });

  it("uses staff priority and a stable tie-breaker in promoted groups", () => {
    const ranked = rankExploreLocations(
      [
        location("lower", { priorityListing: true, priorityRank: 10 }),
        location("higher", { priorityListing: true, priorityRank: 100 }),
      ],
      "test-seed",
    );

    expect(ranked.map((candidate) => candidate.id)).toEqual([
      "higher",
      "lower",
    ]);
  });

  it("keeps the randomized remainder stable for the same session seed", () => {
    const records = [location("one"), location("two"), location("three")];
    const first = rankExploreLocations(records, "same-seed");
    const second = rankExploreLocations([...records].reverse(), "same-seed");

    expect(second.map((candidate) => candidate.id)).toEqual(
      first.map((candidate) => candidate.id),
    );
  });
});
