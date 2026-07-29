import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { and, eq, gt, lt } from "drizzle-orm";
import type { Request, Response, NextFunction } from "express";
import {
  db,
  staffUsersTable,
  staffSessionsTable,
  adminAuditLogTable,
  appConfigTable,
  type StaffUser,
} from "@workspace/db";
import { logger } from "./logger";

export const SESSION_COOKIE = "staff_session";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
const BCRYPT_ROUNDS = 12;
const LEGACY_ACCESS_KEY = "legacy_admin_access"; // app_config: "enabled" (default) | "disabled"

const INITIAL_STAFF_USERNAMES = ["Jim", "Gina", "Drew", "Paula", "Michelle"];

declare global {
  namespace Express {
    interface Request {
      staffUser?: StaffUser;
      adminVia?: "staff" | "legacy";
    }
  }
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Strip the password hash before anything leaves the server. */
export function toPublicStaffUser(u: StaffUser) {
  return {
    id: u.id,
    username: u.username,
    email: u.email,
    status: u.status,
    mustChangePassword: u.mustChangePassword,
    lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
    passwordChangedAt: u.passwordChangedAt ? u.passwordChangedAt.toISOString() : null,
    createdAt: u.createdAt.toISOString(),
  };
}

/**
 * Seed the initial staff users from the INITIAL_STAFF_PASSWORD secret.
 * The plaintext is read from the environment only, hashed immediately, and
 * never logged or persisted. Existing users are never overwritten.
 */
export async function seedStaffUsers(): Promise<void> {
  const initialPassword = process.env.INITIAL_STAFF_PASSWORD;
  if (!initialPassword) {
    logger.warn("INITIAL_STAFF_PASSWORD is not set; skipping staff user seeding");
    return;
  }
  const existing = await db.select({ username: staffUsersTable.username }).from(staffUsersTable);
  const have = new Set(existing.map((r) => r.username.toLowerCase()));
  const missing = INITIAL_STAFF_USERNAMES.filter((u) => !have.has(u.toLowerCase()));
  if (missing.length === 0) return;
  const passwordHash = await bcrypt.hash(initialPassword, BCRYPT_ROUNDS);
  for (const username of missing) {
    await db
      .insert(staffUsersTable)
      .values({ username, passwordHash, mustChangePassword: true, status: "active" })
      .onConflictDoNothing({ target: staffUsersTable.username });
  }
  logger.info({ created: missing }, "Seeded initial staff users (temporary password, change required)");
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(res: Response, staffId: string): Promise<void> {
  const token = randomBytes(32).toString("hex");
  await db.insert(staffSessionsTable).values({
    tokenHash: hashToken(token),
    staffId,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS),
  });
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_TTL_MS,
    path: "/",
  });
}

export async function destroySession(req: Request, res: Response): Promise<void> {
  const token = req.cookies?.[SESSION_COOKIE];
  if (typeof token === "string" && token) {
    await db.delete(staffSessionsTable).where(eq(staffSessionsTable.tokenHash, hashToken(token)));
  }
  res.clearCookie(SESSION_COOKIE, { path: "/" });
}

/** Resolve the staff user for the current request's session cookie, if valid. */
export async function getSessionUser(req: Request): Promise<StaffUser | null> {
  const token = req.cookies?.[SESSION_COOKIE];
  if (typeof token !== "string" || !token) return null;
  const now = new Date();
  const rows = await db
    .select({ user: staffUsersTable })
    .from(staffSessionsTable)
    .innerJoin(staffUsersTable, eq(staffSessionsTable.staffId, staffUsersTable.id))
    .where(and(eq(staffSessionsTable.tokenHash, hashToken(token)), gt(staffSessionsTable.expiresAt, now)));
  const user = rows[0]?.user ?? null;
  if (!user || user.status !== "active") return null;
  return user;
}

/** Opportunistic cleanup of expired sessions. */
export async function pruneExpiredSessions(): Promise<void> {
  await db.delete(staffSessionsTable).where(lt(staffSessionsTable.expiresAt, new Date()));
}

export async function isLegacyAccessEnabled(): Promise<boolean> {
  const [row] = await db.select().from(appConfigTable).where(eq(appConfigTable.key, LEGACY_ACCESS_KEY));
  return row?.value !== "disabled";
}

export async function setLegacyAccessEnabled(enabled: boolean): Promise<void> {
  const value = enabled ? "enabled" : "disabled";
  await db
    .insert(appConfigTable)
    .values({ key: LEGACY_ACCESS_KEY, value, updatedAt: new Date() })
    .onConflictDoUpdate({ target: appConfigTable.key, set: { value, updatedAt: new Date() } });
}

/**
 * Actor name for audit attribution. Prefers the authenticated staff user;
 * legacy shared-key requests fall back to the (untrusted) x-admin-actor
 * header, clearly tagged so it is distinguishable in the audit trail.
 */
export function adminActor(req: Request): string {
  if (req.staffUser) return req.staffUser.username;
  const header = req.headers["x-admin-actor"];
  if (typeof header === "string" && header.trim()) {
    try {
      return `legacy:${decodeURIComponent(header).trim().slice(0, 80)}`;
    } catch {
      return `legacy:${header.trim().slice(0, 80)}`;
    }
  }
  return "legacy-admin";
}

/** Write an entry to the generic admin audit log. Never throws. */
export async function logAdminAction(
  req: Request,
  action: string,
  entity?: { type?: string; id?: string; detail?: string },
): Promise<void> {
  try {
    await db.insert(adminAuditLogTable).values({
      actor: adminActor(req),
      action,
      entityType: entity?.type ?? null,
      entityId: entity?.id ?? null,
      detail: entity?.detail ?? null,
    });
  } catch (err) {
    logger.error({ err, action }, "Failed to write admin audit log entry");
  }
}

// ── Login rate limiting (in-memory, per username+IP) ────────────────────────
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const attempts = new Map<string, { count: number; firstAt: number }>();

export function loginRateLimit(req: Request): { blocked: boolean; retryAfterMinutes: number } {
  const username = typeof req.body?.username === "string" ? req.body.username.toLowerCase() : "";
  const key = `${username}|${req.ip ?? "unknown"}`;
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || now - entry.firstAt > WINDOW_MS) {
    attempts.set(key, { count: 1, firstAt: now });
    return { blocked: false, retryAfterMinutes: 0 };
  }
  entry.count += 1;
  if (entry.count > MAX_ATTEMPTS) {
    return {
      blocked: true,
      retryAfterMinutes: Math.ceil((WINDOW_MS - (now - entry.firstAt)) / 60000),
    };
  }
  return { blocked: false, retryAfterMinutes: 0 };
}

export function clearLoginAttempts(req: Request): void {
  const username = typeof req.body?.username === "string" ? req.body.username.toLowerCase() : "";
  attempts.delete(`${username}|${req.ip ?? "unknown"}`);
}

/**
 * Middleware guard for password-change enforcement: a staff user with a
 * temporary password may only hit the auth endpoints until they change it.
 */
export function blockUntilPasswordChanged(req: Request, res: Response, next: NextFunction): void {
  if (req.staffUser?.mustChangePassword && !req.path.startsWith("/admin/auth/")) {
    res.status(403).json({ error: "You must change your temporary password first", code: "PASSWORD_CHANGE_REQUIRED" });
    return;
  }
  next();
}
