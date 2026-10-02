import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Crown, Goal, Home, Plane, Scale, Users, Eye } from "lucide-react";
import { db } from "@/lib/db";
import { sportDef, GENDERS, LEAGUE_STATUS } from "@/lib/constants";
import { getLeagueStandings } from "@/lib/standings";
import { getDiscipline, getLeaders, getLeagueSummary } from "@/lib/stats";
import { cn, lines, pct } from "@/lib/utils";
import { Badge, EmptyState, StatTile, StatusBadge, Tabs, TeamCrest } from "@/components/ui";
import { LeaderTable, MatchRow, StandingsTable } from "@/components/sport";

type P = { params: Promise<{ slug: string }>; searchParams: Promise<{ sekme?: string; hafta?: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { slug } = await params;
  const l = await db.league.findUnique({ where: { slug }, select: { name: true, description: true } });
  return { title: l?.name ?? "Lig", description: l?.description ?? undefined };
}

export default async function LeaguePage({ params, searchParams }: P) {
  const { slug } = await params;
  const { sekme = "puan", hafta } = await searchParams;
  const league = await db.league.findUnique({ where: { slug }, include: { season: true, _count: { select: { entries: true, matches: true } } } });
  if (!league) notFound();
  const def = sportDef(league.sport);
  const base = `/spor/lig/${league.slug}`;

  const tabs = [
    { key: "puan", label: "Puan Durumu", href: base },
    { key: "fikstur", label: "Fikstür & Sonuçlar", href: `${base}?sekme=fikstur` },
    { key: "istatistik", label: "İstatistikler", href: `${base}?sekme=istatistik` },
    { key: "takimlar", label: "Takımlar", href: `${base}?sekme=takimlar`, count: league._count.entries },
    { key: "kurallar", label: "Lig Kuralları", href: `${base}?sekme=kurallar` },
  ];

  return (
    <>
      <section className={cn("relative overflow-hidden bg-gradient-to-br text-white", def.gradient)}>
        <div className="bg-basalt-wall absolute inset-0 opacity-40 mix-blend-multiply" />
        <span className="pointer-events-none absolute -right-10 top-0 text-[14rem] leading-none opacity-10">{def.emoji}</span>
        <div className="container-x relative py-10 sm:py-14">
          <div className="flex flex-wrap items-center gap-2 text-sm text-white/70">
            <Link href={`/spor?cinsiyet=${GENDERS[league.gender as "ERKEK"].slug}`} className="hover:text-white">Lig Merkezi</Link>
            <span>/</span>
            <span>{GENDERS[league.gender as "ERKEK"]?.plural}</span>
          </div>
          <h1 className="mt-3 font-display text-4xl font-semibold uppercase tracking-wide sm:text-5xl">{league.name}</h1>
          <div className="mt-4 flex flex-wrap gap-2">
            <StatusBadge map={LEAGUE_STATUS} value={league.status} dot />
            <Badge tone="dark">{league.season.name} Sezonu</Badge>
            <Badge tone="dark">{league.ageGroup}</Badge>
            <Badge tone="dark">{league._count.entries} Takım</Badge>
          </div>
          {league.description && <p className="mt-4 max-w-2xl text-white/75">{league.description}</p>}
        </div>
      </section>

      <div className="sticky top-28 z-30 border-b border-basalt-200 bg-white/90 backdrop-blur md:top-16">
        <div className="container-x"><Tabs items={tabs} active={sekme} /></div>
      </div>

      <div className="container-x py-10">
        {sekme === "puan" && <StandingsTab leagueId={league.id} sport={league.sport} />}
        {sekme === "fikstur" && <FixtureTab leagueId={league.id} base={base} hafta={hafta} />}
        {sekme === "istatistik" && <StatsTab leagueId={league.id} sport={league.sport} />}
        {sekme === "takimlar" && <TeamsTab leagueId={league.id} />}
        {sekme === "kurallar" && (
          <div className="card max-w-3xl p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><Scale className="h-5 w-5 text-dicle-600" /> Lig Kuralları</h2>
            <ul className="space-y-3">
              {lines(league.rules).map((r, i) => (
                <li key={i} className="flex gap-3 text-sm text-basalt-700"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-dicle-500/10 text-xs font-bold text-dicle-700">{i + 1}</span>{r}</li>
              ))}
            </ul>
            <div className="mt-6 rounded-xl bg-basalt-50 p-4 text-sm text-basalt-600">
              <p className="font-semibold text-basalt-800">Puanlama sistemi</p>
              <p className="mt-1">
                {league.sport === "VOLEYBOL" ? "3-0 veya 3-1 galibiyet 3 puan, 3-2 galibiyet 2 puan, 2-3 mağlubiyet 1 puan, 0-3 / 1-3 mağlubiyet 0 puan." : `Galibiyet ${def.points.win} puan${def.allowsDraw ? `, beraberlik ${def.points.draw} puan` : ""}, mağlubiyet ${def.points.loss} puan.`}
                {" "}Eşitlik halinde sırasıyla {league.sport === "VOLEYBOL" ? "galibiyet sayısı, set averajı" : "averaj, atılan " + def.scoreLabel.toLowerCase()} dikkate alınır.
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

async function StandingsTab({ leagueId, sport }: { leagueId: string; sport: string }) {
  const def = sportDef(sport);
  const [rows, scorers] = await Promise.all([getLeagueStandings(leagueId), getLeaders(def.scoringEvents, { leagueId }, 5)]);
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <div className="card overflow-hidden">
        {rows.length ? <StandingsTable rows={rows} sport={sport} /> : <EmptyState title="Ligde henüz takım yok" />}
      </div>
      <div className="card h-fit overflow-hidden">
        <h3 className="flex items-center gap-2 border-b border-basalt-100 px-4 py-3 font-semibold"><Crown className="h-4 w-4 text-amber-500" /> {def.scorerTitle}</h3>
        <LeaderTable rows={scorers} unit={def.scorerUnit} compact />
      </div>
    </div>
  );
}

async function FixtureTab({ leagueId, base, hafta }: { leagueId: string; base: string; hafta?: string }) {
  const teamSel = { select: { name: true, shortName: true, slug: true, logoUrl: true, primaryColor: true, secondaryColor: true } };
  const matches = await db.match.findMany({ where: { leagueId }, orderBy: [{ round: "asc" }, { date: "asc" }], include: { homeTeam: teamSel, awayTeam: teamSel, venue: true } });
  if (matches.length === 0) return <EmptyState title="Fikstür henüz yayımlanmadı" description="Kura çekiminin ardından fikstür burada yayımlanacak." icon="📅" />;
  const rounds = [...new Set(matches.map((m) => m.round))];
  const current = matches.find((m) => m.status !== "FINISHED")?.round ?? rounds[rounds.length - 1]!;
  const selected = hafta === "tum" ? null : Number(hafta) || current;
  const shown = selected ? rounds.filter((r) => r === selected) : rounds;
  return (
    <div>
      <div className="scrollbar-none -mx-4 mb-6 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <Link href={`${base}?sekme=fikstur&hafta=tum`} scroll={false} className={cn("shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold", selected == null ? "bg-basalt-900 text-white" : "bg-white text-basalt-600 ring-1 ring-basalt-200")}>Tümü</Link>
        {rounds.map((r) => {
          const done = matches.filter((m) => m.round === r).every((m) => m.status === "FINISHED");
          return (
            <Link key={r} href={`${base}?sekme=fikstur&hafta=${r}`} scroll={false} className={cn("shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold", selected === r ? "bg-basalt-900 text-white" : "bg-white text-basalt-600 ring-1 ring-basalt-200", done && selected !== r && "text-basalt-400")}>
              {r}. Hafta{r === current && " •"}
            </Link>
          );
        })}
      </div>
      <div className="space-y-6">
        {shown.map((r) => (
          <div key={r} className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-basalt-100 bg-basalt-50 px-4 py-2.5">
              <h3 className="font-display text-base font-semibold uppercase tracking-wider">{r}. Hafta</h3>
              {r === current && <Badge tone="green" dot>Bu hafta</Badge>}
            </div>
            <div className="divide-y divide-basalt-100">
              {matches.filter((m) => m.round === r).map((m) => <MatchRow key={m.id} m={m} />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

async function StatsTab({ leagueId, sport }: { leagueId: string; sport: string }) {
  const def = sportDef(sport);
  const boards = def.events.filter((e) => e.leaderboard);
  const [summary, leaders, discipline] = await Promise.all([
    getLeagueSummary(leagueId),
    Promise.all(boards.map(async (b) => ({ b, rows: await getLeaders(b.key === def.scoringEvents[0] ? def.scoringEvents : [b.key], { leagueId }, 10) }))),
    getDiscipline(leagueId),
  ]);
  const hasCards = def.events.some((e) => e.key === "YELLOW_CARD" || e.key === "SUSPENSION");
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Oynanan Maç" value={`${summary.played}/${summary.total}`} sub={`%${pct(summary.played, summary.total)} tamamlandı`} />
        <StatTile label={`Toplam ${def.scoreLabel}`} value={summary.scored.toLocaleString("tr-TR")} sub={`Maç başı ${summary.avg}`} icon={<Goal className="h-4 w-4" />} />
        <StatTile label="İç Saha / Deplasman" value={`${summary.homeWins} / ${summary.awayWins}`} sub={def.allowsDraw ? `${summary.draws} beraberlik` : "galibiyet"} icon={<Home className="h-4 w-4" />} />
        <StatTile label="Toplam Seyirci" value={summary.attendance.toLocaleString("tr-TR")} sub={summary.played ? `Maç başı ${Math.round(summary.attendance / summary.played)}` : undefined} icon={<Eye className="h-4 w-4" />} />
      </div>

      {summary.played > 0 && (
        <div className="card p-5">
          <p className="mb-3 text-sm font-semibold">Sonuç dağılımı</p>
          <div className="flex h-4 overflow-hidden rounded-full">
            <div className="bg-dicle-500" style={{ width: `${pct(summary.homeWins, summary.played)}%` }} />
            <div className="bg-basalt-300" style={{ width: `${pct(summary.draws, summary.played)}%` }} />
            <div className="bg-orange-500" style={{ width: `${pct(summary.awayWins, summary.played)}%` }} />
          </div>
          <div className="mt-2 flex flex-wrap gap-4 text-xs text-basalt-600">
            <span className="flex items-center gap-1"><Home className="h-3 w-3 text-dicle-600" /> İç saha %{pct(summary.homeWins, summary.played)}</span>
            {def.allowsDraw && <span>Beraberlik %{pct(summary.draws, summary.played)}</span>}
            <span className="flex items-center gap-1"><Plane className="h-3 w-3 text-orange-600" /> Deplasman %{pct(summary.awayWins, summary.played)}</span>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {leaders.map(({ b, rows }) => (
          <div key={b.key} className="card overflow-hidden">
            <h3 className="flex items-center gap-2 border-b border-basalt-100 px-4 py-3 font-semibold">{b.key === def.scoringEvents[0] && <Crown className="h-4 w-4 text-amber-500" />}{b.leaderboard}</h3>
            <LeaderTable rows={rows} unit={b.label} />
          </div>
        ))}
      </div>

      {hasCards && (
        <div className="card overflow-hidden">
          <h3 className="border-b border-basalt-100 px-4 py-3 font-semibold">Disiplin Tablosu</h3>
          {discipline.length === 0 ? <p className="p-6 text-center text-sm text-basalt-500">Henüz kart görülmedi. Fair-play! 👏</p> : (
            <div className="overflow-x-auto">
              <table className="table-base">
                <thead><tr><th>Oyuncu</th><th>Takım</th><th className="text-center">🟨</th><th className="text-center">🟥</th>{sport === "HENTBOL" && <th className="text-center">2&apos;</th>}</tr></thead>
                <tbody>
                  {discipline.map((d) => (
                    <tr key={d.player.id}>
                      <td><Link href={`/spor/oyuncu/${d.player.slug}`} className="font-medium hover:text-dicle-700">{d.player.firstName} {d.player.lastName}</Link></td>
                      <td className="text-basalt-500">{d.player.team?.name}</td>
                      <td className="text-center font-semibold tabular-nums">{d.yellow}</td>
                      <td className="text-center font-semibold tabular-nums">{d.red}</td>
                      {sport === "HENTBOL" && <td className="text-center font-semibold tabular-nums">{d.susp}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

async function TeamsTab({ leagueId }: { leagueId: string }) {
  const entries = await db.leagueEntry.findMany({ where: { leagueId }, include: { team: { include: { _count: { select: { players: true } }, venue: true } } }, orderBy: { team: { name: "asc" } } });
  if (entries.length === 0) return <EmptyState title="Ligde henüz takım yok" />;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {entries.map(({ team }) => (
        <Link key={team.id} href={`/spor/takim/${team.slug}`} className="card group relative overflow-hidden p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
          <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: `linear-gradient(90deg, ${team.primaryColor}, ${team.secondaryColor})` }} />
          <div className="flex items-center gap-4">
            <TeamCrest team={team} size={56} />
            <div className="min-w-0">
              <p className="truncate font-semibold text-basalt-900 group-hover:text-dicle-700">{team.name}</p>
              <p className="text-sm text-basalt-500">{team.district}{team.foundedYear ? ` · Kuruluş ${team.foundedYear}` : ""}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-basalt-500">
            <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {team._count.players} oyuncu</span>
            {team.coachName && <span>Antrenör: {team.coachName}</span>}
          </div>
        </Link>
      ))}
    </div>
  );
}
