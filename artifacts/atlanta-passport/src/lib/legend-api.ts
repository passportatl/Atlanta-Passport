import { useQuery } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";

export type LegendSummary = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  excerpt: string | null;
  category: string;
  tags: string[];
  authorName: string | null;
  authorImage: string | null;
  heroImage: string | null;
  publishedAt: string;
  isFeatured: boolean;
  readingTimeMinutes: number | null;
};

export type Legend = LegendSummary & {
  body: string | null;
  authorBio: string | null;
  galleryImages: string[];
  seoTitle: string | null;
  seoDescription: string | null;
  socialPreviewImage: string | null;
  relatedLocationSlugs: string[];
  relatedEventIds: string[];
  relatedRouteSlugs: string[];
  relatedExperienceSlugs: string[];
};

export function useLegends(search?: string) {
  const normalizedSearch = search?.trim() ?? "";
  return useQuery({
    queryKey: ["legends", normalizedSearch],
    queryFn: () =>
      customFetch<LegendSummary[]>(
        `/api/legends${
          normalizedSearch
            ? `?search=${encodeURIComponent(normalizedSearch)}`
            : ""
        }`,
        { responseType: "json" },
      ),
  });
}

export function useLegend(slug: string) {
  return useQuery({
    queryKey: ["legends", slug],
    queryFn: () =>
      customFetch<Legend>(`/api/legends/${encodeURIComponent(slug)}`, {
        responseType: "json",
      }),
    enabled: Boolean(slug),
  });
}
