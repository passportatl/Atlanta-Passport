# Partner Portal Foundation

- Status: approved implementation contract
- Owner: Passport ATL
- Last updated: 2026-07-30
- Target: August 5 launch foundation

## 1. Purpose

Passport ATL partners need a dedicated account experience at `/partners` for
managing their locations, events, media, package fulfillment, billing status,
and performance information. The partner portal must remain separate from the
consumer Passport experience even when the same email address is used for both.

This document defines the security and ownership foundation required before the
partner dashboard is exposed.

## 2. Current-state audit

- `/partners` currently renders the public location-submission form.
- `/list-a-location` also renders the location-submission form.
- Clerk authentication is configured globally for the consumer application.
- Every Clerk sign-in currently triggers `ClerkVisitorBridge`, which creates or
  links a consumer visitor record.
- The database has no partner account, organization, membership, invitation, or
  listing-ownership tables.
- Location and event submissions identify contacts by email but do not establish
  durable account ownership.
- Staff can review submissions, but there is no partner-safe API.

Replacing `/partners` with a dashboard without first adding ownership checks
would risk exposing or editing another organization's information.

## 3. Locked product decisions

1. `/partners` is the partner portal entry point, not the public submission
   form.
2. `/list-a-location` remains the public location-submission route.
3. Partner navigation is separate from consumer Passport navigation.
4. A person may use the same email for a consumer Passport and a partner
   account without merging the two data models.
5. Partner-portal authentication must not automatically create a consumer
   visitor record.
6. Authentication alone does not grant partner access. Every request also
   requires an active partner membership.
7. Partner access is organization-scoped. A user can see only organizations and
   records connected to their memberships.
8. Staff approval or a secure invitation activates the initial partner
   membership.
9. Contact-email matching may help staff suggest ownership, but it must never
   silently grant access.
10. All partner edits are logged with actor, organization, record, action,
    timestamp, and safe before/after metadata.

## 4. Authentication contexts

Passport ATL may continue using Clerk as the underlying identity provider, but
the application must treat these as separate product contexts:

### Consumer

- Routes: `/sign-in`, `/sign-up`, `/passport/*`
- Resolves a Clerk user to a `visitor`
- Uses Passport navigation and member data

### Partner

- Routes: `/partners`, `/partners/sign-in`, `/partners/*`
- Resolves a Clerk user to a `partner_account` and active membership
- Uses partner navigation and organization-owned data
- Does not run consumer visitor linking while the partner context is active

### Staff

- Routes: `/admin/*`
- Uses staff authorization and action permissions
- May inspect partner records but does not impersonate a partner by default

One Clerk identity may resolve independently in more than one context.

## 5. Required data model

### `partner_accounts`

- `id`
- `clerk_user_id` (unique)
- `primary_email`
- `display_name`
- `status`: invited, active, suspended, archived
- `created_at`
- `updated_at`
- `last_login_at`

### `partner_organizations`

- `id`
- `name`
- `slug` (unique)
- `status`: pending, active, suspended, archived
- `created_at`
- `updated_at`

### `partner_memberships`

- `id`
- `partner_account_id`
- `partner_organization_id`
- `role`: owner, manager, editor, analyst, billing
- `status`: invited, active, revoked
- `invited_by_staff_id` or safe actor reference
- `accepted_at`
- `created_at`
- unique membership constraint per account and organization

### Ownership relationships

Public records retain their existing stable IDs. Ownership is explicit:

- a location/business belongs to one partner organization;
- an organizer-created event belongs to one partner organization when claimed;
- imported or Passport-curated events may remain unowned;
- media, fulfillment tasks, invoices, and analytics reference the same
  organization ID.

An ownership claim is a staff-reviewed operation. Historical source and contact
information is retained separately from ownership.

### `partner_invitations`

- secure single-use token hash;
- intended email;
- organization and role;
- expiration, acceptance, and revocation timestamps;
- inviting staff actor.

### `partner_activity_log`

- actor account ID;
- organization ID;
- action and record type/ID;
- timestamp;
- safe change summary;
- request correlation ID.

Never store authentication tokens, payment card data, or unrestricted request
bodies in the activity log.

## 6. Authorization contract

Every partner API request must:

1. validate the Clerk session;
2. resolve the partner account by Clerk user ID;
3. confirm the account is active;
4. confirm an active membership for the requested organization;
5. confirm the membership role permits the action;
6. scope every database query by organization ID;
7. record meaningful mutations in the activity log.

The client must never be trusted to supply an unrestricted organization ID.

Suggested action permissions:

- `partner.organization.view`
- `partner.members.invite`
- `partner.listing.view`
- `partner.listing.edit`
- `partner.event.view`
- `partner.event.edit`
- `partner.media.upload`
- `partner.analytics.view`
- `partner.billing.view`
- `partner.support.create`

## 7. Route and navigation contract

### Public

- `/list-a-location`: public location submission
- `/list-event`: public event submission
- Contact Us / Become a Partner links to both submission paths and partner sign
  in

### Partner

- `/partners`: sign-in prompt or dashboard redirect
- `/partners/sign-in`: partner-specific sign-in presentation
- `/partners/dashboard`
- `/partners/listings`
- `/partners/events`
- `/partners/media`
- `/partners/analytics`
- `/partners/billing`
- `/partners/support`

Partner pages must not render marketing, Passport member, or staff navigation.

## 8. Minimum launch foundation

Before August 5, the minimum safe portal is:

1. separate partner sign-in route and layout;
2. consumer visitor linking disabled in partner context;
3. partner account, organization, membership, invitation, and activity tables;
4. authenticated `/api/partner/session` endpoint returning only the current
   account's active memberships;
5. protected dashboard shell with organization switcher;
6. read-only listing summary for organization-owned records;
7. clear no-access, invited, suspended, loading, and error states;
8. staff-controlled invitation and ownership-assignment path;
9. deployment and rollback documentation.

Editing, analytics, billing, media, and support can be enabled incrementally
after this foundation passes authorization tests.

## 9. Migration rules

- Do not infer ownership automatically from a submission contact email.
- Produce a staff review queue suggesting potential organization/listing
  matches.
- Staff confirms the organization, owner, and records before invitation.
- Keep unclaimed listings public according to their existing publication and
  entitlement rules.
- Migration is additive and must not change public IDs, URLs, stamps, or event
  publication state.

## 10. Acceptance criteria

### Separation

- [ ] Visiting `/partners` never displays consumer Passport navigation.
- [ ] Partner-context sign-in does not create or link a `visitor`.
- [ ] The same Clerk identity can have independent visitor and partner records.
- [ ] Consumer sign-out and partner navigation have documented, predictable
      behavior.

### Security

- [ ] A signed-in user with no partner account receives no partner data.
- [ ] A partner can access only organizations with an active membership.
- [ ] Organization IDs in URLs or requests cannot bypass membership scope.
- [ ] Suspended accounts and revoked memberships lose access immediately.
- [ ] Partner mutations enforce role permissions server-side.
- [ ] Meaningful mutations create activity-log entries.

### Ownership

- [ ] Staff can create an organization and securely invite its first owner.
- [ ] Staff can assign existing locations and claimed events to an organization.
- [ ] Email matching never grants ownership automatically.
- [ ] Unclaimed and Passport-curated records remain valid.

### Experience

- [ ] Partner sign-in, no-access, invitation, dashboard, loading, and error
      states use a dedicated partner layout.
- [ ] The dashboard identifies the active organization and signed-in account.
- [ ] Multi-organization partners can switch only among authorized
      organizations.
- [ ] Meaningful text is never truncated.
- [ ] Mobile and keyboard navigation are supported.

### Quality

- [ ] Database constraints prevent duplicate memberships.
- [ ] API tests cover unauthenticated, unauthorized, cross-organization,
      suspended, and permitted requests.
- [ ] UI tests cover partner/consumer separation and access states.
- [ ] Schema is applied before API deployment.
- [ ] Rollback leaves additive identity and ownership data intact.

## 11. Delivery slices

### Slice 1: identity and ownership

- Add tables, constraints, and types.
- Add partner session resolver and authorization helpers.
- Add staff invitation and ownership-assignment operations.
- Add API and authorization tests.

### Slice 2: portal shell

- Move public submission off `/partners` while preserving
  `/list-a-location`.
- Add partner sign-in and dedicated layout.
- Add dashboard, organization switcher, and access states.

### Slice 3: read-only records

- Show organization locations, events, package status, and fulfillment needs.
- Keep private contact and billing fields role-gated.

### Slice 4: managed edits

- Add validated listing and event edits.
- Route changes through review/publish rules where required.
- Add media upload and fulfillment tracking.

### Slice 5: insights and operations

- Add partner-safe analytics, billing visibility, support, notifications, and
  staff activity reporting.

## 12. Explicit non-goals for the foundation

- payment-card processing;
- automatic social publishing;
- unrestricted direct publication by partners;
- public partner profiles;
- automatic ownership based on email;
- replacing the consumer or staff authentication systems;
- changing existing public listing or event URLs.

## 13. Deployment order

1. Back up the production database.
2. Apply additive partner identity and ownership schema.
3. Verify constraints and indexes.
4. Deploy partner API authorization.
5. Create and test an internal staff-owned pilot organization.
6. Deploy the partner route and dashboard behind a release flag.
7. Test unauthenticated, no-access, invited, active, revoked, and
   cross-organization cases.
8. Invite one pilot partner.
9. Monitor access failures and activity logs.
10. Enable `/partners` publicly only after the pilot passes.

Rollback should disable the portal release flag and restore the preceding
application version. Additive tables should remain in place unless a separate,
reviewed data-removal plan is approved.
