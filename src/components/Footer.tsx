"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Mail, Phone, MapPin } from "lucide-react";
import { Logo } from "./Header";
import { SITE } from "@/lib/constants";
import { useT } from "@/lib/i18n";
import { ArchMark, PenMark } from "./Logos";

const COLS = [
  {
    title: "Spor",
    links: [
      ["Erkek Ligleri", "/spor?cinsiyet=erkek"], ["Kadın Ligleri", "/spor?cinsiyet=kadin"], ["Fikstür", "/spor/fikstur"],
      ["Krallık Yarışı", "/spor/krallik"], ["Takımlar", "/spor/takimlar"], ["Oyuncular", "/spor/oyuncular"],
    ],
  },
  {
    title: "Kültür & Sanat",
    links: [["Genç Sesler Müzik Yarışması", "/muzik"], ["Gençlik Tiyatro Festivali", "/tiyatro"], ["Genç Kalemler Yazarlık Yarışması", "/tiyatro/yazarlik"], ["Video Arşivi", "/videolar"], ["Tesisler & Sahneler", "/tesisler"]],
  },
  {
    title: "Organizasyon",
    links: [["Başvurular", "/basvuru"], ["Başvuru Takip", "/basvuru/takip"], ["Duyurular", "/duyurular"], ["Hakkımızda", "/hakkimizda"], ["İletişim", "/iletisim"], ["KVKK Aydınlatma Metni", "/kvkk"]],
  },
] as const;

export function Footer() {
  const t = useT();
  // Koyu zeminli bölümlerde (müzik, tiyatro) sayfa ile alt bilgi arasında açık renkli boşluk kalmasın
  const dark = /^\/(muzik|tiyatro)/.test(usePathname());
  return (
    <footer className={cn("bg-basalt-wall relative text-white", dark ? "mt-0" : "mt-20")}>
      <div className="h-1 bg-gradient-to-r from-dicle-400 via-fuchsia-500 to-amber-400" />
      <div className="container-x grid gap-10 py-14 lg:grid-cols-[1.3fr_2fr]">
        <div>
          <Link href="/" className="flex items-center gap-3">
            <Logo size={44} />
            <span>
              <span className="block font-display text-xl font-semibold uppercase tracking-wider">{SITE.name}</span>
              <span className="block text-xs text-white/50">{SITE.org}</span>
            </span>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/60">
            {t("Diyarbakır'ın 17 ilçesindeki gençleri spor, müzik ve tiyatro ile buluşturan şehir çapında gençlik organizasyonu. Ligler, yarışmalar ve festivaller tek çatı altında.")}
          </p>
          <div className="mt-4 flex items-center gap-3 text-white/40">
            <ArchMark size={22} /><span className="text-[11px] uppercase tracking-[0.2em]">{t("Ligler")}</span>
            <PenMark size={20} /><span className="text-[11px] uppercase tracking-[0.2em]">{t("Genç Kalemler")}</span>
          </div>
          <div className="mt-5 space-y-2 text-sm text-white/70">
            <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-dicle-400" /> {SITE.address}</p>
            <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-dicle-400" /> {SITE.phone}</p>
            <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-dicle-400" /> {SITE.email}</p>
          </div>
          <div className="mt-5 flex gap-2">
            <a href={SITE.socials.instagram} target="_blank" rel="noreferrer" aria-label="Instagram" className="rounded-lg bg-white/5 p-2 hover:bg-white/10"><svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" /></svg></a>
            <a href={SITE.socials.youtube} target="_blank" rel="noreferrer" aria-label="YouTube" className="rounded-lg bg-white/5 p-2 hover:bg-white/10"><svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12 31 31 0 0 0 1 16.8a3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1c.4-1.6.5-4.8.5-4.8s0-3.2-.5-4.8ZM9.7 15.1V8.9l5.8 3.1-5.8 3.1Z" /></svg></a>
          </div>
        </div>
        <div className="grid gap-8 sm:grid-cols-3">
          {COLS.map((c) => (
            <div key={c.title}>
              <p className="eyebrow mb-4 text-white/40">{t(c.title)}</p>
              <ul className="space-y-2.5">
                {c.links.map(([label, href]) => (
                  <li key={href}><Link href={href} className="text-sm text-white/70 transition hover:text-white">{t(label)}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col items-center justify-between gap-2 py-5 text-xs text-white/40 sm:flex-row">
          <p>© {new Date().getFullYear()} {SITE.org}. {t("Tüm hakları saklıdır.")}</p>
          <Link href="/yonetim" className="hover:text-white/70">{t("Yönetim Paneli")}</Link>
        </div>
      </div>
    </footer>
  );
}
