import { useState } from "react";
import { MAP_STYLES } from "@/components/BusinessMap";

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
export default function MapSnapshot({ lat, lng, name }: { lat: number; lng: number; name: string }) {
  const [failed, setFailed] = useState(false);
  if (!MAPS_KEY || failed) return null;
  const marker = `markers=${encodeURIComponent(`color:0xa71930|${lat},${lng}`)}`;
  const url =
    `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}` +
    `&zoom=16&size=600x320&scale=2&${marker}&${buildStyleParams()}&key=${MAPS_KEY}`;
  return (
    <div className="mb-5 overflow-hidden rounded-xl border-2 border-foreground">
      <img
        src={url}
        alt={`Map showing ${name} on the Atlanta Passport map`}
        className="block w-full h-auto"
        loading="lazy"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
