import type { Metadata } from "next";
import { Crown } from "lucide-react";
import { SPORT_LIST, sportBySlug, genderBySlug } from "@/lib/constants";
import { getLeaders } from "@/lib/stats";
import { cn } from "@/lib/utils";
import { PageHero, Avatar } from "@/components/ui";
import { FilterChips } from "@/components/FilterBar";
import { GenderSwitch, LeaderTable } from "@/components/sport";
import Link from "next/link";

export const metadata: Metadata = { title: "Krallık Yarışı", description: "Gol krallığı, sayı krallığı, asist ve diğer bireysel istatistik liderleri." };

export default async function KrallikPage({ searchParams }: { searchParams: Promise<{ brans?: string; cinsiyet?: string }> }) {
  const sp = await searchParams;
  const sport = sportBySlug(sp.brans ?? "futbol") ?? SPORT_LIST[0]!;
  const gender = genderBySlug(sp.cinsiyet);
  const boards = sport.events.filter((e) => e.leaderboard);
  const data = await Promise.all(boards.map(async (b) => ({ b, rows: await getLeaders(b.key === sport.scoringEvents[0] ? sport.scoringEvents : [b.key], { sport: sport.key, gender }, 15) })));
  const [main, ...rest] = data;
  const podium = main?.rows.slice(0, 3) ?? [];

  return (
    <>
      <PageHero eyebrow="Bireysel İstatistikler" title="Krallık Yarışı" description="Ligin en golcü, en skorer ve en üretken oyuncuları.">
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <GenderSwitch active={gender} hrefFor={(g) => `/spor/krallik?brans=${sport.slug}&cinsiyet=${g}`} />
        </div>
      </PageHero>
      <div className="container-x py-10">
        <div className="mb-8">
          <FilterChips name="brans" basePath="/spor/krallik" params={{ brans: sp.brans, cinsiyet: sp.cinsiyet }} value={sport.slug} allLabel={null} options={SPORT_LIST.map((s) => ({ value: s.slug, label: `${s.emoji} ${s.label}` }))} />
        </div>

        {podium.length > 0 && (
          <div className="mb-10">
            <h2 className="mb-6 flex items-center gap-2 font-display text-2xl font-semibold uppercase tracking-wide"><Crown className="h-6 w-6 text-amber-500" /> {sport.scorerTitle} Kürsüsü</h2>
            <div className="grid items-end gap-4 sm:grid-cols-3">
              {[podium[1], podium[0], podium[2]].map((p, i) => {
                if (!p) return <div key={i} />;
                const rank = i === 1 ? 1 : i === 0 ? 2 : 3;
                return (
                  <Link key={p.playerId} href={`/spor/oyuncu/${p.slug}`} className={cn("group relative overflow-hidden rounded-3xl p-6 text-center text-white shadow-xl transition hover:-translate-y-1", rank === 1 ? "bg-gradient-to-b from-amber-400 to-amber-700 sm:pb-12" : rank === 2 ? "bg-gradient-to-b from-slate-400 to-slate-700" : "bg-gradient-to-b from-orange-600 to-orange-900", rank === 1 ? "order-first sm:order-none" : "")}>
                    <span className="absolute right-4 top-2 font-display text-6xl font-bold opacity-25">{rank}</span>
                    <Avatar name={p.name} src={p.photoUrl} size={rank === 1 ? 96 : 76} color={p.teamColor} className="mx-auto ring-4 ring-white/40" />
                    <p className="mt-4 font-display text-xl font-semibold uppercase">{p.name}</p>
                    <p className="text-sm opacity-80">{p.teamName}</p>
                    <p className="mt-3 font-display text-5xl font-bold">{p.total}</p>
                    <p className="text-xs uppercase tracking-widest opacity-75">{sport.scorerUnit} · {p.perMatch}/maç</p>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {main && (
            <div className="card overflow-hidden lg:row-span-2">
              <h3 className="flex items-center gap-2 border-b border-basalt-100 px-4 py-3 font-semibold"><Crown className="h-4 w-4 text-amber-500" /> {main.b.leaderboard}</h3>
              <LeaderTable rows={main.rows} unit={sport.scorerUnit} />
            </div>
          )}
          {rest.map(({ b, rows }) => (
            <div key={b.key} className="card overflow-hidden">
              <h3 className="border-b border-basalt-100 px-4 py-3 font-semibold">{b.leaderboard}</h3>
              <LeaderTable rows={rows.slice(0, 8)} unit={b.label} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
