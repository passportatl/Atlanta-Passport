# GitHub Continuous Integration

## Purpose

Passport ATL uses GitHub Actions to validate proposed changes without consuming
Replit development or deployment credits. The workflow is a merge gate for
`develop` and `main`; it does not deploy or modify external systems.

## Workflow

The `Quality` workflow runs for:

- pull requests targeting `develop` or `main`;
- pushes to `develop` or `main`;
- manual runs from the GitHub Actions interface.

It uses Ubuntu, Node.js 22, pnpm 10, and the committed lockfile.

## Required checks

The validation job performs:

1. frozen dependency installation;
2. workspace TypeScript validation;
3. Passport frontend unit tests;
4. API unit tests that do not require a database;
5. production builds for workspace applications.

The two destructive bulk-undo integration suites are excluded from the
database-free API unit step because they create and delete test rows through a
real `DATABASE_URL`. They remain required during the controlled Replit
pre-release verification or a future isolated CI database job.

## Security and cost controls

- The workflow receives read-only repository contents permission.
- It does not receive production secrets.
- It does not call Replit or deploy.
- Concurrent runs for the same branch are cancelled when superseded.
- The job has a 25-minute timeout.
- Dependency installation honors the lockfile and the workspace's package-age
  safeguards.

## Branch protection recommendation

After the first successful workflow run, configure both protected branches:

- require `Typecheck, test, and build` before merging;
- require branches to be current before merging;
- prevent direct pushes to `main`;
- keep deployment as a separate, explicit operation.

Do not make the check required until its first successful run confirms the
workflow name exactly as GitHub displays it.

## Future database integration job

Add a separate PostgreSQL service-container job after the current migrations and
test cleanup behavior are verified in a disposable database. Never point
GitHub Actions at the production or shared Replit database.
