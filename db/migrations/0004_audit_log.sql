-- Migration 0004: audit_log
-- Records every admin mutation (who did what and when).

CREATE TABLE IF NOT EXISTS audit_log (
  id          bigserial   PRIMARY KEY,
  actor_id    text REFERENCES "user"(id) ON DELETE SET NULL,
  action      text        NOT NULL,   -- 'user.ban' | 'game.override.update' ...
  target_type text,                   -- 'user' | 'game' | 'image_cache'
  target_id   text,
  meta        jsonb       NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_log_created_idx
  ON audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_target_idx
  ON audit_log (target_type, target_id);