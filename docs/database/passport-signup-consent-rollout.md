# Passport signup consent rollout

## Scope

Passport signup now records required Terms of Service and Privacy Policy
acceptance separately from the optional newsletter and promotions preference.
The marketing checkbox starts selected in the interface but remains optional.
Existing visitor records are **not** automatically opted into marketing.

## Database changes

Apply the Drizzle schema in `lib/db/src/schema/visitors.ts` before deploying the
application code. The change adds:

- `terms_accepted_at`
- `terms_version`
- `privacy_accepted_at`
- `privacy_version`
- `marketing_opt_in` (non-null, default `false`)
- `marketing_consent_updated_at`

The repository currently uses `drizzle-kit push` rather than checked-in SQL
migrations. In the deployment environment, run the database package's normal
schema-push command against a verified backup before starting the updated app.

## Existing members

Existing members keep `marketing_opt_in = false`. On their next Passport visit,
they are sent to `/passport/consent`, where they must accept the current Terms
and Privacy Policy and may independently choose whether to receive marketing.

## Verification

Before production release:

1. Back up the production database.
2. Apply the schema update in a non-production environment.
3. Confirm an existing member reaches the consent page.
4. Confirm a new email signup stores both legal timestamps and the marketing
   choice.
5. Confirm a social signup reaches the consent gate if Clerk metadata is not
   retained.
6. Confirm changing the marketing preference in Passport Rewards updates the
   same visitor record.
7. Have counsel review the Terms of Service and consent language.
