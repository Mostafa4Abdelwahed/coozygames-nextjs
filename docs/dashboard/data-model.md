# Data Model & Migrations — Dashboard

## 1. الوضع الحالي

- الجداول الموجودة يديرها **better-auth**: `"user"`, `"session"`, `"account"`,
  `"verification"` (أسماء camelCase بين علامات تنصيص، زي `"phoneNumber"` / `"userId"`).
- **لا يوجد نظام migrations في الريبو.** تم إنشاء الجداول يدويًا أو عبر أداة سابقة.
- الكتالوج حاليًا في `data/games.json` (ملف) — **مش** في DB.

## 2. Migration Runner

نضيف runner بسيط بدون dependencies جديدة (بيستخدم `pg` الموجود):

```
db/migrations/0001_admin_plugin.sql
db/migrations/0002_game_overrides.sql
db/migrations/0003_play_events.sql
db/migrations/0004_audit_log.sql
scripts/migrate.mjs
```

### `scripts/migrate.mjs` (تصميم)

1. يقرأ `db/migrations/*.sql` مرتّبة بالاسم.
2. ينشئ جدول التتبّع إن لم يوجد:
   ```sql
   CREATE TABLE IF NOT EXISTS _migrations (
     name       text PRIMARY KEY,
     applied_at timestamptz NOT NULL DEFAULT now()
   );
   ```
3. لأي ملف غير مسجّل: يشتغّل داخل `BEGIN … COMMIT` ثم يسجّل الاسم.
4. عند الفشل: `ROLLBACK` وطبع الخطأ و`process.exit(1)`.

يُضاف لـ `package.json`:
```json
"migrate": "node scripts/migrate.mjs"
```

> بديل: `@better-auth/cli` — تم استبعاده لتفادي dependency إضافية؛ لو احتجناه
> لاحقًا نقدر نولّد منه SQL يدويًا.

---

## 3. Migration 0001 — Admin plugin columns

مطلوبة لتفعيل `better-auth` admin plugin (انظر `architecture.md` §4).

```sql
-- 0001_admin_plugin.sql

ALTER TABLE "user"
  ADD COLUMN IF NOT EXISTS role          text DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS banned        boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "banReason"   text,
  ADD COLUMN IF NOT EXISTS "banExpires"  timestamptz;

-- backfill الصفوف القديمة
UPDATE "user" SET role = 'user' WHERE role IS NULL;

ALTER TABLE "session"
  ADD COLUMN IF NOT EXISTS "impersonatedBy" text;
```

> بعد التطبيق: فعّل الـ plugin في `lib/auth.ts`، وبعدها عيّن أول أدمن:
> `UPDATE "user" SET role='admin' WHERE email='…';` أو عبر `ADMIN_USER_IDS`.

---

## 4. Migration 0002 — `game_overrides`

مصدر الحقيقة للكتالوج يفضل `data/games.json`. الجدول ده **طبقة تعديلات** فوقه
(إخفاء/تمييز/ترتيب/عنوان عربي/صورة بديلة). الصفوف القليلة فقط اللي الأدمن غيّرها.

```sql
-- 0002_game_overrides.sql

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
```

**قواعد الدمج** (`lib/dashboard/overrides.ts`):
- `hidden = true` → تُستبعد اللعبة من كل القوائم العامة (لكن صفحتها `/game/[slug]`
  تفضل 200 ولا 404 — قرار قابل للتغيير).
- `featured = true` → تُرفع لبداية الأقسام المميّزة.
- `sort_weight` → ترتيب تنازلي داخل القسم.
- `title_ar` / `thumb` → يتجاوزان قيم JSON عند العرض.

---

## 5. Migration 0003 — `play_events`

تتبّع فعلي لكل بدء لعبة (append-only).

```sql
-- 0003_play_events.sql

CREATE TABLE IF NOT EXISTS play_events (
  id          bigserial   PRIMARY KEY,
  game_slug   text        NOT NULL,
  user_id     text,                 -- nullable (زائر مجهول)
  session_id  text,                 -- معرّف جلسة better-auth (nullable)
  referrer    text,
  country     text,                 -- اختياري (من هيدر الـ CDN)
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS play_events_created_idx
  ON play_events (created_at DESC);
CREATE INDEX IF NOT EXISTS play_events_game_idx
  ON play_events (game_slug, created_at DESC);
CREATE INDEX IF NOT EXISTS play_events_user_idx
  ON play_events (user_id)
  WHERE user_id IS NOT NULL;
```

> **بلا FK على `"user"`** عن قصد: الحدث append-only ولازم يفضل حتى لو المستخدم اتحذف.
> مصدر الكتابة: `POST /api/track/play` من `components/game-stage.tsx` عند بدء التشغيل.

---

## 6. Migration 0004 — `audit_log`

تسجيل كل عملية إدارية (مَن فعل ماذا ومتى).

```sql
-- 0004_audit_log.sql

CREATE TABLE IF NOT EXISTS audit_log (
  id          bigserial   PRIMARY KEY,
  actor_id    text REFERENCES "user"(id) ON DELETE SET NULL,
  action      text        NOT NULL,   -- 'user.ban' | 'game.override.update' | 'image_cache.purge' ...
  target_type text,                   -- 'user' | 'game' | 'image_cache'
  target_id   text,
  meta        jsonb       NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_log_created_idx
  ON audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_target_idx
  ON audit_log (target_type, target_id);
```

---

## 7. استعلامات مبدئية (نظرة عامة / تحليلات)

```sql
-- عدّادات النظرة العامة
SELECT
  (SELECT count(*) FROM "user")                              AS users,
  (SELECT count(*) FROM "session" WHERE "expiresAt" > now()) AS active_sessions,
  (SELECT count(*) FROM play_events WHERE created_at > now() - interval '24 hours') AS plays_24h,
  (SELECT count(*) FROM play_events)                         AS plays_total;

-- أشهر الألعاب آخر 7 أيام
SELECT game_slug, count(*) AS plays
FROM play_events
WHERE created_at > now() - interval '7 days'
GROUP BY game_slug
ORDER BY plays DESC
LIMIT 10;

-- المستخدمون النشطون يوميًا (DAU) آخر 14 يوم
SELECT date_trunc('day', created_at)::date AS day, count(DISTINCT user_id) AS users
FROM play_events
WHERE user_id IS NOT NULL AND created_at > now() - interval '14 days'
GROUP BY day
ORDER BY day;

-- قائمة المستخدمين + ترقيم + بحث
SELECT id, name, email, "phoneNumber", role, banned, "createdAt"
FROM "user"
WHERE ($1 = '' OR name ILIKE '%'||$1||'%' OR email ILIKE '%'||$1||'%' OR "phoneNumber" LIKE '%'||$1||'%')
ORDER BY "createdAt" DESC
LIMIT $2 OFFSET $3;
```

## 8. اعتبارات

- **الأداء:** `play_events` هيكبر بسرعة. نضيف لاحقًا تجميع يومي (`play_daily_stats`)
  أو partitioning لو لزم — مش مطلوب في MVP.
- **الترحيل للإنتاج:** الـ migrations تشتغل مرة واحدة عند النشر (`npm run migrate`)
  قبل تشغيل `next start`، أو كـ step منفصل في الـ deploy.
- **التراجع:** كل migration لازم يكون آمن (`IF NOT EXISTS`)؛ تغييرات هدّامة تحتاج
  migration عكسي منفصل.
- **الكتالوج:** أي بيانات ألعاب جديدة تفضل في `data/games.json` عبر سكريبت الـ scrape
  (`scripts/scrape-poki-catalog.py`)، مش في DB.
