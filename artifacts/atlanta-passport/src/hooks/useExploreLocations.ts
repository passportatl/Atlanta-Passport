import { useEffect, useMemo } from "react";
import {
  getListBusinessesQueryKey,
  useListBusinesses,
  type Business,
} from "@workspace/api-client-react";
import { businesses as staticBusinesses } from "@/data/sample-data";
import { STAMP_SLUG } from "@/passport/data";
import {
  resolveLocationCategoryId,
  toLocationTaxonomyId,
} from "@/data/location-taxonomy";
import { assessExploreRollout } from "@/lib/explore-rollout";

export type ExploreLocation = (typeof staticBusinesses)[number] & {
  canonicalId?: string;
  canonicalSlug?: string;
  categoryId?: string;
  tags?: string[];
  areaId?: string;
  mapReadiness?: Business["mapReadiness"];
  isStampStop?: boolean;
  detailPageEnabled?: boolean;
  priorityListing?: boolean;
  priorityRank?: number;
  entitlementStartsAt?: string | null;
  entitlementEndsAt?: string | null;
  sortKey?: string;
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

function legacyTagIds(location: (typeof staticBusinesses)[number]): string[] {
  const categories =
    "categories" in location && Array.isArray(location.categories)
      ? location.categories
      : [location.category];
  return [...new Set(categories.map(toLocationTaxonomyId).filter(Boolean))];
}

function legacyStampStop(location: (typeof staticBusinesses)[number]): boolean {
  return Boolean(
    STAMP_SLUG[location.id] || ("stampSpot" in location && location.stampSpot),
  );
}

export function mergeCanonicalExploreLocations(
  canonical: readonly Business[],
): ExploreLocationMerge {
  const matchedIds = new Set<string>();
  const locations = staticBusinesses.map((location): ExploreLocation => {
    const record = findCanonicalMatch(location, canonical);
    if (!record) {
      return {
        ...location,
        categoryId: resolveLocationCategoryId(location.category),
        tags: legacyTagIds(location),
        areaId: toLocationTaxonomyId(location.neighborhood),
        mapReadiness: "coordinates-present",
        isStampStop: legacyStampStop(location),
        detailPageEnabled: true,
        priorityListing: false,
        priorityRank: 0,
        sortKey: `${location.name.toLocaleLowerCase("en-US")}:${location.id}`,
        locationSource: "static-fallback",
      };
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
      tags: Array.isArray(record.tags) && record.tags.length > 0 ? record.tags : legacyTagIds(location),
      areaId: record.areaId,
      mapReadiness: record.mapReadiness,
      isStampStop: record.isStampStop,
      detailPageEnabled: record.detailPageEnabled,
      priorityListing: record.priorityListing,
      priorityRank: record.priorityRank,
      entitlementStartsAt: record.entitlementStartsAt,
      entitlementEndsAt: record.entitlementEndsAt,
      sortKey: record.sortKey,
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

  const locations = useMemo(
    () =>
      status === "canonical"
        ? merged.locations
        : staticBusinesses.map(
            (location): ExploreLocation => ({
              ...location,
              categoryId: resolveLocationCategoryId(location.category),
              tags: legacyTagIds(location),
              areaId: toLocationTaxonomyId(location.neighborhood),
              mapReadiness: "coordinates-present",
              isStampStop: legacyStampStop(location),
              detailPageEnabled: status === "disabled",
              priorityListing: false,
              priorityRank: 0,
              sortKey: `${location.name.toLocaleLowerCase("en-US")}:${location.id}`,
              locationSource: "static-fallback",
            }),
          ),
    [merged.locations, status],
  );

  const rollout = useMemo(
    () =>
      assessExploreRollout({
        status,
        legacyCount: staticBusinesses.length,
        matchedCount: status === "canonical" ? merged.matchedCanonicalCount : 0,
        canonicalOnlyCount:
          status === "canonical" ? merged.unmatchedCanonicalCount : 0,
        locations,
      }),
    [locations, merged, status],
  );

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    window.dispatchEvent(
      new CustomEvent("passport-atl:explore-rollout", {
        detail: rollout,
      }),
    );
  }, [enabled, rollout]);

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
    rollout,
  };
}
