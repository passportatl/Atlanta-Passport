import { categoryColor, isDarkColor } from "@/data/sample-data";
import { cn } from "@/lib/utils";

type Props = {
  src?: string;
  name: string;
  category: string;
  className?: string;
  /** larger initials/label for hero usage */
  size?: "sm" | "lg";
};

// Renders a business photo, or a branded placeholder tile (category-colored
// block with the business initials) when no image is available — so listings
// imported without a photo still read as intentional, on-brand cards.
export default function BusinessImage({ src, name, category, className, size = "sm" }: Props) {
  if (src) {
    return <img src={src} alt={name} className={className} />;
  }

  const hex = categoryColor(category);
  const light = isDarkColor(hex);
  const initials = name
    .replace(/^the\s+/i, "")
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center select-none",
        className,
      )}
      style={{ backgroundColor: hex, color: light ? "#FFFFFF" : "#15171c" }}
      role="img"
      aria-label={name}
    >
      <span
        className={cn(
          "font-display leading-none tracking-tight",
          size === "lg" ? "text-6xl md:text-8xl" : "text-2xl",
        )}
      >
        {initials}
      </span>
      <span
        className={cn(
          "font-display uppercase tracking-[0.18em] opacity-80",
          size === "lg" ? "mt-3 text-sm" : "mt-1 text-[8px]",
        )}
      >
        {category}
      </span>
    </div>
  );
}
