import { sportDef } from "./constants";
import { computeStandings } from "./standings";
import type { League, LeaderRow, LeagueSummary, Match, Team } from "./types";

/** Belirli olay tiplerinde oyuncu sıralaması (maçlara gömülü olaylardan) */
export function computeLeaders(matches: Match[], types: string[], teams: Map<string, Team>, take = 10): LeaderRow[] {
  const finished = matches.filter((m) => m.status === "FINISHED");
  const teamPlayed = new Map<string, number>();
  for (const m of finished) for (const t of m.teamIds) teamPlayed.set(t, (teamPlayed.get(t) ?? 0) + 1);
  const totals = new Map<string, { name: string; teamId: string; total: number }>();
  for (const m of finished) {
    for (const e of m.events) {
      if (!e.playerId || !types.includes(e.type)) continue;
      const cur = totals.get(e.playerId) ?? { name: e.playerName, teamId: e.teamId, total: 0 };
      cur.total += e.value;
      totals.set(e.playerId, cur);
    }
  }
  return [...totals.entries()]
    .sort((a, b) => b[1].total - a[1].total || a[1].name.localeCompare(b[1].name, "tr"))
    .slice(0, take)
    .map(([playerId, v]) => {
      const t = teams.get(v.teamId);
      const matchesPlayed = teamPlayed.get(v.teamId) ?? 0;
      return {
        playerId, slug: playerId, name: v.name, teamName: t?.name ?? "—", teamSlug: t?.slug ?? "", teamColor: t?.primaryColor ?? "#64748b",
        total: v.total, matches: matchesPlayed, perMatch: matchesPlayed ? Math.round((v.total / matchesPlayed) * 10) / 10 : 0,
      };
    });
}

export function computeDiscipline(matches: Match[], teams: Map<string, Team>, take = 10) {
  const map = new Map<string, { name: string; teamId: string; yellow: number; red: number; susp: number }>();
  for (const m of matches.filter((x) => x.status === "FINISHED")) {
    for (const e of m.events) {
      if (!e.playerId || !["YELLOW_CARD", "RED_CARD", "SUSPENSION"].includes(e.type)) continue;
      const cur = map.get(e.playerId) ?? { name: e.playerName, teamId: e.teamId, yellow: 0, red: 0, susp: 0 };
      if (e.type === "YELLOW_CARD") cur.yellow++;
      if (e.type === "RED_CARD") cur.red++;
      if (e.type === "SUSPENSION") cur.susp++;
      map.set(e.playerId, cur);
    }
  }
  return [...map.entries()]
    .map(([playerId, v]) => ({ playerId, slug: playerId, name: v.name, teamName: teams.get(v.teamId)?.name ?? "—", yellow: v.yellow, red: v.red, susp: v.susp }))
    .sort((a, b) => b.red * 3 + b.yellow + b.susp - (a.red * 3 + a.yellow + a.susp))
    .slice(0, take);
}

export function computeLeagueStats(matches: Match[]) {
  const done = matches.filter((m) => m.status === "FINISHED");
  const scored = done.reduce((s, m) => s + (m.homeScore ?? 0) + (m.awayScore ?? 0), 0);
  const homeWins = done.filter((m) => (m.homeScore ?? 0) > (m.awayScore ?? 0)).length;
  const awayWins = done.filter((m) => (m.homeScore ?? 0) < (m.awayScore ?? 0)).length;
  return {
    played: done.length, total: matches.length, scored, avg: done.length ? Math.round((scored / done.length) * 10) / 10 : 0,
    homeWins, awayWins, draws: done.length - homeWins - awayWins, attendance: done.reduce((s, m) => s + (m.attendance ?? 0), 0),
  };
}

/** Lig özetini (puan durumu, liderler, disiplin, istatistik) hesaplar. Yönetici her değişiklikte lig belgesine yazar. */
export function buildLeagueSummary(league: League, teams: Team[], matches: Match[]): LeagueSummary {
  const def = sportDef(league.sport);
  const teamMap = new Map(teams.map((t) => [t.id, t]));
  const entryTeams = league.entries.map((e) => ({ team: teamMap.get(e.teamId), penalty: e.penaltyPoints })).filter((x) => x.team);
  const standings = computeStandings(
    league.sport,
    entryTeams.map(({ team, penalty }) => ({ id: team!.id, name: team!.name, shortName: team!.shortName, slug: team!.slug, logoUrl: team!.logoUrl, primaryColor: team!.primaryColor, secondaryColor: team!.secondaryColor, penalty })),
    matches.filter((m) => m.status === "FINISHED"),
  );
  const leaders: Record<string, LeaderRow[]> = {};
  for (const ev of def.events.filter((e) => e.leaderboard)) {
    const types = ev.key === def.scoringEvents[0] ? def.scoringEvents : [ev.key];
    leaders[ev.key] = computeLeaders(matches, types, teamMap, 15);
  }
  return { standings, leaders, discipline: computeDiscipline(matches, teamMap), stats: computeLeagueStats(matches), updatedAt: new Date() };
}

/** Oyuncunun olay tipine göre toplamları */
export function playerTotals(matches: Match[], playerId: string) {
  const totals: Record<string, number> = {};
  let count = 0;
  for (const m of matches.filter((x) => x.status === "FINISHED")) {
    const evs = m.events.filter((e) => e.playerId === playerId);
    if (evs.length) count++;
    for (const e of evs) totals[e.type] = (totals[e.type] ?? 0) + (e.type.endsWith("_CARD") || e.type === "SUSPENSION" ? 1 : e.value);
  }
  return { totals, matches: count };
}
