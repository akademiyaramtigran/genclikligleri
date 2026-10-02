import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, CalendarDays, Crown, ListOrdered, Shield, Users } from "lucide-react";
import { db } from "@/lib/db";
import { SPORT_LIST, GENDERS, genderBySlug, LEAGUE_STATUS } from "@/lib/constants";
import { computeStandings } from "@/lib/standings";
import { getScorers } from "@/lib/stats";
import { cn } from "@/lib/utils";
import { Badge, EmptyState, StatusBadge } from "@/components/ui";
import { GenderSwitch, LeaderTable, MatchRow, StandingsTable } from "@/components/sport";

export const metadata: Metadata = { title: "Lig Merkezi", description: "Futbol, basketbol, voleybol ve hentbol erkek ve kadın gençlik ligleri: puan durumları, fikstür ve istatistikler." };

export default async function SporPage({ searchParams }: { searchParams: Promise<{ cinsiyet?: string; brans?: string }> }) {
  const sp = await searchParams;
  const gender = genderBySlug(sp.cinsiyet);
  const g = GENDERS[gender];
  const teamSel = { select: { name: true, shortName: true, slug: true, logoUrl: true, primaryColor: true, secondaryColor: true } };

  const leagues = await db.league.findMany({
    where: { gender, season: { isActive: true } },
    include: {
      entries: { include: { team: true } },
      matches: { where: { status: "FINISHED" }, select: { homeTeamId: true, awayTeamId: true, homeScore: true, awayScore: true, date: true } },
      _count: { select: { matches: true, entries: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const blocks = await Promise.all(
    SPORT_LIST.map(async (s) => {
      const list = leagues.filter((l) => l.sport === s.key);
      return Promise.all(
        list.map(async (l) => {
          const rows = computeStandings(l.sport, l.entries.map((e) => ({ ...e.team, penalty: e.penaltyPoints })), l.matches);
          const [scorers, next, players] = await Promise.all([
            getScorers(l.sport, { leagueId: l.id }, 5),
            db.match.findMany({ where: { leagueId: l.id, status: { in: ["SCHEDULED", "LIVE"] } }, orderBy: { date: "asc" }, take: 3, include: { homeTeam: teamSel, awayTeam: teamSel } }),
            db.player.count({ where: { team: { entries: { some: { leagueId: l.id } } } } }),
          ]);
          return { sport: s, league: l, rows, scorers, next, players };
        }),
      );
    }),
  );
  const items = blocks.flat();
  const accent = gender === "KADIN" ? "from-rose-500/30" : "from-sky-500/30";

  return (
    <>
      <section className="bg-basalt-wall relative overflow-hidden text-white">
        <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-br to-transparent", accent)} />
        <div className="container-x relative py-12 sm:py-16">
          <p className="eyebrow text-dicle-300">Lig Merkezi · 2026-2027</p>
          <div className="mt-3 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="font-display text-5xl font-semibold uppercase tracking-wide sm:text-6xl">{g.plural}</h1>
              <p className="mt-3 max-w-xl text-white/70">
                Diyarbakır&apos;ın {gender === "KADIN" ? "kadın" : "erkek"} gençlik takımlarının mücadele ettiği dört branşın puan durumları, krallık yarışları ve fikstürü.
              </p>
            </div>
            <GenderSwitch active={gender} hrefFor={(x) => `/spor?cinsiyet=${x}`} />
          </div>

          <nav className="scrollbar-none mt-10 flex gap-3 overflow-x-auto">
            {items.map(({ sport, league }) => (
              <a key={league.id} href={`#${sport.slug}`} className="flex shrink-0 items-center gap-2 rounded-2xl bg-white/5 px-4 py-3 ring-1 ring-white/10 transition hover:bg-white/10">
                <span className="text-2xl">{sport.emoji}</span>
                <span>
                  <span className="block text-sm font-semibold">{sport.label}</span>
                  <span className="block text-xs text-white/50">{league._count.entries} takım · {league._count.matches} maç</span>
                </span>
              </a>
            ))}
            <Link href="/spor/fikstur" className="flex shrink-0 items-center gap-2 rounded-2xl bg-white/5 px-4 py-3 text-sm font-semibold ring-1 ring-white/10 hover:bg-white/10"><CalendarDays className="h-5 w-5 text-dicle-300" /> Fikstür</Link>
            <Link href="/spor/krallik" className="flex shrink-0 items-center gap-2 rounded-2xl bg-white/5 px-4 py-3 text-sm font-semibold ring-1 ring-white/10 hover:bg-white/10"><Crown className="h-5 w-5 text-amber-300" /> Krallık</Link>
          </nav>
        </div>
      </section>

      <div className="container-x space-y-14 py-12">
        {items.length === 0 && <EmptyState title="Bu kategoride aktif lig bulunmuyor" description="Yeni sezon ligleri oluşturulduğunda burada listelenecek." />}
        {items.map(({ sport, league, rows, scorers, next, players }) => (
          <section key={league.id} id={sport.slug} className="scroll-mt-28">
            <div className={cn("relative overflow-hidden rounded-t-3xl bg-gradient-to-r px-6 py-6 text-white", sport.gradient)}>
              <span className="pointer-events-none absolute -right-4 -top-8 text-[9rem] leading-none opacity-15">{sport.emoji}</span>
              <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <StatusBadge map={LEAGUE_STATUS} value={league.status} />
                    <Badge tone="dark">{league.ageGroup}</Badge>
                  </div>
                  <h2 className="mt-2 font-display text-3xl font-semibold uppercase tracking-wide">{league.name}</h2>
                  <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/75">
                    <span className="flex items-center gap-1"><Shield className="h-4 w-4" /> {league._count.entries} takım</span>
                    <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {players} sporcu</span>
                    <span className="flex items-center gap-1"><ListOrdered className="h-4 w-4" /> {league.matches.length}/{league._count.matches} maç oynandı</span>
                  </p>
                </div>
                <Link href={`/spor/lig/${league.slug}`} className="btn shrink-0 bg-white text-basalt-900 hover:bg-white/90">Lig Sayfası <ArrowRight className="h-4 w-4" /></Link>
              </div>
            </div>
            <div className="grid gap-px overflow-hidden rounded-b-3xl border border-t-0 border-basalt-200 bg-basalt-200 lg:grid-cols-[1.6fr_1fr]">
              <div className="bg-white">
                <StandingsTable rows={rows} sport={league.sport} />
              </div>
              <div className="flex flex-col bg-white">
                <div className="flex items-center justify-between border-b border-basalt-100 px-4 py-3">
                  <h3 className="flex items-center gap-2 font-semibold"><Crown className="h-4 w-4 text-amber-500" /> {sport.scorerTitle}</h3>
                  <Link href={`/spor/lig/${league.slug}?sekme=istatistik`} className="text-xs font-medium text-dicle-700">Tümü →</Link>
                </div>
                <LeaderTable rows={scorers} unit={sport.scorerUnit} compact />
                <div className="mt-auto border-t border-basalt-100">
                  <h3 className="px-4 pt-3 text-xs font-bold uppercase tracking-wider text-basalt-500">Sıradaki Maçlar</h3>
                  <div className="divide-y divide-basalt-100">
                    {next.length === 0 ? <p className="px-4 py-4 text-sm text-basalt-400">Planlanmış maç yok</p> : next.map((m) => <MatchRow key={m.id} m={m} />)}
                  </div>
                </div>
              </div>
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
