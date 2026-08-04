import type { ExploreLocation } from "@/hooks/useExploreLocations";
import {
  locationCategoryLabel,
  locationTagLabel,
  resolveLocationCategoryId,
  toLocationTaxonomyId,
} from "@/data/location-taxonomy";

export type ExploreFilters = {
  query: string;
  areaIds: string[];
  categoryIds: string[];
  tagIds: string[];
};

export type ExploreFilterOption = {
  id: string;
  name: string;
  count: number;
};

export type ExploreFilterOptions = {
  areas: ExploreFilterOption[];
  categories: ExploreFilterOption[];
  tags: ExploreFilterOption[];
};

function locationCategoryId(location: ExploreLocation): string {
  return location.categoryId || resolveLocationCategoryId(location.category);
}

function locationAreaId(location: ExploreLocation): string {
  return location.areaId || toLocationTaxonomyId(location.neighborhood);
}

function locationTagIds(location: ExploreLocation): string[] {
  return location.tags ?? [];
}

export function matchesExploreFilters(
  location: ExploreLocation,
  filters: ExploreFilters,
): boolean {
  const categoryId = locationCategoryId(location);
  const areaId = locationAreaId(location);
  const tagIds = locationTagIds(location);
  const query = filters.query.trim().toLowerCase();

  const matchesCategory =
    filters.categoryIds.length === 0 ||
    filters.categoryIds.includes(categoryId);
  const matchesArea =
    filters.areaIds.length === 0 || filters.areaIds.includes(areaId);
  const matchesTags =
    filters.tagIds.length === 0 ||
    filters.tagIds.some((tagId) => tagIds.includes(tagId));
  const searchText = [
    location.name,
    location.description,
    location.address,
    location.neighborhood,
    locationCategoryLabel(categoryId),
    ...tagIds.map(locationTagLabel),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return (
    matchesCategory &&
    matchesArea &&
    matchesTags &&
    (query === "" || searchText.includes(query))
  );
}

function toOptions(
  counts: Map<string, number>,
  label: (id: string) => string,
): ExploreFilterOption[] {
  return [...counts.entries()]
    .map(([id, count]) => ({ id, name: label(id), count }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getExploreFilterOptions(
  locations: readonly ExploreLocation[],
): ExploreFilterOptions {
  const areaCounts = new Map<string, number>();
  const categoryCounts = new Map<string, number>();
  const tagCounts = new Map<string, number>();

  for (const location of locations) {
    const areaId = locationAreaId(location);
    const categoryId = locationCategoryId(location);
    areaCounts.set(areaId, (areaCounts.get(areaId) ?? 0) + 1);
    categoryCounts.set(categoryId, (categoryCounts.get(categoryId) ?? 0) + 1);
    for (const tagId of locationTagIds(location)) {
      tagCounts.set(tagId, (tagCounts.get(tagId) ?? 0) + 1);
    }
  }

  const areaName = new Map(
    locations.map((location) => [
      locationAreaId(location),
      location.neighborhood,
    ]),
  );

  return {
    areas: toOptions(areaCounts, (id) => areaName.get(id) ?? id),
    categories: toOptions(categoryCounts, locationCategoryLabel),
    tags: toOptions(tagCounts, locationTagLabel),
  };
}
