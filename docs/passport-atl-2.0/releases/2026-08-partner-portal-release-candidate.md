# Partner Portal Release Candidate

Status: conditional — not approved for production

Target: August 5, 2026

## Included

- separate partner sign-in and portal context;
- consumer/partner identity separation;
- partner accounts, organizations, memberships, invitations, and activity log;
- explicit location and event ownership;
- staff Partner Hub;
- read-only partner location and event summaries;
- additive production migration and rollback runbook;
- tracked-file credential scanning.

## Automated evidence

- GitHub quality checks passed for partner identity, portal shell, invitations,
  read-only records, Partner Hub, and launch safeguards.
- Partner route classification now has explicit tests for partner callback and
  invitation URLs.
- Invitation security tests cover approved roles, email normalization, token
  hashing, accepted/revoked/expired states, and email mismatch.
- Local TypeScript validation passes.
- Focused local Vitest execution is unavailable on Windows because the
  repository lacks its optional Windows Rollup binary. GitHub Actions on Linux
  is the authoritative test environment.

## Security correction found during QA

Partner Clerk callback paths such as `/partners/sso-callback` were not included
in the guest-access prefix list. The global protected-route redirect could
therefore interrupt a signed-out partner authentication callback. The release
candidate recognizes every `/partners/*` path as partner context and excludes
it from consumer visitor linking.

## Remaining launch blockers

1. Rotate all credentials previously committed to the public repository.
2. Store replacements only in Replit Secrets.
3. Back up production and verify a disposable restore.
4. Test the additive migration against the disposable database.
5. Complete the internal pilot checklist.
6. Perform responsive and keyboard QA in the deployed preview.
7. Obtain an explicit go/no-go decision before merging to `main`.

## Deferred until after the foundation

- partner-managed editing and publication;
- media upload and fulfillment;
- partner analytics;
- billing visibility;
- support tickets;
- automatic social publishing;
- ATL Legends, storefront, and AI-generated routes.

## Release decision

No-go until credential rotation and the production-like pilot are complete.
Development may continue on isolated branches without deploying or applying the
database migration.
