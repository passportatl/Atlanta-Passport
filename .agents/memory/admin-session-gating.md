---
name: Admin session gating
description: Admin pages must validate the sessionStorage admin key on mount, not trust it blindly
---
Rule: any admin page restoring the `x-admin-key` from sessionStorage must validate it server-side on mount (shared helper `restoreAdminKey()` in `src/lib/adminSession.ts`) and clear session state on 401/403 so the login gate reappears.

**Why:** After ADMIN_SECRET rotation (Jul 20, 2026), pages that blindly trusted the stored key fired requests with a stale key, got 401 on every admin endpoint, and rendered silently empty lists — looked like total data loss (events/routes/stamps were all intact in the DB).

**How to apply:** New admin pages should use the shared helper for both restore and storage key names (`atlanta-passport-admin-key` / `atlanta-passport-admin-unlocked`). Never hand-type the storage key string — a truncated `atl-passport-admin-key` typo once broke Routes Hub and Content admin permanently even after re-login.
