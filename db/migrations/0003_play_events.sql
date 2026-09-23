-- Migration 0003: play_events
-- Append-only record of each game launch.

CREATE TABLE IF NOT EXISTS play_events (
  id          bigserial   PRIMARY KEY,
  game_slug   text        NOT NULL,
  user_id     text,                 -- nullable (anonymous visitor)
  session_id  text,                 -- better-auth session id (nullable)
  referrer    text,
  country     text,                 -- optional (from CDN header)
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS play_events_created_idx
  ON play_events (created_at DESC);
CREATE INDEX IF NOT EXISTS play_events_game_idx
  ON play_events (game_slug, created_at DESC);
CREATE INDEX IF NOT EXISTS play_events_user_idx
  ON play_events (user_id)
  WHERE user_id IS NOT NULL;