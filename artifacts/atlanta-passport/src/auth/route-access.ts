export const MEMBER_HOME_ROUTE = "/passport/stamps";

const PUBLIC_GUEST_ROUTES = new Set([
  "/",
  "/partners",
  "/apply",
  "/list-event",
  "/list-a-location",
  "/passport/contact",
  "/privacy-policy",
  "/terms-of-service",
  "/sign-in",
  "/sign-up",
]);

const PUBLIC_GUEST_PREFIXES = ["/sign-in/", "/sign-up/", "/stamp/"];

function normalizePathname(location: string): string {
  const pathname = location.split(/[?#]/, 1)[0] || "/";

  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }

  return pathname;
}

/**
 * Routes available without a Passport account.
 *
 * The QR stamp landing is a deliberate functional exception: it must load
 * while signed out so it can preserve the scanned stamp through authentication.
 */
export function isGuestAccessibleRoute(location: string): boolean {
  const pathname = normalizePathname(location);

  if (PUBLIC_GUEST_ROUTES.has(pathname)) {
    return true;
  }

  return PUBLIC_GUEST_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function isProtectedRoute(location: string): boolean {
  return !isGuestAccessibleRoute(location);
}
