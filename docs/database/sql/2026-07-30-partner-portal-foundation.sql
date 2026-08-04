BEGIN;

CREATE TABLE IF NOT EXISTS partner_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id text NOT NULL,
  primary_email text NOT NULL,
  display_name text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS partner_accounts_clerk_user_id_unique
  ON partner_accounts (clerk_user_id);
CREATE INDEX IF NOT EXISTS partner_accounts_primary_email_idx
  ON partner_accounts (primary_email);

CREATE TABLE IF NOT EXISTS partner_organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS partner_organizations_slug_unique
  ON partner_organizations (slug);

CREATE TABLE IF NOT EXISTS partner_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_account_id uuid NOT NULL REFERENCES partner_accounts(id),
  partner_organization_id uuid NOT NULL REFERENCES partner_organizations(id),
  role text NOT NULL DEFAULT 'editor',
  status text NOT NULL DEFAULT 'invited',
  invited_by_actor text,
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS partner_memberships_account_organization_unique
  ON partner_memberships (partner_account_id, partner_organization_id);
CREATE INDEX IF NOT EXISTS partner_memberships_organization_idx
  ON partner_memberships (partner_organization_id);

CREATE TABLE IF NOT EXISTS partner_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_organization_id uuid NOT NULL REFERENCES partner_organizations(id),
  intended_email text NOT NULL,
  role text NOT NULL DEFAULT 'editor',
  token_hash text NOT NULL,
  invited_by_actor text NOT NULL,
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS partner_invitations_token_hash_unique
  ON partner_invitations (token_hash);
CREATE INDEX IF NOT EXISTS partner_invitations_email_idx
  ON partner_invitations (intended_email);

CREATE TABLE IF NOT EXISTS partner_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_account_id uuid REFERENCES partner_accounts(id),
  partner_organization_id uuid NOT NULL REFERENCES partner_organizations(id),
  action text NOT NULL,
  record_type text NOT NULL,
  record_id text,
  change_summary text,
  request_correlation_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS partner_activity_log_organization_created_idx
  ON partner_activity_log (partner_organization_id, created_at);

ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS partner_organization_id uuid;
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS partner_organization_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'businesses_partner_organization_id_fk'
  ) THEN
    ALTER TABLE businesses
      ADD CONSTRAINT businesses_partner_organization_id_fk
      FOREIGN KEY (partner_organization_id) REFERENCES partner_organizations(id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'events_partner_organization_id_fk'
  ) THEN
    ALTER TABLE events
      ADD CONSTRAINT events_partner_organization_id_fk
      FOREIGN KEY (partner_organization_id) REFERENCES partner_organizations(id);
  END IF;
END $$;

COMMIT;
