-- 0001_admin_plugin.sql
-- Columns required by the better-auth `admin` plugin.
-- See docs/dashboard/data-model.md for details.

ALTER TABLE "user"
  ADD COLUMN IF NOT EXISTS role          text DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS banned        boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "banReason"   text,
  ADD COLUMN IF NOT EXISTS "banExpires"  timestamptz;

-- Backfill existing rows (plugin treats NULL as the default role).
UPDATE "user" SET role = 'user' WHERE role IS NULL;

ALTER TABLE "session"
  ADD COLUMN IF NOT EXISTS "impersonatedBy" text;