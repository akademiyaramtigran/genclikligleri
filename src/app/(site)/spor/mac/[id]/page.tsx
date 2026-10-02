import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CalendarDays, Clock, MapPin, Star, Users, Flag } from "lucide-react";
import { db } from "@/lib/db";
import { sportDef, GENDERS, MATCH_STATUS, eventDef } from "@/lib/constants";
import { cn, formatDate, formatTime } from "@/lib/utils";
import { Avatar, Badge, StatusBadge, TeamCrest } from "@/components/ui";
import { YouTubeEmbed } from "@/components/YouTubeEmbed";
import { Countdown } from "@/components/Countdown";
import { MatchRow } from "@/components/sport";

type P = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { id } = await params;
  const m = await db.match.findUnique({ where: { id }, include: { homeTeam: true, awayTeam: true } });
  if (!m) return { title: "Maç" };
  const score = m.status === "FINISHED" ? ` ${m.homeScore}-${m.awayScore} ` : " - ";
  return { title: `${m.homeTeam.name}${score}${m.awayTeam.name}` };
}

export default async function MatchPage({ params }: P) {
  const { id } = await params;
  const match = await db.match.findUnique({
    where: { id },
    include: {
      homeTeam: true, awayTeam: true, venue: true, league: true, mvpPlayer: true,
      events: { include: { player: true }, orderBy: [{ minute: "asc" }] },
    },
  });
  if (!match) notFound();
  const def = sportDef(match.league.sport);
  const done = match.status === "FINISHED";
  const live = match.status === "LIVE";

  const teamSel = { select: { name: true, shortName: true, slug: true, logoUrl: true, primaryColor: true, secondaryColor: true } };
  const h2h = await db.match.findMany({
    where: {
      id: { not: match.id }, status: "FINISHED",
      OR: [{ homeTeamId: match.homeTeamId, awayTeamId: match.awayTeamId }, { homeTeamId: match.awayTeamId, awayTeamId: match.homeTeamId }],
    },
    orderBy: { date: "desc" }, take: 5, include: { homeTeam: teamSel, awayTeam: teamSel },
  });

  const timeline = match.events.filter((e) => e.minute != null && !["ASSIST"].includes(e.type));
  const scoringTypes = new Set([...def.scoringEvents, "OWN_GOAL"]);
  const statBoards = def.events.filter((e) => e.hasValue || e.key === "ASSIST");

  // Futbol: gol atanların listesi; diğer branşlar: oyuncu istatistik tablosu
  const sideEvents = (teamId: string) => match.events.filter((e) => e.teamId === teamId);
  const playerStats = (teamId: string) => {
    const map = new Map<string, { name: string; slug: string; values: Record<string, number> }>();
    for (const e of sideEvents(teamId)) {
      if (!e.player) continue;
      const cur = map.get(e.player.id) ?? { name: `${e.player.firstName} ${e.player.lastName}`, slug: e.player.slug, values: {} };
      cur.values[e.type] = (cur.values[e.type] ?? 0) + e.value;
      map.set(e.player.id, cur);
    }
    const key = def.scoringEvents[0]!;
    return [...map.values()].sort((a, b) => (b.values[key] ?? 0) - (a.values[key] ?? 0));
  };
  const periods = (match.periodScores ?? "").split(",").map((s) => s.trim()).filter(Boolean);

  return (
    <>
      <section className="bg-basalt-wall relative overflow-hidden text-white">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1/2 opacity-30" style={{ background: `radial-gradient(circle at 20% 50%, ${match.homeTeam.primaryColor}, transparent 60%)` }} />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 opacity-30" style={{ background: `radial-gradient(circle at 80% 50%, ${match.awayTeam.primaryColor}, transparent 60%)` }} />
        <div className="container-x relative py-10">
          <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-white/70">
            <Link href={`/spor/lig/${match.league.slug}`} className="font-semibold hover:text-white">{def.emoji} {match.league.name}</Link>
            <span>·</span><span>{match.round}. Hafta</span>
            <span>·</span><span>{GENDERS[match.league.gender as "ERKEK"]?.league}</span>
          </div>
          <div className="mt-8 grid grid-cols-[1fr_auto_1fr] items-center gap-4 sm:gap-10">
            <Link href={`/spor/takim/${match.homeTeam.slug}`} className="group flex flex-col items-center gap-3 text-center">
              <TeamCrest team={match.homeTeam} size={88} className="ring-4 transition group-hover:scale-105" />
              <span className="font-display text-lg font-semibold uppercase tracking-wide sm:text-2xl">{match.homeTeam.name}</span>
              <span className="text-xs uppercase tracking-wider text-white/50">Ev Sahibi</span>
            </Link>
            <div className="text-center">
              {done || live ? (
                <>
                  <p className="font-display text-6xl font-bold tabular-nums sm:text-8xl">{match.homeScore}<span className="mx-2 text-white/30">:</span>{match.awayScore}</p>
                  <div className="mt-2"><StatusBadge map={MATCH_STATUS} value={match.status} dot={live} /></div>
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
            <Link href={`/spor/takim/${match.awayTeam.slug}`} className="group flex flex-col items-center gap-3 text-center">
              <TeamCrest team={match.awayTeam} size={88} className="ring-4 transition group-hover:scale-105" />
              <span className="font-display text-lg font-semibold uppercase tracking-wide sm:text-2xl">{match.awayTeam.name}</span>
              <span className="text-xs uppercase tracking-wider text-white/50">Deplasman</span>
            </Link>
          </div>

          {done && def.key === "FUTBOL" && (
            <div className="mx-auto mt-8 grid max-w-2xl grid-cols-2 gap-8 text-sm">
              {[match.homeTeamId, match.awayTeamId].map((tid, i) => (
                <ul key={tid} className={cn("space-y-1 text-white/80", i === 0 ? "text-right" : "text-left")}>
                  {match.events.filter((e) => e.teamId === tid && scoringTypes.has(e.type)).map((e) => (
                    <li key={e.id}>⚽ {e.player ? `${e.player.firstName[0]}. ${e.player.lastName}` : "—"} {e.minute ? `${e.minute}'` : ""}{e.type === "PENALTY_GOAL" ? " (P)" : e.type === "OWN_GOAL" ? " (KK)" : ""}</li>
                  ))}
                </ul>
              ))}
            </div>
          )}

          <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-white/60">
            <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4" /> {formatDate(match.date)}</span>
            <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {formatTime(match.date)}</span>
            {match.venue && <Link href={`/tesisler#${match.venue.slug}`} className="flex items-center gap-1.5 hover:text-white"><MapPin className="h-4 w-4" /> {match.venue.name}</Link>}
            {match.referee && <span className="flex items-center gap-1.5"><Flag className="h-4 w-4" /> Hakem: {match.referee}</span>}
            {match.attendance && <span className="flex items-center gap-1.5"><Users className="h-4 w-4" /> {match.attendance.toLocaleString("tr-TR")} seyirci</span>}
          </div>
        </div>
      </section>

      <div className="container-x grid gap-8 py-10 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-8">
          <div>
            <h2 className="mb-4 font-display text-xl font-semibold uppercase tracking-wide">Maç Videosu</h2>
            {match.youtubeUrl ? (
              <YouTubeEmbed url={match.youtubeUrl} title={`${match.homeTeam.name} - ${match.awayTeam.name}`} />
            ) : (
              <div className="flex aspect-video flex-col items-center justify-center rounded-2xl bg-basalt-900 text-center text-white/60">
                <p className="text-4xl">🎬</p>
                <p className="mt-2 font-semibold text-white">{done ? "Maç videosu yakında yüklenecek" : "Maç kaydı karşılaşmanın ardından yayınlanacak"}</p>
                <p className="mt-1 text-sm">Tüm maçlar kayıt altına alınıp YouTube kanalımızda yayınlanır.</p>
              </div>
            )}
          </div>

          {match.summary && (
            <div className="card p-6">
              <h2 className="mb-2 font-semibold">Maç Özeti</h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-basalt-600">{match.summary}</p>
            </div>
          )}

          {timeline.length > 0 && (
            <div className="card p-6">
              <h2 className="mb-5 font-semibold">Maç Akışı</h2>
              <ol className="relative space-y-3 before:absolute before:inset-y-0 before:left-1/2 before:w-px before:bg-basalt-200">
                {timeline.map((e) => {
                  const home = e.teamId === match.homeTeamId;
                  const d = eventDef(match.league.sport, e.type);
                  return (
                    <li key={e.id} className={cn("relative flex items-center gap-3", home ? "flex-row" : "flex-row-reverse")}>
                      <div className={cn("w-1/2 text-sm", home ? "pr-8 text-right" : "pl-8 text-left")}>
                        <span className="font-semibold">{e.player ? `${e.player.firstName} ${e.player.lastName}` : "—"}</span>
                        <span className="ml-2 text-basalt-500">{d?.label}</span>
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
              {[match.homeTeam, match.awayTeam].map((t) => {
                const rows = playerStats(t.id);
                return (
                  <div key={t.id} className="card overflow-hidden">
                    <h3 className="flex items-center gap-2 border-b border-basalt-100 px-4 py-3 font-semibold"><TeamCrest team={t} size={24} /> {t.name}</h3>
                    <div className="overflow-x-auto">
                      <table className="table-base">
                        <thead><tr><th>Oyuncu</th>{statBoards.map((b) => <th key={b.key} className="text-center">{b.short}</th>)}</tr></thead>
                        <tbody>
                          {rows.map((r) => (
                            <tr key={r.slug}>
                              <td><Link href={`/spor/oyuncu/${r.slug}`} className="font-medium hover:text-dicle-700">{r.name}</Link></td>
                              {statBoards.map((b) => <td key={b.key} className="text-center tabular-nums">{r.values[b.key] ?? "–"}</td>)}
                            </tr>
                          ))}
                          {rows.length === 0 && <tr><td colSpan={statBoards.length + 1} className="text-center text-basalt-400">Veri girilmedi</td></tr>}
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
          {match.mvpPlayer && (
            <Link href={`/spor/oyuncu/${match.mvpPlayer.slug}`} className="block overflow-hidden rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 p-5 text-amber-950 shadow-lg transition hover:-translate-y-0.5">
              <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest"><Star className="h-4 w-4 fill-current" /> Maçın Oyuncusu</p>
              <div className="mt-3 flex items-center gap-3">
                <Avatar name={`${match.mvpPlayer.firstName} ${match.mvpPlayer.lastName}`} src={match.mvpPlayer.photoUrl} size={56} className="ring-2 ring-white" />
                <div>
                  <p className="font-display text-xl font-semibold uppercase">{match.mvpPlayer.firstName} {match.mvpPlayer.lastName}</p>
                  <p className="text-sm opacity-80">{match.mvpPlayer.position}</p>
                </div>
              </div>
            </Link>
          )}
          {done && def.key === "FUTBOL" && (
            <div className="card p-5">
              <h3 className="mb-3 font-semibold">Kartlar</h3>
              {[match.homeTeam, match.awayTeam].map((t) => {
                const cards = match.events.filter((e) => e.teamId === t.id && e.type.endsWith("_CARD"));
                return (
                  <div key={t.id} className="mb-3 last:mb-0">
                    <p className="text-xs font-semibold text-basalt-500">{t.name}</p>
                    {cards.length === 0 ? <p className="text-sm text-basalt-400">Kart yok</p> : cards.map((c) => (
                      <p key={c.id} className="text-sm">{c.type === "RED_CARD" ? "🟥" : "🟨"} {c.player?.firstName} {c.player?.lastName} {c.minute ? `${c.minute}'` : ""}</p>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
          <div className="card overflow-hidden">
            <h3 className="border-b border-basalt-100 px-4 py-3 font-semibold">Aralarındaki Maçlar</h3>
            {h2h.length === 0 ? <p className="p-4 text-sm text-basalt-500">İki takım ilk kez karşılaşıyor.</p> : <div className="divide-y divide-basalt-100">{h2h.map((m) => <MatchRow key={m.id} m={m} />)}</div>}
          </div>
          <Badge tone="slate">Maç kodu: {match.id.slice(-8).toUpperCase()}</Badge>
        </aside>
      </div>
    </>
  );
}
