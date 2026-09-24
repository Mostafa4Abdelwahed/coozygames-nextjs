# Architecture — Payments

## المسارات

| المسار | النوع | الصلاحية | الوظيفة |
|---|---|---|---|
| `/premium` | RSC | أي زائر (يسجّل دخول عند الدفع) | عرض السعر، طرق الدفع، الحالة، السجل |
| `/premium/actions.ts` | server action | مستخدم دخيل | إرسال طلب دفع جديد |
| `/api/uploads/receipt/[id]` | route handler | **صاحب الدفع أو أدمن** | تقديم صورة الإيصال |
| `/dashboard/billing` | RSC | أدمن | الطلبات، السعر، طرق الدفع |
| `/dashboard/billing/actions.ts` | server actions | أدمن (`requireAdmin`) | موافقة/رفض، سعر، طرق |
| `/play/[slug]` | RSC (gate) | الجميع | لو مش فاعل → شاشة "الاشتراك مطلوب" |

## تدفق الشراء (المستخدم)

1. يدخل `/premium` → يشوف السعر الحالي (من `getMonthlyPrice`) وطرق الدفع المفعلة.
2. يعبّي فورم: طريقة الدفع + رقم العملية + اسم المُرسِل + صورة إيصال (اختياري الملاحظة).
3. `submitPayment` (سيرفر):
   - يتحقق من الجلسة، يقرأ السعر **من DB** (لا يأخذ `amount` من الفورما أبدًا).
   - يتحقق من حجم الصورة (≤ 5MB) وصيغتها، يضغطها بـ `sharp` (resize ≤ 1600px، JPEG q80،
     fallback WebP) ويخزن `bytea + mime`.
   - يكتب صف `payments` بـ `status='pending'`.
4. `revalidatePath('/premium')` → المستخدم يرى "دفعة قيد المراجعة".

## تدفق الموافقة (الأدمن)

1. `/dashboard/billing` يعرض المعلّقة أولًا، وديالوج يعرض صورة الإيصال
   (من `/api/uploads/receipt/[id]`).
2. `reviewPayment(state, formData)` بـ `requireAdmin`:
   - **موافقة:** في ترانزاكشن — update الدفعة (`approved`, `reviewed_by`, `admin_note`,
     `reviewed_at`) + upsert الاشتراك (منطق التمديد في `data-model.md`).
   - **رفض:** update الدفعة فقط (`rejected` + ملاحظة)— لا مساس بالاشتراك.
   - `logAudit(actorId, 'billing.payment.approve|reject', 'payment', id, {...})`.
   - `revalidatePath('/dashboard/billing')` + `revalidatePath('/premium')`.

## Gating اللعب

`app/play/[slug]/page.tsx` (سيرفر) هو نقطة العبور الوحيدة لكل الألعاب:
المستخدم يفتح `/play/mario` → لو `subscriptions.expires_at > now()` غير موجودة
لصاحب الجلسة، تُعرض `SubscriptionGate` (شاشة ثيم ليلي) بدل `GameStage`:
- غير دخيل → زر "سجّل الدخول" + زر `/premium`.
- دخيل → السعر الحالي + زر `/premium`.
- **لا يُتحمّل بروكسي ولا يُسجَّل `play_event`** للطلبات الممنوعة.

العرض/التصفح (`/`, `/games`, `/game/[slug]`, `/game-category/...`) لا يتأثر.

## الأمان

- **السعر:** يُقرأ من DB داخل الـ action — رفع الـ amount من العميل مستحيل.
- **الإيصالات:** المسار مقيد (المالك أو `role='admin'`)؛ ويُتحقق من الـ id أنه uuid صالح.
- **الإجراءات:** كل action في الداشبورد تحت `requireAdmin()` + `logAudit`.
- **التمديد:** يُنفَّذ في ترانزاكشن واحدة؛ الموافقة مرتين على نفس الدفعة مستحيلة
  (`reviewed_at` يمنعها منطقيًا — نتأكد من `status='pending'` قبل الـ update).
- **الرفع:** حجم الصورة، الصيغ المسموحة (`image/jpeg|png|webp`)، والضغط إجباري —
  لا يُخزن الملف الأصلي.
- **المنطق الزمني:** الفاعلية تُحسب دائمًا `expires_at > now()` على مستوى DB — لا يوجد
  مؤقّت/عقد، ولا حاجة لتثبيت حالة.

## إعادة التصفح (Revalidation)

تغييرات الاشتراك (موافقة/رفض) تعيد توليد صفحات متعلقة بالمال:
`revalidatePath('/premium')`, `revalidatePath('/profile')`, `revalidatePath('/dashboard/billing')`.
صفحة اللعب نفسها ديناميكية على الجلسة فلا تحتاج cache-busting إضافي.

## الاعتماديات الموجودة (غير مضافة)

`sharp` (موجود)، `pg` (موجود)، `better-auth` sessions (موجود)، `@/lib/utils` + shadcn.
لا dependency جديدة في هذا الـ MVP.