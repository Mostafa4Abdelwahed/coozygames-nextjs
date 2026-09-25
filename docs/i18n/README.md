# CoozyGames i18n — تعدد اللغات (عربي + إنجليزي)

- **التاريخ:** 2026-09-26
- **الحالة:** خطة (لم يُنفّذ بعد).
- **النطاق:** إضافة اللغة الإنجليزية كلغة ثانية بجانب العربية للموقع العام.
- **المكتبة:** [`next-intl`](https://next-intl.dev) (دعم رسمي لـ Next.js 16 / `proxy.ts` / `next/root-params`).

## الهدف

دعم لغتين (عربي `ar` افتراضي، إنجليزي `en`) مع:

- روابط لكل لغة عبر prefix: `/ar/...` و `/en/...`.
- redirect تلقائي من `/` حسب لغة المتصفح (والافتراضي عربي).
- تبديل الاتجاه RTL/LTR حسب اللغة.
- SEO لكل لغة (روابط + `metadata` + `hreflang` من next-intl).
- توليد ساكن (static rendering) لكل اللغات للحفاظ على الأداء الحالي.

## القرارات المعتمدة

| القرار | الاختيار | السبب |
|---|---|---|
| استراتيجية الرابط | prefix للغتين (`/ar`, `/en`) مع `localePrefix: 'always'` | المعيار الرسمي في Next.js وأفضل SEO |
| المكتبة | `next-intl` | يدعم Next.js 16 و`proxy.ts`، ويعمل في Server Components وServer Actions |
| اللغة الافتراضية | `ar` | الحفاظ على الوضع الحالي لكل زائر غير عربي/إنجليزي |
| نطاق الترجمة | الموقع العام + Auth + الحساب + Premium | لوحة التحكم للإداريين فقط |
| لوحة التحكم | تُنقل تحت `[locale]` للاتساق لكن **نصوصها تبقى عربي** | تجنّب تعقيد راوتنج مزدوج |
| الـ API | تبقى بدون prefix خارج `[locale]` | الفيتشات الحالية (`/api/*`, `/image/*`) لا تتأثر |
| الخط | `Cairo` الحالي يدعم اللاتيني | لا حاجة لخط إضافي في أول نسخة |

## النطاق

**داخل النطاق**

- الواجهة العامة: الرئيسية، `/games`, `/game/[slug]`, `/game-category/[slug]`, البحث، الـ sidebar/الهيدر.
- المصادقة والحساب: `/login`, `/register`, `/complete`, `/profile`.
- الاشتراك: `/premium` ورسائله.
- `metadata` والتصنيفات (ليبل إنجليزي).

**خارج النطاق (حاليًا)**

- ترجمة نصوص لوحة التحكم `/dashboard/*` (تبقى عربي).
- أسماء الألعاب (إنجليزي أصلًا في `data/games.json`).
- لغات إضافية غير `ar`/`en`.
- ترجمة محتوى الـ proxy/الألعاب نفسها.
- دعم locale في `proxy-server` (Wisp) — منفصل تمامًا.

## ملفات التخطيط

| الملف | المحتوى |
|---|---|
| [`README.md`](./README.md) | هذا الملف — الهدف والنطاق والقرارات |
| [`architecture.md`](./architecture.md) | الراوتنج، بنية الملفات، دمج الـ proxy، القواميس، RTL/LTR، الميتاداتا |
| [`roadmap.md`](./roadmap.md) | المراحل والمهام ومعايير القبول والمخاطر |

## مراجع سريعة للمشروع

- الراوتنج الحالي: `app/` (بدون `[locale]`)، `app/layout.tsx` (`lang="ar"`, `dir="rtl"`).
- الوسيط: `proxy.ts` (حماية auth/profile + `OPEN_PATHS`).
- الهيدر/الشِل: `components/site-shell.tsx`, `components/auth-area.tsx`, `components/sidebar-nav.tsx`.
- التصنيفات: `lib/category-meta.ts` (`AR_LABELS`, `SIDEBAR_TOP`), `lib/categories.ts`.
- الكتالوج: `data/games.json`, `lib/games.ts`.
- الميتاداتا: `app/layout.tsx`, `app/manifest.ts`.
