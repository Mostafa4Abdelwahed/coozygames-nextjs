# Roadmap — i18n

## Phase 0 — تخطيط (منتهي)

- [x] حسم القرارات (prefix للّغتين، `next-intl`، الافتراضي عربي، النطاق العام فقط).
- [x] كتابة ملفات `docs/i18n/`.

---

## Phase 1 — البنية التحتية (منتهي ✅)

**الهدف:** تثبيت next-intl وربطه بالراوتنج والـ proxy بدون تغيير النصوص بعد.

### المهام

- [x] `npm install next-intl`.
- [x] لفّ `next.config.ts` بـ `createNextIntlPlugin()` (مع الحفاظ على `headers` و `images`).
- [x] `i18n/routing.ts` (`locales: ['ar','en']`, `defaultLocale: 'ar'`, `localePrefix: 'always'`).
- [x] `i18n/request.ts` (قراءة اللغة من `next/root-params` + `hasLocale`).
- [x] `i18n/navigation.ts` (`createNavigation`).
- [x] `messages/ar.json` + `messages/en.json` (هيكل فاضي مبدئي).
- [x] نقل كل `app/*` (عدا `api`, `image`, `manifest.ts`, الأيقونات) إلى `app/[locale]/*`.
- [x] `app/[locale]/layout.tsx`: `<html lang dir>` + `NextIntlClientProvider` + `SiteShell` + `generateStaticParams`.
- [x] حذف `app/layout.tsx` القديم بعد نقل منطقه.
- [x] دمج `createMiddleware(routing)` داخل `proxy.ts` مع إبقاء منطق auth/profile + `stripLocale` + تحديث `matcher`.

### معايير القبول

- ✅ `/` يحوّل إلى `/ar` (وإلى `/en` لو لغة المتصفح إنجليزية).
- ✅ `/ar` و`/en` يعملان، و`/api/*` و`/image/*` بدون prefix.
- ✅ `proxy.ts` لا يكسر حماية login/profile.
- ✅ `npm run build` ينجح مع توليد `ar` و`en` (3212 صفحة ثابتة).

---

## Phase 2 — نقل الصفحات والروابط (منتهي ✅)

**الهدف:** كل التنقّل الداخلي واعي باللغة.

### المهام

- [x] استبدال `next/link` → `@/i18n/navigation` Link في كل الكومبوننتس والصفحات العامة.
- [x] استبدال `redirect`/`router.push`/`usePathname` بالنسخ من `@/i18n/navigation`.
- [x] تحديث `components/site-shell.tsx` (بايباس `/play` و`/dashboard` مع إزالة الـ locale).
- [x] تحديث `components/dashboard/shell.tsx` وروابط الداشبورد للـ prefix (النصوص تبقى عربي).
- [x] بناء `next` param واعي باللغة في login/register/complete.
- [x] `generateStaticParams` لصفحات `game/[slug]` و`game-category/[slug]` (locales × slugs).

### معايير القبول

- ✅ التنقّل بين الصفحات يحافظ على اللغة الحالية.
- ✅ صفحة اللعبة/التصنيف تعمل على اللغتين وتتولّد ساكنة.
- ✅ لا روابط داخلية تفقد الـ prefix.

---

## Phase 3 — ترجمة الموقع العام (منتهي ✅)

**الهدف:** إزالة كل النصوص العربية المكتوبة يدويًا من الواجهة العامة.

### المهام

- [x] تعبئة `messages/ar.json` و`messages/en.json` بالـ namespaces (`Common`, `Nav`, `Home`, `Games`, `Game`, `Search`, `Pager`, `Metadata`, `GameStage`, `SubscriptionGate`).
- [x] `lib/category-meta.ts`: إضافة `EN_LABELS` + تحويل `SIDEBAR_TOP` لمفاتيح.
- [x] ترجمة: `site-shell`, `sidebar-nav`, `games-section`, `search-overlay`, `pager`, `game-card/poster/stage`, الرئيسية، `/games`, `/game/[slug]`, `/game-category/[slug]`.
- [x] تدويل `metadata` لكل الصفحات العامة عبر `getTranslations`.
- [x] إضافة namespaces `GameStage` و `SubscriptionGate` للقوائم.

### معايير القبول

- ✅ لا نصوص عربية hardcoded في الواجهة العامة (غير محتوى الكتالوج).
- ✅ تبديل اللغة يعرض كل النصوص مترجمة بدون fallback عربي في `en`.
- ✅ البحث يعمل بالعربية والإنجليزية.

---

## Phase 4 — Auth + الحساب + Premium (منتهي ✅)

**الهدف:** ترجمة كل تدفقات المستخدم المسجّل.

### المهام

- [x] ترجمة `login-form`, `register-form`, `complete-profile-form`, `profile-form`, `account-section`.
- [x] ترجمة صفحات `login`, `register`, `complete`, `profile`.
- [x] ترجمة `premium-panel`, `premium-history`, `premium-status-card`, `subscription-gate`, صفحة `premium`.
- [x] ترجمة رسائل Server Actions (`lib/actions/complete`, `premium`) عبر namespace `Auth` و `Premium`.
- [x] مبدّل اللغة في الهيدر (كرة أرضية + قائمة ar/en).

### معايير القبول

- ✅ كل رسائل التحقق والأخطاء مترجمة على اللغتين.
- ✅ التبديل من صفحة محمية يحافظ على نفس الصفحة والـ query.
- ✅ `npm run lint` + `npx tsc --noEmit` ناجحان (الأخطاء كلها في proxy assets الموجودة مسبقاً).

---

## Phase 5 — RTL/LTR وتلميع

**الهدف:** تجربة صحيحة على اللغتين.

### المهام

- [ ] مراجعة أيقونات الاتجاه (`MdChevronLeft`) في مسار التنقل والبحث والترقيم.
- [ ] التأكد أن `max-sm:rtl:translate-x-full` و logical props تعمل على `ltr`.
- [ ] مراجعة `dir="ltr"` الصريحة (أرقام/إيميلات/توكنات) تبقى صحيحة.
- [ ] مراجعة `manifest.ts` و PWA (هل نحتاج `en` أم يبقى عربي).
- [ ] `npm run build` نهائي + فحص يدوي سريع للصفحات الرئيسية على اللغتين.

### معايير القبول

- لا انكسار تخطيط على `ltr` (الـ sidebar، الهيدر، الكروت).
- الروابط والصور والألعاب تعمل بلا أخطاء على `/en/*`.

---

## المخاطر

| المخاطرة | التخفيف |
|---|---|
| تعارض `createMiddleware` مع منطق auth في `proxy.ts` | تشغيل intl أولًا وإرجاع response الخاص به مع auth، واختبار سيناريوهات login/complete/profile |
| `/image/*` أو `/api/*` تتأثر بالـ prefix | استثناؤها في `matcher` والتحقق بعمل الصور والألعاب |
| كسر التوليد الساكن للألعاب (عدد الصفحات ×2) | `generateStaticParams` صحيح + قياس زمن/حجم البناء |
| نسيان `next/link` في مكان ما | مسح بـ `rg "from 'next/link'"` / `next/navigation` قبل الإنهاء |
| روابط `next` param القديمة (بدون locale) | بناء المسار واعيًا باللغة أو الاعتماد على redirect الـ middleware |
| نص عربي متبقٍ في الواجهة العامة | مسح بـ `rg "[\p{Arabic}]"` على الصفحات العامة في نهاية Phase 3 |