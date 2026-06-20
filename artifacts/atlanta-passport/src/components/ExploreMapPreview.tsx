import { useState } from "react";
import { MapPin, Stamp } from "lucide-react";
import { MAP_STYLES } from "@/components/BusinessMap";
import atlantuckyFeatured from "@/assets/images/atlantucky-featured.jpg";
import neighborhoodsMap from "@/assets/images/atl-neighborhoods-map.png";

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

// Real business coordinates (from sample-data) spread across the city so the
// preview map looks populated like the live Explore page.
const PINS: [number, number][] = [
  [33.7531, -84.4016],
  [33.737, -84.3389],
  [33.7343, -84.4257],
  [33.7491, -84.3722],
  [33.75699, -84.36401],
  [33.7469, -84.358],
];

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

function mapUrl(): string | null {
  if (!MAPS_KEY) return null;
  const markers = `markers=${encodeURIComponent(
    "color:0xa71930|" + PINS.map(([a, b]) => `${a},${b}`).join("|"),
  )}`;
  return (
    `https://maps.googleapis.com/maps/api/staticmap?center=33.745,-84.385` +
    `&zoom=12&size=420x760&scale=2&${markers}&${buildStyleParams()}&key=${MAPS_KEY}`
  );
}

const CHIPS = ["All", "Food", "Drinks", "Routes"];

// A phone-framed example of the signed-in Explore page: the branded interactive
// map with business pins, the category filters, and a sample business card.
export default function ExploreMapPreview() {
  const [failed, setFailed] = useState(false);
  const url = mapUrl();
  const showLiveMap = url && !failed;

  return (
    <div className="relative mx-auto w-full max-w-[300px]">
      {/* Phone frame */}
      <div className="relative rounded-[2.5rem] border-4 border-foreground bg-foreground p-2.5 shadow-pop-lg rotate-1">
        {/* Notch */}
        <div className="absolute left-1/2 top-2.5 z-20 h-5 w-24 -translate-x-1/2 rounded-b-2xl bg-foreground" />
        {/* Screen */}
        <div className="relative aspect-[9/19] overflow-hidden rounded-[1.9rem] bg-brand-navy">
          {showLiveMap ? (
            <img
              src={url}
              alt="Atlanta Passport Explore map with business pins"
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
              onError={() => setFailed(true)}
            />
          ) : (
            <img
              src={neighborhoodsMap}
              alt="Atlanta Passport Explore map"
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
            />
          )}

          {/* Filter chips */}
          <div className="absolute left-0 right-0 top-9 z-10 flex flex-wrap gap-1.5 px-3">
            {CHIPS.map((c, i) => (
              <span
                key={c}
                className={`rounded-full border-2 border-foreground px-2.5 py-1 text-[10px] font-display font-black uppercase tracking-wide shadow-pop-sm ${
                  i === 0 ? "bg-brand-yellow text-foreground" : "bg-white text-foreground"
                }`}
              >
                {c}
              </span>
            ))}
          </div>

          {/* Sample business card */}
          <div className="absolute inset-x-3 bottom-3 z-10">
            <div className="card-pop flex items-center gap-3 bg-white p-2.5">
              <img
                src={atlantuckyFeatured}
                alt=""
                aria-hidden="true"
                className="h-12 w-12 shrink-0 rounded-lg border-2 border-foreground object-cover"
              />
              <div className="min-w-0 flex-grow text-left">
                <h4 className="truncate font-serif text-sm font-black leading-tight text-foreground">
                  Atlantucky Brewing
                </h4>
                <p className="flex items-center gap-1 truncate text-[11px] font-medium text-foreground/70">
                  <MapPin className="h-3 w-3 shrink-0" /> Castleberry Hill
                </p>
              </div>
              <span className="flex shrink-0 items-center gap-1 rounded-full border-2 border-foreground bg-brand-yellow px-2 py-1 text-[10px] font-display font-black uppercase text-foreground shadow-pop-sm">
                <Stamp className="h-3 w-3" /> Stamp
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
