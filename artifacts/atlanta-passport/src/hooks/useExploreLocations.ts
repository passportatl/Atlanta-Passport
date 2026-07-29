import { useMemo } from "react";
import {
  getListBusinessesQueryKey,
  useListBusinesses,
  type Business,
} from "@workspace/api-client-react";
import { businesses as staticBusinesses } from "@/data/sample-data";
import { STAMP_SLUG } from "@/passport/data";

export type ExploreLocation = (typeof staticBusinesses)[number] & {
  canonicalId?: string;
  canonicalSlug?: string;
  categoryId?: string;
  tags?: string[];
  areaId?: string;
  mapReadiness?: Business["mapReadiness"];
  detailPageEnabled?: boolean;
  priorityListing?: boolean;
  priorityRank?: number;
  locationSource?: "canonical" | "static-fallback";
};

export type ExploreLocationDataStatus =
  | "disabled"
  | "loading"
  | "canonical"
  | "fallback-empty"
  | "fallback-error";

export type ExploreLocationMerge = {
  locations: ExploreLocation[];
  matchedCanonicalCount: number;
  unmatchedCanonicalCount: number;
};

function normalize(value: string | null | undefined): string {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]/g, "");
}

function findCanonicalMatch(
  location: (typeof staticBusinesses)[number],
  canonical: readonly Business[],
): Business | undefined {
  const seededSlug = STAMP_SLUG[location.id];
  return canonical.find(
    (record) =>
      record.slug === seededSlug ||
      record.slug === location.id ||
      normalize(record.name) === normalize(location.name) ||
      (record.address &&
        location.address &&
        normalize(record.address) === normalize(location.address)),
  );
}

export function mergeCanonicalExploreLocations(
  canonical: readonly Business[],
): ExploreLocationMerge {
  const matchedIds = new Set<string>();
  const locations = staticBusinesses.map((location): ExploreLocation => {
    const record = findCanonicalMatch(location, canonical);
    if (!record) {
      return { ...location, locationSource: "static-fallback" };
    }

    matchedIds.add(record.id);
    return {
      ...location,
      name: record.name || location.name,
      neighborhood: record.neighborhood || location.neighborhood,
      description: record.description || location.description,
      address: record.address || location.address || "",
      image: record.image || location.image,
      lat: record.latitude ?? location.lat,
      lng: record.longitude ?? location.lng,
      canonicalId: record.id,
      canonicalSlug: record.slug,
      categoryId: record.categoryId,
      tags: record.tags,
      areaId: record.areaId,
      mapReadiness: record.mapReadiness,
      detailPageEnabled: record.detailPageEnabled,
      priorityListing: record.priorityListing,
      priorityRank: record.priorityRank,
      locationSource: "canonical",
    };
  });

  return {
    locations,
    matchedCanonicalCount: matchedIds.size,
    unmatchedCanonicalCount: canonical.length - matchedIds.size,
  };
}

export function isCanonicalExploreEnabled(
  value = import.meta.env.VITE_EXPLORE_CANONICAL_LOCATIONS,
): boolean {
  return value === "true";
}

export function useExploreLocations() {
  const enabled = isCanonicalExploreEnabled();
  const query = useListBusinesses({
    query: {
      queryKey: getListBusinessesQueryKey(),
      enabled,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  });

  const canonical = (query.data as Business[] | undefined) ?? [];
  const merged = useMemo(
    () => mergeCanonicalExploreLocations(canonical),
    [canonical],
  );

  let status: ExploreLocationDataStatus;
  if (!enabled) status = "disabled";
  else if (query.isPending) status = "loading";
  else if (query.isError) status = "fallback-error";
  else if (canonical.length === 0 || merged.matchedCanonicalCount === 0)
    status = "fallback-empty";
  else status = "canonical";

  const locations =
    status === "canonical"
      ? merged.locations
      : staticBusinesses.map(
          (location): ExploreLocation => ({
            ...location,
            locationSource: "static-fallback",
          }),
        );

  return {
    locations,
    status,
    error: query.error,
    matchedCanonicalCount:
      status === "canonical" ? merged.matchedCanonicalCount : 0,
    unmatchedCanonicalCount:
      status === "canonical"
        ? merged.unmatchedCanonicalCount
        : canonical.length,
  };
}
