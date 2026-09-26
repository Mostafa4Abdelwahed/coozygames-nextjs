-- 0008_partner_api.sql
-- Reseller ("partner") API: external systems can mint one-time access links.
-- A `label` makes the call idempotent (same label -> same link), and partner
-- links have no dashboard author, so created_by must become nullable.

ALTER TABLE access_links ADD COLUMN IF NOT EXISTS label text;

ALTER TABLE access_links ALTER COLUMN created_by DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS access_links_label_key
  ON access_links (label) WHERE label IS NOT NULL;
