import Link from "next/link";
import { MdArrowForward, MdLockOutline } from "react-icons/md";
import { formatMoney } from "@/lib/money";

/** Full-screen "subscription required" gate replacing GameStage for non-premium users. */
export function SubscriptionGate({
  title,
  signedIn,
  price,
  backHref,
}: {
  title: string;
  signedIn: boolean;
  price: number;
  backHref: string;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-night-100">
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-night-60 bg-night-80 px-3">
        <Link
          href={backHref}
          aria-label="رجوع إلى صفحة اللعبة"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-mist-90 transition-colors hover:text-white"
        >
          <MdArrowForward size={22} />
        </Link>
        <h1 className="min-w-0 flex-1 truncate text-base font-extrabold text-white">{title}</h1>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-5 p-6 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-[linear-gradient(135deg,#6842ff,#22d3ee)] text-white">
          <MdLockOutline size={40} />
        </span>
        <div>
          <h2 className="text-2xl font-extrabold text-white">الاشتراك مطلوب لتشغيل الألعاب</h2>
          <p className="mt-2 text-sm font-semibold text-mist-50">
            تصفّح الألعاب والتصنيفات متاح مجانًا للجميع — لكن تشغيل أي لعبة يتطلب اشتراكًا مميزًا
            شهريًا بـ <span className="font-extrabold text-brand-60">{formatMoney(price, "EGP")}</span>.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {signedIn ? (
            <Link
              href="/premium/"
              className="flex h-12 items-center justify-center rounded-[30px] bg-brand-100 px-6 text-base font-extrabold text-white transition hover:bg-brand-80 active:opacity-70"
            >
              الاشتراك الآن
            </Link>
          ) : (
            <>
              <Link
                href="/login/"
                className="flex h-12 items-center justify-center rounded-[30px] bg-brand-100 px-6 text-base font-extrabold text-white transition hover:bg-brand-80 active:opacity-70"
              >
                تسجيل الدخول
              </Link>
              <Link
                href="/register/"
                className="flex h-12 items-center justify-center rounded-[30px] bg-night-80 px-6 text-base font-extrabold text-white transition hover:bg-night-60"
              >
                إنشاء حساب
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}