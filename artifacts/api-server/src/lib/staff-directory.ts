import { eq } from "drizzle-orm";
import { db, appConfigTable } from "@workspace/db";

const STAFF_DIRECTORY_CONFIG_KEY = "crm_staff_directory";

export interface StaffMember {
  name: string;
  email: string;
}

/** Normalize a staff name for case/whitespace-insensitive matching. */
export function normalizeStaffName(name: string): string {
  return name.trim().toLowerCase();
}

/** Load the admin-editable staff directory (name -> email) from app config. */
export async function loadStaffDirectory(): Promise<StaffMember[]> {
  const [row] = await db
    .select()
    .from(appConfigTable)
    .where(eq(appConfigTable.key, STAFF_DIRECTORY_CONFIG_KEY));
  if (!row?.value) return [];
  try {
    const parsed = JSON.parse(row.value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is StaffMember =>
        e && typeof e.name === "string" && typeof e.email === "string",
    );
  } catch {
    return [];
  }
}

/** Replace the staff directory. Entries are trimmed; blank names/emails dropped. */
export async function saveStaffDirectory(entries: StaffMember[]): Promise<StaffMember[]> {
  const seen = new Set<string>();
  const cleaned: StaffMember[] = [];
  for (const e of entries) {
    const name = e.name.trim();
    const email = e.email.trim();
    if (!name || !email) continue;
    const key = normalizeStaffName(name);
    if (seen.has(key)) continue;
    seen.add(key);
    cleaned.push({ name, email });
  }
  await db
    .insert(appConfigTable)
    .values({
      key: STAFF_DIRECTORY_CONFIG_KEY,
      value: JSON.stringify(cleaned),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: appConfigTable.key,
      set: { value: JSON.stringify(cleaned), updatedAt: new Date() },
    });
  return cleaned;
}

/** Look up a staff email by (free-text) assignedTo name. Returns null when unmapped. */
export function staffEmailFor(
  directory: StaffMember[],
  assignedTo: string | null | undefined,
): string | null {
  if (!assignedTo?.trim()) return null;
  const key = normalizeStaffName(assignedTo);
  return directory.find((e) => normalizeStaffName(e.name) === key)?.email ?? null;
}
