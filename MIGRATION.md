# Migrating Atlanta Passport to a new Replit workspace

This guide moves the app to a different Replit account/workspace. The code travels
via GitHub; secrets, database data, and integrations must be re-set up by hand
because they are stored in Replit (not in the repo).

## 1. Code (GitHub)

The project is connected to GitHub at `github.com/passportatl/Atlanta-Passport`.

In the destination Replit account:

1. Create a new Repl → **Import from GitHub**.
2. Choose (or paste the URL of) `passportatl/Atlanta-Passport`.
3. If the destination account uses a different GitHub login, grant it access to the
   repo first (add it as a collaborator, or temporarily make the repo public).

Replit installs dependencies automatically (pnpm monorepo).

## 2. Secrets

Add these in the new workspace's **Secrets** tool:

- `DATABASE_URL`
- `SESSION_SECRET`
- `RESEND_API_KEY`
- `VITE_GOOGLE_MAPS_API_KEY`
- `CLERK_SECRET_KEY`
- `CLERK_PUBLISHABLE_KEY`
- `VITE_CLERK_PUBLISHABLE_KEY`

## 3. Database

The Postgres data (visitors, stamps, businesses, redemptions) does NOT travel with
the code. Two options:

**Keep existing data** — create a Postgres database in the new workspace (this sets
`DATABASE_URL`), upload the backup file, then restore:

```bash
gunzip atlanta-passport-db.sql.gz
psql "$DATABASE_URL" -f atlanta-passport-db.sql
```

To make a fresh backup from the old workspace before moving:

```bash
pg_dump "$DATABASE_URL" --no-owner --no-privileges -f atlanta-passport-db.sql
gzip atlanta-passport-db.sql
```

**Start empty** — skip the restore and build the schema fresh:

```bash
pnpm --filter @workspace/db run push
```

> Note: keep DB dumps OUT of source control. The `.backups/` folder is for local
> download only.

## 4. Integrations

Reconnect these in the new workspace (they are tied per-workspace and do not transfer):

- **Clerk** (auth) — Replit-managed Clerk tenant.
- **Google Sheets** + **Google Drive** connectors (partner sheet sync / export).

## 5. Verify

- `pnpm run typecheck` — full typecheck across all packages.
- Start the workflows and load the preview.
- Test a sign-up + stamp collection end to end.
