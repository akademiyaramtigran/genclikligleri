"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X, Trophy, Music2, Drama, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { SITE } from "@/lib/constants";
import { LANGS, useLang } from "@/lib/i18n";
import { ArchBadge, MusicBadge, StageBadge } from "./Logos";
import { withBase } from "./client";

const SECTIONS = [
  { key: "spor", label: "Spor", href: "/spor", icon: Trophy, on: "bg-dicle-500 text-white", hover: "hover:text-dicle-300" },
  { key: "muzik", label: "Müzik", href: "/muzik", icon: Music2, on: "bg-fuchsia-600 text-white", hover: "hover:text-fuchsia-300" },
  { key: "tiyatro", label: "Tiyatro", href: "/tiyatro", icon: Drama, on: "bg-rose-500 text-stage-950", hover: "hover:text-rose-300" },
] as const;

const SPORT_MENU = [
  { label: "Erkek Ligleri", href: "/spor?cinsiyet=erkek" },
  { label: "Kadın Ligleri", href: "/spor?cinsiyet=kadin" },
  { label: "Fikstür & Sonuçlar", href: "/spor/fikstur" },
  { label: "İstatistikler", href: "/spor/istatistik" },
  { label: "Takımlar", href: "/spor/takimlar" },
  { label: "Oyuncular", href: "/spor/oyuncular" },
  { label: "Sezon Arşivi", href: "/spor/arsiv" },
];

// Üst menüde doğrudan görünenler; diğerleri "Keşfet" altında
const MAIN_LINKS = ["/gencligin-sesi", "/basvuru"];

const LINKS = [
  { label: "Gençliğin Sesi", href: "/gencligin-sesi" },
  { label: "Başvurular", href: "/basvuru" },
  { label: "Videolar", href: "/videolar" },
  { label: "Duyurular", href: "/duyurular" },
  { label: "Tesisler", href: "/tesisler" },
];

/** Bölüme göre amblem ve isim */
const BRAND: Record<string, { mark: React.ReactNode; top: string; bottom: string }> = {
  spor: { mark: <ArchBadge />, top: "Gençlik Ligleri", bottom: "Diyarbakır" },
  muzik: { mark: <MusicBadge />, top: "Genç Sesler", bottom: "Müzik Yarışması" },
  tiyatro: { mark: <StageBadge />, top: "Tiyatro", bottom: "Gençlik Festivali" },
};

export function LangSwitch({ className }: { className?: string }) {
  const { lang, setLang } = useLang();
  return (
    <div className={cn("flex items-center rounded-full bg-white/[0.08] p-0.5 ring-1 ring-white/10", className)} role="group" aria-label="Dil / Ziman / Ziwan">
      {LANGS.map((l) => (
        <button key={l.key} type="button" onClick={() => setLang(l.key)} title={l.label} aria-pressed={lang === l.key}
          className={cn("rounded-full px-2 py-1 text-[11px] font-bold tracking-wide transition", lang === l.key ? "bg-white text-basalt-950" : "text-white/60 hover:text-white")}>
          {l.short}
        </button>
      ))}
    </div>
  );
}

export function Header() {
  const pathname = usePathname();
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const section = SECTIONS.find((s) => pathname.startsWith(s.href))?.key;

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (pathname.startsWith("/yonetim")) return null;

  const bar =
    section === "muzik" ? "bg-[#0b0614]/90" : section === "tiyatro" ? "bg-stage-950/90" : "bg-basalt-950/90";
  const brand = section ? BRAND[section] : null;

  return (
    <header className={cn("sticky top-0 z-50 border-b border-white/10 text-white backdrop-blur-xl transition-shadow", bar, scrolled && "shadow-lg shadow-black/20")}>
      <div className="container-x flex h-16 items-center gap-3 2xl:gap-4">
        <Link href="/" className="group flex shrink-0 items-center gap-2.5" aria-label="Ana sayfa">
          {brand ? brand.mark : <Logo size={42} />}
          <span className="hidden leading-none sm:block">
            <span className={cn("block text-lg uppercase tracking-wider", section === "tiyatro" ? "font-stage tracking-wide" : section === "muzik" ? "font-music text-base font-bold" : "font-display font-semibold")}>{brand ? t(brand.top) : "Diyarbakır"}</span>
            <span className="block text-[10px] font-semibold uppercase tracking-[0.25em] text-white/50">{brand ? t(brand.bottom) : t("Gençlik Organizasyonları")}</span>
          </span>
        </Link>

        {/* Bölüm değiştirici: Spor / Müzik / Tiyatro */}
        <div className="mx-auto hidden items-center rounded-full bg-white/[0.06] p-1 ring-1 ring-white/10 md:flex">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            const on = section === s.key;
            return (
              <Link key={s.key} href={s.href} className={cn("flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition 2xl:px-4", on ? s.on : cn("text-white/70", s.hover))}>
                <Icon className="h-4 w-4" />
                {t(s.label)}
              </Link>
            );
          })}
        </div>

        <nav className="hidden items-center gap-0.5 xl:flex">
          <div className="group relative">
            <button className="flex items-center gap-1 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-white/70 hover:text-white">
              {t("Lig Merkezi")} <ChevronDown className="h-3.5 w-3.5 transition group-hover:rotate-180" />
            </button>
            <div className="invisible absolute right-0 top-full w-56 translate-y-1 rounded-xl border border-white/10 bg-basalt-900 p-1.5 opacity-0 shadow-2xl transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
              {SPORT_MENU.map((l) => (
                <Link key={l.href} href={l.href} className="block rounded-lg px-3 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white">{t(l.label)}</Link>
              ))}
            </div>
          </div>
          {LINKS.filter((l) => MAIN_LINKS.includes(l.href)).map((l) => (
            <Link key={l.href} href={l.href} className={cn("whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition", pathname.startsWith(l.href) ? "text-white" : "text-white/70 hover:text-white")}>
              {t(l.label)}
            </Link>
          ))}
          <div className="group relative">
            <button className="flex items-center gap-1 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-white/70 hover:text-white">
              {t("Keşfet")} <ChevronDown className="h-3.5 w-3.5 transition group-hover:rotate-180" />
            </button>
            <div className="invisible absolute right-0 top-full w-56 translate-y-1 rounded-xl border border-white/10 bg-basalt-900 p-1.5 opacity-0 shadow-2xl transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
              {[...LINKS.filter((l) => !MAIN_LINKS.includes(l.href)), { label: "Başvuru Takip", href: "/basvuru/takip" }, { label: "Hakkımızda", href: "/hakkimizda" }, { label: "İletişim", href: "/iletisim" }].map((l) => (
                <Link key={l.href} href={l.href} className="block rounded-lg px-3 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white">{t(l.label)}</Link>
              ))}
            </div>
          </div>
        </nav>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <LangSwitch />
          <Link href="/ara" aria-label={t("Ara")} className="rounded-lg p-2 text-white/70 hover:bg-white/10 hover:text-white">
            <Search className="h-5 w-5" />
          </Link>
          <button onClick={() => setOpen((o) => !o)} className="rounded-lg p-2 hover:bg-white/10 xl:hidden" aria-label="Menü" aria-expanded={open}>
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobil bölüm değiştirici */}
      <div className="border-t border-white/5 md:hidden">
        <div className="container-x grid grid-cols-3 gap-1 py-2">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            return (
              <Link key={s.key} href={s.href} className={cn("flex items-center justify-center gap-1.5 rounded-full py-1.5 text-sm font-semibold", section === s.key ? s.on : "bg-white/5 text-white/70")}>
                <Icon className="h-4 w-4" /> {t(s.label)}
              </Link>
            );
          })}
        </div>
      </div>

      {open && (
        <div className="max-h-[calc(100vh-7rem)] overflow-y-auto border-t border-white/10 bg-basalt-950 xl:hidden">
          <div className="container-x space-y-6 py-6">
            <div>
              <p className="eyebrow mb-2 text-white/40">{t("Lig Merkezi")}</p>
              <div className="grid grid-cols-2 gap-1">
                {SPORT_MENU.map((l) => (
                  <Link key={l.href} href={l.href} className="rounded-lg px-3 py-2 text-sm text-white/80 hover:bg-white/10">{t(l.label)}</Link>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1">
              {LINKS.map((l) => (
                <Link key={l.href} href={l.href} className="rounded-lg px-3 py-2 text-sm font-medium text-white/80 hover:bg-white/10">{t(l.label)}</Link>
              ))}
              <Link href="/basvuru/takip" className="rounded-lg px-3 py-2 text-sm font-medium text-white/80 hover:bg-white/10">{t("Başvuru Takip")}</Link>
              <Link href="/iletisim" className="rounded-lg px-3 py-2 text-sm font-medium text-white/80 hover:bg-white/10">{t("İletişim")}</Link>
            </div>
            <Link href="/basvuru" className="btn w-full bg-white text-basalt-950">{t("Başvuru Yap")}</Link>
          </div>
        </div>
      )}
    </header>
  );
}

/** Organizasyonun genel logosu (amblem). Koyu zeminde "acik" (beyaz kale), açık zeminde orijinal renkler. */
export function Logo({ size = 38, variant = "dark", className }: { size?: number; variant?: "dark" | "light"; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={withBase(variant === "dark" ? "/brand/amblem-acik.png" : "/brand/amblem.png")} alt="Diyarbakır Gençlik Organizasyonları" width={size} height={size}
      className={cn("shrink-0 object-contain", className)} style={{ width: size, height: size }} />
  );
}

/** Tam logo (amblem + yazı) — Hakkımızda, büyük alanlar */
export function FullLogo({ variant = "light", className }: { variant?: "dark" | "light"; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={withBase(variant === "dark" ? "/brand/logo-acik.png" : "/brand/logo.png")} alt="Diyarbakır Gençlik Organizasyonları" className={cn("object-contain", className)} />
  );
}

export function SiteName() {
  return <>{SITE.name}</>;
}
