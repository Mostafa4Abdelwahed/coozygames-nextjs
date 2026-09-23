-- Migration 0005: app_settings
-- Runtime key/value configuration ("env from the dashboard").
-- Code reads these via getSetting() with a fallback to process.env,
-- so admins can override env-like values without redeploying.

CREATE TABLE IF NOT EXISTS app_settings (
  key_name   text PRIMARY KEY,
  value      text        NOT NULL DEFAULT '',
  is_secret  boolean     NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS app_settings_updated_idx
  ON app_settings (updated_at DESC);