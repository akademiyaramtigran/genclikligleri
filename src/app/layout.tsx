import type { Metadata, Viewport } from "next";
import { Inter, Oswald, Playfair_Display, Unbounded } from "next/font/google";
import "./globals.css";
import { SITE } from "@/lib/constants";

const inter = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-inter", display: "swap" });
const oswald = Oswald({ subsets: ["latin", "latin-ext"], variable: "--font-oswald", display: "swap" });
const playfair = Playfair_Display({ subsets: ["latin", "latin-ext"], variable: "--font-playfair", display: "swap" });
const unbounded = Unbounded({ subsets: ["latin", "latin-ext"], variable: "--font-unbounded", display: "swap" });

// Tüm sayfalar canlı veriden üretilir
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: { default: `${SITE.name} — Spor · Müzik · Tiyatro`, template: `%s | ${SITE.name}` },
  description: "Diyarbakır gençlik ligleri: futbol, basketbol, voleybol, hentbol erkek ve kadın ligleri; puan durumu, fikstür, oyuncu istatistikleri, Genç Sesler müzik yarışması ve Gençlik Tiyatro Festivali.",
  keywords: ["Diyarbakır", "gençlik ligi", "amatör lig", "futbol", "basketbol", "voleybol", "hentbol", "kadın ligi", "müzik yarışması", "tiyatro festivali"],
  openGraph: { type: "website", locale: "tr_TR", siteName: SITE.name },
};

export const viewport: Viewport = { themeColor: "#0a0d15", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={`${inter.variable} ${oswald.variable} ${playfair.variable} ${unbounded.variable}`}>
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
