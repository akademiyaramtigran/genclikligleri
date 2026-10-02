import { db } from "./db";
import { sportDef } from "./constants";

export type LeaderRow = {
  playerId: string;
  slug: string;
  name: string;
  photoUrl: string | null;
  position: string | null;
  teamName: string;
  teamSlug: string;
  teamColor: string;
  total: number;
  matches: number;
  perMatch: number;
};

type Filter = { leagueId?: string; sport?: string; gender?: string; teamId?: string };

/** Belirli olay tiplerinde oyuncu sıralaması (gol krallığı, asist, ribaund vb.) */
export async function getLeaders(types: string[], filter: Filter, take = 10): Promise<LeaderRow[]> {
  const matchWhere = {
    status: "FINISHED",
    ...(filter.leagueId ? { leagueId: filter.leagueId } : {}),
    ...(filter.sport || filter.gender
      ? { league: { ...(filter.sport ? { sport: filter.sport } : {}), ...(filter.gender ? { gender: filter.gender } : {}) } }
      : {}),
  };

  const grouped = await db.matchEvent.groupBy({
    by: ["playerId"],
    where: { type: { in: types }, playerId: { not: null }, match: matchWhere, ...(filter.teamId ? { teamId: filter.teamId } : {}) },
    _sum: { value: true },
    orderBy: { _sum: { value: "desc" } },
    take,
  });

  const ids = grouped.map((g) => g.playerId!).filter(Boolean);
  if (ids.length === 0) return [];

  const players = await db.player.findMany({ where: { id: { in: ids } }, include: { team: true } });
  // Oyuncunun takımının oynadığı maç sayısı (kadro listesi tutulmadığından yaklaşık değer)
  const teamIds = [...new Set(players.map((p) => p.teamId).filter((x): x is string => !!x))];
  const teamMatches = await db.match.findMany({
    where: { ...matchWhere, OR: [{ homeTeamId: { in: teamIds } }, { awayTeamId: { in: teamIds } }] },
    select: { homeTeamId: true, awayTeamId: true },
  });
  const appCount = new Map<string, number>();
  for (const m of teamMatches) {
    appCount.set(m.homeTeamId, (appCount.get(m.homeTeamId) ?? 0) + 1);
    appCount.set(m.awayTeamId, (appCount.get(m.awayTeamId) ?? 0) + 1);
  }

  return grouped
    .map((g) => {
      const p = players.find((x) => x.id === g.playerId);
      if (!p) return null;
      const total = g._sum.value ?? 0;
      const matches = p.teamId ? appCount.get(p.teamId) ?? 0 : 0;
      return {
        playerId: p.id,
        slug: p.slug,
        name: `${p.firstName} ${p.lastName}`,
        photoUrl: p.photoUrl,
        position: p.position,
        teamName: p.team?.name ?? "Takımsız",
        teamSlug: p.team?.slug ?? "",
        teamColor: p.team?.primaryColor ?? "#64748b",
        total,
        matches,
        perMatch: matches ? Math.round((total / matches) * 10) / 10 : 0,
      } satisfies LeaderRow;
    })
    .filter((x): x is LeaderRow => x !== null);
}

export async function getScorers(sport: string, filter: Filter, take = 10) {
  return getLeaders(sportDef(sport).scoringEvents, { ...filter, sport }, take);
}

/** Disiplin tablosu: sarı / kırmızı kart ve uzaklaştırmalar */
export async function getDiscipline(leagueId: string, take = 10) {
  const rows = await db.matchEvent.groupBy({
    by: ["playerId", "type"],
    where: { type: { in: ["YELLOW_CARD", "RED_CARD", "SUSPENSION"] }, playerId: { not: null }, match: { leagueId, status: "FINISHED" } },
    _count: { _all: true },
  });
  const map = new Map<string, { yellow: number; red: number; susp: number }>();
  for (const r of rows) {
    const cur = map.get(r.playerId!) ?? { yellow: 0, red: 0, susp: 0 };
    if (r.type === "YELLOW_CARD") cur.yellow += r._count._all;
    if (r.type === "RED_CARD") cur.red += r._count._all;
    if (r.type === "SUSPENSION") cur.susp += r._count._all;
    map.set(r.playerId!, cur);
  }
  const players = await db.player.findMany({ where: { id: { in: [...map.keys()] } }, include: { team: true } });
  return players
    .map((p) => ({ player: p, ...map.get(p.id)! }))
    .sort((a, b) => b.red * 3 + b.yellow + b.susp - (a.red * 3 + a.yellow + a.susp))
    .slice(0, take);
}

/** Lig genel istatistikleri */
export async function getLeagueSummary(leagueId: string) {
  const [matches, total, events] = await Promise.all([
    db.match.findMany({ where: { leagueId, status: "FINISHED" }, select: { homeScore: true, awayScore: true, homeTeamId: true, awayTeamId: true, attendance: true } }),
    db.match.count({ where: { leagueId } }),
    db.matchEvent.groupBy({ by: ["type"], where: { match: { leagueId, status: "FINISHED" } }, _sum: { value: true }, _count: { _all: true } }),
  ]);
  const scored = matches.reduce((s, m) => s + (m.homeScore ?? 0) + (m.awayScore ?? 0), 0);
  const homeWins = matches.filter((m) => (m.homeScore ?? 0) > (m.awayScore ?? 0)).length;
  const awayWins = matches.filter((m) => (m.homeScore ?? 0) < (m.awayScore ?? 0)).length;
  const draws = matches.length - homeWins - awayWins;
  const biggest = [...matches].sort((a, b) => Math.abs((b.homeScore ?? 0) - (b.awayScore ?? 0)) - Math.abs((a.homeScore ?? 0) - (a.awayScore ?? 0)))[0];
  const byType = Object.fromEntries(events.map((e) => [e.type, { sum: e._sum.value ?? 0, count: e._count._all }]));
  return {
    played: matches.length,
    total,
    scored,
    avg: matches.length ? Math.round((scored / matches.length) * 10) / 10 : 0,
    homeWins, awayWins, draws,
    attendance: matches.reduce((s, m) => s + (m.attendance ?? 0), 0),
    biggest,
    byType,
  };
}

/** Bir oyuncunun kariyer istatistikleri (olay tipine göre toplam) */
export async function getPlayerTotals(playerId: string) {
  const [rows, matchIds] = await Promise.all([
    db.matchEvent.groupBy({ by: ["type"], where: { playerId, match: { status: "FINISHED" } }, _sum: { value: true }, _count: { _all: true } }),
    db.matchEvent.findMany({ where: { playerId, match: { status: "FINISHED" } }, select: { matchId: true }, distinct: ["matchId"] }),
  ]);
  const totals: Record<string, number> = {};
  for (const r of rows) totals[r.type] = r.type.endsWith("_CARD") || r.type === "SUSPENSION" ? r._count._all : r._sum.value ?? 0;
  return { totals, matches: matchIds.length };
}
