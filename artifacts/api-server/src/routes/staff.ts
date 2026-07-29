import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, staffUsersTable, adminAuditLogTable } from "@workspace/db";
import {
  StaffLoginBody,
  StaffChangePasswordBody,
  UpdateStaffUserBody,
  SetLegacyAccessStatusBody,
} from "@workspace/api-zod";
import { requireAdmin } from "../lib/admin-auth";
import {
  createSession,
  destroySession,
  getSessionUser,
  verifyPassword,
  verifyPasswordOrBurn,
  normalizeUsername,
  hashPassword,
  toPublicStaffUser,
  loginRateLimit,
  clearLoginAttempts,
  isLegacyAccessEnabled,
  setLegacyAccessEnabled,
  logAdminAction,
  pruneExpiredSessions,
} from "../lib/staff-auth";

const router: IRouter = Router();

router.post("/admin/auth/login", async (req, res) => {
  const limit = loginRateLimit(req);
  if (limit.blocked) {
    res.status(429).json({
      error: `Too many login attempts. Try again in about ${limit.retryAfterMinutes} minute(s).`,
    });
    return;
  }
  const parsed = StaffLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Username and password are required" });
    return;
  }
  const password = parsed.data.password;
  const username = normalizeUsername(parsed.data.username);
  const [user] = await db
    .select()
    .from(staffUsersTable)
    .where(eq(staffUsersTable.username, username));
  // Always pay the bcrypt cost (dummy hash when the user is missing) so
  // response timing cannot be used to enumerate usernames.
  const ok = await verifyPasswordOrBurn(password, user?.passwordHash);
  if (!user || !ok) {
    req.log.info({ username }, "Failed staff login attempt");
    res.status(401).json({ error: "Invalid username or password" });
    return;
  }
  if (user.status !== "active") {
    res.status(403).json({ error: "This account is disabled" });
    return;
  }
  clearLoginAttempts(req);
  await createSession(res, user.id);
  await db
    .update(staffUsersTable)
    .set({ lastLoginAt: new Date() })
    .where(eq(staffUsersTable.id, user.id));
  req.staffUser = user;
  await logAdminAction(req, "login", { type: "staff", id: user.id });
  void pruneExpiredSessions().catch(() => undefined);
  res.json({ authenticated: true, user: toPublicStaffUser({ ...user, lastLoginAt: new Date() }) });
});

router.post("/admin/auth/logout", async (req, res) => {
  const user = await getSessionUser(req);
  if (user) {
    req.staffUser = user;
    await logAdminAction(req, "logout", { type: "staff", id: user.id });
  }
  await destroySession(req, res);
  res.json({ ok: true });
});

router.get("/admin/auth/me", async (req, res) => {
  const user = await getSessionUser(req);
  if (!user) {
    res.json({ authenticated: false });
    return;
  }
  res.json({ authenticated: true, user: toPublicStaffUser(user) });
});

router.post("/admin/auth/change-password", async (req, res) => {
  const user = await getSessionUser(req);
  if (!user) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }
  const parsed = StaffChangePasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "New password must be at least 10 characters" });
    return;
  }
  const { currentPassword, newPassword } = parsed.data;
  if (!(await verifyPassword(currentPassword, user.passwordHash))) {
    res.status(401).json({ error: "Current password is incorrect" });
    return;
  }
  if (currentPassword === newPassword) {
    res.status(400).json({ error: "New password must be different from the current one" });
    return;
  }
  const passwordHash = await hashPassword(newPassword);
  const [updated] = await db
    .update(staffUsersTable)
    .set({ passwordHash, mustChangePassword: false, passwordChangedAt: new Date() })
    .where(eq(staffUsersTable.id, user.id))
    .returning();
  req.staffUser = user;
  await logAdminAction(req, "change-password", { type: "staff", id: user.id });
  res.json({ authenticated: true, user: toPublicStaffUser(updated!) });
});

router.get("/admin/users", requireAdmin, async (_req, res) => {
  const rows = await db.select().from(staffUsersTable).orderBy(staffUsersTable.username);
  res.json(rows.map(toPublicStaffUser));
});

router.patch("/admin/users/:id", requireAdmin, async (req, res) => {
  const parsed = UpdateStaffUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", issues: parsed.error.issues });
    return;
  }
  const patch: Record<string, unknown> = {};
  if (parsed.data.email !== undefined) patch.email = parsed.data.email?.trim() || null;
  if (parsed.data.status !== undefined) patch.status = parsed.data.status;
  if (Object.keys(patch).length === 0) {
    res.status(400).json({ error: "No fields provided" });
    return;
  }
  // A staff user may not disable their own account.
  if (parsed.data.status === "disabled" && req.staffUser?.id === req.params.id) {
    res.status(400).json({ error: "You cannot disable your own account" });
    return;
  }
  const [updated] = await db
    .update(staffUsersTable)
    .set(patch)
    .where(eq(staffUsersTable.id, req.params.id as string))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  await logAdminAction(req, "update-staff-user", {
    type: "staff",
    id: updated.id,
    detail: JSON.stringify(patch),
  });
  res.json(toPublicStaffUser(updated));
});

router.get("/admin/audit-log", requireAdmin, async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 200, 500);
  const rows = await db
    .select()
    .from(adminAuditLogTable)
    .orderBy(desc(adminAuditLogTable.createdAt))
    .limit(limit);
  res.json(
    rows.map((r) => ({
      id: r.id,
      actor: r.actor,
      action: r.action,
      entityType: r.entityType,
      entityId: r.entityId,
      detail: r.detail,
      createdAt: r.createdAt.toISOString(),
    })),
  );
});

router.get("/admin/settings/legacy-access", requireAdmin, async (_req, res) => {
  res.json({ enabled: await isLegacyAccessEnabled() });
});

router.patch("/admin/settings/legacy-access", requireAdmin, async (req, res) => {
  const parsed = SetLegacyAccessStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  // Only an authenticated staff user may change this — the legacy shared key
  // cannot disable (or re-enable) itself, and disabling requires that staff
  // accounts are verified to work.
  if (!req.staffUser) {
    res.status(403).json({ error: "Sign in with a staff account to change legacy access" });
    return;
  }
  await setLegacyAccessEnabled(parsed.data.enabled);
  await logAdminAction(req, parsed.data.enabled ? "enable-legacy-access" : "disable-legacy-access", {
    type: "settings",
    id: "legacy_admin_access",
  });
  res.json({ enabled: parsed.data.enabled });
});

export default router;
