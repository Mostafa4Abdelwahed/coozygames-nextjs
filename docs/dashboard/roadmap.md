# Roadmap — Dashboard

## Phase 0 — تخطيط (منتهي)

- [x] حسم القرارات (overrides في DB، admin plugin، تتبع لعب فعلي، `/dashboard`).
- [x] كتابة ملفات `docs/dashboard/`.

---

## Phase 1 — الأساس + MVP

**الهدف:** دخول آمن للداشبورد + عرض بيانات للقراءة.

### المهام
- [ ] **Migrations:** إنشاء `db/migrations/0001_admin_plugin.sql` + `scripts/migrate.mjs`
      + إضافة `"migrate"` في `package.json`.
- [ ] تفعيل `admin` plugin في `lib/auth.ts` و`adminClient()` في `lib/auth-client.ts`.
- [ ] تعيين أول أدمن (`ADMIN_USER_IDS` أو SQL seed) والتأكد من ظهور `role` في الجلسة.
- [ ] `app/dashboard/layout.tsx` (فحص أدمن) + `components/dashboard/shell.tsx`.
- [ ] تعديل `components/site-shell.tsx` لتجاهل `/dashboard`.
- [ ] تعديل `proxy.ts` لاستثناء `/dashboard` من تحويل البروفايل.
- [ ] `lib/dashboard/queries.ts` (عدّادات + قوائم مستخدمين/ألعاب).
- [ ] صفحات: `/dashboard` (عدّادات)، `/dashboard/users` (قراءة/بحث/ترقيم)،
      `/dashboard/games` (قراءة/بحث).
- [ ] إضافة رابط "لوحة التحكم" في `components/auth-area.tsx` للأدمن فقط.

### معايير القبول
- مستخدم عادي يفتح `/dashboard` → يُحوَّل للرئيسية؛ زائر → `/login`.
- الأدمن يشوف العدّادات وقائمة المستخدمين والألعاب.
- لا تسريب أي بيانات حساسة للـ client (لا `playUrl`، لا أسرار).
- `npm run build` و`npm run lint` ناجحان.

---

## Phase 2 — الإدارة الفعلية + التتبّع

**الهدف:** تعديل حقيقي من الداشبورد + إحصائيات حقيقية.

### المهام
- [ ] migrations: `0002_game_overrides.sql`, `0003_play_events.sql`, `0004_audit_log.sql`.
- [ ] `lib/dashboard/overrides.ts` + دمجها في الصفحات العامة
      (`app/page.tsx`, `app/games/page.tsx`, `app/game-category/[slug]/page.tsx`, `app/game/[slug]/page.tsx`).
- [ ] Server Actions لإدارة الـ overrides + `revalidatePath` بعد كل تعديل.
- [ ] `/api/track/play` + ربطه في `components/game-stage.tsx`.
- [ ] إجراءات المستخدمين عبر `authClient.admin.*` (دور/حظر/جلسات) + `audit_log`.
- [ ] `/dashboard/analytics` (أشهر الألعاب/التصنيفات، DAU، توزيع زمني).
- [ ] إظهار عدد اللعب الحقيقي على الكروت (cached aggregate).

### معايير القبول
- تعديل override يظهر على الصفحات العامة خلال ثوانٍ (بعد revalidation) بدون rebuild كامل.
- حظر مستخدم يمنعه فعليًا من الدخول/اللعب.
- `play_events` تتسجّل لكل بدء لعبة، والتحليلات تعكسها.
- كل إجراء إداري مسجّل في `audit_log`.

---

## Phase 3 — التشغيل والتحسينات

**الهدف:** مراقبة وصيانة + تنظيف تقني.

### المهام
- [ ] إضافة `/health` HTTP في `proxy-server/server.mjs` + `WISP_HEALTH_URL`.
- [ ] `/dashboard/ops`: كاش الصور (عدد/حجم/أكبر ملفات) + تنظيف آمن + حالة Wisp.
- [ ] `POST /api/admin/ops/purge-cache` مع تأكيد و`audit_log`.
- [ ] (اختياري) تجميع مسبق `play_daily_stats` لتسريع التحليلات.
- [ ] (اختياري) تحسين `proxy.ts` (cookie-cache session) لتقليل DB roundtrip — مرجع:
      `docs/performance/nextjs-performance-audit.md` (P1-2).
- [ ] (اختياري) نقل الكتالوج بالكامل إلى Postgres (CRUD كامل) — قرار كبير منفصل.

### معايير القبول
- صفحة ops تعرض أرقام صحيحة، والتنظيف آمن ولا يكسر صورًا مستخدمة.
- حالة Wisp تظهر صح (متصل/غير متصل).

---

## الملفات المتوقّع إضافتها/تعديلها

```
db/migrations/0001_admin_plugin.sql      (جديد)
db/migrations/0002_game_overrides.sql    (جديد)
db/migrations/0003_play_events.sql       (جديد)
db/migrations/0004_audit_log.sql         (جديد)
scripts/migrate.mjs                      (جديد)
lib/auth.ts                              (تعديل: admin plugin)
lib/auth-client.ts                       (تعديل: adminClient)
lib/dashboard/queries.ts                 (جديد)
lib/dashboard/overrides.ts               (جديد)
app/dashboard/layout.tsx                 (جديد)
app/dashboard/page.tsx                   (جديد)
app/dashboard/users/page.tsx             (جديد)
app/dashboard/games/page.tsx             (جديد)
app/dashboard/analytics/page.tsx         (جديد)
app/dashboard/ops/page.tsx               (جديد)
app/api/track/play/route.ts              (جديد)
app/api/admin/ops/purge-cache/route.ts   (جديد)
components/dashboard/*                   (جديد)
components/site-shell.tsx                (تعديل)
components/auth-area.tsx                 (تعديل)
components/game-stage.tsx                (تعديل: تتبّع)
proxy.ts                                 (تعديل: استثناء /dashboard)
proxy-server/server.mjs                  (تعديل: /health)
package.json                             (تعديل: migrate script)
```

---

## المخاطر والافتراضات

| المخاطرة | التخفيف |
|---|---|
| admin plugin يحتاج migration قبل التفعيل | Phase 1 أول مهمة هي الـ migration |
| overrides في DB مع صفحات static → تغييرات لا تظهر | on-demand `revalidatePath` بعد كل تعديل |
| `play_events` تكبر بسرعة | فهارس مناسبة + caching + تجميع مسبق لاحقًا |
| كتابة على `image-cache/` من عملية أخرى (تنظيف) | قصر التنظيف على variants غير مستخدمة + حذر مع الملفات قيد الكتابة |
| صعوبة اختبار الداشبورد محليًا (يحتاج DB + أدمن) | seed SQL + `ADMIN_USER_IDS` + بيانات تجريبية |
| نسيان تسجيل audit | helper واحد `logAudit()` يُستخدم في كل Action |

**افتراضات:**
- نفس تطبيق Next ونفس الـ deploy (`deploy/`).
- مسار `/dashboard` (قابل للتغيير لـ `/admin` بسهولة).
- عربي RTL في الواجهة.
- الكتالوج يفضل في `data/games.json` في هذه المراحل.
