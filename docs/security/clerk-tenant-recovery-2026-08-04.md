# Clerk tenant recovery — 2026-08-04

## Incident

The original Replit-managed Clerk tenant can still serve browser sign-in, but
its backend secret cannot be reconnected. Replit Support confirmed that it
cannot restore the connection.

## Safety controls

- Production database point-in-time recovery is enabled for seven days.
- No database migration is required for identity recovery.
- Existing `visitors.id` and `partner_accounts.id` values are preserved.
- Relinking requires the new Clerk account's **verified primary email**.
- Ambiguous duplicate-email records are refused and require staff review.
- Secondary and unverified email addresses are never used for relinking.
- Relinking is off by default and requires
  `CLERK_IDENTITY_RECOVERY_ENABLED=true` during the controlled recovery window.

## Recovery sequence

1. Merge and deploy the identity-recovery code before inviting existing users
   into the replacement tenant.
2. Provision a new Replit-managed Clerk Development tenant.
3. Test new registration and sign-in with a disposable Development account.
4. Confirm the server can call Clerk's Backend API with the managed secret.
5. Publish the matching Production tenant and credentials.
6. Set `CLERK_IDENTITY_RECOVERY_ENABLED=true` for the recovery window.
7. Existing users register or use social sign-in with their original verified
   primary email.
8. On first authenticated link, update only `visitors.clerk_user_id` while
   preserving the visitor UUID and all dependent records.
9. Partner sessions similarly update only the matching account's Clerk user ID.
10. Resolve any HTTP 409 duplicate-email cases manually; never merge them
   automatically.
11. Disable `CLERK_IDENTITY_RECOVERY_ENABLED` after the announced recovery
    period and handle late or ambiguous claims through staff review.

## Verification

- Existing visitor retains the same UUID before and after relinking.
- Existing stamps and redemptions remain attached.
- Marketing and legal-consent fields remain unchanged.
- A different or unverified email cannot claim the record.
- A partner retains memberships and organization access.
- Staff/admin authentication continues to use its existing controls.

## Rollback

Revert the application deployment. If an unexpected database write occurred,
restore the production database to the point immediately before the recovery
deployment using Replit point-in-time recovery.
