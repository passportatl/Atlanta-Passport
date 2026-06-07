// MARTA heavy-rail lines for the passport map. Station coordinates are
// approximate (good enough for a styled overlay, not navigation). Each line is
// an ordered list of stations from one terminus to the other.
//
// The Red + Gold lines share the north-south trunk (Lindbergh -> Airport); the
// Blue + Green lines share the east-west trunk (Ashby -> Edgewood/Candler Park
// and through downtown). To keep BOTH colors visible on the shared track, the
// second line of each pair (Gold, Green) is drawn with a tiny parallel offset.

export type LatLng = { lat: number; lng: number };

export type MartaLine = {
  id: "red" | "gold" | "blue" | "green";
  name: string;
  color: string;
  // Small parallel offset (degrees) applied to every point so overlapping
  // trunk segments render as two side-by-side colored lines.
  offset?: { lat?: number; lng?: number };
  path: LatLng[];
};

const NS_TRUNK: LatLng[] = [
  { lat: 33.8236, lng: -84.3692 }, // Lindbergh Center
  { lat: 33.7892, lng: -84.3873 }, // Arts Center
  { lat: 33.7806, lng: -84.3863 }, // Midtown
  { lat: 33.7715, lng: -84.3867 }, // North Avenue
  { lat: 33.7664, lng: -84.3875 }, // Civic Center
  { lat: 33.759, lng: -84.3876 }, // Peachtree Center
  { lat: 33.7539, lng: -84.3916 }, // Five Points
  { lat: 33.7487, lng: -84.3954 }, // Garnett
  { lat: 33.7349, lng: -84.4135 }, // West End
  { lat: 33.7178, lng: -84.425 }, // Oakland City
  { lat: 33.7016, lng: -84.429 }, // Lakewood / Ft. McPherson
  { lat: 33.6766, lng: -84.4406 }, // East Point
  { lat: 33.6447, lng: -84.4488 }, // College Park
  { lat: 33.6404, lng: -84.4462 }, // Airport
];

const EW_TRUNK_TO_EDGEWOOD: LatLng[] = [
  { lat: 33.756, lng: -84.4176 }, // Ashby
  { lat: 33.7565, lng: -84.4035 }, // Vine City
  { lat: 33.7572, lng: -84.3964 }, // GWCC / Dome
  { lat: 33.7539, lng: -84.3916 }, // Five Points
  { lat: 33.7497, lng: -84.3859 }, // Georgia State
  { lat: 33.7501, lng: -84.3766 }, // King Memorial
  { lat: 33.7573, lng: -84.3526 }, // Inman Park / Reynoldstown
  { lat: 33.7619, lng: -84.3401 }, // Edgewood / Candler Park
];

export const MARTA_LINES: MartaLine[] = [
  {
    id: "red",
    name: "Red Line",
    color: "#E4002B",
    path: [
      { lat: 33.9456, lng: -84.3575 }, // North Springs
      { lat: 33.9314, lng: -84.3515 }, // Sandy Springs
      { lat: 33.921, lng: -84.3446 }, // Dunwoody
      { lat: 33.912, lng: -84.3519 }, // Medical Center
      { lat: 33.848, lng: -84.3673 }, // Buckhead
      ...NS_TRUNK,
    ],
  },
  {
    id: "gold",
    name: "Gold Line",
    color: "#D4A017",
    offset: { lng: 0.0011 },
    path: [
      { lat: 33.9026, lng: -84.28 }, // Doraville
      { lat: 33.8878, lng: -84.3057 }, // Chamblee
      { lat: 33.8601, lng: -84.3392 }, // Brookhaven / Oglethorpe
      { lat: 33.8459, lng: -84.3585 }, // Lenox
      ...NS_TRUNK,
    ],
  },
  {
    id: "blue",
    name: "Blue Line",
    color: "#0072CE",
    path: [
      { lat: 33.7547, lng: -84.4694 }, // Hamilton E. Holmes
      { lat: 33.7531, lng: -84.4456 }, // West Lake
      ...EW_TRUNK_TO_EDGEWOOD,
      { lat: 33.7652, lng: -84.3132 }, // East Lake
      { lat: 33.7748, lng: -84.2954 }, // Decatur
      { lat: 33.7752, lng: -84.2799 }, // Avondale
      { lat: 33.772, lng: -84.2503 }, // Kensington
      { lat: 33.7691, lng: -84.2298 }, // Indian Creek
    ],
  },
  {
    id: "green",
    name: "Green Line",
    color: "#00A551",
    offset: { lat: -0.0011 },
    path: [
      { lat: 33.7723, lng: -84.4189 }, // Bankhead
      ...EW_TRUNK_TO_EDGEWOOD,
    ],
  },
];
