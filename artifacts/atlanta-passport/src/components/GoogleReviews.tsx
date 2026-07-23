import { Star, ExternalLink, PenLine } from "lucide-react";

interface GoogleReviewsProps {
  rating: number;
  count: number;
  placeId: string;
  /** Location name for accessible labels. */
  name: string;
}

/**
 * Google reviews summary bar: star rating snapshot, a "write a review"
 * field-style button that opens Google's review dialog, and a link to
 * the full review section on Google.
 */
export default function GoogleReviews({ rating, count, placeId, name }: GoogleReviewsProps) {
  const writeUrl = `https://search.google.com/local/writereview?placeid=${placeId}`;
  const reviewsUrl = `https://search.google.com/local/reviews?placeid=${placeId}`;
  const pct = Math.max(0, Math.min(100, (rating / 5) * 100));

  return (
    <div className="mt-4 rounded-xl border-2 border-foreground shadow-pop-sm bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="font-serif font-bold text-2xl text-foreground leading-none">
          {rating.toFixed(1)}
        </span>
        <span
          className="relative inline-flex"
          role="img"
          aria-label={`Rated ${rating.toFixed(1)} out of 5 stars on Google`}
        >
          <span className="flex text-muted-foreground/40" aria-hidden>
            {[0, 1, 2, 3, 4].map((i) => (
              <Star key={i} className="w-5 h-5" fill="currentColor" strokeWidth={0} />
            ))}
          </span>
          <span
            className="absolute inset-0 flex overflow-hidden text-amber-400"
            style={{ width: `${pct}%` }}
            aria-hidden
          >
            {[0, 1, 2, 3, 4].map((i) => (
              <Star key={i} className="w-5 h-5 shrink-0" fill="currentColor" strokeWidth={0} />
            ))}
          </span>
        </span>
        <a
          href={reviewsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground inline-flex items-center gap-1"
        >
          {count.toLocaleString()} Google reviews
          <ExternalLink className="w-3.5 h-3.5" aria-hidden />
        </a>
      </div>

      <a
        href={writeUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Write a Google review for ${name} (opens Google)`}
        className="mt-3 flex items-center gap-2 w-full rounded-lg border-2 border-foreground/20 bg-background px-3 py-2.5 text-sm text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
      >
        <PenLine className="w-4 h-4 shrink-0" aria-hidden />
        Share your experience — write a review on Google
      </a>
    </div>
  );
}
