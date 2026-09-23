# Features — Dashboard

كل وحدة موصوفة بـ: الغرض، مصدر البيانات، الواجهة، الإجراءات (API/Actions)، الحالات
الطرفية، والمرحلة.

---

## 1. نظرة عامة (Overview) — `/dashboard`

**الغرض:** صورة سريعة عن حالة الموقع.

**المصدر:** `pool` (عدّادات) + `image-cache/` (حجم الكاش) + Wisp health.

**المحتوى (Cards):**
- إجمالي المستخدمين / الجلسات النشطة.
- لعب آخر 24 ساعة / إجمالي اللعب.
- عدد الألعاب (من `ALL_GAMES`) وعدد التصنيفات.
- حجم وعدد ملفات `image-cache/`.
- حالة Wisp (متصل / غير متصل).

**رسم بياني:** خط بسيط للّعب آخر 14 يوم (من `play_events`).

**الإجراءات:** لا يوجد (قراءة فقط).

**الحالات الطرفية:** `play_events` فاضية → نعرض "لا بيانات بعد" بدل رسم فاضي.

**المرحلة:** Phase 1 (العدّادات) — الرسم في Phase 2.

---

## 2. إدارة المستخدمين (Users) — `/dashboard/users`

**الغرض:** إدارة حسابات المستخدمين والجلسات.

**المصدر:** جداول better-auth (`"user"`, `"session"`) + admin plugin endpoints.

**الواجهة:**
- جدول: الاسم، الإيميل، الهاتف، الدور، الحالة (نشط/محظور)، تاريخ التسجيل.
- بحث (name/email/phone) + ترقيم (نعيد استخدام نمط `components/pager.tsx`).
- فلتر: الدور / المحظورين.

**الإجراءات:**
| الإجراء | الآلية |
|---|---|
| تغيير الدور | `authClient.admin.setRole({ userId, role })` |
| حظر / فك حظر | `authClient.admin.banUser` / `unbanUser` (مع `banReason`, `banExpiresIn`) |
| إنهاء جلسة / كل الجلسات | `admin.listUserSessions` / `admin.revokeUserSession(s)` |
| حذف مستخدم | `admin.removeUser` (بتأكيد إجباري) |
| تعديل بيانات (اسم/إيميل) | `admin.adminUpdateUser` |

**الحالات الطرفية:**
- منع الأدمن من حظر/حذف نفسه (`YOU_CANNOT_BAN_YOURSELF` من الـ plugin).
- منع حذف آخر أدمن.
- كل إجراء كتابة → تسجيل في `audit_log` + `revalidatePath` لو أثّر على العامة.

**المرحلة:** Phase 1 (عرض/بحث/ترقيم) → Phase 2 (كل الإجراءات).

---

## 3. إدارة الألعاب (Games) — `/dashboard/games`

**الغرض:** التحكم في عرض الألعاب دون تعديل ملف JSON.

**المصدر:** `ALL_GAMES` (من `data/games.json`) + جدول `game_overrides`.

**الواجهة:**
- جدول/شبكة الألعاب: الصورة، العنوان، التصنيف، `plays` (حقيقي من `play_events`)،
  وحالة override (مخفي/مميّز/وزن).
- بحث + فلترة بالتصنيف + فلتر (مخفي / مميّز / معدّل).
- نموذج تعديل override للعبة: `hidden`, `featured`, `sort_weight`, `title_ar`, `thumb`.
- زر "إعادة تعيين" يمسح الـ override (يرجع لقيم JSON).

**الإجراءات:**
- Server Action `upsertGameOverride(slug, values)`.
- Server Action `clearGameOverride(slug)`.
- بعد كل تعديل: `revalidatePath('/')`, `/games/`, `/game/[slug]/`, `/game-category/[categorySlug]/`.
- تسجيل في `audit_log`.

**الحالات الطرفية:**
- لعبة مخفية: تُستبعد من القوائم لكن صفحتها تفضل شغّالة (قرار قابل للتغيير).
- `sort_weight`/`featured` يغيّران ترتيب الأقسام في الصفحة الرئيسية.
- تعارض slug: المفتاح الأساسي يمنع التكرار.

**المرحلة:** Phase 1 (عرض/بحث) → Phase 2 (overrides + revalidation).

---

## 4. التحليلات (Analytics) — `/dashboard/analytics`

**الغرض:** إحصائيات لعب حقيقية بدل الأرقام الوهمية.

**المصدر:** `play_events` (تُكتب من `/api/track/play`).

**المحتوى:**
- لعب إجمالي / يومي / شهري.
- أشهر 10 ألعاب (آخر 7/30 يوم).
- أشهر التصنيفات (نجمع على `game_slug` ثم نربط بالتصنيف من الكتالوج).
- مستخدمون نشطون يوميًا (DAU) — للمسجّلين فقط.
- توزيع زمني (ساعات الذروة).

**الواجهة:** جداول + رسم بسيط (CSS/SVG أو مكتبة خفيفة — نفضّل بدون مكتبة جديدة).

**الحالات الطرفية:**
- الأحداث المجهولة (`user_id = null`) تُحسب في "اللعب" لكن مش في DAU.
- تجنّب الاستعلامات الثقيلة: caching 60s أو تجميع مسبق لاحقًا.

**المرحلة:** Phase 2.

---

## 5. مراقبة التشغيل (Ops) — `/dashboard/ops`

**الغرض:** صحة النظام وموارد السيرفر.

**المصدر:** نظام الملفات (`image-cache/`) + Wisp health + `pool`.

**المحتوى:**
- كاش الصور: عدد الملفات، الحجم الكلي، أكبر الملفات، عدد الملفات > 1MB.
- إجراء **تنظيف**: حذف الـ variants القديمة/اليتيمة (بحد أقصى آمن + تأكيد).
- حالة Wisp: ping لـ `/health` (نضيفه في `proxy-server/server.mjs`).
- عدّادات DB: حجم الجداول، عدد `play_events`.
- (اختياري) آخر أخطاء `[image-cache]` من اللوجات.

**الإجراءات:**
- `POST /api/admin/ops/purge-cache` (بعد تأكيد) → تسجيل في `audit_log`.
- فحص Wisp: fetch داخلي لـ `WISP_HEALTH_URL`.

**الحالات الطرفية:**
- Wisp غير متاح → نظهر "غير متصل" بدل خطأ.
- التنظيف ممنوع أثناء وجود طلبات جارية (نتعامل بحذر مع الملفات قيد الكتابة).

**المرحلة:** Phase 3 (بعد إضافة `/health` للـ Wisp).

---

## 6. تتبّع اللعب (Cross-cutting) — `/api/track/play`

**الغرض:** تسجيل حدث بدء لعبة.

**التنفيذ:**
- `POST /api/track/play` بجسم `{ slug }`.
- يتحقق أن الـ slug موجود في الكتالوج (منع spam).
- يجيب `session` (اختياري) من `auth.api.getSession`.
- `INSERT INTO play_events (game_slug, user_id, session_id, referrer, country)`.
- Rate limit بسيط (per IP/session).
- يتنادى من `components/game-stage.tsx` داخل `run()` بعد نجاح `ensureProxy()` وقبل/بعد
  `go(playUrl)` — نستخدم `fetch(..., { keepalive: true })` حتى لا يعطّل التشغيل.

**الحالات الطرفية:** فشل التتبّع لا يؤثر على تشغيل اللعبة (fire-and-forget).

**المرحلة:** Phase 2.
