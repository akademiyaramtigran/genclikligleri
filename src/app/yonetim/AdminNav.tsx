"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, Inbox, CalendarRange, Megaphone, Video, Mail, Trophy, Shield, Users, CalendarDays, MapPin,
  Mic2, ListMusic, Drama, Theater, UserCog, History, Menu, X, ExternalLink, LogOut, KeyRound, PenLine,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Header";
import { useRouter } from "next/navigation";
import { adminLogout } from "./AdminContext";

type Item = { href: string; label: string; icon: typeof Trophy; badge?: number };
type Group = { title: string; unit?: "SPOR" | "MUZIK" | "TIYATRO"; superOnly?: boolean; items: Item[] };

export function AdminNav({ user, counts }: { user: { name: string; role: string; scope: string }; counts: { pending: number; messages: number } }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const groups: Group[] = [
    { title: "Genel", items: [
      { href: "/yonetim", label: "Pano", icon: LayoutDashboard },
      { href: "/yonetim/basvurular", label: "Başvurular", icon: Inbox, badge: counts.pending },
      { href: "/yonetim/donemler", label: "Başvuru Dönemleri", icon: CalendarRange },
      { href: "/yonetim/duyurular", label: "Duyurular", icon: Megaphone },
      { href: "/yonetim/videolar", label: "Videolar", icon: Video },
      { href: "/yonetim/mesajlar", label: "Mesajlar", icon: Mail, badge: counts.messages },
    ] },
    { title: "Spor", unit: "SPOR", items: [
      { href: "/yonetim/ligler", label: "Sezonlar & Ligler", icon: Trophy },
      { href: "/yonetim/takimlar", label: "Takımlar", icon: Shield },
      { href: "/yonetim/oyuncular", label: "Oyuncular", icon: Users },
      { href: "/yonetim/maclar", label: "Maçlar & Sonuçlar", icon: CalendarDays },
      { href: "/yonetim/tesisler", label: "Tesisler", icon: MapPin },
    ] },
    { title: "Müzik", unit: "MUZIK", items: [
      { href: "/yonetim/muzik", label: "Yarışma & Turlar", icon: Mic2 },
      { href: "/yonetim/muzik/yarismacilar", label: "Yarışmacılar", icon: ListMusic },
    ] },
    { title: "Tiyatro", unit: "TIYATRO", items: [
      { href: "/yonetim/tiyatro", label: "Festival & Program", icon: Theater },
      { href: "/yonetim/tiyatro/oyunlar", label: "Topluluklar & Oyunlar", icon: Drama },
      { href: "/yonetim/tiyatro/yazarlik", label: "Genç Kalemler", icon: PenLine },
    ] },
    { title: "Sistem", superOnly: true, items: [
      { href: "/yonetim/kullanicilar", label: "Kullanıcılar", icon: UserCog },
      { href: "/yonetim/kayitlar", label: "İşlem Kayıtları", icon: History },
    ] },
  ];
  const visible = groups.filter((g) => (g.superOnly ? user.role === "SUPER_ADMIN" : !g.unit || user.role === "SUPER_ADMIN" || user.scope === "ALL" || user.scope === g.unit));
  const isActive = (href: string) => (href === "/yonetim" ? path === href : path === href || (path.startsWith(`${href}/`) && !visible.some((g) => g.items.some((i) => i.href !== href && i.href.startsWith(href) && path.startsWith(i.href)))));

  const nav = (
    <nav className="flex h-full flex-col">
      <Link href="/yonetim" className="flex items-center gap-2.5 px-5 py-5">
        <Logo size={34} />
        <span className="leading-none"><span className="block font-display text-base font-semibold uppercase tracking-wider text-white">Yönetim</span><span className="text-[10px] uppercase tracking-[0.2em] text-white/40">Gençlik Organizasyonları</span></span>
      </Link>
      <div className="flex-1 space-y-6 overflow-y-auto px-3 pb-6">
        {visible.map((g) => (
          <div key={g.title}>
            <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">{g.title}</p>
            {g.items.map((i) => {
              const Icon = i.icon;
              const on = isActive(i.href);
              return (
                <Link key={i.href} href={i.href} onClick={() => setOpen(false)} className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition", on ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white")}>
                  <Icon className="h-4 w-4" /> <span className="flex-1">{i.label}</span>
                  {!!i.badge && <span className="rounded-full bg-dicle-500 px-1.5 text-[10px] font-bold text-white">{i.badge}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </div>
      <div className="border-t border-white/10 p-3">
        <div className="px-3 py-2">
          <p className="truncate text-sm font-semibold text-white">{user.name}</p>
          <p className="text-xs text-white/40">{user.role === "SUPER_ADMIN" ? "Süper Yönetici" : user.role === "ADMIN" ? "Yönetici" : "Editör"} · {user.scope === "ALL" ? "Tüm birimler" : user.scope}</p>
        </div>
        <Link href="/yonetim/profil" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/60 hover:bg-white/5 hover:text-white"><KeyRound className="h-4 w-4" /> Şifre Değiştir</Link>
        <Link href="/" target="_blank" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/60 hover:bg-white/5 hover:text-white"><ExternalLink className="h-4 w-4" /> Siteyi Görüntüle</Link>
        <form onSubmit={async (e) => { e.preventDefault(); await adminLogout(); router.replace("/yonetim/giris"); }}><button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/60 hover:bg-white/5 hover:text-white"><LogOut className="h-4 w-4" /> Çıkış Yap</button></form>
      </div>
    </nav>
  );

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 bg-basalt-950 lg:block">{nav}</aside>
      <div className="sticky top-0 z-40 flex h-14 items-center justify-between bg-basalt-950 px-4 text-white lg:hidden">
        <Link href="/yonetim" className="flex items-center gap-2"><Logo size={28} /> <span className="font-display uppercase tracking-wider">Yönetim</span></Link>
        <button onClick={() => setOpen(true)} aria-label="Menü"><Menu className="h-6 w-6" /></button>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-basalt-950">
            <button onClick={() => setOpen(false)} className="absolute right-3 top-5 text-white/60" aria-label="Kapat"><X className="h-5 w-5" /></button>
            {nav}
          </aside>
        </div>
      )}
    </>
  );
}
