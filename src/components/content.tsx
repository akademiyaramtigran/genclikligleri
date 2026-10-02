"use client";

import Link from "next/link";
import { ArrowRight, Camera, Feather, Mic, Newspaper, Quote, Share2, HeartHandshake, Star, Music2 } from "lucide-react";
import type { Announcement, Highlight, Post } from "@/lib/types";
import { HIGHLIGHT_KINDS, POST_KINDS, POST_SECTIONS } from "@/lib/constants";
import { cn, formatDate, initials } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { withBase } from "./client";
import { highlightCard, shareOrDownload } from "@/lib/sharecard";

/** Ana sayfa manşeti: haftanın en çarpıcı olayı, büyük fotoğrafla */
export function HeadlineHero({ a, children }: { a: Announcement; children?: React.ReactNode }) {
  const t = useT();
  return (
    <section className="relative isolate overflow-hidden bg-basalt-950 text-white">
      {a.coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={a.coverUrl} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover" />
      ) : (
        <div className="bg-basalt-wall absolute inset-0 -z-10">
          <div className="absolute -left-20 top-0 h-[30rem] w-[30rem] rounded-full bg-dicle-500/30 blur-[120px]" />
          <div className="absolute right-0 top-20 h-[26rem] w-[26rem] rounded-full bg-fuchsia-600/25 blur-[120px]" />
        </div>
      )}
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-basalt-950 via-basalt-950/70 to-basalt-950/10" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-basalt-950/80 via-transparent to-transparent" />
      <div className="container-x flex min-h-[78vh] flex-col justify-end pb-12 pt-28 sm:min-h-[82vh]">
        <div className="max-w-3xl animate-fade-up">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] ring-1 ring-white/20 backdrop-blur">
            <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-amber-400" /> {a.kicker || t("Haftanın Manşeti")}
          </p>
          <h1 className="mt-5 font-display text-5xl font-semibold uppercase leading-[0.95] tracking-wide text-balance sm:text-7xl lg:text-8xl">{a.title}</h1>
          <p className="mt-5 max-w-2xl text-lg text-white/80">{a.excerpt}</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href={`/duyurular/oku?s=${a.slug}`} className="btn bg-white px-6 py-3 text-basalt-950 hover:bg-dicle-300">{t("Haberi Oku")} <ArrowRight className="h-4 w-4" /></Link>
            <span className="text-sm text-white/60">{formatDate(a.publishedAt)}</span>
          </div>
        </div>
        {children}
      </div>
    </section>
  );
}

const KIND_ICON = { PLAYER: Star, ARTIST: Music2, FAIRPLAY: HeartHandshake } as const;
const KIND_STYLE: Record<string, { grad: string; chip: string }> = {
  PLAYER: { grad: "from-dicle-500 to-emerald-800", chip: "bg-emerald-500 text-white" },
  ARTIST: { grad: "from-fuchsia-600 to-purple-900", chip: "bg-fuchsia-600 text-white" },
  FAIRPLAY: { grad: "from-amber-500 to-orange-700", chip: "bg-amber-400 text-basalt-950" },
};

/** Haftanın oyuncusu / sanatçısı / centilmenlik kartı */
export function HighlightCard({ h, large }: { h: Highlight; large?: boolean }) {
  const t = useT();
  const Icon = KIND_ICON[h.kind as keyof typeof KIND_ICON] ?? Star;
  const st = KIND_STYLE[h.kind] ?? KIND_STYLE.PLAYER!;
  const inner = (
    <article className={cn("group relative flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-basalt-200/70 transition hover:-translate-y-1 hover:shadow-xl", large && "md:flex-row")}>
      <div className={cn("relative overflow-hidden bg-gradient-to-br", h.photoUrl ? "aspect-[4/5]" : "aspect-[16/9]", st.grad, large ? "md:aspect-auto md:w-2/5" : "")}>
        {h.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={h.photoUrl} alt={h.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="font-display text-6xl font-bold text-white/30">{initials(h.name)}</span>
            <Icon className="absolute bottom-4 right-4 h-10 w-10 text-white/30" />
          </div>
        )}
        <span className={cn("absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider shadow", st.chip)}>
          <Icon className="h-3.5 w-3.5" /> {t(HIGHLIGHT_KINDS[h.kind]?.label ?? h.kind)}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-basalt-400">{formatDate(h.weekOf, { day: "numeric", month: "long" })} {t("haftası")}</p>
        <h3 className="mt-1 font-display text-2xl font-semibold uppercase leading-tight text-basalt-900">{h.name}</h3>
        {h.subtitle && <p className="text-sm font-medium text-dicle-700">{h.subtitle}</p>}
        <p className="mt-3 flex-1 text-sm leading-relaxed text-basalt-600"><Quote className="mr-1 inline h-4 w-4 -translate-y-0.5 text-basalt-300" />{h.story}</p>
        <div className="mt-4 flex items-center justify-between gap-2">
          {h.link ? <span className="inline-flex items-center gap-1 text-sm font-semibold text-dicle-700">{t("Profili gör")} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span> : <span />}
          <button type="button" title={t("Paylaşım Görseli")} aria-label={t("Paylaşım Görseli")}
            onClick={async (e) => { e.preventDefault(); e.stopPropagation(); const label = t(HIGHLIGHT_KINDS[h.kind]?.label ?? ""); await shareOrDownload(await highlightCard(h, label), `haftanin-${h.kind.toLowerCase()}.png`, `${label}: ${h.name}`); }}
            className="rounded-lg p-2 text-basalt-400 hover:bg-basalt-100 hover:text-basalt-900"><Share2 className="h-4 w-4" /></button>
        </div>
      </div>
    </article>
  );
  return h.link ? <Link href={h.link} className="block h-full">{inner}</Link> : inner;
}

const POST_ICON = { ROPORTAJ: Mic, KOSE: Feather, FOTO: Camera, HABER: Newspaper } as const;
const POST_TONE: Record<string, string> = {
  ROPORTAJ: "bg-sky-100 text-sky-800", KOSE: "bg-rose-100 text-rose-800", FOTO: "bg-amber-100 text-amber-800", HABER: "bg-emerald-100 text-emerald-800",
};

/** Sosyal medya gönderisi görünümünde akış kartı */
export function PostCard({ p, compact }: { p: Post; compact?: boolean }) {
  const t = useT();
  const Icon = POST_ICON[p.kind as keyof typeof POST_ICON] ?? Newspaper;
  const photos = p.photos ?? [];
  const share = async (e: React.MouseEvent) => {
    e.preventDefault();
    const url = `${location.origin}${withBase(`/gencligin-sesi/oku/?s=${p.slug}`)}`;
    try {
      if (navigator.share) await navigator.share({ title: p.title, url });
      else { await navigator.clipboard.writeText(url); alert(t("Bağlantı kopyalandı")); }
    } catch { /* paylaşım iptal edildi */ }
  };
  return (
    <article className="overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-basalt-200/70">
      <header className="flex items-center gap-3 px-5 pt-5">
        {p.authorPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.authorPhoto} alt="" className="h-11 w-11 rounded-full object-cover" />
        ) : <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-basalt-700 to-basalt-900 text-sm font-bold text-white">{initials(p.author)}</span>}
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-basalt-900">{p.author}</p>
          <p className="truncate text-xs text-basalt-500">{p.authorRole ? `${p.authorRole} · ` : ""}{formatDate(p.publishedAt, { day: "numeric", month: "long" })}</p>
        </div>
        <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider", POST_TONE[p.kind])}><Icon className="h-3.5 w-3.5" /> {t(POST_KINDS[p.kind]?.label ?? p.kind)}</span>
      </header>
      <Link href={`/gencligin-sesi/oku?s=${p.slug}`} className="block">
        <div className="px-5 pb-4 pt-3">
          <h3 className={cn("font-semibold leading-snug text-basalt-900", compact ? "text-base" : "text-lg", p.kind === "KOSE" && "font-serif text-xl")}>{p.title}</h3>
          {p.kind === "ROPORTAJ" && p.qa?.[0] ? (
            <div className="mt-2 rounded-2xl bg-sky-50 p-3 text-sm">
              <p className="font-semibold text-sky-900">{p.qa[0].q}</p>
              <p className="mt-1 line-clamp-3 text-sky-900/80">“{p.qa[0].a}”</p>
            </div>
          ) : p.body ? (
            <p className={cn("mt-1.5 text-sm leading-relaxed text-basalt-600", compact ? "line-clamp-2" : "line-clamp-4", p.kind === "KOSE" && "font-serif text-[15px] italic")}>{p.body}</p>
          ) : null}
        </div>
        {photos.length > 0 && (
          <div className={cn("grid gap-0.5", photos.length === 1 ? "grid-cols-1" : "grid-cols-2")}>
            {photos.slice(0, compact ? 1 : 4).map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={src} alt="" className={cn("w-full object-cover", photos.length === 1 || compact ? "aspect-[16/10]" : "aspect-square", photos.length === 3 && i === 0 && !compact && "col-span-2 aspect-[16/9]")} />
            ))}
          </div>
        )}
      </Link>
      <footer className="flex items-center justify-between border-t border-basalt-100 px-5 py-3 text-xs text-basalt-500">
        <span className="font-semibold uppercase tracking-wider">{t(POST_SECTIONS[p.section] ?? p.section)}</span>
        <button type="button" onClick={share} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 font-semibold hover:bg-basalt-100 hover:text-basalt-900"><Share2 className="h-3.5 w-3.5" /> {t("Paylaş")}</button>
      </footer>
    </article>
  );
}
