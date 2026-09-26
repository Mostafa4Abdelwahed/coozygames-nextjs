"use client";

import { useState } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { FcGoogle } from "react-icons/fc";
import { MdVisibility, MdVisibilityOff } from "react-icons/md";
import { authClient } from "@/lib/auth-client";
import { COUNTRY_CODES, normalizePhoneNumber, validatePhoneNumber } from "@/lib/phone";
import { useTranslations } from "next-intl";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function toServerMessage(message: string, t: ReturnType<typeof useTranslations>): string {
  if (message.includes("already exists") || message.includes("already registered"))
    return t("accountExists");
  return t("serverError");
}

export function RegisterForm({ next }: { next?: string }) {
  const router = useRouter();
  const nextPath = next ?? "/profile/";
  const [name, setName] = useState("");
  const [region, setRegion] = useState("EG");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    phone?: string;
    email?: string;
    password?: string;
    terms?: string;
  }>({});
  const [serverError, setServerError] = useState("");
  const [pending, setPending] = useState(false);
  const t = useTranslations("Auth");

  const inputClass =
    "h-12 w-full rounded-xl border border-transparent bg-night-40 px-4 text-start text-base font-bold text-white outline-none placeholder:text-mist-50 focus:border-brand-100";
  const errorInput = "border-red-500 focus:border-red-500";

  function clearError(key: keyof typeof errors) {
    setErrors((p) => ({ ...p, [key]: undefined }));
    setServerError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors: typeof errors = {};
    if (name.trim().length < 2) nextErrors.name = t("nameMinLength");
    const phoneError = validatePhoneNumber(phone, region);
    if (phoneError) nextErrors.phone = phoneError;
    if (!EMAIL_RE.test(email.trim())) nextErrors.email = t("emailInvalid");
    if (password.length < 8) nextErrors.password = t("passwordMinLength");
    if (!terms) nextErrors.terms = t("termsRequired");
    setErrors(nextErrors);
    setServerError("");
    if (Object.keys(nextErrors).length > 0) return;

    const normalizedPhone = normalizePhoneNumber(phone, region);
    if (!normalizedPhone) {
      setErrors({ phone: t("phoneInvalid") });
      setPending(false);
      return;
    }
    const fullPhone = normalizedPhone;

    setPending(true);
    try {
      const checkRes = await fetch(
        `/api/check-unique?email=${encodeURIComponent(email.trim())}&phoneNumber=${encodeURIComponent(fullPhone)}`,
      );
      const check = (await checkRes.json()) as { emailTaken: boolean; phoneTaken: boolean };
      const taken: typeof errors = {};
      if (check.emailTaken) taken.email = t("emailExists");
      if (check.phoneTaken) taken.phone = t("phoneExists");
      if (Object.keys(taken).length > 0) {
        setErrors(taken);
        setPending(false);
        return;
      }
    } catch {
      // Pre-check failed (network); the database constraints still guarantee uniqueness
    }

    const { error } = await authClient.signUp.email({
      name: name.trim(),
      email: email.trim(),
      password,
      phoneNumber: fullPhone,
    });
    setPending(false);
    if (error) {
      const message = error.message ?? "";
      if (message.toLowerCase().includes("phone")) {
        setErrors({ phone: t("phoneExists") });
      } else if (message.toLowerCase().includes("email")) {
        setErrors({ email: t("emailExists") });
      } else {
        // Pre-check passed but creation failed: almost certainly a duplicate race
        setServerError(t("accountExists"));
      }
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
    if (error) setServerError(toServerMessage(error.message ?? "", t));
  }

  function fieldError(message?: string, id?: string) {
    if (!message) return null;
    return (
      <p id={id} role="alert" className="mt-1.5 text-xs font-bold text-red-400">
        {message}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex w-full flex-col gap-4">
      <button
        type="button"
        onClick={handleGoogle}
        className="flex h-12 items-center justify-center gap-2 rounded-xl bg-night-60 text-sm font-extrabold text-white transition hover:bg-night-40"
      >
        <FcGoogle size={20} />
        {t("continueWithGoogle")}
      </button>

      <div className="flex items-center gap-3 text-xs font-bold text-mist-50">
        <span className="h-px flex-1 bg-night-60" />
        {t("or")}
        <span className="h-px flex-1 bg-night-60" />
      </div>

      <div>
        <label htmlFor="register-name" className="mb-1.5 block text-sm font-bold text-white">
          {t("name")}
        </label>
        <input
          id="register-name"
          type="text"
          autoComplete="name"
          required
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            clearError("name");
          }}
          placeholder={t("namePlaceholder")}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "register-name-error" : undefined}
          className={`${inputClass} ${errors.name ? errorInput : ""}`}
        />
        {fieldError(errors.name, "register-name-error")}
      </div>

      <div>
        <label htmlFor="register-phone" className="mb-1.5 block text-sm font-bold text-white">
          {t("phone")}
        </label>
        <div className="flex gap-2" dir="ltr">
          <select
            value={region}
            onChange={(e) => {
              setRegion(e.target.value);
              clearError("phone");
            }}
            aria-label="Country Code"
            className="h-12 w-28 shrink-0 rounded-xl border border-transparent bg-night-40 px-2 text-left text-sm font-bold text-white outline-none focus:border-brand-100"
          >
            {COUNTRY_CODES.map((c) => (
              <option key={c.code} value={c.code} className="bg-night-80">
                {c.code} {c.dial}
              </option>
            ))}
          </select>
          <input
            id="register-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              clearError("phone");
            }}
            onBlur={() => {
              if (phone) {
                const message = validatePhoneNumber(phone, region);
                if (message) setErrors((p) => ({ ...p, phone: message }));
              }
            }}
            placeholder="1xxxxxxxxx"
            aria-invalid={!!errors.phone}
            aria-describedby={errors.phone ? "register-phone-error" : undefined}
            className={`${inputClass} text-left ${errors.phone ? errorInput : ""}`}
          />
        </div>
        {fieldError(errors.phone, "register-phone-error")}
      </div>

      <div>
        <label htmlFor="register-email" className="mb-1.5 block text-sm font-bold text-white">
          {t("email")}
        </label>
        <input
          id="register-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          dir="ltr"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            clearError("email");
          }}
          placeholder="you@example.com"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "register-email-error" : undefined}
          className={`${inputClass} text-left ${errors.email ? errorInput : ""}`}
        />
        {fieldError(errors.email, "register-email-error")}
      </div>

      <div>
        <label htmlFor="register-password" className="mb-1.5 block text-sm font-bold text-white">
          {t("password")}
        </label>
        <div className="relative">
          <input
            id="register-password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              clearError("password");
            }}
            placeholder={t("passwordPlaceholder")}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "register-password-error" : undefined}
            className={`${inputClass} pe-12 ${errors.password ? errorInput : ""}`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? t("hidePassword") : t("showPassword")}
            className="absolute inset-e-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-mist-50 transition hover:text-white"
          >
            {showPassword ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
          </button>
        </div>
        {fieldError(errors.password, "register-password-error")}
      </div>

      <div>
        <label className="flex cursor-pointer items-center gap-2 text-sm font-bold text-white">
          <input
            type="checkbox"
            checked={terms}
            onChange={(e) => {
              setTerms(e.target.checked);
              clearError("terms");
            }}
            className="h-4 w-4 accent-brand-100"
          />
          {t("termsAgree")}
        </label>
        {fieldError(errors.terms, "register-terms-error")}
      </div>

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
        {pending ? t("creatingAccount") : t("registerSubmit")}
      </button>

      <p className="text-center text-sm font-semibold text-mist-50">
        {t("hasAccount")}{" "}
        <Link href={`/login/?next=${encodeURIComponent(nextPath)}`} className="font-bold text-brand-60 transition hover:text-white">
          {t("loginLink")}
        </Link>
      </p>
    </form>
  );
}