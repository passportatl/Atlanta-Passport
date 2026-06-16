import {
  Coffee,
  Wine,
  Bike,
  ShoppingBag,
  Disc,
  Utensils,
  MapPin,
  Lock,
  Music,
  Building2,
  Trees,
  TrainFront,
  Star,
  Flame,
  Home,
  Palette,
  GlassWater,
  Compass,
  Gamepad2,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  coffee: Coffee,
  wine: Wine,
  bike: Bike,
  "shopping-bag": ShoppingBag,
  disc: Disc,
  utensils: Utensils,
  music: Music,
  building: Building2,
  tree: Trees,
  train: TrainFront,
  star: Star,
  flame: Flame,
  home: Home,
  palette: Palette,
  glass: GlassWater,
  compass: Compass,
  gamepad: Gamepad2,
  sparkles: Sparkles,
};

interface Palette {
  bg: string;
  ring: string;
  ink: string;
}

const COLOR_MAP: Record<string, Palette> = {
  yellow:       { bg: "hsl(var(--brand-yellow))", ring: "hsl(var(--foreground))", ink: "hsl(var(--brand-yellow-foreground))" },
  red:          { bg: "hsl(var(--brand-red))",    ring: "hsl(var(--foreground))", ink: "#FFF5D6" },
  lime:         { bg: "#BCF000",                  ring: "hsl(var(--foreground))", ink: "hsl(var(--foreground))" },
  cream:        { bg: "hsl(var(--brand-cream))",  ring: "hsl(var(--foreground))", ink: "hsl(var(--foreground))" },
  navy:         { bg: "hsl(var(--brand-navy))",   ring: "hsl(var(--foreground))", ink: "#FFF5D6" },
  orange:       { bg: "hsl(var(--brand-orange))", ring: "hsl(var(--foreground))", ink: "hsl(var(--foreground))" },
  sky:          { bg: "hsl(var(--brand-sky))",    ring: "hsl(var(--foreground))", ink: "hsl(var(--foreground))" },
  "green-dark": { bg: "#16432B",                  ring: "hsl(var(--foreground))", ink: "#FFF5D6" },
  green:        { bg: "#2C7A3D",                  ring: "hsl(var(--foreground))", ink: "#FFF5D6" },
  black:        { bg: "#141414",                  ring: "hsl(var(--foreground))", ink: "#FFF5D6" },
  "black-yellow": { bg: "#141414",                ring: "hsl(var(--brand-yellow))", ink: "hsl(var(--brand-yellow))" },
  "black-lime": { bg: "#141414",                  ring: "#BCF000", ink: "#BCF000" },
  blue:         { bg: "#1E5DA8",                  ring: "hsl(var(--foreground))", ink: "#FFF5D6" },
  "cream-black":{ bg: "hsl(var(--brand-cream))",  ring: "hsl(var(--foreground))", ink: "hsl(var(--foreground))" },
};

interface Props {
  neighborhood: string;
  iconName?: string;
  // Optional sheet-recovered Stamp Icon image. When present (and not locked) it
  // replaces the generic lucide icon in the stamp center.
  iconUrl?: string;
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
  iconUrl,
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
  // Stable id suffix for SVG defs to avoid collisions when many stamps render
  const idSuffix = neighborhood.replace(/[^a-z0-9]/gi, "-").toLowerCase();
  // Scale arc text down a bit when the label is long
  const topFontSize = upperText.length > 14 ? 11 : 14;

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
          <path id={`arc-top-${idSuffix}`} d="M30,100 A70,70 0 0,1 170,100" fill="none" />
          <path id={`arc-bot-${idSuffix}`} d="M170,100 A70,70 0 0,1 30,100" fill="none" />
        </defs>
        <circle cx="100" cy="100" r="92" fill={palette.bg} stroke={palette.ring} strokeWidth="6" />
        <circle cx="100" cy="100" r="78" fill="none" stroke={palette.ring} strokeWidth="2" strokeDasharray="3 4" />
        <text fill={palette.ink} fontSize={topFontSize} fontFamily="Bungee, sans-serif" letterSpacing="2">
          <textPath href={`#arc-top-${idSuffix}`} startOffset="50%" textAnchor="middle">
            {upperText}
          </textPath>
        </text>
        <text fill={palette.ink} fontSize="11" fontFamily="Bungee, sans-serif" letterSpacing="3">
          <textPath href={`#arc-bot-${idSuffix}`} startOffset="50%" textAnchor="middle">
            {dateLabel ? `${label} • ${dateLabel}` : label}
          </textPath>
        </text>
      </svg>
      <div className="relative flex flex-col items-center justify-center" style={{ color: palette.ink }}>
        {locked ? (
          <Lock className="w-9 h-9" strokeWidth={2.5} />
        ) : iconUrl ? (
          <img
            src={iconUrl}
            alt=""
            className="w-11 h-11 object-contain"
            draggable={false}
          />
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
