-- 0007_access_links.sql
-- One-time "activation links": single-use URLs that grant a subscription
-- when a user completes their profile (see /complete/?token=...).

CREATE TABLE IF NOT EXISTS access_links (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  token             text        NOT NULL UNIQUE,
  note              text        NOT NULL DEFAULT '',
  subscription_days integer     NOT NULL DEFAULT 30
                  CHECK (subscription_days > 0 AND subscription_days <= 36500),
  expires_at        timestamptz,   -- NULL = never expires
  created_by        text        NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  used_by           text        REFERENCES "user"(id) ON DELETE SET NULL,
  used_at           timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS access_links_created_idx ON access_links (created_at DESC);
CREATE INDEX IF NOT EXISTS access_links_expires_idx ON access_links (expires_at);
CREATE INDEX IF NOT EXISTS access_links_used_idx    ON access_links (used_at);