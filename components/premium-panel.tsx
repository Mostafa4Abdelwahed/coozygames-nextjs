"use client";

import { useState, useTransition } from "react";
import { MdCloudUpload, MdImage, MdWorkspacePremium } from "react-icons/md";
import { submitPayment, type PaymentActionState } from "@/lib/actions/premium";
import type { PaymentMethod } from "@/lib/billing";
import { useTranslations } from "next-intl";

const MAX_BYTES = 5 * 1024 * 1024;

export function PremiumPanel({
  priceLabel,
  methods,
  hasActive,
  hasPending,
}: {
  price: number;
  priceLabel: string;
  methods: PaymentMethod[];
  hasActive: boolean;
  hasPending: boolean;
}) {
  const t = useTranslations("Premium");
  const [methodId, setMethodId] = useState(methods[0]?.id ?? "");
  const [txId, setTxId] = useState("");
  const [sender, setSender] = useState("");
  const [note, setNote] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [result, setResult] = useState<PaymentActionState | null>(null);
  const [pending, startTransition] = useTransition();

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setPreview(null);
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(t("fileTooLarge"));
      setPreview(null);
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError(t("fileTypeInvalid"));
      setPreview(null);
      return;
    }
    setError("");
    setPreview(URL.createObjectURL(file));
  }

  function handleSubmit(next: FormData) {
    setResult(null);
    setError("");
    startTransition(async () => {
      const state = await submitPayment({ done: false }, next);
      if (state.error) setError(t(state.error));
      else {
        setResult({ done: true });
        setTxId("");
        setSender("");
        setNote("");
        setPreview(null);
      }
    });
  }

  return (
    <form action={handleSubmit} noValidate className="flex flex-col gap-4">
      {methods.length === 0 ? (
        <div className="rounded-2xl border border-night-60 bg-night-80 p-5 text-center text-sm font-bold text-mist-50">
          {t("noPaymentMethods")}
        </div>
      ) : (
        <>
          <fieldset className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <legend className="mb-2 text-sm font-extrabold text-white">{t("selectPaymentMethod")}</legend>
            {methods.map((m) => (
              <label
                key={m.id}
                className={`flex cursor-pointer flex-col gap-0.5 rounded-2xl border p-4 transition-colors ${
                  methodId === m.id
                    ? "border-brand-100 bg-brand-100/10"
                    : "border-night-60 bg-night-80 hover:border-mist-50"
                }`}
              >
                <input
                  type="radio"
                  name="methodId"
                  value={m.id}
                  checked={methodId === m.id}
                  onChange={() => setMethodId(m.id)}
                  className="sr-only"
                />
                <span className="text-sm font-extrabold text-white">{m.name}</span>
                {m.details ? (
                  <span className="text-xs font-semibold text-mist-50" dir="ltr">
                    {m.details}
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-mist-50">{t("paymentMethodSet")}</span>
                )}
              </label>
            ))}
          </fieldset>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div>
              <label htmlFor="tx-id" className="mb-1.5 block text-sm font-bold text-white">
                {t("txIdLabel")} <span className="text-brand-60">*</span>
              </label>
              <input
                id="tx-id"
                name="providerTransactionId"
                type="text"
                value={txId}
                onChange={(e) => setTxId(e.target.value)}
                placeholder={t("txIdRequired")}
                className="h-12 w-full rounded-xl border border-transparent bg-night-40 px-4 text-start text-base font-bold text-white outline-none placeholder:text-mist-50 focus:border-brand-100"
              />
            </div>
            <div>
              <label htmlFor="tx-sender" className="mb-1.5 block text-sm font-bold text-white">
                {t("senderLabel")} <span className="text-brand-60">*</span>
              </label>
              <input
                id="tx-sender"
                name="senderName"
                type="text"
                value={sender}
                onChange={(e) => setSender(e.target.value)}
                placeholder={t("senderPlaceholder")}
                className="h-12 w-full rounded-xl border border-transparent bg-night-40 px-4 text-start text-base font-bold text-white outline-none placeholder:text-mist-50 focus:border-brand-100"
              />
            </div>
          </div>

          <div>
            <label htmlFor="tx-note" className="mb-1.5 block text-sm font-bold text-white">
              {t("noteLabel")}
            </label>
            <textarea
              id="tx-note"
              name="recipientNote"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              maxLength={300}
              className="w-full resize-none rounded-xl border border-transparent bg-night-40 px-4 py-3 text-start text-base font-bold text-white outline-none placeholder:text-mist-50 focus:border-brand-100"
            />
          </div>

          <div>
            <span className="mb-1.5 block text-sm font-bold text-white">
              {t("receiptLabel")} <span className="text-brand-60">*</span>
            </span>
            <label className="flex min-h-48 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-mist-50 bg-night-40 px-4 py-8 text-center transition-colors hover:border-brand-100">
              <input
                type="file"
                name="receiptImage"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFile}
                className="sr-only"
              />
              {preview ? (
                <>
                  <MdImage size={28} className="text-brand-60" />
                  <span className="text-sm font-extrabold text-white">{t("receiptReady")}</span>
                </>
              ) : (
                <>
                  <MdCloudUpload size={28} className="text-mist-50" />
                  <span className="text-sm font-extrabold text-white">{t("clickToUpload")}</span>
                  <span className="text-xs font-semibold text-mist-50">{t("receiptMaxSize")}</span>
                </>
              )}
            </label>
          </div>
        </>
      )}

      {error && (
        <p role="alert" className="rounded-xl bg-red-500/15 px-4 py-2.5 text-sm font-bold text-red-400">
          {error}
        </p>
      )}

      {result?.done ? (
        <p role="status" className="rounded-xl bg-emerald-500/15 px-4 py-2.5 text-center text-sm font-bold text-emerald-400">
          {t("paymentSent")}
        </p>
      ) : (
        <button
          type="submit"
          disabled={pending || hasActive || hasPending || methods.length === 0}
          className="flex h-12 items-center justify-center gap-2 rounded-[30px] bg-brand-100 text-base font-extrabold text-white transition hover:bg-brand-80 active:opacity-70 disabled:opacity-60"
        >
          <MdWorkspacePremium size={20} />
          {pending
            ? t("sending")
            : hasActive
              ? t("subscribed")
              : hasPending
                ? t("hasPending")
                : t("subscribeAtPrice", { priceLabel })}
        </button>
      )}
    </form>
  );
}