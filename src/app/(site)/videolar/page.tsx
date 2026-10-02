"use client";

import Link from "next/link";
import { getCompetitionData, getCurrentCompetition, getCurrentFestival, getFestivalPlays, getSeasonMatches, getVideos } from "@/lib/data";
import { useData, useTitle } from "@/lib/hooks";
import { ErrorBox, PageLoader, Suspended, useParam } from "@/components/client";
import { ANNOUNCEMENT_CATEGORIES, SPORTS, type SportKey } from "@/lib/constants";
import { cn, formatDate } from "@/lib/utils";
import { EmptyState, PageHero } from "@/components/ui";
import { FilterChips } from "@/components/FilterBar";
import { YouTubeEmbed, YouTubeThumb } from "@/components/YouTubeEmbed";


import { useT } from "@/lib/i18n";
type Item = { key: string; title: string; url: string; category: string; date: Date; sub?: string; href?: string };

export default function VideosPage() {
  return <Suspended><Inner /></Suspended>;
}

function Inner() {
  const t = useT();
  useTitle(t("Video Arşivi"));
  const sp = { kategori: useParam("kategori"), v: useParam("v") };
  const { data, error } = useData(async () => {
    const [videos, matches, comp, fest] = await Promise.all([getVideos(), getSeasonMatches(), getCurrentCompetition(), getCurrentFestival()]);
    const [music, plays] = await Promise.all([comp ? getCompetitionData(comp.id) : null, fest ? getFestivalPlays(fest.id) : []]);
    return { videos, matches, comp, rounds: music?.rounds ?? [], plays, fest };
  }, []);
  if (error) return <ErrorBox message={error} />;
  if (!data) return <PageLoader />;
  const { videos, comp, fest } = data;
  const items: Item[] = [
    ...videos.map((v) => ({ key: v.id, title: v.title, url: v.youtubeUrl, category: v.category, date: v.publishedAt, sub: v.description ?? undefined })),
    ...data.matches.filter((m) => m.youtubeUrl).map((m) => ({ key: `m-${m.id}`, title: `${m.home.name} ${m.homeScore ?? ""}-${m.awayScore ?? ""} ${m.away.name}`, url: m.youtubeUrl!, category: "SPOR", date: m.date, sub: `${SPORTS[m.sport as SportKey]?.emoji} ${m.leagueName} · ${m.round}. Hafta`, href: `/spor/mac?id=${m.id}` })),
    ...data.rounds.filter((r) => r.youtubeUrl).map((r) => ({ key: `r-${r.id}`, title: `${comp?.name} ${comp?.edition} — ${r.name}`, url: r.youtubeUrl!, category: "MUZIK", date: r.date, sub: "Tur kaydı", href: `/muzik?tur=${r.id}` })),
    ...data.rounds.flatMap((r) => r.performances.filter((p) => p.youtubeUrl).map((p) => ({ key: `p-${r.id}-${p.contestantId}`, title: `${p.contestantName} — ${p.songTitle}`, url: p.youtubeUrl!, category: "MUZIK", date: r.date, sub: r.name, href: `/muzik/yarismaci?s=${p.contestantSlug}` }))),
    ...data.plays.filter((p) => p.youtubeUrl).map((p) => ({ key: `t-${p.id}`, title: `${p.title} — ${p.groupName}`, url: p.youtubeUrl!, category: "TIYATRO", date: p.shows[0]?.date ?? fest?.startDate ?? new Date(), sub: `${fest?.edition ?? ""} Tiyatro Festivali`, href: `/tiyatro/oyun?s=${p.slug}` })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  const cat = sp.kategori?.toUpperCase();
  const filtered = cat ? items.filter((i) => i.category === cat) : items;
  const current = items.find((i) => i.key === sp.v) ?? filtered[0];
  const qs = (key: string) => `/videolar?${new URLSearchParams({ ...(sp.kategori ? { kategori: sp.kategori } : {}), v: key })}`;

  return (
    <>
      <PageHero eyebrow={t("YouTube Arşivi")} title={t("Video Arşivi")} description={t("Organizasyondaki tüm maçlar, performanslar ve oyunlar kayıt altına alınıp burada yayınlanır.")} />
      <div className="container-x py-10">
        <div className="mb-8">
          <FilterChips name="kategori" basePath="/videolar" params={{ kategori: sp.kategori }} value={sp.kategori} options={[{ value: "spor", label: "⚽ Maçlar" }, { value: "muzik", label: "🎤 Müzik" }, { value: "tiyatro", label: "🎭 Tiyatro" }, { value: "genel", label: "Genel" }]} />
        </div>
        {filtered.length === 0 ? <EmptyState title={t("Bu kategoride video yok")} icon="🎬" /> : (
          <>
            {current && (
              <div className="mb-10 grid gap-6 lg:grid-cols-[1fr_20rem]">
                <YouTubeEmbed key={current.key} url={current.url} title={current.title} autoLoad={!!sp.v} />
                <div className="card h-fit p-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-dicle-600">{ANNOUNCEMENT_CATEGORIES[current.category]}</p>
                  <h2 className="mt-2 text-xl font-semibold">{current.title}</h2>
                  {current.sub && <p className="mt-1 text-sm text-basalt-500">{current.sub}</p>}
                  <p className="mt-3 text-xs text-basalt-400">{formatDate(current.date)}</p>
                  {current.href && <Link href={current.href} className="btn-outline mt-4 w-full">{t("Detay Sayfası")}</Link>}
                </div>
              </div>
            )}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((v) => (
                <Link key={v.key} href={qs(v.key)} scroll={false} className={cn("group overflow-hidden rounded-2xl bg-white shadow-card ring-2 transition hover:shadow-lg", current?.key === v.key ? "ring-dicle-500" : "ring-transparent")}>
                  <YouTubeThumb url={v.url} />
                  <div className="p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-basalt-400">{ANNOUNCEMENT_CATEGORIES[v.category]} · {formatDate(v.date, { day: "numeric", month: "short" })}</p>
                    <p className="mt-0.5 line-clamp-2 text-sm font-semibold">{v.title}</p>
                    {v.sub && <p className="mt-0.5 line-clamp-1 text-xs text-basalt-500">{v.sub}</p>}
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
