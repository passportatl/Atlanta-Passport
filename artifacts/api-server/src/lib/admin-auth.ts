import type { Request, Response, NextFunction } from "express";
import { timingSafeEqual } from "node:crypto";
import { logger } from "./logger";
import { getSessionUser, isLegacyAccessEnabled } from "./staff-auth";

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/**
 * Admin auth middleware. Requires the ADMIN_SECRET environment variable to be
 * configured — there is intentionally NO built-in fallback secret. When the
 * secret is missing, all admin requests are refused.
 *
 * The key is read from the x-admin-key header, or (for direct-download links
 * like CSV exports, where headers can't be set) the _k query parameter.
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  void (async () => {
    // 1) Individual staff account session (preferred).
    const staffUser = await getSessionUser(req);
    if (staffUser) {
      if (staffUser.mustChangePassword) {
        res.status(403).json({
          error: "You must change your temporary password first",
          code: "PASSWORD_CHANGE_REQUIRED",
        });
        return;
      }
      req.staffUser = staffUser;
      req.adminVia = "staff";
      next();
      return;
    }

    // 2) Legacy shared admin secret — kept for a safe migration path; can be
    //    disabled from the Admin Users page once staff accounts are verified.
    const secret = process.env.ADMIN_SECRET;
    if (!secret) {
      logger.error("ADMIN_SECRET is not configured; refusing admin request");
      res.status(503).json({ error: "Admin access is not configured on this server" });
      return;
    }
    const headerKey = req.headers["x-admin-key"];
    const queryKey = req.query["_k"];
    const key = typeof headerKey === "string" ? headerKey : typeof queryKey === "string" ? queryKey : undefined;
    if (!key || !safeEqual(key, secret)) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    if (!(await isLegacyAccessEnabled())) {
      res.status(401).json({ error: "Legacy admin access is disabled. Sign in with your staff account." });
      return;
    }
    req.adminVia = "legacy";
    next();
  })().catch((err) => {
    logger.error({ err }, "Admin auth check failed");
    res.status(500).json({ error: "Auth check failed" });
  });
}
