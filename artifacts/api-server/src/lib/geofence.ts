// Geofence radius (meters) within which a stamp / redemption is allowed.
export const GEOFENCE_RADIUS_M = 200;

// Haversine distance in meters between two lat/lng points.
export function distanceMeters(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number,
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function isWithin(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number,
  radius = GEOFENCE_RADIUS_M,
): boolean {
  return distanceMeters(aLat, aLng, bLat, bLng) <= radius;
}
