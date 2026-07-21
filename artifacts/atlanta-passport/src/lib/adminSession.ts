export const ADMIN_KEY_STORAGE = "atlanta-passport-admin-key";
export const ADMIN_UNLOCK_KEY = "atlanta-passport-admin-unlocked";

export function clearAdminSession(): void {
  sessionStorage.removeItem(ADMIN_KEY_STORAGE);
  sessionStorage.removeItem(ADMIN_UNLOCK_KEY);
}

export async function restoreAdminKey(): Promise<string | null> {
  const storedKey = sessionStorage.getItem(ADMIN_KEY_STORAGE);
  if (sessionStorage.getItem(ADMIN_UNLOCK_KEY) !== "1" || !storedKey) return null;
  try {
    const res = await fetch("/api/admin/sources", {
      headers: { "x-admin-key": storedKey },
    });
    if (res.ok) return storedKey;
    if (res.status === 401 || res.status === 403) {
      clearAdminSession();
      return null;
    }
    return storedKey;
  } catch {
    return storedKey;
  }
}
