import type {
  ExploreLocation,
  ExploreLocationDataStatus,
} from "@/hooks/useExploreLocations";

export type ExploreRolloutLevel =
  | "disabled"
  | "monitoring"
  | "healthy"
  | "warning"
  | "blocked";

export type ExploreRolloutSnapshot = {
  status: ExploreLocationDataStatus;
  level: ExploreRolloutLevel;
  legacyCount: number;
  canonicalCount: number;
  visibleCount: number;
  matchedCount: number;
  fallbackCount: number;
  canonicalOnlyCount: number;
  missingCoordinatesCount: number;
  legacyCoveragePercent: number;
  findings: string[];
};

type ExploreRolloutInput = {
  status: ExploreLocationDataStatus;
  legacyCount: number;
  matchedCount: number;
  canonicalOnlyCount: number;
  locations: readonly ExploreLocation[];
};

export function assessExploreRollout({
  status,
  legacyCount,
  matchedCount,
  canonicalOnlyCount,
  locations,
}: ExploreRolloutInput): ExploreRolloutSnapshot {
  const fallbackCount = locations.filter(
    (location) => location.locationSource === "static-fallback",
  ).length;
  const missingCoordinatesCount = locations.filter(
    (location) => location.mapReadiness === "missing-coordinates",
  ).length;
  const canonicalCount = matchedCount + canonicalOnlyCount;
  const legacyCoveragePercent =
    legacyCount === 0 ? 100 : Math.round((matchedCount / legacyCount) * 100);
  const findings: string[] = [];

  let level: ExploreRolloutLevel;
  if (status === "disabled") {
    level = "disabled";
  } else if (status === "loading") {
    level = "monitoring";
  } else if (status === "fallback-error") {
    level = "blocked";
    findings.push("The canonical location request failed.");
  } else if (status === "fallback-empty") {
    level = "blocked";
    findings.push(
      "The canonical response was empty or matched no legacy records.",
    );
  } else {
    if (fallbackCount > 0) {
      findings.push(
        `${fallbackCount} legacy locations still rely on the compatibility fallback.`,
      );
    }
    if (canonicalOnlyCount > 0) {
      findings.push(
        `${canonicalOnlyCount} canonical locations are not yet mapped into the legacy Explore identity set.`,
      );
    }
    if (missingCoordinatesCount > 0) {
      findings.push(
        `${missingCoordinatesCount} visible locations do not have canonical map coordinates.`,
      );
    }
    level = findings.length === 0 ? "healthy" : "warning";
  }

  return {
    status,
    level,
    legacyCount,
    canonicalCount,
    visibleCount: locations.length,
    matchedCount,
    fallbackCount,
    canonicalOnlyCount,
    missingCoordinatesCount,
    legacyCoveragePercent,
    findings,
  };
}
