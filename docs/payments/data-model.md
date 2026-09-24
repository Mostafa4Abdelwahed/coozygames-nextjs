# Data Model & Migrations — Payments

نفس الـ migration runner الخاص بالمشروع (`scripts/migrate.mjs` + `db/migrations/*.sql`).
هذه الهجرة رقم **0006** وتتبع بعد `0005_app_settings.sql`.

## Migration 0006 — `db/migrations/0006_manual_payments.sql`

ثلاثة جداول: طرق الدفع، الدفعات، الاشتراكات.

```sql
-- 0006_manual_payments.sql

-- 1) payment_methods: طرق دفع يدوية يعرّفها الأدمن (فودافون كاش / إنستاباي ...)
CREATE TABLE IF NOT EXISTS payment_methods (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL UNIQUE,
  details     text        NOT NULL DEFAULT '',   -- رقم المحفظة / رقم الحساب + الاسم
  enabled     boolean     NOT NULL DEFAULT true,
  sort_order  integer     NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

INSERT INTO payment_methods (name, details, sort_order) VALUES
  ('فودافون كاش', '', 1),
  ('إنستاباي',   '', 2)
ON CONFLICT (name) DO NOTHING;

-- 2) payments: كل محاولة دفع يرفعها المستخدم (الإيصال في DB مش ملف)
CREATE TABLE IF NOT EXISTS payments (
  id                      uuid            PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 text            NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  method_id               uuid            NOT NULL REFERENCES payment_methods(id) ON DELETE RESTRICT,
  amount                  numeric(12,2)   NOT NULL,
  currency                text            NOT NULL DEFAULT 'EGP',
  provider_transaction_id text            NOT NULL,
  sender_name             text            NOT NULL,
  receipt_image           bytea,                     -- الإيصال مضغوط
  receipt_image_type      text,                      -- mime للصورة (image/jpeg ...)
  recipient_note          text            NOT NULL DEFAULT '',
  status                  text            NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending','approved','rejected')),
  admin_note              text,
  reviewed_by             text            REFERENCES "user"(id) ON DELETE SET NULL,
  reviewed_at             timestamptz,
  created_at              timestamptz     NOT NULL DEFAULT now(),
  updated_at              timestamptz     NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payments_status_idx ON payments (status, created_at DESC);
CREATE INDEX IF NOT EXISTS payments_user_idx    ON payments (user_id, created_at DESC);

-- 3) subscriptions: اشتراك واحد نشط لكل مستخدم (upsert على المدة عند التأكيد)
CREATE TABLE IF NOT EXISTS subscriptions (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    text        NOT NULL UNIQUE REFERENCES "user"(id) ON DELETE CASCADE,
  plan       text        NOT NULL DEFAULT 'monthly',
  started_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS subscriptions_expires_idx ON subscriptions (expires_at);
```

> `gen_random_uuid()` متاح مدمجًا في PostgreSQL 13+. سيرفر الـ docker الحالي أحدث من ذلك.

## منطق التمديد (يُنفَّذ في ترانزاكشن عند الموافقة)

`expires_at` الجديدة تُحسب من **آخر اشتراك فاعل** لو موجود، وإلا من الآن:

```sql
-- base = آخر انتهاء فاعل أو الآن
SELECT expires_at FROM subscriptions
  WHERE user_id = $1 AND expires_at > now();

-- برمجة الـ upsert النهائية (خطوة واحدة)
INSERT INTO subscriptions (user_id, plan, started_at, expires_at)
VALUES (
  $1, 'monthly',
  least(now(), COALESCE((SELECT expires_at FROM subscriptions WHERE user_id = $1), now())),
  COALESCE((SELECT expires_at FROM subscriptions WHERE user_id = $1 AND expires_at > now()), now())
    + interval '30 days'
)
ON CONFLICT (user_id) DO UPDATE SET
  started_at = EXCLUDED.started_at,
  expires_at = EXCLUDED.expires_at,
  updated_at = now();
```

## مصدر السعر

`app_settings('PREMIUM_MONTHLY_PRICE')` (من ميزة الإعدادات الحالية). القيمة نص رقمي
بالجنيه المصري، مع fallback في الكود:

```ts
// lib/billing.ts
const DEFAULT_MONTHLY_PRICE = 100
export async function getMonthlyPrice(): Promise<number> {
  const v = await getSetting('PREMIUM_MONTHLY_PRICE')
  const n = v ? Number(v) : NaN
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_MONTHLY_PRICE
}
```

يُضاف للمفتاح كـ KNOWN_SETTINGS في `lib/dashboard/settings.ts` ليظهر في صفحة الإعدادات
العامة، مع صفحة مخصصة في `/dashboard/billing` لحقل رقمي أنضف.

## استعلامات مبدئية

```sql
-- طلبات الدفعات مع بيانات المستخدم والطريقة (ترقيم)
SELECT p.id, p.amount, p.currency, p.status, p.created_at,
       u.id AS user_id, u.name AS user_name, u.email, u."phoneNumber",
       m.name AS method_name
FROM payments p
JOIN "user" u ON u.id = p.user_id
JOIN payment_methods m ON m.id = p.method_id
WHERE ($1 = '' OR p.status = $1)
ORDER BY
  CASE p.status WHEN 'pending' THEN 0 ELSE 1 END,
  p.created_at DESC
LIMIT $2 OFFSET $3;

-- ملخص الصفحة
SELECT
  count(*) FILTER (WHERE status = 'pending')  AS pending,
  count(*) FILTER (WHERE status = 'approved')
    AND created_at > date_trunc('month', now())) AS approved_this_month,
  COALESCE(sum(amount) FILTER (WHERE status = 'approved'
    AND created_at > date_trunc('month', now())), 0) AS revenue_this_month,
  (SELECT count(*) FROM subscriptions WHERE expires_at > now()) AS active_subscribers;

-- حالة اشتراك مستخدم
SELECT plan, started_at, expires_at FROM subscriptions WHERE user_id = $1;
```

## اعتبارات

- **الإيصال في DB:** `payments` سيبقى صغيرًا (صور مضغوطة ≤ ~1 MB). لو ضخم المستقبل
  ننقل الصور لـ object storage، والجدول يحتفظ بـ `receipt_image` nullable.
- **عداد إنشاء المدة:** `interval '30 days'` من **آخر انتهاء فاعل** أو الآن — أي أن
  الدفع الشهري لا يُهدر أيام الاشتراك الساري الحالي.
- **التراجع:** الـ upsert يدعم إعادة الموافقة (المدة بتزود مرة واحدة لكل دفع مقبول).
- **حذف المستخدم:** `payments` و`subscriptions` بيتمسحوا بـ `ON DELETE CASCADE`.