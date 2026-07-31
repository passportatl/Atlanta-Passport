# August 5 Launch Readiness Audit

Status: conditional release candidate — no-go for production

Audit date: July 31, 2026

Release branch: `release/2026-08-05`

Release commit at audit start: `a40f14f9b4767ab0dc95bd83ee0ae466db754f5a`

## Decision summary

Passport ATL 2.0 is code-complete for the approved August 5 foundation and can
remain frozen on the release branch while expansion work continues elsewhere.
It is not yet approved for production. The remaining blockers are operational
and security checks that require the deployment environment, a disposable
database, and an explicit go/no-go decision.

No release branch change may be deployed, merged to `main`, or applied to the
production database until every blocking item below is complete.

## Code and documentation ready

- The `main` → `develop` → feature/release branch workflow is established.
- Authenticated Explore filtering, ranking, cards, map/list coordination, and
  entitlement behavior are implemented and covered by the current quality
  suite.
- Event submission, review, package metadata, approval/publishing, upgrade, and
  event detail foundations are implemented.
- Passport signup consent and communication preferences are implemented.
- Legal content is centralized so the footer can link to the full terms instead
  of repeating a long disclaimer on every page.
- Consumer, partner, and staff authentication contexts are separated.
- Partner organizations, memberships, invitations, ownership assignments, and
  activity logging have additive schema and API foundations.
- A separate `/partners` portal shell and staff Partner Hub are implemented.
- ATL Legends and Shop remain intentionally limited to coming-soon member
  placeholders for this release.
- Additive migration, rollout, rollback, credential-rotation, and release
  runbooks are checked in.
- Tracked-file credential scanning is part of the GitHub quality workflow.
- The latest `develop` quality run passed.
- The current tracked-file credential scan passed.

## Manual verification still required

- Back up production and prove that the backup can be restored to a disposable
  database.
- Review and apply the additive partner migration to that disposable database.
- Run the reconciliation queries and confirm that no records are assigned
  unexpectedly.
- Complete the internal partner pilot using a staff-owned organization,
  invitation, location, and event.
- Verify the consumer, partner, and staff sign-in contexts with production-like
  Clerk settings.
- Complete responsive checks on representative mobile, tablet, and desktop
  widths.
- Complete keyboard navigation, focus order, labels, and visible focus checks.
- Confirm public Explore, Events, Stamps, Rewards, partner portal, and staff
  workflows in the deployed preview.
- Confirm monitoring, rollback ownership, and the final release operator.

## Hard release blockers

1. Rotate every credential that previously appeared in the public repository.
2. Store replacement credentials only in the deployment secret store.
3. Complete the disposable backup/restore and migration rehearsal.
4. Complete the internal partner pilot.
5. Complete production-like responsive, keyboard, and authentication QA.
6. Record an explicit go/no-go decision.

Credential rotation is intentionally scheduled for August 1. Deferring it does
not permit deployment in the meantime.

## Deferred product scope

The following are not required for the August 5 foundation:

- partner-managed editing and direct publication;
- partner media upload and fulfillment;
- partner analytics and insights;
- billing and invoice visibility;
- support ticket workflows;
- automatic social publishing;
- full ATL Legends editorial publishing;
- storefront commerce and fulfillment;
- public AI-generated routes.

These items require separate specifications, acceptance criteria, security
reviews, and delivery branches. Their design may begin while this release
candidate remains frozen.

## Expansion work authorization

ATL Legends, the Passport Storefront, and AI-driven routes may proceed on
branches created from `develop` because:

- launch code is isolated on `release/2026-08-05`;
- the latest automated quality run passed;
- no expansion work will be merged into the release branch;
- no expansion work will be deployed before its own review.

## Final go/no-go checklist

- [ ] Previously exposed credentials rotated
- [ ] Replacement secrets verified in the deployment environment
- [ ] Production backup completed
- [ ] Disposable restore verified
- [ ] Additive migration rehearsal passed
- [ ] Reconciliation queries passed
- [ ] Internal partner pilot passed
- [ ] Responsive QA passed
- [ ] Keyboard and accessibility QA passed
- [ ] Authentication-context QA passed
- [ ] Rollback owner and release operator confirmed
- [ ] Final go/no-go recorded

Until every item is checked, the decision remains **no-go**.
