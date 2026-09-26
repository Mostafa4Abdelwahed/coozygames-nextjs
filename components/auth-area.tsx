"use client";

import { Link, useRouter } from "@/i18n/navigation";
import { MdAdminPanelSettings, MdLogout, MdWorkspacePremium } from "react-icons/md";
import { authClient, useSession } from "@/lib/auth-client";

/**
 * Isolated session island for the header.
 * Keeping useSession() here (instead of in SiteShell) means session resolution
 * does not re-render the shell and the 75-item sidebar.
 */
export function AuthArea() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  async function handleLogout() {
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }

  if (isPending) {
    return <span aria-hidden="true" className="h-9 w-24 animate-pulse rounded-[30px] bg-night-60 sm:h-10" />;
  }

  if (!session) {
    return (
      <Link
        className="flex h-9 items-center justify-center rounded-[30px] bg-brand-100 px-3 text-sm font-extrabold whitespace-nowrap text-mist-100 transition hover:bg-brand-80 active:opacity-70 sm:h-10 sm:px-4 sm:text-base"
        href="/login/"
      >
        <span>تسجيل الدخول</span>
      </Link>
    );
  }

  const role = (session.user as { role?: string | null }).role;

  return (
    <>
      {role === "admin" && (
        <Link
          href="/dashboard/"
          aria-label="لوحة التحكم"
          title="لوحة التحكم"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-mist-90 transition hover:text-brand-60 sm:h-10 sm:w-10"
        >
          <MdAdminPanelSettings size={20} />
        </Link>
      )}
      <Link
        href="/premium/"
        aria-label="الاشتراك المميز"
        title="الاشتراك المميز"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-orange-300 transition hover:text-orange-200 sm:h-10 sm:w-10"
      >
        <MdWorkspacePremium size={20} />
      </Link>
      <Link
        href="/profile/"
        aria-label="حسابي"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#6842ff,#22d3ee)] text-sm font-extrabold text-white sm:h-10 sm:w-10"
      >
        {(session.user.name ?? "؟").charAt(0)}
      </Link>
      <button
        type="button"
        onClick={handleLogout}
        aria-label="تسجيل الخروج"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-mist-90 transition hover:text-mist-50 sm:h-10 sm:w-10"
      >
        <MdLogout size={20} />
      </button>
    </>
  );
}