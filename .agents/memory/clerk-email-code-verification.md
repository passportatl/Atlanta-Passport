---
name: Clerk email-code sign-up verification
description: Why valid email verification codes get rejected and trigger "too many attempts" in the custom Clerk signUp flow.
---

# Clerk email-code verification pitfalls

When implementing a **custom** Clerk `signUp` email-code flow (not the prebuilt `<SignUp/>`),
two mistakes cause valid codes to be rejected, which then burns Clerk's limited attempt
quota and surfaces as "too many attempts, try again later" that the user can't escape:

1. **Over-strict success guard.** Do NOT gate success on
   `res.status === "complete" && res.createdSessionId`. Treat `status === "complete"` as
   success and activate `res.createdSessionId ?? signUp.createdSessionId`. If you also require
   `createdSessionId` in the condition, a complete verification with a momentarily-absent id
   falls into the "incomplete, retry" branch → the user re-submits an **already-consumed** code
   → every retry is rejected as invalid until the attempt cap.

2. **Unsanitized code input.** Mobile email/one-time-code autofill and paste often insert
   whitespace (e.g. `123 456`). Strip it (`code.replace(/\s+/g, "")`) before
   `attemptEmailAddressVerification` — codes are numeric, so stripping whitespace is safe.

**Why:** "won't accept the code" + "too many attempts" is almost always a false-negative on a
*correct* code, not a Clerk outage. The attempt cap is a downstream symptom.

**How to apply:** On resend, clear the stale code and confirm a new code was sent (a fresh code
resets Clerk's per-code attempt counter). Note: dev/preview uses a `pk_test` Clerk instance with
**strict usage limits** — testers hitting limits fast should verify on the published (prod-key) site.
Lives in `artifacts/atlanta-passport/src/passport/StartPassportForm.tsx`.
