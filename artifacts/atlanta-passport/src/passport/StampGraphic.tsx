import {
  Coffee,
  Wine,
  Bike,
  ShoppingBag,
  Disc,
  Utensils,
  MapPin,
  Lock,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  coffee: Coffee,
  wine: Wine,
  bike: Bike,
  "shopping-bag": ShoppingBag,
  disc: Disc,
  utensils: Utensils,
};

const COLOR_MAP: Record<string, { bg: string; ring: string; ink: string }> = {
  yellow: { bg: "hsl(var(--brand-yellow))", ring: "hsl(var(--foreground))", ink: "hsl(var(--brand-yellow-foreground))" },
  red:    { bg: "hsl(var(--brand-red))",    ring: "hsl(var(--foreground))", ink: "#FFF5D6" },
  lime:   { bg: "hsl(var(--brand-lime))",   ring: "hsl(var(--foreground))", ink: "hsl(var(--foreground))" },
  cream:  { bg: "hsl(var(--brand-cream))",  ring: "hsl(var(--foreground))", ink: "hsl(var(--foreground))" },
  navy:   { bg: "hsl(var(--brand-navy))",   ring: "hsl(var(--foreground))", ink: "#FFF5D6" },
  orange: { bg: "hsl(var(--brand-orange))", ring: "hsl(var(--foreground))", ink: "hsl(var(--foreground))" },
  sky:    { bg: "hsl(var(--brand-sky))",    ring: "hsl(var(--foreground))", ink: "hsl(var(--foreground))" },
};

interface Props {
  neighborhood: string;
  iconName?: string;
  color?: string;
  size?: number;
  locked?: boolean;
  collectedAt?: string | Date;
  rotate?: number;
  label?: string;
}

export function StampGraphic({
  neighborhood,
  iconName = "coffee",
  color = "yellow",
  size = 168,
  locked = false,
  collectedAt,
  rotate = -4,
  label = "EXPLORED",
}: Props) {
  const palette = COLOR_MAP[color] ?? COLOR_MAP.yellow!;
  const Icon = ICON_MAP[iconName] ?? MapPin;

  const dateLabel = collectedAt
    ? new Date(collectedAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "2-digit",
      })
    : null;

  const upperText = neighborhood.toUpperCase();

  return (
    <div
      className="relative inline-flex items-center justify-center select-none"
      style={{
        width: size,
        height: size,
        transform: `rotate(${rotate}deg)`,
        filter: locked ? "grayscale(1) opacity(0.45)" : undefined,
      }}
    >
      <svg viewBox="0 0 200 200" width={size} height={size} className="absolute inset-0">
        <defs>
          <path id={`arc-top-${neighborhood}`} d="M30,100 A70,70 0 0,1 170,100" fill="none" />
          <path id={`arc-bot-${neighborhood}`} d="M170,100 A70,70 0 0,1 30,100" fill="none" />
        </defs>
        <circle cx="100" cy="100" r="92" fill={palette.bg} stroke={palette.ring} strokeWidth="6" />
        <circle cx="100" cy="100" r="78" fill="none" stroke={palette.ring} strokeWidth="2" strokeDasharray="3 4" />
        <text fill={palette.ink} fontSize="14" fontFamily="Bungee, sans-serif" letterSpacing="2">
          <textPath href={`#arc-top-${neighborhood}`} startOffset="50%" textAnchor="middle">
            {upperText}
          </textPath>
        </text>
        <text fill={palette.ink} fontSize="11" fontFamily="Bungee, sans-serif" letterSpacing="3">
          <textPath href={`#arc-bot-${neighborhood}`} startOffset="50%" textAnchor="middle">
            {dateLabel ? `${label} • ${dateLabel}` : label}
          </textPath>
        </text>
      </svg>
      <div className="relative flex flex-col items-center justify-center" style={{ color: palette.ink }}>
        {locked ? (
          <Lock className="w-9 h-9" strokeWidth={2.5} />
        ) : (
          <Icon className="w-9 h-9" strokeWidth={2.5} />
        )}
        <div
          className="mt-1 text-[10px] tracking-widest font-black"
          style={{ fontFamily: "Bungee, sans-serif" }}
        >
          ATL
        </div>
      </div>
    </div>
  );
}
