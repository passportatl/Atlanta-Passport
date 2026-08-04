# Partner Portal Launch Runbook

Status: pre-deployment

Target: August 5, 2026

Production changes performed by this document: none

## Release gate

Do not deploy until all items below are complete:

- exposed credentials are rotated and stored only in Replit Secrets;
- production database backup is downloaded and recovery is verified;
- GitHub `develop` checks pass;
- the migration is reviewed against a production schema snapshot;
- one internal pilot organization, user, location, and event are selected;
- staff know how to disable `/partners` and restore the previous deployment.

## Required secrets

Configure through Replit Secrets, never `.replit` or tracked files:

- `DATABASE_URL`
- `ADMIN_SECRET`
- `CLERK_SECRET_KEY`
- `CLERK_PUBLISHABLE_KEY`
- `VITE_CLERK_PUBLISHABLE_KEY`
- `SESSION_SECRET`
- provider/API credentials used by enabled integrations

## Preflight

1. Confirm the deployment commit and record its hash.
2. Confirm `main` is healthy before merging the release.
3. Export a production database backup with timestamp and commit hash.
4. Confirm the backup is non-empty and restorable to a disposable database.
5. Run the SQL migration against a disposable copy first.
6. Run the verification queries below.
7. Build and test the exact release commit.
8. Confirm Replit Secrets contain newly rotated values.

## Migration

Apply
[`sql/2026-07-30-partner-portal-foundation.sql`](sql/2026-07-30-partner-portal-foundation.sql)
before deploying the partner API or interface.

The migration is additive:

- creates five partner tables;
- adds nullable organization ownership to businesses and events;
- does not assign existing records;
- does not change public IDs, slugs, publication state, stamps, or URLs.

Do not use an automatic destructive schema push in production. Review the SQL
plan and apply the checked-in migration explicitly.

## Verification queries

```sql
SELECT to_regclass('public.partner_accounts');
SELECT to_regclass('public.partner_organizations');
SELECT to_regclass('public.partner_memberships');
SELECT to_regclass('public.partner_invitations');
SELECT to_regclass('public.partner_activity_log');

SELECT column_name, is_nullable
FROM information_schema.columns
WHERE table_name IN ('businesses', 'events')
  AND column_name = 'partner_organization_id'
ORDER BY table_name;

SELECT count(*) FROM businesses WHERE partner_organization_id IS NOT NULL;
SELECT count(*) FROM events WHERE partner_organization_id IS NOT NULL;
```

Immediately after migration, the last two counts must be zero unless a reviewed
pilot assignment was intentionally performed.

## Deployment order

1. Rotate credentials and verify Replit Secrets.
2. Back up production.
3. Apply the additive SQL migration.
4. Run verification queries.
5. Deploy the API and frontend together from the approved release commit.
6. Verify `/api/health`.
7. Verify public Home, Explore, Events, Stamps, and existing admin hubs.
8. Verify `/partners` while signed out and with a signed-in non-partner.
9. Create the internal pilot organization in Partner Hub.
10. Assign only the pilot records.
11. Generate and accept the pilot invitation.
12. Complete the pilot checklist.
13. Invite one external pilot only after the internal pilot passes.

## Pilot checklist

### Security and separation

- [ ] Signed-out `/partners` shows partner sign-in and no consumer navigation.
- [ ] Partner sign-in does not create a new visitor record.
- [ ] A signed-in account without membership receives no partner data.
- [ ] Invitation acceptance fails for a different email.
- [ ] An accepted or expired invitation cannot be reused.
- [ ] Changing an organization ID cannot expose another partner's data.

### Staff workflow

- [ ] Staff can create a uniquely named organization.
- [ ] Staff can create an owner invitation and copy the one-time link.
- [ ] Staff can assign one location and one event.
- [ ] Member, invitation, ownership, and activity views update.
- [ ] No unselected record changes ownership.

### Partner workflow

- [ ] The invited owner can accept the invitation.
- [ ] The dashboard shows the correct organization and role.
- [ ] Only explicitly assigned records appear.
- [ ] Multiple organizations can be switched safely.
- [ ] Empty, loading, denied, and error states are readable on mobile.
- [ ] Meaningful text is not truncated.

### Regression

- [ ] Consumer sign-up, sign-in, consent, stamps, and rewards/profile work.
- [ ] Public Explore ranking, filtering, cards, and map work.
- [ ] Event import, approval, publishing, details, and map behavior work.
- [ ] Location submission and promotion work.
- [ ] Admin Events, Locations, Routes, Stamps, and Partner hubs unlock.

## Rollback

Application rollback is preferred because the schema is additive:

1. Stop issuing invitations and ownership changes.
2. Restore the preceding application deployment.
3. Confirm public and admin regressions are cleared.
4. Leave partner tables and nullable ownership columns intact.
5. Record affected organizations and actions from `partner_activity_log`.
6. Restore the database backup only if data integrity is damaged and the
   incident commander approves the data-loss implications.

Do not drop partner tables during an ordinary application rollback.

## Launch evidence

Record:

- release commit;
- database backup identifier;
- migration start/end time and operator;
- verification-query results;
- pilot user and organization IDs;
- checklist owner and completion time;
- rollback owner;
- issues and final go/no-go decision.
