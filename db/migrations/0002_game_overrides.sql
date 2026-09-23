-- Migration 0002: game_overrides
-- A thin per-game overlay over data/games.json (catalog stays the source of truth).

CREATE TABLE IF NOT EXISTS game_overrides (
  slug         text PRIMARY KEY,
  hidden       boolean     NOT NULL DEFAULT false,
  featured     boolean     NOT NULL DEFAULT false,
  sort_weight  integer     NOT NULL DEFAULT 0,
  title_ar     text,
  thumb        text,
  updated_at   timestamptz NOT NULL DEFAULT now(),
  updated_by   text REFERENCES "user"(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS game_overrides_featured_idx
  ON game_overrides (featured, sort_weight DESC)
  WHERE hidden = false;