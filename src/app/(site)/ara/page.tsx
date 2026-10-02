import Link from "next/link";
import type { Metadata } from "next";
import { Search } from "lucide-react";
import { db } from "@/lib/db";
import { sportDef } from "@/lib/constants";
import { Avatar, EmptyState, PageHero, TeamCrest } from "@/components/ui";

export const metadata: Metadata = { title: "Arama", robots: { index: false } };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q: raw } = await searchParams;
  const q = raw?.trim() ?? "";
  // SQLite'ta Türkçe büyük/küçük harf duyarlılığı için birkaç varyasyon denenir
  const variants = q ? [...new Set([q, q.toLocaleLowerCase("tr-TR"), q.toLocaleUpperCase("tr-TR"), q.charAt(0).toLocaleUpperCase("tr-TR") + q.slice(1).toLocaleLowerCase("tr-TR")])] : [];
  const any = (field: string) => variants.map((v) => ({ [field]: { contains: v } }));
  const [teams, players, contestants, plays, news] = q.length >= 2
    ? await Promise.all([
        db.team.findMany({ where: { OR: any("name") }, take: 12 }),
        db.player.findMany({ where: { OR: [...any("firstName"), ...any("lastName")] }, include: { team: true }, take: 24 }),
        db.musicContestant.findMany({ where: { OR: any("name") }, take: 8 }),
        db.theatrePlay.findMany({ where: { OR: any("title") }, include: { group: true }, take: 8 }),
        db.announcement.findMany({ where: { isPublished: true, OR: any("title") }, take: 8 }),
      ])
    : [[], [], [], [], []];
  const total = teams.length + players.length + contestants.length + plays.length + news.length;

  return (
    <>
      <PageHero eyebrow="Arama" title={q ? `“${q}”` : "Sitede Ara"}>
        <form className="mt-6 flex max-w-xl gap-2" action="/ara">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-basalt-400" />
            <input name="q" defaultValue={q} autoFocus placeholder="Takım, oyuncu, yarışmacı, oyun…" className="input pl-9" />
          </div>
          <button className="btn bg-white text-basalt-900">Ara</button>
        </form>
      </PageHero>
      <div className="container-x space-y-10 py-10">
        {q.length >= 2 && total === 0 && <EmptyState title="Sonuç bulunamadı" description="Farklı bir kelimeyle tekrar deneyin." />}
        {teams.length > 0 && (
          <section><h2 className="mb-3 font-semibold">Takımlar</h2><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {teams.map((t) => <Link key={t.id} href={`/spor/takim/${t.slug}`} className="card flex items-center gap-3 p-3 hover:shadow-lg"><TeamCrest team={t} size={36} /><span><span className="block font-semibold">{t.name}</span><span className="text-xs text-basalt-500">{sportDef(t.sport).label} · {t.gender === "KADIN" ? "Kadın" : "Erkek"}</span></span></Link>)}
          </div></section>
        )}
        {players.length > 0 && (
          <section><h2 className="mb-3 font-semibold">Oyuncular</h2><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {players.map((p) => <Link key={p.id} href={`/spor/oyuncu/${p.slug}`} className="card flex items-center gap-3 p-3 hover:shadow-lg"><Avatar name={`${p.firstName} ${p.lastName}`} src={p.photoUrl} size={36} color={p.team?.primaryColor} /><span className="min-w-0"><span className="block truncate font-semibold">{p.firstName} {p.lastName}</span><span className="block truncate text-xs text-basalt-500">{p.team?.name}</span></span></Link>)}
          </div></section>
        )}
        {contestants.length > 0 && (
          <section><h2 className="mb-3 font-semibold">Müzik Yarışmacıları</h2><div className="flex flex-wrap gap-2">
            {contestants.map((c) => <Link key={c.id} href={`/muzik/yarismaci/${c.slug}`} className="rounded-full bg-fuchsia-50 px-4 py-2 text-sm font-semibold text-fuchsia-700 ring-1 ring-fuchsia-200 hover:bg-fuchsia-100">🎤 {c.name}</Link>)}
          </div></section>
        )}
        {plays.length > 0 && (
          <section><h2 className="mb-3 font-semibold">Tiyatro Oyunları</h2><div className="flex flex-wrap gap-2">
            {plays.map((p) => <Link key={p.id} href={`/tiyatro/oyun/${p.slug}`} className="rounded-full bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 ring-1 ring-amber-200 hover:bg-amber-100">🎭 {p.title} — {p.group.name}</Link>)}
          </div></section>
        )}
        {news.length > 0 && (
          <section><h2 className="mb-3 font-semibold">Duyurular</h2><div className="card divide-y divide-basalt-100">
            {news.map((n) => <Link key={n.id} href={`/duyurular/${n.slug}`} className="block p-4 hover:bg-basalt-50"><span className="font-semibold">{n.title}</span><span className="block text-sm text-basalt-500">{n.excerpt}</span></Link>)}
          </div></section>
        )}
      </div>
    </>
  );
}
