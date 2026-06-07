import { categoryColor, isDarkColor } from "@/data/sample-data";
import { cn } from "@/lib/utils";

type Props = {
  category: string;
  className?: string;
};

// A category/Type pill that always renders in that category's site-wide color.
export default function CategoryBadge({ category, className }: Props) {
  const hex = categoryColor(category);
  return (
    <span
      className={cn("badge-sticker", className)}
      style={{
        backgroundColor: hex,
        color: isDarkColor(hex) ? "#FFFFFF" : "#15171c",
      }}
    >
      {category}
    </span>
  );
}
