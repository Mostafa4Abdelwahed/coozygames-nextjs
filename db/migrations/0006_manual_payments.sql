-- 0006_manual_payments.sql
-- Manual monthly subscription payments (see docs/payments/*)

-- 1) payment_methods: manual payment channels defined by the admin.
CREATE TABLE IF NOT EXISTS payment_methods (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL UNIQUE,
  details     text        NOT NULL DEFAULT '',
  enabled     boolean     NOT NULL DEFAULT true,
  sort_order  integer     NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

INSERT INTO payment_methods (name, details, sort_order) VALUES
  ('فودافون كاش', '', 1),
  ('إنستاباي',   '', 2)
ON CONFLICT (name) DO NOTHING;

-- 2) payments: each submitted manual payment (receipt stored compressed in DB).
CREATE TABLE IF NOT EXISTS payments (
  id                      uuid            PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 text            NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  method_id               uuid            NOT NULL REFERENCES payment_methods(id) ON DELETE RESTRICT,
  amount                  numeric(12,2)   NOT NULL,
  currency                text            NOT NULL DEFAULT 'EGP',
  provider_transaction_id text            NOT NULL,
  sender_name             text            NOT NULL,
  receipt_image           bytea,
  receipt_image_type      text,
  recipient_note          text            NOT NULL DEFAULT '',
  status                  text            NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note              text,
  reviewed_by             text            REFERENCES "user"(id) ON DELETE SET NULL,
  reviewed_at             timestamptz,
  created_at              timestamptz     NOT NULL DEFAULT now(),
  updated_at              timestamptz     NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payments_status_idx ON payments (status, created_at DESC);
CREATE INDEX IF NOT EXISTS payments_user_idx    ON payments (user_id, created_at DESC);

-- 3) subscriptions: one active subscription row per user (extended on approval).
CREATE TABLE IF NOT EXISTS subscriptions (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    text        NOT NULL UNIQUE REFERENCES "user"(id) ON DELETE CASCADE,
  plan       text        NOT NULL DEFAULT 'monthly',
  started_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS subscriptions_expires_idx ON subscriptions (expires_at);