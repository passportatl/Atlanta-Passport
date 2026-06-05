import { Link } from "wouter";
import { cn } from "@/lib/utils";
import logoSrc from "@/assets/images/passport-atl-logo.png";

type Variant = "default" | "stacked" | "compact" | "xl";

const sizeByVariant: Record<Variant, string> = {
  default: "h-36 w-36",
  stacked: "h-20 w-20",
  compact: "h-9 w-9",
  xl: "h-[120px] w-[120px]",
};

export default function Logo({
  variant = "default",
  className,
  asLink = true,
}: {
  variant?: Variant;
  className?: string;
  asLink?: boolean;
}) {
  const img = (
    <img
      src={logoSrc}
      alt="Passport ATL"
      className={cn(sizeByVariant[variant], "object-contain select-none")}
      draggable={false}
    />
  );

  if (!asLink) {
    return <span className={cn("inline-flex", className)}>{img}</span>;
  }

  return (
    <Link href="/" className={cn("inline-flex", className)} aria-label="Atlanta Passport home">
      {img}
    </Link>
  );
}
