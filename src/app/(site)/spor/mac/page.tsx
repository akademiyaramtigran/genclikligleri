"use client";

import Link from "next/link";
import { CalendarDays, Clock, MapPin, Star, Users, Flag } from "lucide-react";
import { getMatch, getTeamMatches } from "@/lib/data";
import { useData, useTitle } from "@/lib/hooks";
import { sportDef, GENDERS, MATCH_STATUS, eventDef } from "@/lib/constants";
import { cn, formatDate, formatTime } from "@/lib/utils";
import { Avatar, Badge, StatusBadge, TeamCrest } from "@/components/ui";
import { YouTubeEmbed } from "@/components/YouTubeEmbed";
import { Countdown } from "@/components/Countdown";
import { MatchRow } from "@/components/sport";
import { ErrorBox, NotFoundBox, PageLoader, Suspended, useParam } from "@/components/client";

import { useT } from "@/lib/i18n";
import { ShareImageButton, CalendarButton, pageUrl } from "@/components/tools";
import { matchCard } from "@/lib/sharecard";
import { slugify } from "@/lib/utils";
export default function MatchPage() {
  return <Suspended><Inner /></Suspended>;
}

function Inner() {
  const t = useT();
  const id = useParam("id") ?? "";
  const { data, error } = useData(async () => {
    const match = await getMatch(id);
    if (!match) return null;
    const h2h = (await getTeamMatches(match.homeTeamId)).filter((m) => m.id !== match.id && m.status === "FINISHED" && m.teamIds.includes(match.awayTeamId)).slice(-5).reverse();
    return { match, h2h };
  }, [id]);
  useTitle(data?.match ? `${data.match.home.name} - ${data.match.away.name}` : undefined);
  if (error) return <ErrorBox message={error} />;
  if (data === undefined) return <PageLoader />;
  if (!data) return <NotFoundBox title={t("Maç bulunamadı")} />;
  const { match, h2h } = data;
  const def = sportDef(match.sport);
  const done = match.status === "FINISHED";
  const homeTeam = { ...match.home, id: match.homeTeamId };
  const awayTeam = { ...match.away, id: match.awayTeamId };

  const timeline = match.events.filter((e) => e.minute != null && !["ASSIST"].includes(e.type));
  const scoringTypes = new Set([...def.scoringEvents, "OWN_GOAL"]);
  const statBoards = def.events.filter((e) => e.hasValue || e.key === "ASSIST");

  // Futbol: gol atanların listesi; diğer branşlar: oyuncu istatistik tablosu
  const sideEvents = (teamId: string) => match.events.filter((e) => e.teamId === teamId);
  const playerStats = (teamId: string) => {
    const map = new Map<string, { name: string; slug: string; values: Record<string, number> }>();
    for (const e of sideEvents(teamId)) {
      if (!e.playerId) continue;
      const cur = map.get(e.playerId) ?? { name: e.playerName, slug: e.playerId, values: {} };
      cur.values[e.type] = (cur.values[e.type] ?? 0) + e.value;
      map.set(e.playerId, cur);
    }
    const key = def.scoringEvents[0]!;
    return [...map.values()].sort((a, b) => (b.values[key] ?? 0) - (a.values[key] ?? 0));
  };
  const periods = (match.periodScores ?? "").split(",").map((s) => s.trim()).filter(Boolean);

  return (
    <>
      <section className="bg-basalt-wall relative overflow-hidden text-white">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1/2 opacity-30" style={{ background: `radial-gradient(circle at 20% 50%, ${homeTeam.primaryColor}, transparent 60%)` }} />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 opacity-30" style={{ background: `radial-gradient(circle at 80% 50%, ${awayTeam.primaryColor}, transparent 60%)` }} />
        <div className="container-x relative py-10">
          <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-white/70">
            <Link href={`/spor/lig?s=${match.leagueSlug}`} className="font-semibold hover:text-white">{def.emoji} {match.leagueName}</Link>
            <span>·</span><span>{match.round}{t(". Hafta")}</span>
            <span>·</span><span>{GENDERS[match.gender as "ERKEK"]?.league}</span>
          </div>
          <div className="mt-8 grid grid-cols-[1fr_auto_1fr] items-center gap-4 sm:gap-10">
            <Link href={`/spor/takim?s=${homeTeam.slug}`} className="group flex flex-col items-center gap-3 text-center">
              <TeamCrest team={homeTeam} size={88} className="ring-4 transition group-hover:scale-105" />
              <span className="font-display text-lg font-semibold uppercase tracking-wide sm:text-2xl">{homeTeam.name}</span>
              <span className="text-xs uppercase tracking-wider text-white/50">{t("Ev Sahibi")}</span>
            </Link>
            <div className="text-center">
              {done ? (
                <>
                  <p className="font-display text-6xl font-bold tabular-nums sm:text-8xl">{match.homeScore}<span className="mx-2 text-white/30">:</span>{match.awayScore}</p>
                  <div className="mt-2"><StatusBadge map={MATCH_STATUS} value={match.status} /></div>
                </>
              ) : (
                <>
                  <p className="font-display text-4xl font-bold sm:text-6xl">{formatTime(match.date)}</p>
                  <p className="mt-1 text-sm text-white/60">{formatDate(match.date, { weekday: "long", day: "numeric", month: "long" })}</p>
                  {match.status === "SCHEDULED" && match.date > new Date() && <Countdown to={match.date} className="mt-4 hidden sm:block" />}
                  {match.status !== "SCHEDULED" && <div className="mt-2"><StatusBadge map={MATCH_STATUS} value={match.status} /></div>}
                </>
              )}
              {periods.length > 0 && (
                <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                  {periods.map((p, i) => <span key={i} className="rounded-md bg-white/10 px-2 py-0.5 text-xs tabular-nums text-white/80">{p}</span>)}
                </div>
              )}
            </div>
            <Link href={`/spor/takim?s=${awayTeam.slug}`} className="group flex flex-col items-center gap-3 text-center">
              <TeamCrest team={awayTeam} size={88} className="ring-4 transition group-hover:scale-105" />
              <span className="font-display text-lg font-semibold uppercase tracking-wide sm:text-2xl">{awayTeam.name}</span>
              <span className="text-xs uppercase tracking-wider text-white/50">{t("Deplasman")}</span>
            </Link>
          </div>

          {done && def.key === "FUTBOL" && (
            <div className="mx-auto mt-8 grid max-w-2xl grid-cols-2 gap-8 text-sm">
              {[match.homeTeamId, match.awayTeamId].map((tid, i) => (
                <ul key={tid} className={cn("space-y-1 text-white/80", i === 0 ? "text-right" : "text-left")}>
                  {match.events.filter((e) => e.teamId === tid && scoringTypes.has(e.type)).map((e) => (
                    <li key={e.id}>⚽ {e.playerName || "—"} {e.minute ? `${e.minute}'` : ""}{e.type === "PENALTY_GOAL" ? " (P)" : e.type === "OWN_GOAL" ? " (KK)" : ""}</li>
                  ))}
                </ul>
              ))}
            </div>
          )}

          <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-white/60">
            <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4" /> {formatDate(match.date)}</span>
            <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {formatTime(match.date)}</span>
            {match.venueName && <Link href={`/tesisler#${match.venueId}`} className="flex items-center gap-1.5 hover:text-white"><MapPin className="h-4 w-4" /> {match.venueName}</Link>}
            {match.referee && <span className="flex items-center gap-1.5"><Flag className="h-4 w-4" /> {t("Hakem:")} {match.referee}</span>}
            {match.attendance && <span className="flex items-center gap-1.5"><Users className="h-4 w-4" /> {match.attendance.toLocaleString("tr-TR")} {t("seyirci")}</span>}
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-2 [&_.btn-outline]:border-white/20 [&_.btn-outline]:bg-white/5 [&_.btn-outline]:text-white [&_.btn-outline:hover]:bg-white/10">
            <ShareImageButton make={() => matchCard(match)} filename={`mac-${slugify(match.home.shortName)}-${slugify(match.away.shortName)}.png`} title={`${match.home.name} - ${match.away.name}`} />
            {!done && <CalendarButton filename={`mac-${match.id}`} events={[{ uid: match.id, title: `${def.emoji} ${match.home.name} - ${match.away.name}`, start: match.date, minutes: 120, location: match.venueName, description: match.leagueName, url: pageUrl(`/spor/mac/?id=${match.id}`) }]} />}
          </div>
        </div>
      </section>

      <div className="container-x grid gap-8 py-10 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-8">
          <div>
            <h2 className="mb-4 font-display text-xl font-semibold uppercase tracking-wide">{t("Maç Videosu")}</h2>
            {match.youtubeUrl ? (
              <YouTubeEmbed url={match.youtubeUrl} title={`${homeTeam.name} - ${awayTeam.name}`} />
            ) : (
              <div className="flex aspect-video flex-col items-center justify-center rounded-2xl bg-basalt-900 text-center text-white/60">
                <p className="text-4xl">🎬</p>
                <p className="mt-2 font-semibold text-white">{done ? "Maç videosu yakında yüklenecek" : "Maç kaydı karşılaşmanın ardından yayınlanacak"}</p>
                <p className="mt-1 text-sm">{t("Tüm maçlar kayıt altına alınıp YouTube kanalımızda yayınlanır.")}</p>
              </div>
            )}
          </div>

          {match.summary && (
            <div className="card p-6">
              <h2 className="mb-2 font-semibold">{t("Maç Özeti")}</h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-basalt-600">{match.summary}</p>
            </div>
          )}

          {timeline.length > 0 && (
            <div className="card p-6">
              <h2 className="mb-5 font-semibold">{t("Maç Akışı")}</h2>
              <ol className="relative space-y-3 before:absolute before:inset-y-0 before:left-1/2 before:w-px before:bg-basalt-200">
                {timeline.map((e) => {
                  const home = e.teamId === match.homeTeamId;
                  const d = eventDef(match.sport, e.type);
                  return (
                    <li key={e.id} className={cn("relative flex items-center gap-3", home ? "flex-row" : "flex-row-reverse")}>
                      <div className={cn("w-1/2 text-sm", home ? "pr-8 text-right" : "pl-8 text-left")}>
                        <span className="font-semibold">{e.playerName || "—"}</span>
                        <span className="ml-2 text-basalt-500">{t(d?.label ?? "")}</span>
                      </div>
                      <span className={cn("absolute left-1/2 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full text-xs font-bold ring-4 ring-white",
                        d?.tone === "goal" ? "bg-emerald-500 text-white" : d?.tone === "card-yellow" ? "bg-yellow-400 text-yellow-950" : d?.tone === "card-red" ? "bg-red-600 text-white" : "bg-basalt-200 text-basalt-700")}>
                        {e.minute}&apos;
                      </span>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}

          {done && def.key !== "FUTBOL" && (
            <div className="grid gap-6 md:grid-cols-2">
              {[homeTeam, awayTeam].map((tm) => {
                const rows = playerStats(tm.id);
                return (
                  <div key={tm.id} className="card overflow-hidden">
                    <h3 className="flex items-center gap-2 border-b border-basalt-100 px-4 py-3 font-semibold"><TeamCrest team={tm} size={24} /> {tm.name}</h3>
                    <div className="overflow-x-auto">
                      <table className="table-base">
                        <thead><tr><th>{t("Oyuncu")}</th>{statBoards.map((b) => <th key={b.key} className="text-center">{b.short}</th>)}</tr></thead>
                        <tbody>
                          {rows.map((r) => (
                            <tr key={r.slug}>
                              <td><Link href={`/spor/oyuncu?s=${r.slug}`} className="font-medium hover:text-dicle-700">{r.name}</Link></td>
                              {statBoards.map((b) => <td key={b.key} className="text-center tabular-nums">{r.values[b.key] ?? "–"}</td>)}
                            </tr>
                          ))}
                          {rows.length === 0 && <tr><td colSpan={statBoards.length + 1} className="text-center text-basalt-400">{t("Veri girilmedi")}</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <aside className="space-y-6">
          {match.mvpPlayerId && match.mvpName && (
            <Link href={`/spor/oyuncu?s=${match.mvpPlayerId}`} className="block overflow-hidden rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 p-5 text-amber-950 shadow-lg transition hover:-translate-y-0.5">
              <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest"><Star className="h-4 w-4 fill-current" /> {t("Maçın Oyuncusu")}</p>
              <div className="mt-3 flex items-center gap-3">
                <Avatar name={match.mvpName} size={56} className="ring-2 ring-white" />
                <p className="font-display text-xl font-semibold uppercase">{match.mvpName}</p>
              </div>
            </Link>
          )}
          {done && def.key === "FUTBOL" && (
            <div className="card p-5">
              <h3 className="mb-3 font-semibold">{t("Kartlar")}</h3>
              {[homeTeam, awayTeam].map((tm) => {
                const cards = match.events.filter((e) => e.teamId === tm.id && e.type.endsWith("_CARD"));
                return (
                  <div key={tm.id} className="mb-3 last:mb-0">
                    <p className="text-xs font-semibold text-basalt-500">{tm.name}</p>
                    {cards.length === 0 ? <p className="text-sm text-basalt-400">{t("Kart yok")}</p> : cards.map((c) => (
                      <p key={c.id} className="text-sm">{c.type === "RED_CARD" ? "🟥" : "🟨"} {c.playerName} {c.minute ? `${c.minute}'` : ""}</p>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
          <div className="card overflow-hidden">
            <h3 className="border-b border-basalt-100 px-4 py-3 font-semibold">{t("Aralarındaki Maçlar")}</h3>
            {h2h.length === 0 ? <p className="p-4 text-sm text-basalt-500">{t("İki takım ilk kez karşılaşıyor.")}</p> : <div className="divide-y divide-basalt-100">{h2h.map((m) => <MatchRow key={m.id} m={m} />)}</div>}
          </div>
          <Badge tone="slate">{t("Maç kodu:")} {match.id.slice(-8).toUpperCase()}</Badge>
        </aside>
      </div>
    </>
  );
}
