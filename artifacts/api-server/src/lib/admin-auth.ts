import type { Request, Response, NextFunction } from "express";
import { timingSafeEqual } from "node:crypto";
import { logger } from "./logger";

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
  next();
}
