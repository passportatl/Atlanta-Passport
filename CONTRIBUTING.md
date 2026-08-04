# Contributing to Passport ATL

Thank you for helping build Passport ATL.

## Branches

- `main` is the production-ready branch.
- `develop` is the integration branch for upcoming work.
- Create focused branches from `develop`, using names such as
  `feature/explore-redesign`, `fix/event-date`, or `docs/api-guide`.

Open pull requests into `develop` unless a release process explicitly says
otherwise. Do not commit directly to `main`.

## Local setup

Passport ATL is a pnpm workspace. Use the Node.js version configured for the
project and install dependencies with:

```sh
pnpm install
```

Useful repository-wide checks are:

```sh
pnpm typecheck
pnpm build
```

Run any package-specific tests or checks affected by your change as well.

## Making a change

1. Update your local `develop` branch.
2. Create a focused branch from `develop`.
3. Keep code, tests, generated clients, schema changes, and documentation in
   sync.
4. Run the relevant checks.
5. Open a pull request that explains the problem, solution, verification, and
   user-visible impact.

For visual changes, include desktop and mobile evidence where applicable. For
API changes, update the OpenAPI source and regenerate dependent artifacts.

## Commit and review expectations

- Prefer small, reviewable commits with imperative commit subjects.
- Avoid unrelated formatting or refactors.
- Never commit credentials, production data, or local environment files.
- Call out migrations, rollout concerns, accessibility implications, and
  follow-up work in the pull request.
- Update [ARCHITECTURE.md](ARCHITECTURE.md), [ROADMAP.md](ROADMAP.md), or the
  [Passport ATL 2.0 documentation](docs/passport-atl-2.0/README.md) when a
  change affects those records.
