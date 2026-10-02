import { sportDef } from "./constants";

import type { StandingRow } from "./types";
export type { StandingRow };

type MatchLite = {
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number | null;
  awayScore: number | null;
  date: Date;
};

/** Spor dalının kurallarına göre bir maçtan kazanılan puanlar */
export function matchPoints(sport: string, own: number, opp: number) {
  const def = sportDef(sport);
  if (sport === "VOLEYBOL") {
    // 3-0 / 3-1 galibiyet 3 puan, 3-2 galibiyet 2 puan, 2-3 mağlubiyet 1 puan
    if (own > opp) return opp >= 2 ? 2 : 3;
    return own >= 2 ? 1 : 0;
  }
  if (own > opp) return def.points.win;
  if (own === opp) return def.points.draw;
  return def.points.loss;
}

export function computeStandings(
  sport: string,
  teams: { id: string; name: string; shortName: string; slug: string; logoUrl: string | null; primaryColor: string; secondaryColor: string; penalty?: number }[],
  matches: MatchLite[],
): StandingRow[] {
  const rows = new Map<string, StandingRow>();
  for (const t of teams) {
    rows.set(t.id, {
      teamId: t.id, name: t.name, shortName: t.shortName, slug: t.slug, logoUrl: t.logoUrl,
      primaryColor: t.primaryColor, secondaryColor: t.secondaryColor,
      played: 0, won: 0, drawn: 0, lost: 0, scored: 0, conceded: 0, diff: 0,
      points: -(t.penalty ?? 0), penalty: t.penalty ?? 0, form: [], position: 0, ratio: 0,
    });
  }

  const sorted = [...matches].sort((a, b) => a.date.getTime() - b.date.getTime());
  for (const m of sorted) {
    if (m.homeScore == null || m.awayScore == null) continue;
    const h = rows.get(m.homeTeamId);
    const a = rows.get(m.awayTeamId);
    if (!h || !a) continue;
    const apply = (r: StandingRow, own: number, opp: number) => {
      r.played++;
      r.scored += own;
      r.conceded += opp;
      r.points += matchPoints(sport, own, opp);
      if (own > opp) { r.won++; r.form.push("G"); }
      else if (own === opp) { r.drawn++; r.form.push("B"); }
      else { r.lost++; r.form.push("M"); }
    };
    apply(h, m.homeScore, m.awayScore);
    apply(a, m.awayScore, m.homeScore);
  }

  const list = [...rows.values()].map((r) => ({
    ...r,
    diff: r.scored - r.conceded,
    ratio: r.conceded === 0 ? (r.scored > 0 ? 99 : 0) : r.scored / r.conceded,
    form: r.form.slice(-5),
  }));

  list.sort((x, y) => {
    if (y.points !== x.points) return y.points - x.points;
    if (sport === "VOLEYBOL") {
      if (y.won !== x.won) return y.won - x.won;
      if (y.ratio !== x.ratio) return y.ratio - x.ratio;
    }
    if (y.diff !== x.diff) return y.diff - x.diff;
    if (y.scored !== x.scored) return y.scored - x.scored;
    return x.name.localeCompare(y.name, "tr");
  });
  list.forEach((r, i) => (r.position = i + 1));
  return list;
}
