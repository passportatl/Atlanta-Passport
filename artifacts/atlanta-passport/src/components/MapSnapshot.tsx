import { useState } from "react";
import { MAP_STYLES } from "@/components/BusinessMap";
import { SOCCER_BALL_SRC } from "@/components/SoccerBall";

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

// Convert the in-app map's MapTypeStyle array into Static Maps `style=` params so
// the snapshot matches our dark-navy branded map exactly.
function buildStyleParams(): string {
  return MAP_STYLES.map((s) => {
    const parts: string[] = [];
    if (s.featureType) parts.push(`feature:${s.featureType}`);
    if (s.elementType) parts.push(`element:${s.elementType}`);
    for (const styler of s.stylers ?? []) {
      for (const [key, val] of Object.entries(styler)) {
        if (key === "color") {
          parts.push(`color:0x${String(val).replace("#", "")}`);
        } else {
          parts.push(`${key}:${val}`);
        }
      }
    }
    return `style=${encodeURIComponent(parts.join("|")).replace(/%3A/g, ":").replace(/%7C/g, "|")}`;
  }).join("&");
}

// A static, branded snapshot of a location's marker zoomed in on our map.
// Stamp locations get a soccer-ball marker (overlaid dead-center, since the
// static map is centered on the spot) instead of the default maroon pin.
export default function MapSnapshot({
  lat,
  lng,
  name,
  isStamp = false,
}: {
  lat: number;
  lng: number;
  name: string;
  isStamp?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  if (!MAPS_KEY || failed) return null;
  const marker = isStamp
    ? ""
    : `&markers=${encodeURIComponent(`color:0xa71930|${lat},${lng}`)}`;
  const url =
    `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}` +
    `&zoom=16&size=600x320&scale=2${marker}&${buildStyleParams()}&key=${MAPS_KEY}`;
  return (
    <div className="relative mb-5 overflow-hidden rounded-xl border-2 border-foreground">
      <img
        src={url}
        alt={`Map showing ${name} on the Atlanta Passport map`}
        className="block w-full h-auto"
        loading="lazy"
        onError={() => setFailed(true)}
      />
      {isStamp && (
        <img
          src={SOCCER_BALL_SRC}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 h-9 w-9 -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_2px_3px_rgba(0,0,0,0.45)]"
        />
      )}
    </div>
  );
}
