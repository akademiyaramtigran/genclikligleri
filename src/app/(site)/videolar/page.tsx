import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { ANNOUNCEMENT_CATEGORIES, SPORTS, type SportKey } from "@/lib/constants";
import { cn, formatDate } from "@/lib/utils";
import { EmptyState, PageHero } from "@/components/ui";
import { FilterChips } from "@/components/FilterBar";
import { YouTubeEmbed, YouTubeThumb } from "@/components/YouTubeEmbed";

export const metadata: Metadata = { title: "Video Arşivi", description: "Maç kayıtları, müzik yarışması performansları ve tiyatro festivali videoları." };

type Item = { key: string; title: string; url: string; category: string; date: Date; sub?: string; href?: string };

export default async function VideosPage({ searchParams }: { searchParams: Promise<{ kategori?: string; v?: string }> }) {
  const sp = await searchParams;
  const [videos, matches, rounds, perfs, plays] = await Promise.all([
    db.video.findMany({ orderBy: { publishedAt: "desc" } }),
    db.match.findMany({ where: { youtubeUrl: { not: null } }, include: { homeTeam: true, awayTeam: true, league: true }, orderBy: { date: "desc" }, take: 120 }),
    db.musicRound.findMany({ where: { youtubeUrl: { not: null } }, include: { competition: true } }),
    db.musicPerformance.findMany({ where: { youtubeUrl: { not: null } }, include: { contestant: true, round: true } }),
    db.theatrePlay.findMany({ where: { youtubeUrl: { not: null } }, include: { group: true, festival: true } }),
  ]);
  const items: Item[] = [
    ...videos.map((v) => ({ key: v.id, title: v.title, url: v.youtubeUrl, category: v.category, date: v.publishedAt, sub: v.description ?? undefined })),
    ...matches.map((m) => ({ key: `m-${m.id}`, title: `${m.homeTeam.name} ${m.homeScore ?? ""}-${m.awayScore ?? ""} ${m.awayTeam.name}`, url: m.youtubeUrl!, category: "SPOR", date: m.date, sub: `${SPORTS[m.league.sport as SportKey]?.emoji} ${m.league.name} · ${m.round}. Hafta`, href: `/spor/mac/${m.id}` })),
    ...rounds.map((r) => ({ key: `r-${r.id}`, title: `${r.competition.name} ${r.competition.edition} — ${r.name}`, url: r.youtubeUrl!, category: "MUZIK", date: r.date, sub: "Tur kaydı", href: `/muzik?tur=${r.id}` })),
    ...perfs.map((p) => ({ key: `p-${p.id}`, title: `${p.contestant.name} — ${p.songTitle}`, url: p.youtubeUrl!, category: "MUZIK", date: p.round.date, sub: p.round.name, href: `/muzik/yarismaci/${p.contestant.slug}` })),
    ...plays.map((p) => ({ key: `t-${p.id}`, title: `${p.title} — ${p.group.name}`, url: p.youtubeUrl!, category: "TIYATRO", date: p.createdAt, sub: `${p.festival.edition} Tiyatro Festivali`, href: `/tiyatro/oyun/${p.slug}` })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  const cat = sp.kategori?.toUpperCase();
  const filtered = cat ? items.filter((i) => i.category === cat) : items;
  const current = items.find((i) => i.key === sp.v) ?? filtered[0];
  const qs = (key: string) => `/videolar?${new URLSearchParams({ ...(sp.kategori ? { kategori: sp.kategori } : {}), v: key })}`;

  return (
    <>
      <PageHero eyebrow="YouTube Arşivi" title="Video Arşivi" description="Organizasyondaki tüm maçlar, performanslar ve oyunlar kayıt altına alınıp burada yayınlanır." />
      <div className="container-x py-10">
        <div className="mb-8">
          <FilterChips name="kategori" basePath="/videolar" params={{ kategori: sp.kategori }} value={sp.kategori} options={[{ value: "spor", label: "⚽ Maçlar" }, { value: "muzik", label: "🎤 Müzik" }, { value: "tiyatro", label: "🎭 Tiyatro" }, { value: "genel", label: "Genel" }]} />
        </div>
        {filtered.length === 0 ? <EmptyState title="Bu kategoride video yok" icon="🎬" /> : (
          <>
            {current && (
              <div className="mb-10 grid gap-6 lg:grid-cols-[1fr_20rem]">
                <YouTubeEmbed key={current.key} url={current.url} title={current.title} autoLoad={!!sp.v} />
                <div className="card h-fit p-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-dicle-600">{ANNOUNCEMENT_CATEGORIES[current.category]}</p>
                  <h2 className="mt-2 text-xl font-semibold">{current.title}</h2>
                  {current.sub && <p className="mt-1 text-sm text-basalt-500">{current.sub}</p>}
                  <p className="mt-3 text-xs text-basalt-400">{formatDate(current.date)}</p>
                  {current.href && <Link href={current.href} className="btn-outline mt-4 w-full">Detay Sayfası</Link>}
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
