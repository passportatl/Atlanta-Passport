import { describe, expect, it } from "vitest";
import { businesses } from "@/data/sample-data";
import type { ExploreLocation } from "@/hooks/useExploreLocations";
import { assessExploreRollout } from "./explore-rollout";

const legacy = businesses[0] as ExploreLocation;

describe("Explore rollout assessment", () => {
  it("blocks rollout when the canonical request fails", () => {
    const snapshot = assessExploreRollout({
      status: "fallback-error",
      legacyCount: 1,
      matchedCount: 0,
      canonicalOnlyCount: 0,
      locations: [{ ...legacy, locationSource: "static-fallback" }],
    });

    expect(snapshot.level).toBe("blocked");
    expect(snapshot.findings).toContain(
      "The canonical location request failed.",
    );
  });

  it("warns while compatibility records or canonical-only records remain", () => {
    const snapshot = assessExploreRollout({
      status: "canonical",
      legacyCount: 2,
      matchedCount: 1,
      canonicalOnlyCount: 1,
      locations: [
        { ...legacy, locationSource: "canonical" },
        { ...legacy, id: "fallback", locationSource: "static-fallback" },
      ],
    });

    expect(snapshot.level).toBe("warning");
    expect(snapshot.legacyCoveragePercent).toBe(50);
    expect(snapshot.fallbackCount).toBe(1);
    expect(snapshot.canonicalOnlyCount).toBe(1);
  });

  it("reports healthy only after complete reconciliation", () => {
    const snapshot = assessExploreRollout({
      status: "canonical",
      legacyCount: 1,
      matchedCount: 1,
      canonicalOnlyCount: 0,
      locations: [
        {
          ...legacy,
          locationSource: "canonical",
          mapReadiness: "verified",
        },
      ],
    });

    expect(snapshot.level).toBe("healthy");
    expect(snapshot.findings).toEqual([]);
    expect(snapshot.legacyCoveragePercent).toBe(100);
  });
});
