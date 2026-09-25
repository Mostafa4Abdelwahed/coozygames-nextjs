import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard/shell";
import { getTranslations } from "next-intl/server";

export const metadata: Metadata = {
  title: "لوحة التحكم | Coozy Games",
  robots: { index: false, follow: false },
};

export default async function DashboardLayout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: "Common" });
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect(`/${locale}/login/`);
  }
  if (session.user.role !== "admin") {
    redirect(`/${locale}/`);
  }

  return (
    <DashboardShell user={{ name: session.user.name, role: session.user.role }}>
      {props.children}
    </DashboardShell>
  );
}