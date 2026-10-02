import type { Metadata } from "next";
import { db } from "@/lib/db";
import { SPORT_LIST, SPORTS, type SportKey } from "@/lib/constants";
import { formatDate, dayKey } from "@/lib/utils";
import { EmptyState, PageHero } from "@/components/ui";
import { FilterChips } from "@/components/FilterBar";
import { MatchRow } from "@/components/sport";

export const metadata: Metadata = { title: "Fikstür & Sonuçlar", description: "Tüm gençlik liglerinin maç programı ve sonuçları." };

export default async function FixturePage({ searchParams }: { searchParams: Promise<{ brans?: string; cinsiyet?: string; durum?: string }> }) {
  const sp = await searchParams;
  const sport = SPORT_LIST.find((s) => s.slug === sp.brans)?.key;
  const gender = sp.cinsiyet === "kadin" ? "KADIN" : sp.cinsiyet === "erkek" ? "ERKEK" : undefined;
  const results = sp.durum === "sonuclar";
  const now = new Date();
  const teamSel = { select: { name: true, shortName: true, slug: true, logoUrl: true, primaryColor: true, secondaryColor: true } };

  const matches = await db.match.findMany({
    where: {
      league: { ...(sport ? { sport } : {}), ...(gender ? { gender } : {}), season: { isActive: true } },
      ...(results ? { status: "FINISHED" } : { status: { in: ["SCHEDULED", "LIVE", "POSTPONED"] }, date: { gte: new Date(now.getTime() - 6 * 3_600_000) } }),
    },
    orderBy: { date: results ? "desc" : "asc" },
    take: 80,
    include: { homeTeam: teamSel, awayTeam: teamSel, league: true, venue: true },
  });

  const days = new Map<string, typeof matches>();
  for (const m of matches) {
    const k = dayKey(m.date);
    days.set(k, [...(days.get(k) ?? []), m]);
  }
  const params = { brans: sp.brans, cinsiyet: sp.cinsiyet, durum: sp.durum };

  return (
    <>
      <PageHero eyebrow="Maç Merkezi" title="Fikstür & Sonuçlar" description="Şehrin dört bir yanındaki sahalarda ve salonlarda oynanan tüm gençlik ligi maçları." />
      <div className="container-x py-10">
        <div className="mb-8 space-y-3">
          <FilterChips name="durum" basePath="/spor/fikstur" params={params} value={sp.durum} allLabel="Gelecek Maçlar" options={[{ value: "sonuclar", label: "Sonuçlar" }]} />
          <FilterChips name="brans" basePath="/spor/fikstur" params={params} value={sp.brans} allLabel="Tüm Branşlar" options={SPORT_LIST.map((s) => ({ value: s.slug, label: `${s.emoji} ${s.label}` }))} />
          <FilterChips name="cinsiyet" basePath="/spor/fikstur" params={params} value={sp.cinsiyet} allLabel="Erkek & Kadın" options={[{ value: "erkek", label: "Erkekler" }, { value: "kadin", label: "Kadınlar" }]} />
        </div>
        {days.size === 0 && <EmptyState title="Bu filtrelere uygun maç bulunamadı" icon="📅" />}
        <div className="space-y-6">
          {[...days.entries()].map(([k, list]) => (
            <div key={k} className="card overflow-hidden">
              <div className="border-b border-basalt-100 bg-basalt-50 px-4 py-2.5">
                <h2 className="font-semibold capitalize">{formatDate(list[0]!.date, { weekday: "long", day: "numeric", month: "long" })}</h2>
              </div>
              <div className="divide-y divide-basalt-100">
                {list.map((m) => (
                  <div key={m.id}>
                    <p className="px-4 pt-2 text-[11px] font-semibold uppercase tracking-wider text-basalt-400">{SPORTS[m.league.sport as SportKey]?.emoji} {m.league.name}{m.venue ? ` · ${m.venue.name}` : ""}</p>
                    <MatchRow m={m} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
