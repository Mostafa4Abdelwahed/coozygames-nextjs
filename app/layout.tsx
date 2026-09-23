import type { Metadata } from "next";
import { Cairo, Geist } from "next/font/google";
import { SiteShell } from "@/components/site-shell";
import { navCategories } from "@/lib/categories";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

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
      className={cn("h-full", "antialiased", cairo.className, "font-sans", geist.variable)}
    >
      <body dir="rtl" className="min-h-full flex flex-col"><SiteShell categories={navCategories()}>{children}</SiteShell></body>
    </html>
  );
}
