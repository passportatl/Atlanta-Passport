import type { legendsPostsTable } from "@workspace/db";

type LegendRow = typeof legendsPostsTable.$inferSelect;

export function toLegendSummary(post: LegendRow) {
  return {
    id: post.id,
    slug: post.slug!,
    title: post.title,
    subtitle: post.subtitle,
    excerpt: post.excerpt,
    category: post.category,
    tags: post.tags ?? [],
    authorName: post.authorName,
    authorImage: post.authorImage,
    heroImage: post.heroImage,
    publishedAt: post.publishedAt!,
    isFeatured: post.isFeatured,
    readingTimeMinutes: post.readingTimeMinutes,
  };
}

export function toPublicLegend(post: LegendRow) {
  return {
    ...toLegendSummary(post),
    body: post.body,
    authorBio: post.authorBio,
    galleryImages: post.galleryImages ?? [],
    seoTitle: post.seoTitle,
    seoDescription: post.seoDescription,
    socialPreviewImage: post.socialPreviewImage,
    relatedLocationSlugs: post.relatedLocationSlugs ?? [],
    relatedEventIds: post.relatedEventIds ?? [],
    relatedRouteSlugs: post.relatedRouteSlugs ?? [],
    relatedExperienceSlugs: post.relatedExperienceSlugs ?? [],
  };
}
