import { useEffect } from "react";
import { Link } from "wouter";
import {
  APIProvider,
  Map,
  Marker,
  InfoWindow,
  useMap,
  useMapsLibrary,
} from "@vis.gl/react-google-maps";
import { SOCCER_BALL_SRC } from "@/components/SoccerBall";

const ATLANTA_CENTER = { lat: 33.749, lng: -84.388 };
const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

// Dark navy base (#0f2942) with gold roads/labels and red accents to match the
// passport nav bar scheme (red #a71930 + gold #f9c629).
const MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#0f2942" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#e8d9a8" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0a1c2e" }, { weight: 3 }] },
  { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "poi.business", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  {
    featureType: "landscape",
    elementType: "geometry",
    stylers: [{ color: "#0f2942" }],
  },
  {
    featureType: "landscape.man_made",
    elementType: "geometry",
    stylers: [{ color: "#15314f" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#163a4a" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#7fae9a" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#23456b" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#0a1c2e" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#cdb98f" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#f9c629" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#a71930" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#f9c629" }],
  },
  {
    featureType: "road.arterial",
    elementType: "geometry",
    stylers: [{ color: "#2d527c" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0a1c2e" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#5d7da6" }],
  },
  {
    featureType: "administrative",
    elementType: "geometry.stroke",
    stylers: [{ color: "#a71930" }],
  },
  {
    featureType: "administrative.land_parcel",
    stylers: [{ visibility: "off" }],
  },
];

// MARTA heavy-rail lines, approximate station coordinates (south→north / west→east).
// Red + Gold share the trunk from Airport up to Lindbergh, then split (Red → North
// Springs, Gold → Doraville). Blue + Green share the downtown trunk (Ashby →
// Edgewood/Candler Park); Green branches to Bankhead and ends at Edgewood, Blue
// continues east to Indian Creek and west to Hamilton E. Holmes.
const MARTA_TRUNK_NS = [
  { lat: 33.6407, lng: -84.4444 }, // Airport
  { lat: 33.6519, lng: -84.4486 }, // College Park
  { lat: 33.6766, lng: -84.4404 }, // East Point
  { lat: 33.7012, lng: -84.429 }, // Lakewood/Ft. McPherson
  { lat: 33.7177, lng: -84.4254 }, // Oakland City
  { lat: 33.7356, lng: -84.4136 }, // West End
  { lat: 33.7478, lng: -84.3924 }, // Garnett
  { lat: 33.7539, lng: -84.3915 }, // Five Points
  { lat: 33.7592, lng: -84.3875 }, // Peachtree Center
  { lat: 33.7669, lng: -84.3874 }, // Civic Center
  { lat: 33.7716, lng: -84.3866 }, // North Avenue
  { lat: 33.7813, lng: -84.3862 }, // Midtown
  { lat: 33.7892, lng: -84.3872 }, // Arts Center
  { lat: 33.8231, lng: -84.3692 }, // Lindbergh Center
];

const MARTA_TRUNK_EW = [
  { lat: 33.7564, lng: -84.4176 }, // Ashby
  { lat: 33.7565, lng: -84.4054 }, // Vine City
  { lat: 33.757, lng: -84.396 }, // GWCC/CNN Center
  { lat: 33.7539, lng: -84.3915 }, // Five Points
  { lat: 33.7503, lng: -84.3858 }, // Georgia State
  { lat: 33.7501, lng: -84.3766 }, // King Memorial
  { lat: 33.757, lng: -84.3526 }, // Inman Park/Reynoldstown
  { lat: 33.7617, lng: -84.3393 }, // Edgewood/Candler Park
];

const MARTA_LINES: { name: string; color: string; path: { lat: number; lng: number }[] }[] = [
  {
    name: "Gold",
    color: "#FDB913",
    path: [
      ...MARTA_TRUNK_NS,
      { lat: 33.8459, lng: -84.358 }, // Lenox
      { lat: 33.8602, lng: -84.3393 }, // Brookhaven/Oglethorpe
      { lat: 33.8877, lng: -84.3057 }, // Chamblee
      { lat: 33.9028, lng: -84.2802 }, // Doraville
    ],
  },
  {
    name: "Red",
    color: "#E0001B",
    path: [
      ...MARTA_TRUNK_NS,
      { lat: 33.8479, lng: -84.3674 }, // Buckhead
      { lat: 33.9123, lng: -84.3516 }, // Medical Center
      { lat: 33.9214, lng: -84.3447 }, // Dunwoody
      { lat: 33.9319, lng: -84.3516 }, // Sandy Springs
      { lat: 33.9453, lng: -84.3573 }, // North Springs
    ],
  },
  {
    name: "Green",
    color: "#00A94F",
    path: [
      { lat: 33.772, lng: -84.4258 }, // Bankhead
      ...MARTA_TRUNK_EW,
    ],
  },
  {
    name: "Blue",
    color: "#0067B1",
    path: [
      { lat: 33.7547, lng: -84.4694 }, // Hamilton E. Holmes
      { lat: 33.753, lng: -84.4459 }, // West Lake
      ...MARTA_TRUNK_EW,
      { lat: 33.7651, lng: -84.3132 }, // East Lake
      { lat: 33.7748, lng: -84.2963 }, // Decatur
      { lat: 33.7752, lng: -84.2799 }, // Avondale
      { lat: 33.7723, lng: -84.2496 }, // Kensington
      { lat: 33.769, lng: -84.2295 }, // Indian Creek
    ],
  },
];

// Unique MARTA stations (deduped across all lines; true coordinates, no line offset).
const MARTA_STATIONS: { lat: number; lng: number }[] = (() => {
  const seen = new Set<string>();
  const out: { lat: number; lng: number }[] = [];
  for (const line of MARTA_LINES) {
    for (const p of line.path) {
      const key = `${p.lat},${p.lng}`;
      if (!seen.has(key)) {
        seen.add(key);
        out.push(p);
      }
    }
  }
  return out;
})();

// MARTA station badge — blue roundel with a white "M", white ring for contrast on
// the dark map. Inline SVG data URI so it ships without an extra asset request.
const MARTA_ICON_SRC =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26">` +
      `<circle cx="13" cy="13" r="11" fill="#0067B1" stroke="#ffffff" stroke-width="2.5"/>` +
      `<text x="13" y="18" font-family="Arial, Helvetica, sans-serif" font-size="14" font-weight="700" fill="#ffffff" text-anchor="middle">M</text>` +
      `</svg>`,
  );

export type MapBusiness = {
  id: string;
  name: string;
  neighborhood: string;
  category: string;
  lat: number;
  lng: number;
  sponsorTier?: string;
};

const BALL_ICON_URL = SOCCER_BALL_SRC;

function BusinessMarkers({
  businesses,
  onSelect,
}: {
  businesses: MapBusiness[];
  onSelect: (id?: string) => void;
}) {
  const coreLib = useMapsLibrary("core");

  const ballIcon = coreLib
    ? {
        url: BALL_ICON_URL,
        scaledSize: new coreLib.Size(44, 44),
        anchor: new coreLib.Point(22, 22),
      }
    : undefined;

  return (
    <>
      {businesses.map((b) => (
        <Marker
          key={b.id}
          position={{ lat: b.lat, lng: b.lng }}
          title={b.name}
          onClick={() => onSelect(b.id)}
          icon={b.sponsorTier === "Founding Sponsor" ? ballIcon : undefined}
        />
      ))}
    </>
  );
}

function PanToSelected({ selected }: { selected?: MapBusiness }) {
  const map = useMap();
  useEffect(() => {
    if (!map || !selected) return;
    map.panTo({ lat: selected.lat, lng: selected.lng });
    if ((map.getZoom() ?? 0) < 14) map.setZoom(15);
  }, [map, selected]);
  return null;
}

// Draws the highlighted route line connecting its stops in order and fits the
// map to it. Rendered only when a route is selected; cleans the line up on
// deselection or route change.
function RoutePath({ path }: { path: { lat: number; lng: number }[] }) {
  const map = useMap();
  const mapsLib = useMapsLibrary("maps");

  useEffect(() => {
    if (!map || !mapsLib || path.length < 1) return;

    const polyline =
      path.length >= 2
        ? new mapsLib.Polyline({
            path,
            geodesic: true,
            strokeColor: "#f9c629",
            strokeOpacity: 0.95,
            strokeWeight: 4,
            map,
          })
        : null;

    const bounds = new google.maps.LatLngBounds();
    path.forEach((p) => bounds.extend(p));
    map.fitBounds(bounds, 64);
    if (path.length === 1 && (map.getZoom() ?? 0) > 15) map.setZoom(15);

    return () => {
      polyline?.setMap(null);
    };
  }, [map, mapsLib, path]);

  return null;
}

const MARTA_LINE_WEIGHT = 4;
// Half-line perpendicular offset (degrees lng) for the shared Red/Gold trunk,
// tuned so the two half-width lines sit flush at the map's default zoom — together
// they read as one full-width line that's red on one side, gold on the other.
const MARTA_SPLIT_OFFSET = 0.00035;

const MARTA_LINE_COLORS = Object.fromEntries(
  MARTA_LINES.map((l) => [l.name, l.color]),
) as Record<string, string>;

// Draws the four MARTA heavy-rail lines in their official colors. The Red and Gold
// lines share the N-S trunk (Airport→Lindbergh): there it's drawn as a lengthwise
// two-tone stripe (red half + gold half), splitting into solid branches north of
// Lindbergh. Mounted once with the map; cleans its polylines up on unmount.
function MartaRailLines() {
  const map = useMap();
  const mapsLib = useMapsLibrary("maps");

  useEffect(() => {
    if (!map || !mapsLib) return;

    const lines: google.maps.Polyline[] = [];
    const draw = (
      path: { lat: number; lng: number }[],
      color: string,
      weight: number,
      zIndex: number,
    ) => {
      lines.push(
        new mapsLib.Polyline({
          path,
          geodesic: true,
          strokeColor: color,
          strokeOpacity: 0.95,
          strokeWeight: weight,
          zIndex,
          map,
        }),
      );
    };

    // Blue + Green full lines (Green overlaps Blue on the shared E-W trunk).
    for (const name of ["Blue", "Green"]) {
      const line = MARTA_LINES.find((l) => l.name === name);
      if (line) draw(line.path, line.color, MARTA_LINE_WEIGHT, 3);
    }

    // Red/Gold shared N-S trunk as a lengthwise two-tone stripe: two half-width
    // lines nudged to opposite sides of the centerline.
    const redTrunk = MARTA_TRUNK_NS.map((p) => ({
      lat: p.lat,
      lng: p.lng - MARTA_SPLIT_OFFSET,
    }));
    const goldTrunk = MARTA_TRUNK_NS.map((p) => ({
      lat: p.lat,
      lng: p.lng + MARTA_SPLIT_OFFSET,
    }));
    draw(redTrunk, MARTA_LINE_COLORS.Red, MARTA_LINE_WEIGHT / 2, 5);
    draw(goldTrunk, MARTA_LINE_COLORS.Gold, MARTA_LINE_WEIGHT / 2, 5);

    // Solid branches north of Lindbergh (prepend Lindbergh so they join the trunk).
    const lindbergh = MARTA_TRUNK_NS[MARTA_TRUNK_NS.length - 1];
    const redLine = MARTA_LINES.find((l) => l.name === "Red");
    const goldLine = MARTA_LINES.find((l) => l.name === "Gold");
    if (redLine) {
      draw(
        [lindbergh, ...redLine.path.slice(MARTA_TRUNK_NS.length)],
        redLine.color,
        MARTA_LINE_WEIGHT,
        5,
      );
    }
    if (goldLine) {
      draw(
        [lindbergh, ...goldLine.path.slice(MARTA_TRUNK_NS.length)],
        goldLine.color,
        MARTA_LINE_WEIGHT,
        5,
      );
    }

    return () => lines.forEach((l) => l.setMap(null));
  }, [map, mapsLib]);

  return null;
}

// Places a small MARTA roundel at every station. Non-interactive so it never
// steals clicks from business pins or the map's deselect handler.
function MartaStationMarkers() {
  const coreLib = useMapsLibrary("core");

  const icon = coreLib
    ? {
        url: MARTA_ICON_SRC,
        scaledSize: new coreLib.Size(18, 18),
        anchor: new coreLib.Point(9, 9),
      }
    : undefined;

  if (!icon) return null;

  return (
    <>
      {MARTA_STATIONS.map((s) => (
        <Marker
          key={`marta-${s.lat}-${s.lng}`}
          position={s}
          icon={icon}
          clickable={false}
          zIndex={2}
        />
      ))}
    </>
  );
}

export default function BusinessMap({
  businesses,
  selectedId,
  onSelect,
  routePath,
}: {
  businesses: MapBusiness[];
  selectedId?: string;
  onSelect: (id?: string) => void;
  routePath?: { lat: number; lng: number }[];
}) {
  if (!API_KEY) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#0b0f1a] p-6 text-center">
        <p className="text-sm text-brand-cream/80">
          Map unavailable — a Google Maps API key is required to display the
          interactive map.
        </p>
      </div>
    );
  }

  const selected = businesses.find((b) => b.id === selectedId);

  return (
    <APIProvider apiKey={API_KEY}>
      <Map
        defaultCenter={ATLANTA_CENTER}
        defaultZoom={12}
        gestureHandling="cooperative"
        scrollwheel={false}
        disableDefaultUI={true}
        zoomControl={true}
        clickableIcons={false}
        styles={MAP_STYLES}
        className="h-full w-full"
        style={{ width: "100%", height: "100%" }}
        onClick={() => onSelect(undefined)}
      >
        <MartaRailLines />
        <MartaStationMarkers />

        <BusinessMarkers businesses={businesses} onSelect={onSelect} />

        {selected && (
          <InfoWindow
            position={{ lat: selected.lat, lng: selected.lng }}
            pixelOffset={[0, -34]}
            onCloseClick={() => onSelect(undefined)}
          >
            <div className="min-w-[170px] p-1">
              <div className="text-sm font-bold text-[#15171c]">
                {selected.name}
              </div>
              <div className="mb-1.5 text-xs text-gray-500">
                {selected.neighborhood} · {selected.category}
              </div>
              <Link
                href={`/listing/${selected.id}`}
                className="text-xs font-semibold text-[#a71930] hover:underline"
              >
                View details →
              </Link>
            </div>
          </InfoWindow>
        )}

        {routePath && routePath.length > 0 && <RoutePath path={routePath} />}

        <PanToSelected selected={selected} />
      </Map>
    </APIProvider>
  );
}
