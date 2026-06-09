import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import {
  TrainFront,
  Spline,
  Layers,
  MapPin,
  LocateFixed,
  Plus,
  Minus,
} from "lucide-react";
import {
  APIProvider,
  Map,
  Marker,
  InfoWindow,
  useMap,
  useMapsLibrary,
} from "@vis.gl/react-google-maps";
import { SOCCER_BALL_SRC } from "@/components/SoccerBall";
import { neighborhoodColors, categoryColor, businessCategories } from "@/data/sample-data";

const ATLANTA_CENTER = { lat: 33.749, lng: -84.388 };
const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

// Dark navy base (#0f2942) with cream roads/labels and red accents to match the
// passport nav bar scheme (red #a71930 + cream #fff3d6). The brand yellow is
// reserved for the highlighted route line only.
const MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#0f2942" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#fff3d6" }] },
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
    stylers: [{ color: "#ffffff" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#0a1c2e" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#fff3d6" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#fff3d6" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#a71930" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#fff3d6" }],
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
  { lat: 33.6407, lng: -84.4444, name: "Airport" },
  { lat: 33.6519, lng: -84.4486, name: "College Park" },
  { lat: 33.6766, lng: -84.4404, name: "East Point" },
  { lat: 33.7012, lng: -84.429, name: "Lakewood/Ft. McPherson" },
  { lat: 33.7177, lng: -84.4254, name: "Oakland City" },
  { lat: 33.7356, lng: -84.4136, name: "West End" },
  { lat: 33.7478, lng: -84.3924, name: "Garnett" },
  { lat: 33.7539, lng: -84.3915, name: "Five Points" },
  { lat: 33.7592, lng: -84.3875, name: "Peachtree Center" },
  { lat: 33.7669, lng: -84.3874, name: "Civic Center" },
  { lat: 33.7716, lng: -84.3866, name: "North Avenue" },
  { lat: 33.7813, lng: -84.3862, name: "Midtown" },
  { lat: 33.7892, lng: -84.3872, name: "Arts Center" },
  { lat: 33.8231, lng: -84.3692, name: "Lindbergh Center" },
];

const MARTA_TRUNK_EW = [
  { lat: 33.7564, lng: -84.4176, name: "Ashby" },
  { lat: 33.7565, lng: -84.4054, name: "Vine City" },
  { lat: 33.757, lng: -84.396, name: "GWCC/CNN Center" },
  { lat: 33.7539, lng: -84.3915, name: "Five Points" },
  { lat: 33.7503, lng: -84.3858, name: "Georgia State" },
  { lat: 33.7501, lng: -84.3766, name: "King Memorial" },
  { lat: 33.757, lng: -84.3526, name: "Inman Park/Reynoldstown" },
  { lat: 33.7617, lng: -84.3393, name: "Edgewood/Candler Park" },
];

const MARTA_LINES: {
  name: string;
  color: string;
  path: { lat: number; lng: number; name?: string }[];
}[] = [
  {
    name: "Gold",
    color: "#FDB913",
    path: [
      ...MARTA_TRUNK_NS,
      { lat: 33.8459, lng: -84.358, name: "Lenox" },
      { lat: 33.8602, lng: -84.3393, name: "Brookhaven/Oglethorpe" },
      { lat: 33.8877, lng: -84.3057, name: "Chamblee" },
      { lat: 33.9028, lng: -84.2802, name: "Doraville" },
    ],
  },
  {
    name: "Red",
    color: "#E0001B",
    path: [
      ...MARTA_TRUNK_NS,
      { lat: 33.8479, lng: -84.3674, name: "Buckhead" },
      { lat: 33.9123, lng: -84.3516, name: "Medical Center" },
      { lat: 33.9214, lng: -84.3447, name: "Dunwoody" },
      { lat: 33.9319, lng: -84.3516, name: "Sandy Springs" },
      { lat: 33.9453, lng: -84.3573, name: "North Springs" },
    ],
  },
  {
    name: "Green",
    color: "#00A94F",
    path: [
      { lat: 33.772, lng: -84.4258, name: "Bankhead" },
      ...MARTA_TRUNK_EW,
    ],
  },
  {
    name: "Blue",
    color: "#0067B1",
    path: [
      { lat: 33.7547, lng: -84.4694, name: "Hamilton E. Holmes" },
      { lat: 33.753, lng: -84.4459, name: "West Lake" },
      ...MARTA_TRUNK_EW,
      { lat: 33.7651, lng: -84.3132, name: "East Lake" },
      { lat: 33.7748, lng: -84.2963, name: "Decatur" },
      { lat: 33.7752, lng: -84.2799, name: "Avondale" },
      { lat: 33.7723, lng: -84.2496, name: "Kensington" },
      { lat: 33.769, lng: -84.2295, name: "Indian Creek" },
    ],
  },
];

// Unique MARTA stations (deduped across all lines; true coordinates, no line offset).
const MARTA_STATIONS: { lat: number; lng: number; name?: string }[] = (() => {
  const seen = new Set<string>();
  const out: { lat: number; lng: number; name?: string }[] = [];
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
  categories?: string[];
  lat: number;
  lng: number;
  sponsorTier?: string;
  offer?: string;
};

const BALL_ICON_URL = SOCCER_BALL_SRC;

// Build a category-colored dot marker as an inline SVG data URL. A single
// category renders a solid circle; multiple categories split the circle into
// equal pie slices (two categories = left/right halves) so every category a
// business belongs to is represented on the map.
function dotIconSvg(colors: string[], size = 18): string {
  const r = size / 2;
  const c = size / 2;
  const rr = r - 0.75;
  let shapes = "";
  if (colors.length <= 1) {
    shapes = `<circle cx="${c}" cy="${c}" r="${rr}" fill="${colors[0] ?? "#475569"}"/>`;
  } else {
    const n = colors.length;
    const slice = 360 / n;
    for (let i = 0; i < n; i++) {
      const a0 = ((-90 + i * slice) * Math.PI) / 180;
      const a1 = ((-90 + (i + 1) * slice) * Math.PI) / 180;
      const x0 = (c + rr * Math.cos(a0)).toFixed(3);
      const y0 = (c + rr * Math.sin(a0)).toFixed(3);
      const x1 = (c + rr * Math.cos(a1)).toFixed(3);
      const y1 = (c + rr * Math.sin(a1)).toFixed(3);
      const largeArc = slice > 180 ? 1 : 0;
      shapes += `<path d="M${c} ${c} L${x0} ${y0} A${rr} ${rr} 0 ${largeArc} 1 ${x1} ${y1} Z" fill="${colors[i]}"/>`;
    }
  }
  const border = `<circle cx="${c}" cy="${c}" r="${rr}" fill="none" stroke="#1a1a1a" stroke-width="1.5"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${shapes}${border}</svg>`;
}

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
        scaledSize: new coreLib.Size(18, 18),
        anchor: new coreLib.Point(9, 9),
      }
    : undefined;

  const dotIcon = (b: MapBusiness) => {
    if (!coreLib) return undefined;
    const colors = businessCategories(b).map(categoryColor);
    return {
      url: "data:image/svg+xml," + encodeURIComponent(dotIconSvg(colors, 18)),
      scaledSize: new coreLib.Size(18, 18),
      anchor: new coreLib.Point(9, 9),
    };
  };

  return (
    <>
      {businesses.map((b) => (
        <Marker
          key={b.id}
          position={{ lat: b.lat, lng: b.lng }}
          title={b.name}
          onClick={() => onSelect(b.id)}
          icon={b.offer ? ballIcon : dotIcon(b)}
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
function RoutePath({
  path,
  travelMode = "WALKING",
}: {
  path: { lat: number; lng: number }[];
  travelMode?: "WALKING" | "BICYCLING";
}) {
  const map = useMap();
  const mapsLib = useMapsLibrary("maps");
  const routesLib = useMapsLibrary("routes");

  useEffect(() => {
    if (!map || !mapsLib || path.length < 1) return;

    let cancelled = false;
    const polylines: google.maps.Polyline[] = [];

    // Draw the brand route line (black underlay + solid yellow stroke) along the
    // given point list.
    const draw = (linePath: { lat: number; lng: number }[]) => {
      if (cancelled) return;
      polylines.push(
        new mapsLib.Polyline({
          path: linePath,
          geodesic: true,
          strokeColor: "#1a1a1a",
          strokeOpacity: 0.5,
          strokeWeight: 7,
          zIndex: 7,
          map,
        }),
        new mapsLib.Polyline({
          path: linePath,
          geodesic: true,
          strokeColor: "#f9c629",
          strokeOpacity: 1,
          strokeWeight: 4,
          zIndex: 8,
          map,
        }),
      );
    };

    // Tight padding so the traced route fills the map area instead of sitting
    // small in the middle.
    const fitTo = (pts: { lat: number; lng: number }[]) => {
      if (cancelled) return;
      const bounds = new google.maps.LatLngBounds();
      pts.forEach((p) => bounds.extend(p));
      map.fitBounds(bounds, 24);
      if (pts.length === 1 && (map.getZoom() ?? 0) > 15) map.setZoom(15);
    };

    // A single stop: nothing to connect, just frame it.
    if (path.length < 2) {
      fitTo(path);
      return () => {
        cancelled = true;
        polylines.forEach((p) => p.setMap(null));
      };
    }

    const drawStraight = () => {
      draw(path);
      fitTo(path);
    };

    // Trace the real walking/biking route along roads + trails via the
    // Directions service. Falls back to a straight connector if it's
    // unavailable (Directions API not enabled, no route found, quota, etc.).
    if (routesLib) {
      const service = new routesLib.DirectionsService();
      service
        .route({
          origin: path[0],
          destination: path[path.length - 1],
          waypoints: path
            .slice(1, -1)
            .map((location) => ({ location, stopover: true })),
          travelMode:
            google.maps.TravelMode[travelMode] ??
            google.maps.TravelMode.WALKING,
          optimizeWaypoints: false,
        })
        .then((result) => {
          if (cancelled) return;
          const overview = result.routes[0]?.overview_path;
          if (overview && overview.length > 1) {
            draw(overview.map((p) => ({ lat: p.lat(), lng: p.lng() })));
            const bounds = result.routes[0].bounds;
            if (bounds) map.fitBounds(bounds, 24);
            else fitTo(path);
          } else {
            drawStraight();
          }
        })
        .catch(() => {
          drawStraight();
        });
    } else {
      drawStraight();
    }

    return () => {
      cancelled = true;
      polylines.forEach((p) => p.setMap(null));
    };
  }, [map, mapsLib, routesLib, path, travelMode]);

  return null;
}

// Live "you are here" blue dot driven by the browser Geolocation API. Active
// only after the user opts in (taps the "Me" control), which is also what
// triggers the permission prompt. Re-centers the map once on the first fix,
// then keeps tracking as the user moves.
function UserLocationMarker({
  active,
  onError,
}: {
  active: boolean;
  onError: () => void;
}) {
  const map = useMap();
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const didCenter = useRef(false);

  useEffect(() => {
    if (!active) {
      setPos(null);
      didCenter.current = false;
      return;
    }
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      onError();
      return;
    }
    const watchId = navigator.geolocation.watchPosition(
      (p) => {
        const next = { lat: p.coords.latitude, lng: p.coords.longitude };
        setPos(next);
        if (!didCenter.current && map) {
          map.panTo(next);
          if ((map.getZoom() ?? 0) < 14) map.setZoom(15);
          didCenter.current = true;
        }
      },
      () => onError(),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [active, map, onError]);

  if (!pos) return null;

  return (
    <Marker
      position={pos}
      zIndex={9999}
      title="Your location"
      icon={{
        path: google.maps.SymbolPath.CIRCLE,
        scale: 7,
        fillColor: "#1a73e8",
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 3,
      }}
    />
  );
}

const MARTA_LINE_WEIGHT = 4;

const MARTA_LINE_COLORS = Object.fromEntries(
  MARTA_LINES.map((l) => [l.name, l.color]),
) as Record<string, string>;

// Approximate Atlanta Beltline loop (intown 22-mile corridor), traced clockwise
// from Ponce City Market down the Eastside Trail, around the Southside, up the
// Westside, and back across the north. A stylized highlight, not a survey line.
const BELTLINE_PATH = [
  { lat: 33.7726, lng: -84.3656 }, // Ponce City Market
  { lat: 33.767, lng: -84.364 }, // Old Fourth Ward
  { lat: 33.76, lng: -84.3625 }, // Inman Park
  { lat: 33.7545, lng: -84.3637 }, // Krog Street Market
  { lat: 33.749, lng: -84.362 }, // Reynoldstown
  { lat: 33.743, lng: -84.356 }, // Glenwood Park
  { lat: 33.735, lng: -84.359 }, // Boulevard Crossing
  { lat: 33.725, lng: -84.368 }, // Toward Chosewood
  { lat: 33.718, lng: -84.376 }, // Chosewood Park
  { lat: 33.717, lng: -84.388 }, // Southside Trail
  { lat: 33.722, lng: -84.399 }, // Pittsburgh
  { lat: 33.73, lng: -84.413 }, // Adair Park
  { lat: 33.738, lng: -84.418 }, // West End
  { lat: 33.747, lng: -84.42 }, // Washington Park
  { lat: 33.756, lng: -84.418 }, // Ashby
  { lat: 33.768, lng: -84.415 }, // Westside / Bankhead
  { lat: 33.778, lng: -84.412 }, // Huff Rd
  { lat: 33.788, lng: -84.406 }, // Northwest
  { lat: 33.798, lng: -84.398 }, // Tanyard Creek
  { lat: 33.805, lng: -84.387 }, // Atlanta Memorial Park
  { lat: 33.803, lng: -84.376 }, // Toward Piedmont
  { lat: 33.792, lng: -84.37 }, // Piedmont Park (north)
  { lat: 33.786, lng: -84.369 }, // Piedmont Park
  { lat: 33.78, lng: -84.367 }, // Park Drive
  { lat: 33.7726, lng: -84.3656 }, // Close loop at Ponce City Market
];

// Approximate footprints for each neighborhood in the Explore "Area" filter, drawn
// as semi-transparent color overlays for orientation. Colors mirror the brand
// tokens used on each neighborhood card (yellow/red/sky/lime). Rough quadrilaterals,
// not legal boundaries.
const NB_COLOR = {
  yellow: "#F9C61F",
  red: "#D9262A",
  sky: "#5CADD6",
  lime: "#BCF000",
} as const;

const NEIGHBORHOOD_AREAS: {
  name: string;
  color: string;
  path: { lat: number; lng: number }[];
}[] = [
  {
    name: "Old Fourth Ward",
    color: NB_COLOR.yellow,
    path: [
      { lat: 33.7745, lng: -84.379 },
      { lat: 33.7755, lng: -84.3625 },
      { lat: 33.7615, lng: -84.3625 },
      { lat: 33.76, lng: -84.379 },
    ],
  },
  {
    name: "Grant Park",
    color: NB_COLOR.sky,
    path: [
      { lat: 33.746, lng: -84.379 },
      { lat: 33.747, lng: -84.361 },
      { lat: 33.73, lng: -84.361 },
      { lat: 33.729, lng: -84.379 },
    ],
  },
  {
    name: "East Atlanta Village",
    color: NB_COLOR.red,
    path: [
      { lat: 33.748, lng: -84.352 },
      { lat: 33.7485, lng: -84.332 },
      { lat: 33.733, lng: -84.332 },
      { lat: 33.7325, lng: -84.352 },
    ],
  },
  {
    name: "Reynoldstown",
    color: NB_COLOR.sky,
    path: [
      { lat: 33.7565, lng: -84.3625 },
      { lat: 33.757, lng: -84.348 },
      { lat: 33.745, lng: -84.348 },
      { lat: 33.7445, lng: -84.3625 },
    ],
  },
  {
    name: "Castleberry Hill",
    color: NB_COLOR.yellow,
    path: [
      { lat: 33.752, lng: -84.412 },
      { lat: 33.7525, lng: -84.396 },
      { lat: 33.74, lng: -84.396 },
      { lat: 33.7395, lng: -84.412 },
    ],
  },
  {
    name: "Midtown",
    color: NB_COLOR.red,
    path: [
      { lat: 33.796, lng: -84.392 },
      { lat: 33.797, lng: -84.3745 },
      { lat: 33.77, lng: -84.3745 },
      { lat: 33.769, lng: -84.392 },
    ],
  },
  {
    name: "West End",
    color: NB_COLOR.sky,
    path: [
      { lat: 33.743, lng: -84.424 },
      { lat: 33.7435, lng: -84.405 },
      { lat: 33.728, lng: -84.405 },
      { lat: 33.7275, lng: -84.424 },
    ],
  },
  {
    name: "Downtown",
    color: NB_COLOR.yellow,
    path: [
      { lat: 33.7665, lng: -84.398 },
      { lat: 33.767, lng: -84.382 },
      { lat: 33.7475, lng: -84.382 },
      { lat: 33.747, lng: -84.398 },
    ],
  },
  {
    name: "Little Five Points",
    color: NB_COLOR.red,
    path: [
      { lat: 33.7705, lng: -84.356 },
      { lat: 33.771, lng: -84.342 },
      { lat: 33.7575, lng: -84.342 },
      { lat: 33.757, lng: -84.356 },
    ],
  },
  {
    name: "Decatur",
    color: NB_COLOR.sky,
    path: [
      { lat: 33.7825, lng: -84.308 },
      { lat: 33.783, lng: -84.286 },
      { lat: 33.765, lng: -84.286 },
      { lat: 33.7645, lng: -84.308 },
    ],
  },
  {
    name: "Virginia Highlands",
    color: NB_COLOR.yellow,
    path: [
      { lat: 33.7785, lng: -84.36 },
      { lat: 33.779, lng: -84.346 },
      { lat: 33.7655, lng: -84.346 },
      { lat: 33.765, lng: -84.36 },
    ],
  },
  {
    name: "Glenwood Park",
    color: NB_COLOR.lime,
    path: [
      { lat: 33.7465, lng: -84.356 },
      { lat: 33.747, lng: -84.344 },
      { lat: 33.734, lng: -84.344 },
      { lat: 33.7335, lng: -84.356 },
    ],
  },
  {
    name: "Buckhead",
    color: "#475569",
    path: [
      { lat: 33.862, lng: -84.4 },
      { lat: 33.864, lng: -84.358 },
      { lat: 33.832, lng: -84.358 },
      { lat: 33.83, lng: -84.4 },
    ],
  },
  {
    name: "Inman Park",
    color: "#DB2777",
    path: [
      { lat: 33.7665, lng: -84.362 },
      { lat: 33.767, lng: -84.348 },
      { lat: 33.7575, lng: -84.348 },
      { lat: 33.757, lng: -84.362 },
    ],
  },
  {
    name: "Piedmont Heights",
    color: "#CA8A04",
    path: [
      { lat: 33.814, lng: -84.378 },
      { lat: 33.8145, lng: -84.362 },
      { lat: 33.8, lng: -84.362 },
      { lat: 33.7995, lng: -84.378 },
    ],
  },
  {
    name: "Cabbagetown",
    color: "#15803D",
    path: [
      { lat: 33.755, lng: -84.367 },
      { lat: 33.7555, lng: -84.356 },
      { lat: 33.7455, lng: -84.356 },
      { lat: 33.745, lng: -84.367 },
    ],
  },
];

// Returns a copy of `path` shifted perpendicular to its own direction by half a
// line-width, so two opposite-sign copies form one full-width line split
// lengthwise down the centerline (the seam runs exactly through the stations).
// The shift is computed in screen pixels at the given zoom, then converted to
// lat/lng, so the two halves stay flush regardless of zoom or how the track bends.
function offsetPathPerpendicular(
  path: { lat: number; lng: number }[],
  sign: 1 | -1,
  zoom: number,
) {
  const METERS_PER_DEG_LAT = 111320;
  const offsetPx = MARTA_LINE_WEIGHT / 4; // half of a half-width line
  return path.map((p, i) => {
    const prev = path[Math.max(0, i - 1)];
    const next = path[Math.min(path.length - 1, i + 1)];
    const phi = (p.lat * Math.PI) / 180;
    const cosPhi = Math.cos(phi) || 1e-6;
    // Local tangent in meters (east, north).
    const dEast = (next.lng - prev.lng) * cosPhi * METERS_PER_DEG_LAT;
    const dNorth = (next.lat - prev.lat) * METERS_PER_DEG_LAT;
    const len = Math.hypot(dEast, dNorth) || 1;
    // Perpendicular unit vector (east, north).
    const px = (-dNorth / len) * sign;
    const py = (dEast / len) * sign;
    const metersPerPixel = (156543.03392 * cosPhi) / Math.pow(2, zoom);
    const offMeters = offsetPx * metersPerPixel;
    return {
      lat: p.lat + (offMeters * py) / METERS_PER_DEG_LAT,
      lng: p.lng + (offMeters * px) / (METERS_PER_DEG_LAT * cosPhi),
    };
  });
}

// Draws a semi-transparent color overlay for each Explore "Area" neighborhood, for
// orientation. Non-interactive so it never steals map clicks. Sits below the rail
// lines and markers (low zIndex). Mounted once with the map; cleans up on unmount.
function NeighborhoodOverlays({
  names,
  emphasize = false,
}: {
  // When provided, only these neighborhoods are drawn (matched case-insensitively).
  // When omitted, every area is drawn.
  names?: string[];
  // Draw the (selected) areas with a stronger fill so they read as "active".
  emphasize?: boolean;
}) {
  const map = useMap();
  const mapsLib = useMapsLibrary("maps");
  const key = (names ?? []).join("|");

  useEffect(() => {
    if (!map || !mapsLib) return;
    const wanted = names
      ? NEIGHBORHOOD_AREAS.filter((area) =>
          names.some(
            (n) =>
              area.name.toLowerCase().includes(n.toLowerCase()) ||
              n.toLowerCase().includes(area.name.toLowerCase()),
          ),
        )
      : NEIGHBORHOOD_AREAS;
    const polygons = wanted.map((area) => {
      const color = neighborhoodColors[area.name] ?? area.color;
      return new mapsLib.Polygon({
        paths: area.path,
        strokeColor: color,
        strokeOpacity: emphasize ? 0.95 : 0.7,
        strokeWeight: emphasize ? 2.5 : 1.5,
        fillColor: color,
        fillOpacity: emphasize ? 0.32 : 0.18,
        clickable: false,
        zIndex: emphasize ? 2 : 1,
        map,
      });
    });
    return () => polygons.forEach((p) => p.setMap(null));
    // `key` re-runs the effect when the selected-name set changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, mapsLib, key, emphasize]);

  return null;
}

// Highlights the Atlanta Beltline loop as a dashed lime-green line. Dashes are
// drawn via a repeated dash symbol over a transparent stroke. Mounted once with
// the map; cleans up on unmount.
function BeltlineLoop() {
  const map = useMap();
  const mapsLib = useMapsLibrary("maps");

  useEffect(() => {
    if (!map || !mapsLib) return;
    const polyline = new mapsLib.Polyline({
      path: BELTLINE_PATH,
      geodesic: true,
      strokeColor: "#BCF000",
      strokeOpacity: 1,
      strokeWeight: 4,
      zIndex: 6,
      map,
    });
    return () => polyline.setMap(null);
  }, [map, mapsLib]);

  return null;
}

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

    // A shared trunk drawn as a lengthwise two-tone stripe: two half-width lines
    // offset to opposite sides of the centerline so they sit flush, with the seam
    // running through the station centers. Tracked so the zoom listener can keep
    // them flush at any zoom.
    const trunkHalves: {
      line: google.maps.Polyline;
      path: { lat: number; lng: number }[];
      sign: 1 | -1;
    }[] = [];
    const splitTrunk = (
      trunk: { lat: number; lng: number }[],
      colorA: string,
      colorB: string,
      zIndex: number,
    ) => {
      const z = map.getZoom() ?? 12;
      ([
        [colorA, -1],
        [colorB, 1],
      ] as [string, 1 | -1][]).forEach(([color, sign]) => {
        const line = new mapsLib.Polyline({
          path: offsetPathPerpendicular(trunk, sign, z),
          geodesic: false,
          strokeColor: color,
          strokeOpacity: 0.95,
          strokeWeight: MARTA_LINE_WEIGHT / 2,
          zIndex,
          map,
        });
        lines.push(line);
        trunkHalves.push({ line, path: trunk, sign });
      });
    };

    // Green/Blue shared E-W trunk and Red/Gold shared N-S trunk, each two-tone.
    splitTrunk(MARTA_TRUNK_EW, MARTA_LINE_COLORS.Green, MARTA_LINE_COLORS.Blue, 3);
    splitTrunk(MARTA_TRUNK_NS, MARTA_LINE_COLORS.Red, MARTA_LINE_COLORS.Gold, 5);

    const zoomListener = map.addListener("zoom_changed", () => {
      const z = map.getZoom() ?? 12;
      for (const t of trunkHalves) {
        t.line.setPath(offsetPathPerpendicular(t.path, t.sign, z));
      }
    });

    // Solid Red/Gold branches north of Lindbergh (prepend Lindbergh to join trunk).
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

    // Solid Green/Blue branches off the E-W trunk (the trunk objects are the same
    // references spread into each path, so indexOf locates the shared segment).
    const ewStart = MARTA_TRUNK_EW[0];
    const ewEnd = MARTA_TRUNK_EW[MARTA_TRUNK_EW.length - 1];
    const greenLine = MARTA_LINES.find((l) => l.name === "Green");
    const blueLine = MARTA_LINES.find((l) => l.name === "Blue");
    if (greenLine) {
      // Green only extends west of the trunk (Bankhead → Ashby).
      const start = greenLine.path.indexOf(ewStart);
      if (start > 0) {
        draw(
          [...greenLine.path.slice(0, start), ewStart],
          greenLine.color,
          MARTA_LINE_WEIGHT,
          3,
        );
      }
    }
    if (blueLine) {
      const start = blueLine.path.indexOf(ewStart);
      const end = blueLine.path.indexOf(ewEnd);
      if (start > 0) {
        draw(
          [...blueLine.path.slice(0, start), ewStart],
          blueLine.color,
          MARTA_LINE_WEIGHT,
          3,
        );
      }
      if (end >= 0 && end < blueLine.path.length - 1) {
        draw(
          [ewEnd, ...blueLine.path.slice(end + 1)],
          blueLine.color,
          MARTA_LINE_WEIGHT,
          3,
        );
      }
    }

    return () => {
      zoomListener.remove();
      lines.forEach((l) => l.setMap(null));
    };
  }, [map, mapsLib]);

  return null;
}

// Places a small MARTA roundel at every station. Interactive (no onClick) so the
// native title tooltip surfaces the station name on hover.
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
          position={{ lat: s.lat, lng: s.lng }}
          title={s.name ? `${s.name} Station` : undefined}
          icon={icon}
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
  routeTravelMode,
  highlightNeighborhoods,
}: {
  businesses: MapBusiness[];
  selectedId?: string;
  onSelect: (id?: string) => void;
  routePath?: { lat: number; lng: number }[];
  routeTravelMode?: "WALKING" | "BICYCLING";
  highlightNeighborhoods?: string[];
}) {
  const [showMarta, setShowMarta] = useState(true);
  const [showBeltline, setShowBeltline] = useState(true);
  const [showAreas, setShowAreas] = useState(true);
  const [showPins, setShowPins] = useState(true);
  const [showLocation, setShowLocation] = useState(false);
  const [locationError, setLocationError] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);

  const handleLocationError = useCallback(() => {
    setShowLocation(false);
    setLocationError(true);
    window.setTimeout(() => setLocationError(false), 4000);
  }, []);

  const zoomBy = useCallback((delta: number) => {
    const map = mapRef.current;
    if (!map) return;
    const z = map.getZoom() ?? 12;
    map.setZoom(z + delta);
  }, []);

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
    <div className="flex h-full w-full flex-col">
      <div className="relative min-h-0 flex-1">
        <APIProvider apiKey={API_KEY}>
          <Map
            defaultCenter={ATLANTA_CENTER}
            defaultZoom={12}
            gestureHandling="cooperative"
            scrollwheel={false}
            disableDefaultUI={true}
            zoomControl={false}
            clickableIcons={false}
            styles={MAP_STYLES}
            className="h-full w-full"
            style={{ width: "100%", height: "100%" }}
            onClick={() => onSelect(undefined)}
          >
            {highlightNeighborhoods && highlightNeighborhoods.length > 0 ? (
              // A neighborhood filter is active — show ONLY the selected areas
              // (emphasized), hiding every other colored area regardless of the
              // Areas toggle.
              <NeighborhoodOverlays names={highlightNeighborhoods} emphasize />
            ) : (
              showAreas && <NeighborhoodOverlays />
            )}
            {showMarta && <MartaRailLines />}
            {showMarta && <MartaStationMarkers />}
            {showBeltline && <BeltlineLoop />}

            {showPins && (
              <BusinessMarkers businesses={businesses} onSelect={onSelect} />
            )}

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
                  <div className="mb-1.5 flex items-center gap-1.5 text-xs text-gray-500">
                    <span>{selected.neighborhood}</span>
                    <span aria-hidden>·</span>
                    <span className="inline-flex items-center gap-1">
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ backgroundColor: categoryColor(selected.category) }}
                      />
                      {selected.category}
                    </span>
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

            {routePath && routePath.length > 0 && (
              <RoutePath path={routePath} travelMode={routeTravelMode} />
            )}

            <UserLocationMarker
              active={showLocation}
              onError={handleLocationError}
            />

            <PanToSelected selected={selected} />
            <MapInstanceBridge mapRef={mapRef} />
          </Map>
        </APIProvider>

        {locationError && (
          <div className="pointer-events-none absolute inset-x-0 top-2 z-10 mx-auto w-fit max-w-[90%] rounded-full border-2 border-foreground bg-brand-cream px-3 py-1 text-center font-display text-[11px] uppercase tracking-wide text-foreground shadow-pop-sm">
            Turn on location access to show your spot
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center justify-center gap-0.5 border-t-2 border-foreground bg-[#a71930] px-1 py-2 sm:gap-1.5 sm:px-2">
        <MapLayerToggle
          active={showMarta}
          onClick={() => setShowMarta((v) => !v)}
          icon={<TrainFront className="h-3.5 w-3.5" />}
          label="MARTA"
        />
        <MapLayerToggle
          active={showBeltline}
          onClick={() => setShowBeltline((v) => !v)}
          icon={<Spline className="h-3.5 w-3.5" />}
          label="Beltline"
        />
        <MapLayerToggle
          active={showAreas}
          onClick={() => setShowAreas((v) => !v)}
          icon={<Layers className="h-3.5 w-3.5" />}
          label="Areas"
        />
        <MapLayerToggle
          active={showPins}
          onClick={() => setShowPins((v) => !v)}
          icon={<MapPin className="h-3.5 w-3.5" />}
          label="Pins"
        />
        <MapLayerToggle
          active={showLocation}
          onClick={() => {
            setLocationError(false);
            setShowLocation((v) => !v);
          }}
          icon={<LocateFixed className="h-3.5 w-3.5" />}
          label="Me"
        />

        <span className="h-6 w-px shrink-0 bg-brand-cream/30 sm:mx-1" aria-hidden />

        <MapZoomButton
          onClick={() => zoomBy(1)}
          icon={<Plus className="h-3.5 w-3.5" />}
          label="Zoom in"
        />
        <MapZoomButton
          onClick={() => zoomBy(-1)}
          icon={<Minus className="h-3.5 w-3.5" />}
          label="Zoom out"
        />
      </div>
    </div>
  );
}

// Bridges the Map instance (only available inside APIProvider) up to a ref the
// outer component can use for the custom zoom controls in the footer.
function MapInstanceBridge({
  mapRef,
}: {
  mapRef: React.MutableRefObject<google.maps.Map | null>;
}) {
  const map = useMap();
  useEffect(() => {
    mapRef.current = map;
    return () => {
      mapRef.current = null;
    };
  }, [map, mapRef]);
  return null;
}

// Zoom in/out control styled to sit inline with the MapLayerToggle pills. Always
// a solid cream button (it's an action, not a toggle state).
function MapZoomButton({
  onClick,
  icon,
  label,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="inline-flex items-center justify-center rounded-md border-2 border-brand-cream/30 bg-transparent px-1.5 py-1.5 text-brand-cream/80 transition-all hover:border-foreground hover:bg-brand-cream hover:text-foreground sm:px-2.5 sm:py-1"
    >
      {icon}
    </button>
  );
}

// Small pill toggle for showing/hiding a map layer. Lives on the dark map card,
// so it uses a filled brand-yellow "on" state and a dimmed outline "off" state.
function MapLayerToggle({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      title={label}
      className={`inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md border-2 px-1.5 py-1.5 font-display uppercase tracking-normal transition-all sm:px-2.5 sm:py-1 sm:text-[11px] sm:tracking-wider ${
        active
          ? "border-foreground bg-brand-yellow text-brand-yellow-foreground shadow-pop-sm"
          : "border-brand-cream/30 bg-transparent text-brand-cream/55 hover:text-brand-cream/80"
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
