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

## Phase 5 — RTL/LTR وتلميع (منتهي ✅)

**الهدف:** تجربة صحيحة على اللغتين.

### المهام

- [x] مراجعة أيقونات الاتجاه (`MdChevronLeft`) في مسار التنقل والبحث والترقيم.
- [x] التأكد أن `max-sm:rtl:translate-x-full` و logical props تعمل على `ltr`.
- [x] مراجعة `dir="ltr"` الصريحة (أرقام/إيميلات/توكنات) تبقى صحيحة.
- [x] مراجعة `manifest.ts` و PWA (يبقى عربي).
- [x] `npm run build` نهائي + فحص يدوي سريع للصفحات الرئيسية على اللغتين.
- [x] إصلاح تمرير دوال `icon` للكومبوننتس Client (serialization issue).
- [x] استبدال `categoryLabelAr` بـ `categoryLabel` الداعمة للـ locale.
- [x] ترجمة `GamePoster` و `GameCard` للعربية والإنجليزية.

### معايير القبول

- ✅ لا انكسار تخطيط على `ltr` (الـ sidebar، الهيدر، الكروت).
- ✅ الروابط والصور والألعاب تعمل بلا أخطاء على `/en/*`.
- ✅ أيقونات الاتجاه صحيحة للـ RTL/LTR.
- ✅ لا دوال non-serializable تمرر لـ Client Components.

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

---

## Phase 6 — Dashboard localization (مخطّط 📝)

**الهدف:** ترجمة واجهة الداشبورد كاملة (`/ar/dashboard` و `/en/dashboard`) مع إضافة `LocaleSwitcher` في الهيدر، وأرقام Western ثابتة في كل الإحصائيات.

**القرارات:**
- تبديل اللغة من داخل الداشبورد يتم عبر **نفس `LocaleSwitcher`** المُستخدم في الموقع (مع تعديل واحد فقط: الزرّ يوضع في هيدر الداشبورد).
- **الأرقام (counts, money, IDs)** تظل `toLocaleString('en-US')` في **كلا اللغتين** — لغة الواجهة ولاّ الأرقام تيجي arabic-Indic.
- البيانات من قاعدة البيانات (`user.name`، `accessLinks.note`، `title_ar`) **محتوى** ولا تخضع للترجمة.
- التحويل من العربي الصريح إلى الـ key يعتمد **نفس نمط Phase 4**:
  - Server Actions ترجع `{ error: 'invalidDays' }` (مفتاح).
  - الـ Client Components تترجم المفتاح عبر `useTranslations('Dashboard')`.

---

### Phase 6.1 — الأساس: shell + nav + messages (D1)

#### المهام

- [ ] إنشاء namespace **`Dashboard`** في `messages/ar.json` و `messages/en.json`، مقسّم كالتالي:
  - `Dashboard.common` → `dashboard`, `menu`, `menuOpen`, `menuClose`, `goToSite`, `signOut`, `myAccount`, `admin`, `user`,
  - `Dashboard.nav` → `overview`, `analytics`, `users`, `billing`, `accessLinks`, `games`, `ops`, `settings`, `section.general`, `section.admin`
  - `Dashboard.overview` → `title`, `subtitle`, `users`, `activeSessions`, `plays24h`, `playsTotal`, `games`, `categories`
  - `Dashboard.analytics` → `title`, `subtitle`, `search`, `dayCount`, `totalPlays`, `last24h`, `last7d`, `last30d`, `playsOnDay`, `noData`
  - `Dashboard.users` → `title`, `subtitle`, `search`, `role`, `name`, `email`, `createdAt`, `userActions`, `totalCount`, `empty`, `confirmDelete`, `confirmDeleteMessage`, `noUser`, `cannotDeleteSelf`
  - `Dashboard.games` → `title`, `subtitle`, `search`, `slug`, `plays`, `category`, `totalGames`, `empty`, `overrideFor`
  - `Dashboard.billing` → `title`, `subtitle`, `pending`, `approvedThisMonth`, `activeSubscribers`, `receipt`, `review`, `approve`, `reject`, `adminNote`, `noImage`, `amount`, `method`, `sender`, `txId`, `userNote`, `adminNoteField`, `status`, `managePaymentMethods`, `monthlyPrice`, `egp`, `priceSaved`
  - `Dashboard.accessLinks` → `title`, `subtitle`, `createLink`, `note`, `subscriptionDays`, `validityDays`, `zeroNeverExpires`, `copy`, `copied`, `delete`, `confirmDeleteTitle`, `confirmDeleteMessage`, `cancel`, `active`, `used`, `expired`, `totalCount`, `empty`, `revoke`, `sendToCustomer`, `linkBurns`, `invalidDays` (action key), `invalidValidity` (action key), `tokenRequired` (action key), `tokenNotFound` (action key)
  - `Dashboard.settings` → `title`, `subtitle`, `add`, `edit`, `delete`, `save`, `cancel`, `saveOverride`, `saved`, `deleted`, `key`, `value`, `secret`, `show`, `hide`, `noValue`, `overrideFromDb`, `custom`, `fromEnv`, `badgeOverride`, `badgeCustom`, `badgeFromEnv`, `editTitle`, `editDescription`, `addTitle`, `addDescription`, `confirmDeleteTitle`, `confirmDeleteMessage`, `keyPatternHint`, `currentValue`, `noOverrides`, `clear`, `invalidation`, `overrideEnv`, `overrideSaved`
  - `Dashboard.ops` → `title`, `subtitle`, `sectionCache`, `sectionDb`, `filesTotal`, `originalFiles`, `convertedCopies`, `largerThan1mb`, `noData`, `refresh`, `cleanCache`, `cleaning`, `cleanSuccess`, `cleanFailed`, `cleanNetwork`, `cacheHint`, `eventsPlays`, `auditLogs`, `overrides`, `purgeTitle`, `confirmPurge`, `connectionError`, `loading`
  - `Dashboard.actions` (مفاتيح أخطاء الـ Server Actions): `invalidDays`, `invalidValidity`, `tokenRequired`, `tokenNotFound`, `daysOutOfRange`, `validityOutOfRange`, `invalidPrice`, `invalidPaymentMethod`, `settingsKeyRequired`, `settingsValueRequired`, `settingsKeyInvalid`, `gameNotFound`, `roleRequired`, `cannotDeleteSelf`, `cannotChangeOwnRole`, `cannotDeleteAdmin`
  - `Dashboard.status` (شارات/حالات عامة): `pending`, `approved`, `rejected`, `cancelled`, `active`, `expired`, `used`

- [ ] `components/dashboard/shell.tsx`:
  - استبدال كل النصوص العربية (`القائمة`, `إغلاق القائمة`, `فتح القائمة`, `لوحة التحكم`, `الموقع`, `خروج`, `حسابي`, `العودة للموقع`, `تسجيل الخروج`, `أدمن`, `؟`) بـ `useTranslations('Dashboard.common')` و `useTranslations('Dashboard.nav')`.
  - إضافة `<LocaleSwitcher />` (المكوّن الموجود فعلاً في `components/locale-switcher.tsx`) في الـ `<header>` قبل `UserMenu` (مع `ms-auto` يحركه، أو في مجموعة آيقونات يمين الهيدر).
  - التأكد أن `aria-label` للأزرار مأخوذة من `t(...)` بدل النصوص الصلبة.
  - إضافة `getTranslations({ locale, namespace: 'Dashboard.common' })` للـ `aria-label` و الـ fallback إن احتاج (`fallback` للأحرف `admin` switch).

- [ ] `components/dashboard/dashboard-nav.tsx`:
  - تحويل الـ `navItems` من `{ label: 'نص عربي' }` إلى `{ labelKey: 'overview' }` (اسم المفتاح داخل `Dashboard.nav`) والـ component يحوّله عبر `t(labelKey)`.

- [ ] `app/[locale]/dashboard/layout.tsx`:
  - تحويل `metadata` (الـ title العربي الثابت `لوحة التحكم | Coozy Games`) إلى `generateMetadata({ params })` مع `getTranslations({ locale, namespace: 'Dashboard.common' })` يستخدم `t('dashboard')` ثم يُركّب `|` + site name.

---

### Phase 6.2 — صفحات الـ Server Components (D2)

#### المهام

- [ ] `app/[locale]/dashboard/page.tsx` (`overview`):
  - توقيع جديد: `params: Promise<{ locale: string }>`.
  - `await getTranslations({ locale, namespace: 'Dashboard.overview' })`.
  - ترجمة كل `label` الـ 6 بطاقات + الـ `<h1>` والـ `<p>` الوصفي.

- [ ] `app/[locale]/dashboard/analytics/page.tsx`:
  - توقيع جديد + `getTranslations({ locale, namespace: 'Dashboard.analytics' })`.
  - نصوص البطاقات + العنوان + الوصف + صفوف الجدول + وقت (`formatDate` مدركة للـ locale: `new Intl.DateTimeFormat(locale, {...})`).
  - الأرقام تبقى `toLocaleString('en-US')`.

- [ ] `app/[locale]/dashboard/users/page.tsx`:
  - ترجمة العنوان والوصف وسطور الجدول (role, name, email, createdAt) + الترقيم + رسالة الفراغ.

- [ ] `app/[locale]/dashboard/games/page.tsx`:
  - ترجمة العنوان والوصف + أعمدة الجدول + `totalGames` + رسالة الفراغ + نص العدّاد (`{total} لعبة`).

- [ ] `app/[locale]/dashboard/billing/page.tsx`:
  - ترجمة العنوان والوصف + بطاقات الإحصاء الثلاث + رسالة الفراغ + أرباح المستلمة (تستدعي `receiptDialog`).

- [ ] `app/[locale]/dashboard/access-links/page.tsx`:
  - ترجمة العنوان والوصف + بطاقات الإحصاء الثلاث + جدول القائمة + رسالة الفراغ + النصوص داخل الجدول (`روابط مستخدمة` بالإنجليزية `Used links`).

- [ ] `app/[locale]/dashboard/ops/page.tsx`:
  - ترجمة العنوان والوصف + قسم الكاش + قسم الـ DB + النصائح.

- [ ] `app/[locale]/dashboard/settings/page.tsx`:
  - ترجمة العنوان والوصف + رسائل placeholder.

- [ ] كل الصفحات تضيف `if (!hasLocale(routing.locales, locale)) notFound()` قبل `getTranslations` (نفس النمط في صفحات الـ Game).

#### قرارات

- الأرقام تستمر `toLocaleString('en-US')` في كل صفحات overview/analytics/ops/billing.
- التواريخ تُنسق عبر `new Intl.DateTimeFormat(locale, ...)` بدل `ar-EG` الصريح (لتجنّب فرض العربية في الـ EN).

---

### Phase 6.3 — Server Actions + المكونات (D3)

#### المهام

- [ ] **`app/[locale]/dashboard/access-links/actions.ts`**:
  - `createLink` → `error: 'invalidDays'`، `error: 'invalidValidity'`.
  - `deleteLink` → `error: 'tokenRequired'`، `error: 'tokenNotFound'`.

- [ ] **`app/[locale]/dashboard/billing/actions.ts`**:
  - `error: 'invalidPrice'`، `error: 'invalidPaymentMethod'`، `error: 'txIdRequired'`، `error: 'senderRequired'`، `error: 'receiptRequired'`، `error: 'fileTooLarge'`، `error: 'fileTypeInvalid'`، `error: 'fileNotImage'`، `error: 'paymentMethodInvalid'`.
  - تأكد أن المفاتيح متطابقة مع `lib/actions/premium` (نفس الأسماء) أو متطابقة مع `Dashboard.actions` keys الجديدة.

- [ ] **`app/[locale]/dashboard/games/actions.ts`**:
  - `error: 'gameNotFound'`، `error: 'invalidSlug'`.

- [ ] **`app/[locale]/dashboard/settings/actions.ts`**:
  - `error: 'settingsKeyInvalid'`، `error: 'settingsKeyRequired'`.

- [ ] **`app/[locale]/dashboard/users/actions.ts`**:
  - `error: 'cannotDeleteSelf'`، `error: 'cannotChangeOwnRole'`، `error: 'cannotDeleteAdmin'`، `error: 'userNotFound'`.

- [ ] **`components/dashboard/access-links/access-link-form.tsx`**:
  - استبدال كل النصوص بـ `useTranslations('Dashboard.accessLinks')`.
  - `state.error` يمر من خلال `t(state.error)` بدل العرض الخام.

- [ ] **`components/dashboard/access-links/access-link-actions.tsx`**:
  - ترجمة `aria-label` (نسخ/حذف) + أزرار التنبيه.

- [ ] **`components/dashboard/billing/receipt-dialog.tsx`**:
  - ترجمة كل النصوص (الحالات الثلاث كبادج + أزرار approve/reject + admin note + التحقق من الصورة) + `t(state.error)`.

- [ ] **`components/dashboard/billing/price-form.tsx`** + **`payment-methods-manager.tsx`**: ترجمة كل النصوص.

- [ ] **`components/dashboard/user-manager.tsx`**: ترجمة دور المستخدم + أعمدة + تأكيدات الحذف + تعريب `state.error` (مع `'cannotDeleteSelf'` رسالة تظهر كـ danger).

- [ ] **`components/dashboard/game-override-form.tsx`**: ترجمة كل الحقول + placeholder + أزرار الحفظ/الإزالة + aria-label.

- [ ] **`components/dashboard/settings-manager.tsx`**: ترجمة كل النصوص (إضافة/تعديل/حذف/سرّي/عام/إظهار/إخفاء/المفاتيح الحالية). الـ badges (`تجاوز/مخصّص/من الـ env`) تأخذ من المفاتيح الجديدة.

- [ ] **`components/dashboard/ops-purger.tsx`**: ترجمة كل الرسائل، واستبدال `data?.error` الخام بـ `t(state.error ?? 'cleanFailed')`، و fallback `t('connectionError')`.

- [ ] **`components/dashboard/filter-select.tsx`**: حاليًا خالي من العربي لكن يجب التأكد أنه يستخدم `aria-label` من الـ parent (أو إضافة `t('filterAria')` إذا احتاج).

- [ ] جميع الـ Client Components تضيف `"use client"` في أول سطر (بعضها قد يكون missing — تأكد).

#### قرارات

- مفاتيح الـ Action مُعرّفة مرة في `Dashboard.actions` لكلا اللغتين لتجنّب التكرار مع باقي الـ premium/complete namespaces. الـ client component سيستخدم `useTranslations('Dashboard.actions')` عند التعامل مع `state.error`.

---

### Phase 6.4 — التحقق والاختبار (D4)

#### المهام

- [ ] فحص `rg "[\p{Arabic}]"` داخل `app/[locale]/dashboard/**` و`components/dashboard/**` — الباقي المتوقع فقط: قوائم `LOG_LEVEL`/'-----' في التعليقات إن وُجد، ومسارات الـ regex.
- [ ] `npm run build` ومراجعة أنه لا يوجد `MISSING_MESSAGE` جديد في السجلات (سيظهر في الـ static generation لو في مفتاح ناقص).
- [ ] تأكيد يدوي (في المتصفح أو بسكربت `next dev`) لـ `/ar/dashboard` و `/en/dashboard`:
  - التبديل من الداشبورد عبر `LocaleSwitcher` يحافظ على نفس الصفحة.
  - تشغيل كل action (create link, revoke, approve/reject, settings save/delete, user edit/delete, game override) على اللغتين بدون نص مكشوف.
  - توجيه الأدمن العادي من `/en/dashboard` يذهب إلى `/en/` بدل `/`.
- [ ] تأكيد أن التبديل يحافظ على الحالة: rollback من action موجه للـ URL المحلي.
- [ ] فحص `aria-label` على الأزرار الأيقونية في `shell.tsx` و `dashboard-nav.tsx`.
- [ ] تأكيد أن badges الـ settingsManager و receiptDialog تعرض النص المترجم، لا الـ enum من DB.

### معايير قبول Phase 6

- ✅ الداشبورد كامل بكل أقسامه مترجم على `/ar/dashboard` و `/en/dashboard`.
- ✅ `LocaleSwitcher` ظاهر في هيدر الداشبورد ويعمل في الاتجاهين.
- ✅ لا نصوص عربية hardcoded في كود الواجهة (فقط في `messages/ar.json` والتعليقات).
- ✅ الأخطاء من Server Actions مترجمة من خلال `t(state.error)`.
- ✅ `npm run build` ينجح بدون `MISSING_MESSAGE`.
- ✅ الأرقام تبقى Western digits في كلا اللغتين.
