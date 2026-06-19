export type Coords = { latitude: number; longitude: number };

// Promise wrapper around the browser geolocation API. Rejects with the native
// GeolocationPositionError (with a numeric `code`) or an Error("unavailable")
// when geolocation isn't supported.
export function getCurrentPosition(): Promise<Coords> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("unavailable"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 },
    );
  });
}

// Maps a geolocation failure (or our "unavailable" sentinel) to a stable code
// string used to pick user-facing copy.
export function geoErrorCode(e: unknown): "denied" | "timeout" | "unavailable" {
  const code = (e as GeolocationPositionError)?.code;
  if (code === 1) return "denied";
  if (code === 3) return "timeout";
  return "unavailable";
}
