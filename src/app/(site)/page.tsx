import Link from "next/link";
import { ArrowRight, CalendarDays, Drama, MapPin, Mic2, Music2, Sparkles, Trophy, Users, Shield, Video as VideoIcon } from "lucide-react";
import { db } from "@/lib/db";
import { SPORT_LIST, SPORTS, CATEGORIES, ANNOUNCEMENT_CATEGORIES } from "@/lib/constants";
import { computeStandings } from "@/lib/standings";
import { getScorers } from "@/lib/stats";
import { periodState, daysLeft } from "@/lib/periods";
import { cn, formatDate, formatShortDate, formatTime, formatWeekday } from "@/lib/utils";
import { Badge, SectionHeader, TeamCrest, Avatar } from "@/components/ui";
import { MatchCard } from "@/components/sport";
import { Countdown } from "@/components/Countdown";
import { YouTubeThumb } from "@/components/YouTubeEmbed";

export default async function HomePage() {
  const now = new Date();
  const teamSel = { select: { name: true, shortName: true, slug: true, logoUrl: true, primaryColor: true, secondaryColor: true } };

  const [teamCount, playerCount, matchCount, leagues, recent, upcoming, periods, competition, festival, announcements, videos] = await Promise.all([
    db.team.count({ where: { status: "ACTIVE" } }),
    db.player.count({ where: { status: { not: "PASSIVE" } } }),
    db.match.count({ where: { status: "FINISHED" } }),
    db.league.findMany({
      where: { season: { isActive: true } },
      include: {
        entries: { include: { team: true } },
        matches: { where: { status: "FINISHED" }, select: { homeTeamId: true, awayTeamId: true, homeScore: true, awayScore: true, date: true } },
      },
    }),
    db.match.findMany({ where: { status: "FINISHED" }, orderBy: { date: "desc" }, take: 16, include: { homeTeam: teamSel, awayTeam: teamSel, league: true, venue: true } }),
    db.match.findMany({ where: { status: { in: ["SCHEDULED", "LIVE"] }, date: { gte: new Date(now.getTime() - 3 * 3_600_000) } }, orderBy: { date: "asc" }, take: 8, include: { homeTeam: teamSel, awayTeam: teamSel, league: true, venue: true } }),
    db.applicationPeriod.findMany({ where: { isPublished: true, endDate: { gte: now } }, orderBy: { startDate: "asc" }, take: 4 }),
    db.musicCompetition.findFirst({
      where: { isCurrent: true },
      include: {
        rounds: { orderBy: { order: "asc" }, include: { venue: true, performances: { include: { contestant: true }, orderBy: { order: "asc" } } } },
        _count: { select: { contestants: true } },
      },
    }),
    db.theatreFestival.findFirst({
      where: { isCurrent: true },
      include: { plays: { include: { group: true, shows: { include: { venue: true }, orderBy: { date: "asc" } } } } },
    }),
    db.announcement.findMany({ where: { isPublished: true }, orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }], take: 4 }),
    db.video.findMany({ orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }], take: 4 }),
  ]);

  const leagueCards = SPORT_LIST.map((s) => ({
    sport: s,
    byGender: (["ERKEK", "KADIN"] as const).map((g) => {
      const l = leagues.find((x) => x.sport === s.key && x.gender === g);
      if (!l) return { gender: g, league: null, rows: [] };
      const rows = computeStandings(l.sport, l.entries.map((e) => ({ ...e.team, penalty: e.penaltyPoints })), l.matches);
      return { gender: g, league: l, rows: rows.slice(0, 3) };
    }),
  }));

  const scorerHighlights = await Promise.all(
    SPORT_LIST.map(async (s) => ({ sport: s, erkek: (await getScorers(s.key, { gender: "ERKEK" }, 1))[0], kadin: (await getScorers(s.key, { gender: "KADIN" }, 1))[0] })),
  );

  const openPeriod = periods.find((p) => periodState(p) === "OPEN");
  const nextRound = competition?.rounds.find((r) => r.status !== "COMPLETED");
  const allShows = festival?.plays.flatMap((p) => p.shows.map((s) => ({ ...s, play: p }))).sort((a, b) => a.date.getTime() - b.date.getTime()) ?? [];
  const nextShows = allShows.filter((s) => s.date >= new Date(now.getTime() - 2 * 3_600_000)).slice(0, 3);

  return (
    <>
      {/* ───────────── HERO ───────────── */}
      <section className="bg-basalt-wall relative overflow-hidden text-white">
        <div className="pointer-events-none absolute -left-32 top-10 h-96 w-96 rounded-full bg-dicle-500/25 blur-[100px]" />
        <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 rounded-full bg-fuchsia-600/20 blur-[110px]" />
        <div className="pointer-events-none absolute bottom-0 left-1/2 h-72 w-[40rem] -translate-x-1/2 rounded-full bg-amber-500/10 blur-[100px]" />

        <div className="container-x relative pb-14 pt-12 sm:pt-20">
          <div className="max-w-3xl animate-fade-up">
            <Badge tone="dark" dot className="mb-5">2026-2027 Sezonu Devam Ediyor</Badge>
            <h1 className="font-display text-5xl font-semibold uppercase leading-[0.95] tracking-wide text-balance sm:text-7xl">
              Şehrin gençliği <span className="bg-gradient-to-r from-dicle-300 via-fuchsia-400 to-amber-300 bg-clip-text text-transparent">tek sahada</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-white/70">
              Diyarbakır&apos;ın 17 ilçesinden gençler; futbol, basketbol, voleybol ve hentbol liglerinde, müzik yarışmasında ve tiyatro festivalinde buluşuyor.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/spor" className="btn bg-white px-6 py-3 text-basalt-950 hover:bg-dicle-300">Lig Merkezi <ArrowRight className="h-4 w-4" /></Link>
              <Link href="/basvuru" className="btn border border-white/20 bg-white/5 px-6 py-3 text-white hover:bg-white/10">Başvuru Yap</Link>
            </div>
          </div>

          {/* Üç ana bölüm */}
          <div className="mt-14 grid gap-4 md:grid-cols-3">
            <Link href="/spor" className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-dicle-600 to-emerald-900 p-6 ring-1 ring-white/10 transition hover:-translate-y-1">
              <Trophy className="absolute -right-4 -top-4 h-32 w-32 text-white/10 transition group-hover:rotate-12" />
              <p className="eyebrow text-dicle-200">Spor</p>
              <h3 className="mt-2 font-display text-3xl font-semibold uppercase">Gençlik Ligleri</h3>
              <p className="mt-1 text-sm text-white/70">4 branş · Erkek & Kadın · {leagues.length} lig</p>
              <div className="mt-6 flex gap-2 text-2xl">{SPORT_LIST.map((s) => <span key={s.key} title={s.label}>{s.emoji}</span>)}</div>
              <ArrowRight className="absolute bottom-6 right-6 h-6 w-6 transition group-hover:translate-x-1" />
            </Link>
            <Link href="/muzik" className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-fuchsia-600 via-purple-700 to-[#1a0b2e] p-6 ring-1 ring-white/10 transition hover:-translate-y-1">
              <Mic2 className="absolute -right-4 -top-4 h-32 w-32 text-white/10 transition group-hover:-rotate-12" />
              <p className="eyebrow text-fuchsia-200">Müzik Yarışması</p>
              <h3 className="mt-2 font-music text-2xl font-bold uppercase">{competition ? `${competition.name} ${competition.edition}` : "Genç Sesler"}</h3>
              <p className="mt-1 text-sm text-white/70">{competition ? `${competition._count.contestants} yarışmacı · ${nextRound ? `Sıradaki: ${nextRound.name}` : "Tamamlandı"}` : "Yakında"}</p>
              {nextRound && <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold"><CalendarDays className="h-3.5 w-3.5" /> {formatDate(nextRound.date)}</p>}
              <ArrowRight className="absolute bottom-6 right-6 h-6 w-6 transition group-hover:translate-x-1" />
            </Link>
            <Link href="/tiyatro" className="group bg-curtain relative overflow-hidden rounded-3xl p-6 ring-1 ring-white/10 transition hover:-translate-y-1">
              <Drama className="absolute -right-4 -top-4 h-32 w-32 text-amber-200/10 transition group-hover:rotate-12" />
              <p className="eyebrow text-amber-300">Festival</p>
              <h3 className="mt-2 font-serif text-3xl font-bold italic">{festival ? `${festival.edition} Tiyatro Festivali` : "Tiyatro Festivali"}</h3>
              <p className="mt-1 text-sm text-white/70">{festival ? `${festival.plays.length} oyun · ${formatShortDate(festival.startDate)} – ${formatShortDate(festival.endDate)}` : "Yakında"}</p>
              {festival?.theme && <p className="mt-6 inline-flex rounded-full bg-amber-400/15 px-3 py-1 text-xs font-semibold text-amber-200">“{festival.theme}”</p>}
              <ArrowRight className="absolute bottom-6 right-6 h-6 w-6 transition group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Rakamlar */}
          <div className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-white/10 ring-1 ring-white/10 sm:grid-cols-4">
            {[
              [teamCount, "Takım", Shield], [playerCount, "Lisanslı Sporcu", Users], [matchCount, "Oynanan Maç", Trophy], [17, "İlçe", MapPin],
            ].map(([v, l, Icon]) => {
              const I = Icon as typeof Trophy;
              return (
                <div key={l as string} className="bg-basalt-950/80 px-5 py-5">
                  <I className="mb-2 h-5 w-5 text-dicle-400" />
                  <p className="font-display text-3xl font-semibold tabular-nums">{(v as number).toLocaleString("tr-TR")}</p>
                  <p className="text-xs uppercase tracking-wider text-white/50">{l as string}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Son skorlar bandı */}
        {recent.length > 0 && (
          <div className="relative border-t border-white/10 bg-black/30">
            <div className="mask-fade-x overflow-hidden py-3">
              <div className="flex w-max animate-marquee gap-8 hover:[animation-play-state:paused]">
                {[...recent, ...recent].map((m, i) => (
                  <Link key={`${m.id}-${i}`} href={`/spor/mac/${m.id}`} className="flex items-center gap-2 whitespace-nowrap text-sm text-white/80 hover:text-white">
                    <span className="text-xs">{SPORTS[m.league.sport as keyof typeof SPORTS]?.emoji}</span>
                    <span className={cn("rounded px-1.5 text-[10px] font-bold", m.league.gender === "KADIN" ? "bg-rose-500/20 text-rose-300" : "bg-sky-500/20 text-sky-300")}>{m.league.gender === "KADIN" ? "K" : "E"}</span>
                    <span>{m.homeTeam.shortName}</span>
                    <span className="rounded bg-white/10 px-2 font-display font-bold tabular-nums">{m.homeScore}-{m.awayScore}</span>
                    <span>{m.awayTeam.shortName}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ───────────── AÇIK BAŞVURU ───────────── */}
      {openPeriod && (
        <section className="container-x -mt-px pt-10">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-500 to-dicle-600 p-6 text-white shadow-xl sm:p-8">
            <Sparkles className="absolute -right-6 -top-6 h-40 w-40 text-white/10" />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <Badge tone="dark" dot>Başvurular Açık · {daysLeft(openPeriod.endDate)} gün kaldı</Badge>
                <h2 className="mt-3 font-display text-2xl font-semibold uppercase sm:text-3xl">{openPeriod.title}</h2>
                <p className="mt-1 max-w-2xl text-white/85">{openPeriod.summary}</p>
              </div>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <Countdown to={openPeriod.endDate} label="Son başvuruya" />
                <Link href={`/basvuru/${openPeriod.slug}`} className="btn bg-white px-6 py-3 text-emerald-800 hover:bg-emerald-50">Hemen Başvur <ArrowRight className="h-4 w-4" /></Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ───────────── MAÇLAR ───────────── */}
      <section className="container-x pt-16">
        <SectionHeader eyebrow="Maç Merkezi" title="Sıradaki Maçlar" description="Bu hafta şehrin sahalarında ve salonlarında oynanacak karşılaşmalar." action={<Link href="/spor/fikstur" className="btn-outline">Tüm Fikstür <ArrowRight className="h-4 w-4" /></Link>} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {upcoming.slice(0, 4).map((m) => <MatchCard key={m.id} m={m} />)}
        </div>
        <h3 className="mb-4 mt-10 font-display text-xl font-semibold uppercase tracking-wide text-basalt-800">Son Sonuçlar</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {recent.slice(0, 8).map((m) => <MatchCard key={m.id} m={m} />)}
        </div>
      </section>

      {/* ───────────── PUAN DURUMLARI ───────────── */}
      <section className="container-x pt-16">
        <SectionHeader eyebrow="Puan Durumu" title="Liglerin Zirvesi" description="Her branşta erkek ve kadın liglerinin ilk üç sırası." action={<Link href="/spor" className="btn-outline">Tüm Ligler <ArrowRight className="h-4 w-4" /></Link>} />
        <div className="grid gap-5 md:grid-cols-2">
          {leagueCards.map(({ sport, byGender }) => (
            <div key={sport.key} className="card overflow-hidden">
              <div className={cn("flex items-center justify-between bg-gradient-to-r px-5 py-3 text-white", sport.gradient)}>
                <h3 className="font-display text-lg font-semibold uppercase tracking-wider">{sport.emoji} {sport.label}</h3>
              </div>
              <div className="grid divide-y divide-basalt-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                {byGender.map(({ gender, league, rows }) => (
                  <div key={gender} className="p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className={cn("text-xs font-bold uppercase tracking-wider", gender === "KADIN" ? "text-rose-600" : "text-sky-600")}>{gender === "KADIN" ? "Kadınlar" : "Erkekler"}</span>
                      {league && <Link href={`/spor/lig/${league.slug}`} className="text-xs font-medium text-basalt-500 hover:text-basalt-900">Tablo →</Link>}
                    </div>
                    {rows.length === 0 ? <p className="text-sm text-basalt-400">Lig henüz başlamadı</p> : (
                      <ol className="space-y-1.5">
                        {rows.map((r) => (
                          <li key={r.teamId}>
                            <Link href={`/spor/takim/${r.slug}`} className="flex items-center gap-2 rounded-lg px-1 py-1 text-sm hover:bg-basalt-50">
                              <span className="w-4 text-center font-display font-bold text-basalt-400">{r.position}</span>
                              <TeamCrest team={r} size={22} />
                              <span className="flex-1 truncate font-medium">{r.name}</span>
                              <span className="font-display font-bold tabular-nums">{r.points}</span>
                            </Link>
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ───────────── KRALLIK ───────────── */}
      <section className="container-x pt-16">
        <SectionHeader eyebrow="Krallık Yarışı" title="Ligin Yıldızları" action={<Link href="/spor/krallik" className="btn-outline">Tüm Sıralamalar <ArrowRight className="h-4 w-4" /></Link>} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {scorerHighlights.map(({ sport, erkek, kadin }) => (
            <div key={sport.key} className="card p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-basalt-500">{sport.emoji} {sport.label} · {sport.scorerTitle}</p>
              {[erkek, kadin].map((p, i) =>
                p ? (
                  <Link key={p.playerId} href={`/spor/oyuncu/${p.slug}`} className="mt-4 flex items-center gap-3 rounded-xl p-1 hover:bg-basalt-50">
                    <Avatar name={p.name} src={p.photoUrl} size={44} color={p.teamColor} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{p.name}</p>
                      <p className="truncate text-xs text-basalt-500"><span className={i === 0 ? "text-sky-600" : "text-rose-600"}>{i === 0 ? "Erkek" : "Kadın"}</span> · {p.teamName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-2xl font-bold">{p.total}</p>
                      <p className="text-[10px] uppercase text-basalt-400">{sport.scorerUnit}</p>
                    </div>
                  </Link>
                ) : null,
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ───────────── MÜZİK ───────────── */}
      {competition && (
        <section className="container-x pt-16">
          <div className="relative overflow-hidden rounded-3xl bg-[#0b0614] p-6 text-white sm:p-10">
            <div className="pointer-events-none absolute -left-20 -top-40 h-[30rem] w-40 origin-top animate-spot bg-gradient-to-b from-fuchsia-500/40 to-transparent blur-2xl" />
            <div className="pointer-events-none absolute -top-40 right-10 h-[30rem] w-40 origin-top animate-spot bg-gradient-to-b from-cyan-400/30 to-transparent blur-2xl [animation-delay:-4s]" />
            <div className="relative grid gap-10 lg:grid-cols-2 lg:items-center">
              <div>
                <p className="eyebrow flex items-center gap-2 text-fuchsia-300"><Music2 className="h-4 w-4" /> Müzik Yarışması</p>
                <h2 className="mt-3 font-music text-4xl font-black uppercase leading-none sm:text-5xl">
                  {competition.name} <span className="bg-gradient-to-r from-fuchsia-400 to-cyan-300 bg-clip-text text-transparent">{competition.edition}</span>
                </h2>
                <p className="mt-4 max-w-md text-white/70">{competition.tagline}</p>
                {nextRound && (
                  <div className="mt-6">
                    <p className="mb-2 text-sm font-semibold text-white/80">{nextRound.name} · {formatDate(nextRound.date, { weekday: "long", hour: "2-digit", minute: "2-digit" })}</p>
                    <Countdown to={nextRound.date} />
                  </div>
                )}
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link href="/muzik" className="btn bg-fuchsia-600 px-6 py-3 text-white hover:bg-fuchsia-500">Yarışmaya Git</Link>
                  {competition.votingOpen && <Link href="/muzik#oylama" className="btn border border-white/20 px-6 py-3 text-white hover:bg-white/10">Oy Ver</Link>}
                </div>
              </div>
              {nextRound && nextRound.performances.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {nextRound.performances.map((p, i) => (
                    <Link key={p.id} href={`/muzik/yarismaci/${p.contestant.slug}`} className="group rounded-2xl bg-white/5 p-4 ring-1 ring-white/10 transition hover:bg-white/10 hover:shadow-glow">
                      <div className="flex h-24 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-600/40 to-cyan-500/20 font-music text-3xl font-black">
                        {p.contestant.name.split(" ").map((x) => x[0]).slice(0, 2).join("")}
                      </div>
                      <p className="mt-3 truncate font-semibold">{p.contestant.name}</p>
                      <p className="truncate text-xs text-white/50">{p.contestant.genre} · #{i + 1}</p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ───────────── TİYATRO ───────────── */}
      {festival && (
        <section className="container-x pt-10">
          <div className="bg-curtain relative overflow-hidden rounded-3xl p-6 text-white sm:p-10">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-black/50 to-transparent" />
            <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-amber-300/20 blur-3xl" />
            <div className="relative grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-center">
              <div>
                <p className="eyebrow flex items-center gap-2 text-amber-300"><Drama className="h-4 w-4" /> Festival</p>
                <h2 className="mt-3 font-serif text-4xl font-bold leading-tight sm:text-5xl">
                  {festival.edition} {festival.name}
                </h2>
                {festival.theme && <p className="mt-3 font-serif text-xl italic text-amber-200">“{festival.theme}”</p>}
                <p className="mt-4 max-w-md text-white/70">{festival.tagline}</p>
                <Link href="/tiyatro" className="btn mt-8 bg-amber-400 px-6 py-3 text-curtain-950 hover:bg-amber-300">Festival Programı</Link>
              </div>
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-widest text-amber-200/70">Sıradaki Gösterimler</p>
                {nextShows.length === 0 && <p className="text-white/60">Festival programı tamamlandı.</p>}
                {nextShows.map((s) => (
                  <Link key={s.id} href={`/tiyatro/oyun/${s.play.slug}`} className="flex items-center gap-4 rounded-2xl bg-black/25 p-4 ring-1 ring-amber-200/10 transition hover:bg-black/40">
                    <div className="w-16 shrink-0 text-center">
                      <p className="font-serif text-3xl font-bold leading-none text-amber-300">{new Date(s.date).toLocaleDateString("tr-TR", { day: "numeric", timeZone: "Europe/Istanbul" })}</p>
                      <p className="text-[10px] uppercase tracking-wider text-white/60">{formatWeekday(s.date).slice(0, 3)} · {formatTime(s.date)}</p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-serif text-lg font-semibold">{s.play.title}</p>
                      <p className="truncate text-sm text-white/60">{s.play.group.name} · {s.venue?.name}</p>
                    </div>
                    <Badge tone="amber">{s.play.genre}</Badge>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ───────────── BAŞVURULAR ───────────── */}
      {periods.length > 0 && (
        <section className="container-x pt-16">
          <SectionHeader eyebrow="Başvuru Dönemleri" title="Sen de Katıl" description="Takımını kur, grubunla sahneye çık ya da topluluğunla festivale katıl." action={<Link href="/basvuru" className="btn-outline">Tüm Başvurular <ArrowRight className="h-4 w-4" /></Link>} />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {periods.map((p) => {
              const st = periodState(p);
              const cat = CATEGORIES[p.category as keyof typeof CATEGORIES];
              return (
                <Link key={p.id} href={`/basvuru/${p.slug}`} className="card group flex flex-col p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
                  <div className="flex items-center justify-between">
                    <Badge tone={p.category === "SPOR" ? "green" : p.category === "MUZIK" ? "fuchsia" : "amber"}>{cat?.label}</Badge>
                    <Badge tone={st === "OPEN" ? "green" : "amber"} dot={st === "OPEN"}>{st === "OPEN" ? `${daysLeft(p.endDate)} gün kaldı` : `${formatShortDate(p.startDate)}'da açılıyor`}</Badge>
                  </div>
                  <h3 className="mt-4 font-semibold leading-snug text-basalt-900 group-hover:text-dicle-700">{p.title}</h3>
                  <p className="mt-2 line-clamp-3 flex-1 text-sm text-basalt-500">{p.summary}</p>
                  <p className="mt-4 text-sm font-semibold text-dicle-700">Şartları incele →</p>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ───────────── VİDEOLAR & DUYURULAR ───────────── */}
      <section className="container-x grid gap-10 pt-16 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <SectionHeader eyebrow="Video Arşivi" title="İzle" action={<Link href="/videolar" className="btn-outline"><VideoIcon className="h-4 w-4" /> Tümü</Link>} />
          <div className="grid gap-4 sm:grid-cols-2">
            {videos.map((v) => (
              <Link key={v.id} href={`/videolar?v=${v.id}`} className="group overflow-hidden rounded-2xl bg-white shadow-card">
                <YouTubeThumb url={v.youtubeUrl} />
                <div className="p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-basalt-400">{ANNOUNCEMENT_CATEGORIES[v.category]}</p>
                  <p className="line-clamp-1 font-semibold">{v.title}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
        <div>
          <SectionHeader eyebrow="Duyurular" title="Haberler" action={<Link href="/duyurular" className="btn-outline">Tümü</Link>} />
          <div className="card divide-y divide-basalt-100">
            {announcements.map((a) => (
              <Link key={a.id} href={`/duyurular/${a.slug}`} className="block p-4 transition hover:bg-basalt-50">
                <div className="flex items-center gap-2 text-xs text-basalt-500">
                  {a.isPinned && <Badge tone="red">Önemli</Badge>}
                  <span className="font-semibold uppercase tracking-wider">{ANNOUNCEMENT_CATEGORIES[a.category]}</span>
                  <span>· {formatDate(a.publishedAt)}</span>
                </div>
                <p className="mt-1 font-semibold text-basalt-900">{a.title}</p>
                <p className="mt-0.5 line-clamp-2 text-sm text-basalt-500">{a.excerpt}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
