import { Link } from "wouter";
import { cn } from "@/lib/utils";

type Variant = "default" | "stacked" | "compact";

const tile =
  "inline-flex items-center justify-center bg-brand-yellow text-brand-yellow-foreground border-[3px] border-foreground rounded-[10px] font-display leading-none";

export default function Logo({
  variant = "default",
  className,
  asLink = true,
}: {
  variant?: Variant;
  className?: string;
  asLink?: boolean;
}) {
  const content =
    variant === "stacked" ? (
      <span className="inline-grid gap-1.5 -rotate-1">
        <span className={cn(tile, "px-3 py-1.5 text-xl shadow-pop-sm")}>PASSPORT</span>
        <span className={cn(tile, "px-3 py-1.5 text-xl shadow-pop-sm rotate-[2deg] origin-left")}>
          ATLANTA
        </span>
      </span>
    ) : variant === "compact" ? (
      <span className={cn(tile, "px-2.5 py-1 text-base shadow-pop-sm -rotate-1")}>PASS · ATL</span>
    ) : (
      <span className="inline-flex items-center gap-1 sm:gap-1.5 -rotate-1">
        <span className={cn(tile, "px-2 py-0.5 text-sm sm:px-2.5 sm:py-1 sm:text-base shadow-pop-sm")}>
          PASSPORT
        </span>
        <span
          className={cn(tile, "px-2 py-0.5 text-sm sm:px-2.5 sm:py-1 sm:text-base shadow-pop-sm rotate-[2deg]")}
        >
          ATL
        </span>
      </span>
    );

  if (!asLink) {
    return <span className={className}>{content}</span>;
  }

  return (
    <Link href="/" className={cn("inline-block", className)} aria-label="Atlanta Passport home">
      {content}
    </Link>
  );
}
