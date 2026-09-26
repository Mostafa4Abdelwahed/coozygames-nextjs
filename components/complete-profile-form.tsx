"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";
import { COUNTRY_CODES, normalizePhoneNumber, validatePhoneNumber } from "@/lib/phone";
import type { ProfileGap } from "@/lib/profile";

type Props = {
  missing: ProfileGap[];
  currentName: string;
  redirectTo?: string;
};

export function CompleteProfileForm({ missing, currentName, redirectTo = "/profile/" }: Props) {
  const router = useRouter();
  const [name, setName] = useState(currentName);
  const [region, setRegion] = useState("EG");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const needsName = missing.includes("name");
  const needsPhone = missing.includes("phoneNumber");

  const inputClass =
    "h-12 w-full rounded-xl border border-transparent bg-night-40 px-4 text-start text-base font-bold text-white outline-none placeholder:text-mist-50 focus:border-brand-100";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (needsName) {
      if (name.trim().length < 2) {
        setError("الاسم يجب أن يكون حرفين على الأقل");
        return;
      }
      setPending(true);
      const { error } = await authClient.updateUser({ name: name.trim() });
      if (error) {
        setPending(false);
        setError("حدث خطأ أثناء حفظ الاسم");
        return;
      }
    }

    if (needsPhone) {
      const phoneMsg = validatePhoneNumber(phone, region);
      if (phoneMsg) {
        setPending(false);
        setPhoneError(phoneMsg);
        return;
      }
      if (!needsName) setPending(true);
      const normalized = normalizePhoneNumber(phone, region);
      if (!normalized) {
        setPending(false);
        setPhoneError("رقم الهاتف غير صحيح، تحقق من الرقم وكود الدولة");
        return;
      }
      const res = await fetch("/api/profile/phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: normalized }),
      });
      setPending(false);
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { message?: string } | null;
        setError(data?.message ?? "حدث خطأ أثناء حفظ رقم الهاتف");
        return;
      }
    }

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex w-full flex-col gap-4">
      {needsName && (
        <div>
          <label htmlFor="complete-name" className="mb-1.5 block text-sm font-bold text-white">
            الاسم
          </label>
          <input
            id="complete-name"
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
            placeholder="مثال: أحمد محمد"
            className={inputClass}
          />
        </div>
      )}

      {needsPhone && (
        <div>
          <label htmlFor="complete-phone" className="mb-1.5 block text-sm font-bold text-white">
            رقم الهاتف
          </label>
          <div className="flex gap-2" dir="ltr">
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
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
              id="complete-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              required
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setPhoneError("");
                setError("");
              }}
              onBlur={() => {
                if (phone) {
                  const message = validatePhoneNumber(phone, region);
                  if (message) setPhoneError(message);
                }
              }}
              placeholder="1xxxxxxxxx"
              aria-invalid={phoneError !== ""}
              aria-describedby={phoneError ? "complete-phone-error" : undefined}
              className={`${inputClass} text-left ${phoneError ? "border-red-500 focus:border-red-500" : ""}`}
            />
          </div>
          {phoneError && (
            <p id="complete-phone-error" role="alert" className="mt-1.5 text-xs font-bold text-red-400">
              {phoneError}
            </p>
          )}
        </div>
      )}

      {error && (
        <p role="alert" className="rounded-xl bg-red-500/15 px-4 py-2.5 text-center text-sm font-bold text-red-400">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="flex h-12 items-center justify-center rounded-[30px] bg-brand-100 text-base font-extrabold text-white transition hover:bg-brand-80 active:opacity-70 disabled:opacity-60"
      >
        {pending ? "جارٍ الحفظ..." : "حفظ البيانات"}
      </button>
    </form>
  );
}