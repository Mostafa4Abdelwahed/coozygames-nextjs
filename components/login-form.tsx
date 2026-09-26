"use client";

import { useState } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { FcGoogle } from "react-icons/fc";
import { MdVisibility, MdVisibilityOff } from "react-icons/md";
import { authClient } from "@/lib/auth-client";
import { COUNTRY_CODES, normalizePhoneNumber, validatePhoneNumber } from "@/lib/phone";

function toServerMessage(message: string): string {
  if (message.includes("Invalid phone number or password")) return "رقم الهاتف أو كلمة المرور غير صحيحة";
  if (message.includes("not found") || message.includes("User not found")) return "لا يوجد حساب بهذا الرقم";
  if (message.includes("not verified")) return "رقم الهاتف غير مؤكد";
  return "حدث خطأ، حاول مرة أخرى";
}

export function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const nextPath = next ?? "/";
  const [region, setRegion] = useState("EG");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [phoneError, setPhoneError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [serverError, setServerError] = useState("");
  const [pending, setPending] = useState(false);

  function validatePhone(value: string): string {
    return validatePhoneNumber(value, region);
  }

  const inputClass =
    "h-12 w-full rounded-xl border border-transparent bg-night-40 px-4 text-start text-base font-bold text-white outline-none placeholder:text-mist-50 focus:border-brand-100";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const phoneErr = validatePhone(phone);
    const passErr = password ? "" : "كلمة المرور مطلوبة";
    setPhoneError(phoneErr);
    setPasswordError(passErr);
    setServerError("");
    if (phoneErr || passErr) return;

    setPending(true);
    const normalized = normalizePhoneNumber(phone, region);
    if (!normalized) {
      setPending(false);
      setPhoneError("رقم الهاتف غير صحيح، تحقق من الرقم وكود الدولة");
      return;
    }
    const { error } = await authClient.signIn.phoneNumber({
      phoneNumber: normalized,
      password,
      rememberMe: remember,
    });
    setPending(false);
    if (error) {
      setServerError(toServerMessage(error.message ?? ""));
      return;
    }
    router.push(nextPath);
    router.refresh();
  }

  async function handleGoogle() {
    setServerError("");
    const { error } = await authClient.signIn.social({
      provider: "google",
      callbackURL: nextPath,
    });
    if (error) setServerError(toServerMessage(error.message ?? ""));
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex w-full flex-col gap-4">
      <button
        type="button"
        onClick={handleGoogle}
        className="flex h-12 items-center justify-center gap-2 rounded-xl bg-night-60 text-sm font-extrabold text-white transition hover:bg-night-40"
      >
        <FcGoogle size={20} />
        المتابعة عبر Google
      </button>

      <div className="flex items-center gap-3 text-xs font-bold text-mist-50">
        <span className="h-px flex-1 bg-night-60" />
        أو
        <span className="h-px flex-1 bg-night-60" />
      </div>

      <div>
        <label htmlFor="login-phone" className="mb-1.5 block text-sm font-bold text-white">
          رقم الهاتف
        </label>
        <div className="flex gap-2" dir="ltr">
          <select
            value={region}
            onChange={(e) => {
              setRegion(e.target.value);
              setPhoneError("");
              setServerError("");
            }}
            aria-label="كود الدولة"
            className="h-12 w-28 shrink-0 rounded-xl border border-transparent bg-night-40 px-2 text-left text-sm font-bold text-white outline-none focus:border-brand-100"
          >
            {COUNTRY_CODES.map((c) => (
              <option key={c.code} value={c.code} className="bg-night-80">
                {c.code} {c.dial}
              </option>
            ))}
          </select>
          <input
            id="login-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              setPhoneError("");
              setServerError("");
            }}
            onBlur={() => {
              if (phone) setPhoneError(validatePhone(phone));
            }}
            placeholder="1xxxxxxxxx"
            aria-invalid={phoneError !== ""}
            aria-describedby={phoneError ? "login-phone-error" : undefined}
            className={`${inputClass} text-left ${phoneError ? "border-red-500 focus:border-red-500" : ""}`}
          />
        </div>
        {phoneError && (
          <p id="login-phone-error" role="alert" className="mt-1.5 text-xs font-bold text-red-400">
            {phoneError}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="login-password" className="mb-1.5 block text-sm font-bold text-white">
          كلمة المرور
        </label>
        <div className="relative">
          <input
            id="login-password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setPasswordError("");
              setServerError("");
            }}
            placeholder="••••••••"
            aria-invalid={passwordError !== ""}
            aria-describedby={passwordError ? "login-password-error" : undefined}
            className={`${inputClass} pe-12 ${passwordError ? "border-red-500 focus:border-red-500" : ""}`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
            className="absolute inset-e-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-mist-50 transition hover:text-white"
          >
            {showPassword ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
          </button>
        </div>
        {passwordError && (
          <p id="login-password-error" role="alert" className="mt-1.5 text-xs font-bold text-red-400">
            {passwordError}
          </p>
        )}
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-sm font-bold text-white">
        <input
          type="checkbox"
          checked={remember}
          onChange={(e) => setRemember(e.target.checked)}
          className="h-4 w-4 accent-brand-100"
        />
        ابقَ مسجل الدخول
      </label>

      {serverError && (
        <p role="alert" className="rounded-xl bg-red-500/15 px-4 py-2.5 text-center text-sm font-bold text-red-400">
          {serverError}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="flex h-12 items-center justify-center rounded-[30px] bg-brand-100 text-base font-extrabold text-white transition hover:bg-brand-80 active:opacity-70 disabled:opacity-60"
      >
        {pending ? "جارٍ تسجيل الدخول..." : "تسجيل الدخول"}
      </button>

      <p className="text-center text-sm font-semibold text-mist-50">
        جديد هنا؟{" "}
        <Link href={`/register/?next=${encodeURIComponent(nextPath)}`} className="font-bold text-brand-60 transition hover:text-white">
          إنشاء حساب
        </Link>
      </p>
    </form>
  );
}