import type { Metadata, Viewport } from "next";
import { Anton, Inter, Oswald, Playfair_Display, Space_Grotesk, Unbounded } from "next/font/google";
import { LangProvider } from "@/lib/i18n";
import "./globals.css";
import { SITE } from "@/lib/constants";

const inter = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-inter", display: "swap" });
const oswald = Oswald({ subsets: ["latin", "latin-ext"], variable: "--font-oswald", display: "swap" });
const playfair = Playfair_Display({ subsets: ["latin", "latin-ext"], variable: "--font-playfair", display: "swap" });
const unbounded = Unbounded({ subsets: ["latin", "latin-ext"], variable: "--font-unbounded", display: "swap" });
const anton = Anton({ weight: "400", subsets: ["latin", "latin-ext"], variable: "--font-anton", display: "swap" });
const grotesk = Space_Grotesk({ subsets: ["latin", "latin-ext"], variable: "--font-grotesk", display: "swap" });

export const metadata: Metadata = {
  title: { default: `${SITE.name} — Spor · Müzik · Tiyatro`, template: `%s | ${SITE.name}` },
  description: "Diyarbakır gençlik ligleri: futbol, basketbol, voleybol, hentbol erkek ve kadın ligleri; puan durumu, fikstür, oyuncu istatistikleri, Genç Sesler müzik yarışması ve Gençlik Tiyatro Festivali.",
  keywords: ["Diyarbakır", "gençlik ligi", "amatör lig", "futbol", "basketbol", "voleybol", "hentbol", "kadın ligi", "müzik yarışması", "tiyatro festivali"],
  openGraph: { type: "website", locale: "tr_TR", siteName: SITE.name },
};

export const viewport: Viewport = { themeColor: "#0a0d15", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={`${inter.variable} ${oswald.variable} ${playfair.variable} ${unbounded.variable} ${anton.variable} ${grotesk.variable}`}>
      <body className="min-h-screen font-sans"><LangProvider>{children}</LangProvider></body>
    </html>
  );
}
