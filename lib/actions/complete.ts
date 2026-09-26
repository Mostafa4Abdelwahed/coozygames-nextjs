"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { redeemAccessLink, resolveAccessLink } from "@/lib/access-links";

export type RedeemLinkState = { done: boolean; error?: string; expiresAt?: string };

/** Burn the access link and activate the caller's subscription. */
export async function redeemLink(
  _state: RedeemLinkState,
  formData: FormData,
): Promise<RedeemLinkState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { done: true, error: "signInToRedeem" };

  const token = String(formData.get("token") ?? "").trim();
  if (!token) return { done: true, error: "tokenRequired" };

  const link = await resolveAccessLink(token);
  if (!link || link.status !== "active") {
    return { done: true, error: "linkInvalid" };
  }

  const result = await redeemAccessLink(token, session.user.id);
  if (!result.ok) {
    const message =
      result.reason === "used"
        ? "linkUsed"
        : result.reason === "expired"
          ? "linkExpired"
          : "linkInvalidGeneric";
    return { done: true, error: message };
  }

  revalidatePath("/complete", "page");
  revalidatePath("/profile", "page");
  revalidatePath("/premium", "page");
  return { done: true, expiresAt: result.expiresAt.toISOString() };
}