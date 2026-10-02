"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X, Trophy, Music2, Drama, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { SITE } from "@/lib/constants";

const SECTIONS = [
  { key: "spor", label: "Spor", href: "/spor", icon: Trophy, on: "bg-dicle-500 text-white", hover: "hover:text-dicle-300" },
  { key: "muzik", label: "Müzik", href: "/muzik", icon: Music2, on: "bg-fuchsia-600 text-white", hover: "hover:text-fuchsia-300" },
  { key: "tiyatro", label: "Tiyatro", href: "/tiyatro", icon: Drama, on: "bg-amber-500 text-curtain-950", hover: "hover:text-amber-300" },
] as const;

const SPORT_MENU = [
  { label: "Erkek Ligleri", href: "/spor?cinsiyet=erkek" },
  { label: "Kadın Ligleri", href: "/spor?cinsiyet=kadin" },
  { label: "Fikstür & Sonuçlar", href: "/spor/fikstur" },
  { label: "Gol / Sayı Krallığı", href: "/spor/krallik" },
  { label: "Takımlar", href: "/spor/takimlar" },
  { label: "Oyuncular", href: "/spor/oyuncular" },
];

const LINKS = [
  { label: "Başvurular", href: "/basvuru" },
  { label: "Videolar", href: "/videolar" },
  { label: "Duyurular", href: "/duyurular" },
  { label: "Tesisler", href: "/tesisler" },
];

export function Header({ openPeriods }: { openPeriods: number }) {
  const pathname = usePathname();
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
    section === "muzik" ? "bg-[#0b0614]/90" : section === "tiyatro" ? "bg-curtain-950/90" : "bg-basalt-950/90";

  return (
    <header className={cn("sticky top-0 z-50 border-b border-white/10 text-white backdrop-blur-xl transition-shadow", bar, scrolled && "shadow-lg shadow-black/20")}>
      <div className="container-x flex h-16 items-center gap-4">
        <Link href="/" className="group flex shrink-0 items-center gap-2.5" aria-label="Ana sayfa">
          <Logo />
          <span className="hidden leading-none sm:block">
            <span className="block font-display text-lg font-semibold uppercase tracking-wider">Diyarbakır</span>
            <span className="block text-[10px] font-semibold uppercase tracking-[0.25em] text-white/50">Gençlik Ligleri</span>
          </span>
        </Link>

        {/* Bölüm değiştirici: Spor / Müzik / Tiyatro */}
        <div className="mx-auto hidden items-center rounded-full bg-white/[0.06] p-1 ring-1 ring-white/10 md:flex">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            const on = section === s.key;
            return (
              <Link key={s.key} href={s.href} className={cn("flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition", on ? s.on : cn("text-white/70", s.hover))}>
                <Icon className="h-4 w-4" />
                {s.label}
              </Link>
            );
          })}
        </div>

        <nav className="hidden items-center gap-1 lg:flex">
          <div className="group relative">
            <button className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-white/70 hover:text-white">
              Lig Merkezi <ChevronDown className="h-3.5 w-3.5 transition group-hover:rotate-180" />
            </button>
            <div className="invisible absolute right-0 top-full w-56 translate-y-1 rounded-xl border border-white/10 bg-basalt-900 p-1.5 opacity-0 shadow-2xl transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
              {SPORT_MENU.map((l) => (
                <Link key={l.href} href={l.href} className="block rounded-lg px-3 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white">{l.label}</Link>
              ))}
            </div>
          </div>
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={cn("rounded-lg px-3 py-2 text-sm font-medium transition", pathname.startsWith(l.href) ? "text-white" : "text-white/70 hover:text-white")}>
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <Link href="/ara" aria-label="Ara" className="rounded-lg p-2 text-white/70 hover:bg-white/10 hover:text-white">
            <Search className="h-5 w-5" />
          </Link>
          <Link href="/basvuru" className="relative hidden items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-basalt-950 transition hover:bg-dicle-300 sm:inline-flex">
            {openPeriods > 0 && (
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
            )}
            Başvur
          </Link>
          <button onClick={() => setOpen((o) => !o)} className="rounded-lg p-2 hover:bg-white/10 lg:hidden" aria-label="Menü" aria-expanded={open}>
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
                <Icon className="h-4 w-4" /> {s.label}
              </Link>
            );
          })}
        </div>
      </div>

      {open && (
        <div className="max-h-[calc(100vh-7rem)] overflow-y-auto border-t border-white/10 bg-basalt-950 lg:hidden">
          <div className="container-x space-y-6 py-6">
            <div>
              <p className="eyebrow mb-2 text-white/40">Lig Merkezi</p>
              <div className="grid grid-cols-2 gap-1">
                {SPORT_MENU.map((l) => (
                  <Link key={l.href} href={l.href} className="rounded-lg px-3 py-2 text-sm text-white/80 hover:bg-white/10">{l.label}</Link>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1">
              {LINKS.map((l) => (
                <Link key={l.href} href={l.href} className="rounded-lg px-3 py-2 text-sm font-medium text-white/80 hover:bg-white/10">{l.label}</Link>
              ))}
              <Link href="/basvuru/takip" className="rounded-lg px-3 py-2 text-sm font-medium text-white/80 hover:bg-white/10">Başvuru Takip</Link>
              <Link href="/iletisim" className="rounded-lg px-3 py-2 text-sm font-medium text-white/80 hover:bg-white/10">İletişim</Link>
            </div>
            <Link href="/basvuru" className="btn w-full bg-white text-basalt-950">Başvuru Yap</Link>
          </div>
        </div>
      )}
    </header>
  );
}

export function Logo({ size = 38 }: { size?: number }) {
  // Sur burçlarından esinlenen amblem
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden className="shrink-0">
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2dd4bf" />
          <stop offset=".5" stopColor="#d946ef" />
          <stop offset="1" stopColor="#fbbf24" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="38" height="38" rx="11" fill="#121622" stroke="url(#lg)" strokeWidth="2" />
      <path d="M9 30V15h4v-3h3v3h3v-4h2v4h3v-3h3v3h4v15h-6v-6a2.5 2.5 0 0 0-5 0v6H9Z" fill="url(#lg)" />
    </svg>
  );
}

export function SiteName() {
  return <>{SITE.name}</>;
}
