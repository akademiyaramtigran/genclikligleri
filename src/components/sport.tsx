"use client";

import Link from "next/link";
import { MapPin, PlayCircle } from "lucide-react";
import type { LeaderRow, Match, StandingRow } from "@/lib/types";
import { sportDef, MATCH_STATUS, SPORTS } from "@/lib/constants";
import { getSeasonMatches } from "@/lib/data";
import { useData } from "@/lib/hooks";
import { firebaseReady } from "@/lib/firebase";
import { cn, formatShortDate, formatTime, formatWeekday } from "@/lib/utils";
import { Avatar, Badge, FormBadge, TeamCrest } from "./ui";
import { useT } from "@/lib/i18n";

export function StandingsTable({ rows, sport, compact, highlight }: { rows: StandingRow[]; sport: string; compact?: boolean; highlight?: string }) {
  const t = useT();
  const def = sportDef(sport);
  const n = rows.length;
  return (
    <div className="overflow-x-auto">
      <table className="table-base">
        <thead>
          <tr>
            <th className="w-10 text-center">#</th>
            <th>{t("Takım")}</th>
            <th className="text-center">O</th>
            {!compact && <th className="text-center">G</th>}
            {!compact && def.allowsDraw && <th className="text-center">B</th>}
            {!compact && <th className="text-center">M</th>}
            {!compact && <th className="hidden text-center sm:table-cell">{def.forLabel}</th>}
            {!compact && <th className="hidden text-center sm:table-cell">{def.againstLabel}</th>}
            <th className="text-center">{sport === "VOLEYBOL" ? "Set A." : "Av"}</th>
            <th className="text-center">P</th>
            {!compact && <th className="hidden md:table-cell">Form</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const zone = r.position === 1 ? "bg-amber-400" : r.position <= 4 && n >= 6 ? "bg-dicle-500" : r.position > n - 1 && n >= 6 ? "bg-red-500" : "bg-transparent";
            return (
              <tr key={r.teamId} className={cn("transition hover:bg-basalt-50", highlight === r.teamId && "bg-dicle-500/5")}>
                <td className="relative text-center font-semibold tabular-nums text-basalt-500">
                  <span className={cn("absolute inset-y-1 left-0 w-1 rounded-r", zone)} />
                  {r.position}
                </td>
                <td>
                  <Link href={`/spor/takim?s=${r.slug}`} className="flex items-center gap-2.5 font-semibold text-basalt-900 hover:text-dicle-700">
                    <TeamCrest team={r} size={compact ? 24 : 28} />
                    <span className={cn("truncate", compact ? "max-w-[9rem]" : "max-w-[14rem]")}>{r.name}</span>
                    {r.penalty > 0 && <span title={`${r.penalty} puan silme cezası`} className="text-[10px] font-bold text-red-600">-{r.penalty}</span>}
                  </Link>
                </td>
                <td className="text-center tabular-nums">{r.played}</td>
                {!compact && <td className="text-center tabular-nums">{r.won}</td>}
                {!compact && def.allowsDraw && <td className="text-center tabular-nums">{r.drawn}</td>}
                {!compact && <td className="text-center tabular-nums">{r.lost}</td>}
                {!compact && <td className="hidden text-center tabular-nums sm:table-cell">{r.scored}</td>}
                {!compact && <td className="hidden text-center tabular-nums sm:table-cell">{r.conceded}</td>}
                <td className="text-center tabular-nums text-basalt-600">
                  {sport === "VOLEYBOL" ? (r.ratio >= 99 ? "MAX" : r.ratio.toFixed(2)) : r.diff > 0 ? `+${r.diff}` : r.diff}
                </td>
                <td className="text-center font-display text-base font-bold tabular-nums">{r.points}</td>
                {!compact && (
                  <td className="hidden md:table-cell">
                    <div className="flex gap-1">{r.form.map((f, i) => <FormBadge key={i} r={f} />)}</div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
      {!compact && n >= 6 && (
        <div className="flex flex-wrap gap-4 border-t border-basalt-100 px-3 py-3 text-xs text-basalt-500">
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-amber-400" /> Lider</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-dicle-500" /> Play-off</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-red-500" /> Düşme hattı</span>
          <span className="ml-auto">
            Puanlama: {sport === "VOLEYBOL" ? "3-0/3-1 = 3P, 3-2 = 2P, 2-3 = 1P" : `G ${def.points.win}P${def.allowsDraw ? ` · B ${def.points.draw}P` : ""} · M ${def.points.loss}P`}
          </span>
        </div>
      )}
    </div>
  );
}

type MatchWithTeams = Pick<Match, "id" | "date" | "status" | "round" | "homeScore" | "awayScore" | "youtubeUrl" | "home" | "away" | "venueName" | "leagueName" | "sport">;

/** Maç satırı (fikstür listelerinde) */
export function MatchRow({ m, showLeague }: { m: MatchWithTeams; showLeague?: boolean }) {
  const t = useT();
  const done = m.status === "FINISHED";
  const live = m.status === "LIVE";
  const hw = done && (m.homeScore ?? 0) > (m.awayScore ?? 0);
  const aw = done && (m.awayScore ?? 0) > (m.homeScore ?? 0);
  return (
    <Link href={`/spor/mac?id=${m.id}`} className="group grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 py-3 transition hover:bg-basalt-50 sm:grid-cols-[5.5rem_1fr_auto_1fr_2rem] sm:gap-4 sm:px-4">
      <div className="hidden text-xs text-basalt-500 sm:block">
        <div className="font-semibold text-basalt-700">{formatShortDate(m.date)}</div>
        <div>{formatTime(m.date)}</div>
      </div>
      <div className={cn("flex items-center justify-end gap-2 text-right text-sm", hw ? "font-bold text-basalt-900" : "text-basalt-700")}>
        <span className="truncate">{m.home.name}</span>
        <TeamCrest team={m.home} size={26} />
      </div>
      <div className="flex flex-col items-center">
        {done || live ? (
          <span className={cn("min-w-[4.5rem] rounded-lg px-2 py-1 text-center font-display text-lg font-bold tabular-nums", live ? "bg-red-600 text-white" : "bg-basalt-900 text-white")}>
            {m.homeScore ?? 0} - {m.awayScore ?? 0}
          </span>
        ) : (
          <span className="min-w-[4.5rem] rounded-lg bg-basalt-100 px-2 py-1 text-center text-sm font-semibold text-basalt-600">
            <span className="sm:hidden">{formatShortDate(m.date)} </span>
            {formatTime(m.date)}
          </span>
        )}
        {showLeague && <span className="mt-1 hidden text-[10px] text-basalt-400 sm:block">{m.leagueName}</span>}
        {m.status !== "SCHEDULED" && m.status !== "FINISHED" && <span className="mt-1 text-[10px] font-semibold uppercase text-red-600">{t(MATCH_STATUS[m.status]?.label ?? "")}</span>}
      </div>
      <div className={cn("flex items-center gap-2 text-sm", aw ? "font-bold text-basalt-900" : "text-basalt-700")}>
        <TeamCrest team={m.away} size={26} />
        <span className="truncate">{m.away.name}</span>
      </div>
      <div className="hidden justify-end sm:flex">
        {m.youtubeUrl && <PlayCircle className="h-5 w-5 text-red-500" aria-label={t("Maç videosu var")} />}
      </div>
    </Link>
  );
}

/** Kart görünümünde maç (ana sayfa, takım sayfası) */
export function MatchCard({ m, dark }: { m: MatchWithTeams; dark?: boolean }) {
  const t = useT();
  const done = m.status === "FINISHED";
  const def = sportDef(m.sport);
  return (
    <Link
      href={`/spor/mac?id=${m.id}`}
      className={cn(
        "group block rounded-2xl p-4 transition",
        dark ? "bg-white/[0.04] ring-1 ring-white/10 hover:bg-white/[0.08]" : "card hover:-translate-y-0.5 hover:shadow-lg",
      )}
    >
      <div className={cn("mb-3 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider", dark ? "text-white/50" : "text-basalt-500")}>
        <span className="truncate">{def.emoji} {m.leagueName || `${m.round}. ${t("Hafta")}`}</span>
        {done ? (m.youtubeUrl ? <Badge tone="red" className="!py-0">▶ Video</Badge> : <span>MS</span>) : <span>{formatWeekday(m.date)}</span>}
      </div>
      {[m.home, m.away].map((t, i) => {
        const score = i === 0 ? m.homeScore : m.awayScore;
        const other = i === 0 ? m.awayScore : m.homeScore;
        const win = done && (score ?? 0) > (other ?? 0);
        return (
          <div key={t.slug} className="flex items-center justify-between gap-2 py-1">
            <span className={cn("flex min-w-0 items-center gap-2 text-sm", dark ? "text-white" : "text-basalt-800", win && "font-bold")}>
              <TeamCrest team={t} size={24} />
              <span className="truncate">{t.name}</span>
            </span>
            {done && <span className={cn("font-display text-xl font-bold tabular-nums", dark ? "text-white" : "text-basalt-900", !win && "opacity-50")}>{score}</span>}
          </div>
        );
      })}
      {!done && (
        <div className={cn("mt-3 flex items-center justify-between border-t pt-3 text-xs", dark ? "border-white/10 text-white/60" : "border-basalt-100 text-basalt-500")}>
          <span className="font-semibold">{formatShortDate(m.date)} · {formatTime(m.date)}</span>
          {m.venueName && <span className="flex items-center gap-1 truncate"><MapPin className="h-3 w-3" /> {m.venueName}</span>}
        </div>
      )}
    </Link>
  );
}

export function LeaderTable({ rows, unit, empty = "Henüz veri yok", compact }: { rows: LeaderRow[]; unit: string; empty?: string; compact?: boolean }) {
  const t = useT();
  if (rows.length === 0) return <p className="px-4 py-8 text-center text-sm text-basalt-500">{t(empty)}</p>;
  const max = rows[0]?.total ?? 1;
  return (
    <ol className="divide-y divide-basalt-100">
      {rows.map((r, i) => (
        <li key={r.playerId}>
          <Link href={`/spor/oyuncu?s=${r.slug}`} className="flex items-center gap-3 px-4 py-2.5 transition hover:bg-basalt-50">
            <span className={cn("w-6 text-center font-display text-lg font-bold", i === 0 ? "text-amber-500" : i === 1 ? "text-basalt-400" : i === 2 ? "text-orange-700" : "text-basalt-300")}>{i + 1}</span>
            <Avatar name={r.name} src={r.photoUrl} size={compact ? 32 : 38} color={r.teamColor} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-basalt-900">{r.name}</p>
              <p className="truncate text-xs text-basalt-500">{r.teamName}{!compact && r.position ? ` · ${r.position}` : ""}</p>
              {!compact && (
                <div className="mt-1 h-1 overflow-hidden rounded-full bg-basalt-100">
                  <div className="h-full rounded-full bg-gradient-to-r from-dicle-400 to-dicle-600" style={{ width: `${(r.total / max) * 100}%` }} />
                </div>
              )}
            </div>
            <div className="text-right">
              <p className="font-display text-xl font-bold tabular-nums text-basalt-900">{r.total}</p>
              <p className="text-[10px] uppercase tracking-wider text-basalt-400">{compact ? t(unit) : `${r.perMatch} / ${t("maç")}`}</p>
            </div>
          </Link>
        </li>
      ))}
    </ol>
  );
}

export function GenderSwitch({ active, hrefFor, dark = true }: { active: "ERKEK" | "KADIN"; hrefFor: (g: "erkek" | "kadin") => string; dark?: boolean }) {
  const t = useT();
  const items = [
    { key: "ERKEK", slug: "erkek" as const, label: "Erkekler", on: "bg-sky-500 text-white shadow-lg shadow-sky-500/30" },
    { key: "KADIN", slug: "kadin" as const, label: "Kadınlar", on: "bg-rose-500 text-white shadow-lg shadow-rose-500/30" },
  ];
  return (
    <div className={cn("inline-flex rounded-full p-1", dark ? "bg-white/10 ring-1 ring-white/15" : "bg-basalt-100")}>
      {items.map((it) => (
        <Link
          key={it.key}
          href={hrefFor(it.slug)}
          scroll={false}
          className={cn("rounded-full px-5 py-2 text-sm font-bold transition", active === it.key ? it.on : dark ? "text-white/70 hover:text-white" : "text-basalt-600 hover:text-basalt-900")}
        >
          {t(it.label)}
        </Link>
      ))}
    </div>
  );
}

/** Canlı / son skor bandı — yalnızca spor alanında (spor düzeninde) gösterilir */
export function ScoreTicker() {
  const t = useT();
  const { data } = useData(() => (firebaseReady ? getSeasonMatches() : Promise.resolve([])), []);
  const live = (data ?? []).filter((m) => m.status === "LIVE");
  const recent = (data ?? []).filter((m) => m.status === "FINISHED").sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 16);
  const items = [...live, ...recent];
  if (items.length === 0) return null;
  const row = (m: Match, i: number) => (
    <Link key={`${m.id}-${i}`} href={`/spor/mac?id=${m.id}`} className="flex items-center gap-2 whitespace-nowrap text-sm text-white/80 hover:text-white">
      {m.status === "LIVE" && <span className="flex items-center gap-1 rounded bg-red-600 px-1.5 text-[10px] font-bold uppercase text-white"><span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-white" />{t("Canlı")}</span>}
      <span className="text-xs">{SPORTS[m.sport as keyof typeof SPORTS]?.emoji}</span>
      <span className={cn("rounded px-1.5 text-[10px] font-bold", m.gender === "KADIN" ? "bg-rose-500/20 text-rose-300" : "bg-sky-500/20 text-sky-300")}>{m.gender === "KADIN" ? t("K") : t("E")}</span>
      <TeamCrest team={m.home} size={18} className="!ring-0" />
      <span>{m.home.shortName}</span>
      <span className={cn("rounded px-2 font-display font-bold tabular-nums", m.status === "LIVE" ? "bg-red-600/80" : "bg-white/10")}>{m.homeScore ?? 0}-{m.awayScore ?? 0}</span>
      <span>{m.away.shortName}</span>
      <TeamCrest team={m.away} size={18} className="!ring-0" />
    </Link>
  );
  return (
    <div className="border-b border-white/10 bg-basalt-950 text-white">
      <div className="mask-fade-x overflow-hidden py-2.5">
        <div className="flex w-max animate-marquee gap-8 hover:[animation-play-state:paused]">
          {[...items, ...items].map(row)}
        </div>
      </div>
    </div>
  );
}
