import { Clock } from "lucide-react";
import { useLegend } from "@/lib/legend-api";

export function LegendDetail({ slug }: { slug: string }) {
  const query = useLegend(slug);
  const post = query.data;

  if (query.isPending) {
    return <p className="py-8 text-center text-sm">Loading story…</p>;
  }

  if (query.isError || !post) {
    return (
      <div className="card-pop bg-white p-7 text-center">
        <p className="font-display uppercase">Story not found</p>
        <p className="mt-2 text-sm text-foreground/65">
          It may have been archived or is not published yet.
        </p>
      </div>
    );
  }

  const paragraphs =
    post.body?.split(/\n{2,}/).map((paragraph) => paragraph.trim()).filter(Boolean) ??
    [];

  return (
    <article className="card-pop overflow-hidden bg-white">
      {post.heroImage && (
        <img
          src={post.heroImage}
          alt=""
          className="max-h-[26rem] w-full border-b-[3px] border-foreground object-cover"
        />
      )}
      <div className="p-6 sm:p-8">
        <p className="font-display text-[10px] uppercase tracking-[0.16em] text-brand-red">
          {post.category}
        </p>
        <h1 className="mt-2 font-display text-3xl uppercase leading-tight sm:text-4xl">
          {post.title}
        </h1>
        {post.subtitle && (
          <p className="mt-3 text-lg leading-relaxed text-foreground/70">
            {post.subtitle}
          </p>
        )}
        <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs text-foreground/60">
          {post.authorName && <span>By {post.authorName}</span>}
          <time dateTime={post.publishedAt}>
            {new Date(post.publishedAt).toLocaleDateString(undefined, {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </time>
          {post.readingTimeMinutes && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              {post.readingTimeMinutes} min read
            </span>
          )}
        </div>

        <div className="mt-8 space-y-5 text-base leading-8">
          {paragraphs.map((paragraph, index) => (
            <p key={`${index}-${paragraph.slice(0, 24)}`}>{paragraph}</p>
          ))}
        </div>

        {post.tags.length > 0 && (
          <ul className="mt-8 flex flex-wrap gap-2" aria-label="Story topics">
            {post.tags.map((tag) => (
              <li
                key={tag}
                className="rounded-full border-2 border-foreground px-3 py-1 font-display text-[10px] uppercase tracking-wider"
              >
                {tag}
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}
