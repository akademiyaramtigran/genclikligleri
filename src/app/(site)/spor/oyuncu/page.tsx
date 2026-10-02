"use client";

import Link from "next/link";
import { getPlayer, getPlayerMatches, getTeam, getLeague } from "@/lib/data";
import { useData, useTitle } from "@/lib/hooks";
import { sportDef, GENDERS, PLAYER_STATUS, eventDef } from "@/lib/constants";
import { playerTotals } from "@/lib/stats";
import { age, cn, formatDate, formatShortDate } from "@/lib/utils";
import { Avatar, Badge, KeyValue, StatusBadge, TeamCrest } from "@/components/ui";
import { ErrorBox, NotFoundBox, PageLoader, Suspended, useParam } from "@/components/client";

export default function PlayerPage() {
  return <Suspended><Inner /></Suspended>;
}

function Inner() {
  const slug = useParam("s") ?? "";
  const { data, error } = useData(async () => {
    const player = await getPlayer(slug);
    if (!player) return null;
    const team = player.teamId ? await getTeam(player.teamId) : null;
    const [matches, league] = await Promise.all([getPlayerMatches(player.id), team?.leagueIds.length ? getLeague(team.leagueIds[team.leagueIds.length - 1]!) : null]);
    return { player, team, matches, league };
  }, [slug]);
  useTitle(data?.player ? `${data.player.firstName} ${data.player.lastName}` : undefined);
  if (error) return <ErrorBox message={error} />;
  if (data === undefined) return <PageLoader />;
  if (!data) return <NotFoundBox title="Oyuncu bulunamadı" />;
  const { player, team, matches, league } = data;
  const sport = team?.sport ?? player.sport ?? "FUTBOL";
  const def = sportDef(sport);
  const name = `${player.firstName} ${player.lastName}`;
  const { totals } = playerTotals(matches, player.id);
  const mvpCount = matches.filter((m) => m.mvpPlayerId === player.id).length;
  const teamMatches = team && league ? (league.summary?.standings.find((r) => r.teamId === team.id)?.played ?? 0) : matches.length;
  const finished = matches.filter((m) => m.status === "FINISHED");
  const scored = def.scoringEvents.reduce((s, k) => s + (totals[k] ?? 0), 0);
  const statCards = def.events.filter((e) => !def.scoringEvents.includes(e.key)).map((e) => ({ label: e.label, value: totals[e.key] ?? 0 }));
  const color = team?.primaryColor ?? "#0f766e";

  return (
    <>
      <section className="relative overflow-hidden text-white" style={{ background: `linear-gradient(120deg, #0a0d15 30%, ${color})` }}>
        <div className="bg-basalt-wall absolute inset-0 opacity-60 mix-blend-overlay" />
        {player.jerseyNumber != null && (
          <span className="pointer-events-none absolute -bottom-16 right-4 font-display text-[16rem] font-bold leading-none text-white/10 sm:right-16">{player.jerseyNumber}</span>
        )}
        <div className="container-x relative flex flex-col gap-8 py-12 sm:flex-row sm:items-end">
          <Avatar name={name} src={player.photoUrl} size={144} color={color} className="ring-4 ring-white/20" />
          <div className="flex-1">
            <div className="flex flex-wrap gap-2">
              <Badge tone="dark">{def.emoji} {def.label}</Badge>
              {player.position && <Badge tone="dark">{player.position}</Badge>}
              {player.isCaptain && <Badge tone="yellow">Kaptan</Badge>}
              {player.status !== "ACTIVE" && <StatusBadge map={PLAYER_STATUS} value={player.status} />}
            </div>
            <h1 className="mt-3 font-display text-5xl font-semibold uppercase leading-none tracking-wide sm:text-6xl">
              <span className="block text-2xl font-normal text-white/70 sm:text-3xl">{player.firstName}</span>
              {player.lastName}
            </h1>
            {team && (
              <Link href={`/spor/takim?s=${team.slug}`} className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 py-1 pl-1 pr-4 text-sm font-semibold ring-1 ring-white/20 hover:bg-white/20">
                <TeamCrest team={team} size={28} /> {team.name}
              </Link>
            )}
          </div>
          <div className="grid grid-cols-3 gap-3 sm:w-80">
            {[[scored, def.scorerUnit], [teamMatches, "Takım Maçı"], [mvpCount, "Maçın Oyuncusu"]].map(([v, l]) => (
              <div key={l as string} className="rounded-2xl bg-white/10 p-3 text-center ring-1 ring-white/15 backdrop-blur">
                <p className="font-display text-3xl font-bold">{v}</p>
                <p className="text-[10px] uppercase leading-tight tracking-wider text-white/60">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="container-x grid gap-8 py-10 lg:grid-cols-[20rem_1fr]">
        <aside className="space-y-6">
          <div className="card p-5">
            <h2 className="mb-2 font-semibold">Oyuncu Kartı</h2>
            <KeyValue items={[
              ["Forma No", player.jerseyNumber ?? "—"],
              ["Mevki", player.position],
              ["Yaş", player.birthDate ? `${age(player.birthDate)} (${player.birthDate.slice(0, 4)})` : "—"],
              ["Boy / Kilo", player.heightCm ? `${player.heightCm} cm${player.weightKg ? ` / ${player.weightKg} kg` : ""}` : "—"],
              [sport === "FUTBOL" ? "Kullandığı Ayak" : "Kullandığı El", player.strongSide],
              ["Kategori", GENDERS[player.gender as "ERKEK"]?.league],
              ["İlçe", player.district],
              ["Okul", player.school],
              ["Lisans No", player.licenseNo],
              ["Lig", league ? <Link key="l" href={`/spor/lig?s=${league.slug}`} className="link">{league.name}</Link> : "—"],
            ]} />
          </div>
          {player.bio && <div className="card p-5 text-sm leading-relaxed text-basalt-600"><h2 className="mb-2 font-semibold text-basalt-900">Hakkında</h2>{player.bio}</div>}
        </aside>

        <div className="space-y-8">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            <div className="card relative overflow-hidden p-4">
              <div className={cn("absolute inset-0 bg-gradient-to-br opacity-10", def.gradient)} />
              <p className="relative text-xs font-medium uppercase tracking-wider text-basalt-500">{def.scorerUnit}</p>
              <p className="relative mt-2 font-display text-4xl font-bold">{scored}</p>
              <p className="relative text-xs text-basalt-500">{teamMatches ? `${(scored / teamMatches).toFixed(1)} / maç` : "—"}</p>
            </div>
            {statCards.map((s) => (
              <div key={s.label} className="card p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-basalt-500">{s.label}</p>
                <p className="mt-2 font-display text-4xl font-bold">{s.value}</p>
              </div>
            ))}
          </div>

          <div className="card overflow-hidden">
            <h2 className="border-b border-basalt-100 px-5 py-3 font-semibold">Maç Maç Performans</h2>
            {finished.length === 0 ? <p className="p-8 text-center text-sm text-basalt-500">Henüz istatistik kaydı bulunmuyor.</p> : (
              <div className="divide-y divide-basalt-100">
                {finished.map((match) => {
                  const items = match.events.filter((e) => e.playerId === player.id);
                  const isHome = match.homeTeamId === player.teamId;
                  const opp = isHome ? match.away : match.home;
                  const own = isHome ? match.homeScore : match.awayScore;
                  const oth = isHome ? match.awayScore : match.homeScore;
                  const res = (own ?? 0) > (oth ?? 0) ? "G" : own === oth ? "B" : "M";
                  return (
                    <Link key={match.id} href={`/spor/mac?id=${match.id}`} className="flex flex-wrap items-center gap-3 px-5 py-3 transition hover:bg-basalt-50">
                      <span className="w-14 text-xs text-basalt-500">{formatShortDate(match.date)}</span>
                      <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-bold text-white", res === "G" ? "bg-emerald-500" : res === "B" ? "bg-basalt-400" : "bg-red-500")}>{own}-{oth}</span>
                      <span className="flex min-w-0 flex-1 items-center gap-2 text-sm"><span className="text-basalt-400">{isHome ? "vs" : "@"}</span><TeamCrest team={opp} size={20} /><span className="truncate font-medium">{opp.name}</span></span>
                      <span className="flex flex-wrap gap-1.5">
                        {items.map((e) => {
                          const d = eventDef(sport, e.type);
                          return <Badge key={e.id} tone={d?.tone === "goal" ? "green" : d?.tone === "card-red" ? "red" : d?.tone === "card-yellow" ? "amber" : "slate"}>{d?.hasValue ? `${e.value} ` : ""}{d?.label ?? e.type}{e.minute ? ` ${e.minute}'` : ""}</Badge>;
                        })}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
