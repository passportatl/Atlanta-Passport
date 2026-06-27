import { Link } from "wouter";
import { cn } from "@/lib/utils";
import logoSrc from "@/assets/images/passport-atl-logo.png";

type Variant = "default" | "stacked" | "compact" | "nav" | "xl" | "mini";

const sizeByVariant: Record<Variant, string> = {
  default: "h-44 w-44",
  stacked: "h-20 w-20",
  compact: "h-9 w-9",
  nav: "h-[124px] w-[124px]",
  xl: "h-[136px] w-[136px]",
  mini: "h-[84px] w-[84px]",
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
      className={cn(sizeByVariant[variant], "max-w-none object-contain select-none")}
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
