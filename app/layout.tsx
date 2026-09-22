import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import { SiteShell } from "@/components/site-shell";
import "./globals.css";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["400", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Coozy Games",
  description: "Coozy Games - العب أحلى الألعاب",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ar"
      className={`${cairo.className} h-full antialiased`}
    >
      <body dir="rtl" className="min-h-full flex flex-col"><SiteShell>{children}</SiteShell></body>
    </html>
  );
}
