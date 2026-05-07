import { Link } from "wouter";
import { cn } from "@/lib/utils";

type Variant = "default" | "stacked" | "inline-light";

export default function Logo({
  variant = "default",
  className,
  asLink = true,
}: {
  variant?: Variant;
  className?: string;
  asLink?: boolean;
}) {
  const blockBase =
    "inline-block bg-brand-yellow text-brand-yellow-foreground border-2 border-foreground/85 px-2.5 py-0.5 leading-none tracking-[0.04em]";

  const content =
    variant === "stacked" ? (
      <span className="inline-flex flex-col gap-1.5 items-start font-display">
        <span className={cn(blockBase, "text-xl sticker")}>ATLANTA</span>
        <span className={cn(blockBase, "text-xl sticker")}>PASSPORT</span>
      </span>
    ) : variant === "inline-light" ? (
      <span className="inline-flex items-center gap-1.5 font-display">
        <span className={cn(blockBase, "text-base sticker")}>ATL</span>
        <span className="text-primary-foreground text-lg tracking-wide font-display">
          PASSPORT
        </span>
      </span>
    ) : (
      <span className="inline-flex items-center gap-1.5 font-display">
        <span className={cn(blockBase, "text-base sticker")}>ATL</span>
        <span className="text-foreground text-lg tracking-wide font-display">
          PASSPORT
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
