import { useState } from "react";
import { BookOpen, Clock, Search } from "lucide-react";
import { Link } from "wouter";
import { useListLegends } from "@workspace/api-client-react";

export function LegendsFeed() {
  const [search, setSearch] = useState("");
  const query = useListLegends(search.trim() ? { search: search.trim() } : undefined);
  const posts = query.data ?? [];

  return (
    <section className="space-y-5">
      <header>
        <p className="font-display text-[11px] uppercase tracking-[0.16em] text-brand-red">
          Stories from the city
        </p>
        <h1 className="mt-1 font-display text-3xl uppercase tracking-wide">
          ATL Legends
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-foreground/70">
          Restaurant features, event spotlights, neighborhood guides, and the
          people shaping Atlanta.
        </p>
      </header>

      <label className="relative block">
        <span className="sr-only">Search ATL Legends</span>
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2"
          aria-hidden="true"
        />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search stories"
          className="w-full rounded-xl border-[3px] border-foreground bg-white py-3 pl-11 pr-4 text-sm shadow-pop-sm outline-none focus:ring-4 focus:ring-brand-yellow/50"
        />
      </label>

      {query.isPending && (
        <p className="py-8 text-center text-sm text-foreground/65">
          Loading Atlanta stories…
        </p>
      )}

      {query.isError && (
        <div className="card-pop bg-white p-6 text-center">
          <p className="font-display uppercase">Stories could not be loaded</p>
          <button
            type="button"
            onClick={() => query.refetch()}
            className="mt-3 font-display text-xs uppercase tracking-wider text-brand-red underline"
          >
            Try again
          </button>
        </div>
      )}

      {!query.isPending && !query.isError && posts.length === 0 && (
        <div className="card-pop bg-white p-7 text-center">
          <BookOpen className="mx-auto h-9 w-9" aria-hidden="true" />
          <p className="mt-3 font-display uppercase">
            {search ? "No matching stories" : "The first Legends are on the way"}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-foreground/65">
            {search
              ? "Try another name, neighborhood, event, or topic."
              : "Passport ATL is preparing its first restaurant features, event spotlights, and neighborhood guides."}
          </p>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        {posts.map((post) => (
          <article
            key={post.id}
            className="card-pop flex min-w-0 flex-col overflow-hidden bg-white"
          >
            {post.heroImage && (
              <img
                src={post.heroImage}
                alt=""
                className="aspect-[16/9] w-full border-b-[3px] border-foreground object-cover"
              />
            )}
            <div className="flex flex-1 flex-col p-5">
              <p className="font-display text-[10px] uppercase tracking-[0.16em] text-brand-red">
                {post.category}
              </p>
              <h2 className="mt-2 font-display text-xl uppercase leading-tight">
                {post.title}
              </h2>
              {post.excerpt && (
                <p className="mt-3 text-sm leading-relaxed text-foreground/70">
                  {post.excerpt}
                </p>
              )}
              <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-5 text-xs text-foreground/60">
                {post.authorName && <span>By {post.authorName}</span>}
                {post.readingTimeMinutes && (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                    {post.readingTimeMinutes} min read
                  </span>
                )}
              </div>
              <Link
                href={`/passport/legends/${post.slug}`}
                className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg border-[3px] border-foreground bg-brand-yellow px-4 font-display text-xs uppercase tracking-wider shadow-pop-sm transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-yellow/50"
              >
                Read story
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
