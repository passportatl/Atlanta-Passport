---
name: Staff admin accounts
description: Individual staff logins with cookie sessions coexist with the legacy shared admin key; how auth, seeding, and audit attribution work.
---
Admin portal auth has two doors, checked in `requireAdmin` (api-server/src/lib/admin-auth.ts): (1) staff session cookie `staff_session` (preferred; sets `req.staffUser`), (2) legacy `x-admin-key` shared secret, gated on app_config key `legacy_admin_access` (staff-session-only toggle at PATCH /admin/settings/legacy-access — the legacy key cannot disable itself).

**Why:** migration path from a single shared secret to attributable individual accounts without locking anyone out.

**How to apply:**
- Staff seeding: 5 users created at server start from `INITIAL_STAFF_PASSWORD` secret (bcryptjs, mustChangePassword=true). Plaintext must NEVER appear in code, logs, or responses; `toPublicStaffUser` strips hashes everywhere.
- Users with mustChangePassword=true are blocked from all admin endpoints (403 code PASSWORD_CHANGE_REQUIRED) until POST /admin/auth/change-password.
- Login pays a bcrypt cost even for unknown usernames (dummy hash) and rate-limits 5/15min per normalized (trimmed+lowercased) username+IP — keep normalization identical in limiter and DB lookup.
- Audit attribution: prefer `req.staffUser.username`; the `x-admin-actor` header is legacy-only and tagged `legacy:`. Generic trail in `admin_audit_log` via `logAdminAction` (staff-auth.ts); events keep their own `event_audit_log`.
- Frontend gate: shared `AdminGate` component wraps all admin pages (staff login primary, legacy key fallback via sessionStorage); do not re-add per-page inline unlock forms.
