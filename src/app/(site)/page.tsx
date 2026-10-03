"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, Drama, MapPin, Mic2, Music2, Sparkles, Trophy, Users, Shield, Video as VideoIcon } from "lucide-react";
import { where } from "firebase/firestore";
import { countOf, getActiveLeagues, getAnnouncements, getHeadline, getHighlights, getPosts, getCompetitionData, getCurrentCompetition, getCurrentFestival, getFestivalPlays, getPeriods, getSeasonMatches, getVideos } from "@/lib/data";
import { useData } from "@/lib/hooks";
import { SPORT_LIST, SPORTS, CATEGORIES, ANNOUNCEMENT_CATEGORIES, HIGHLIGHT_KINDS, sportDef } from "@/lib/constants";
import { HeadlineHero, HighlightCard, PostCard } from "@/components/content";
import { FullLogo, Logo } from "@/components/Header";
import { periodState, daysLeft } from "@/lib/periods";
import { cn, formatDate, formatShortDate, formatTime, formatWeekday } from "@/lib/utils";
import { Badge, SectionHeader, TeamCrest, Avatar } from "@/components/ui";
import { MatchCard } from "@/components/sport";
import { Countdown } from "@/components/Countdown";
import { YouTubeThumb } from "@/components/YouTubeEmbed";
import { ErrorBox, PageLoader } from "@/components/client";
import { useT } from "@/lib/i18n";
import { ArchMark, PenMark, StageBadge } from "@/components/Logos";

async function loadHome() {
  const [headline, highlights, posts] = await Promise.all([getHeadline().catch(() => null), getHighlights().catch(() => []), getPosts().catch(() => [])]);
  const [teamCount, playerCount, leagues, matches, periods, competition, festival, announcements, videos] = await Promise.all([
    countOf("teams", where("status", "==", "ACTIVE")).catch(() => 0),
    countOf("players").catch(() => 0),
    getActiveLeagues(),
    getSeasonMatches(),
    getPeriods(),
    getCurrentCompetition(),
    getCurrentFestival(),
    getAnnouncements(),
    getVideos(),
  ]);
  const [music, plays] = await Promise.all([
    competition ? getCompetitionData(competition.id) : Promise.resolve(null),
    festival ? getFestivalPlays(festival.id) : Promise.resolve([]),
  ]);
  return { teamCount, playerCount, leagues, matches, periods, competition, music, festival, plays, announcements, videos, headline, highlights, posts };
}

export default function HomePage() {
  const t = useT();
  const { data, error } = useData(loadHome, []);
  if (error) return <ErrorBox message={error} />;
  if (!data) return <PageLoader />;
  const { teamCount, playerCount, leagues, matches, competition, music, festival, plays, headline } = data;
  // Her türün (oyuncu / sanatçı / centilmenlik) en yeni kaydı
  const weekly = Object.keys(HIGHLIGHT_KINDS).map((k) => data.highlights.find((h) => h.kind === k)).filter((h): h is NonNullable<typeof h> => !!h);
  const feed = data.posts.slice(0, 3);
  const now = new Date();
  const matchCount = matches.filter((m) => m.status === "FINISHED").length;
  const recent = matches.filter((m) => m.status === "FINISHED").sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 16);
  const upcoming = matches.filter((m) => m.status === "SCHEDULED" && m.date.getTime() >= now.getTime() - 3 * 3_600_000).slice(0, 8);
  const periods = data.periods.filter((p) => p.endDate >= now).sort((a, b) => a.startDate.getTime() - b.startDate.getTime()).slice(0, 4);
  const announcements = data.announcements.slice(0, 4);
  const videos = data.videos.slice(0, 4);

  const leagueCards = SPORT_LIST.map((s) => ({
    sport: s,
    byGender: (["ERKEK", "KADIN"] as const).map((g) => {
      const l = leagues.find((x) => x.sport === s.key && x.gender === g);
      return { gender: g, league: l ?? null, rows: (l?.summary?.standings ?? []).slice(0, 3) };
    }),
  }));
  const topOf = (sport: string, gender: string) => leagues.find((l) => l.sport === sport && l.gender === gender)?.summary?.leaders?.[sportDef(sport).scoringEvents[0]!]?.[0];
  const scorerHighlights = SPORT_LIST.map((s) => ({ sport: s, erkek: topOf(s.key, "ERKEK"), kadin: topOf(s.key, "KADIN") }));

  const openPeriod = periods.find((p) => periodState(p) === "OPEN");
  const rounds = music?.rounds ?? [];
  const nextRound = rounds.find((r) => r.status !== "COMPLETED");
  const contestantsById = new Map((music?.contestants ?? []).map((c) => [c.id, c]));
  const allShows = plays.flatMap((p) => p.shows.map((s) => ({ ...s, play: p }))).sort((a, b) => a.date.getTime() - b.date.getTime());
  const nextShows = allShows.filter((s) => s.date >= new Date(now.getTime() - 2 * 3_600_000)).slice(0, 3);

  return (
    <>
      {/* ───────────── HERO ───────────── */}
      {headline && <HeadlineHero a={headline} />}
      <section className="bg-basalt-wall relative overflow-hidden text-white">
        <div className="pointer-events-none absolute -left-32 top-10 h-96 w-96 rounded-full bg-dicle-500/25 blur-[100px]" />
        <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 rounded-full bg-fuchsia-600/20 blur-[110px]" />
        <div className="pointer-events-none absolute bottom-0 left-1/2 h-72 w-[40rem] -translate-x-1/2 rounded-full bg-amber-500/10 blur-[100px]" />

        <div className={cn("container-x relative pb-14", headline ? "pt-10" : "pt-12 sm:pt-20")}>
          {/* Organizasyon kimliği */}
          {headline && (
            <div className="mb-8 flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
              <Logo size={88} />
              <div>
                <p className="font-display text-3xl font-semibold uppercase tracking-wide sm:text-4xl">Diyarbakır</p>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/60">{t("Gençlik Organizasyonları")}</p>
                <p className="mt-2 text-sm text-white/70">{t("Spor · Müzik · Tiyatro · Genç Kalemler")}</p>
              </div>
            </div>
          )}
          {!headline && <div className="grid items-center gap-10 lg:grid-cols-[1fr_auto]"><div className="max-w-3xl animate-fade-up">
            <Badge tone="dark" dot className="mb-5">{t("2026-2027 Sezonu Devam Ediyor")}</Badge>
            <h1 className="font-display text-5xl font-semibold uppercase leading-[0.95] tracking-wide text-balance sm:text-7xl">
              {t("Şehrin gençliği")} <span className="bg-gradient-to-r from-[#e0577f] via-[#3cc4c0] to-[#f0bf54] bg-clip-text text-transparent">{t("tek sahada")}</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-white/70">
              {t("Diyarbakır'ın 17 ilçesinden gençler; futbol, basketbol, voleybol ve hentbol liglerinde, müzik yarışmasında ve tiyatro festivalinde buluşuyor.")}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/spor" className="btn bg-white px-6 py-3 text-basalt-950 hover:bg-dicle-300">{t("Lig Merkezi")} <ArrowRight className="h-4 w-4" /></Link>
              <Link href="/basvuru" className="btn border border-white/20 bg-white/5 px-6 py-3 text-white hover:bg-white/10">{t("Başvuru Yap")}</Link>
            </div>
          </div>
          <FullLogo variant="dark" className="mx-auto hidden w-72 drop-shadow-2xl lg:block xl:w-80" /></div>}

          {/* Üç ana bölüm */}
          <div className={cn("grid gap-4 md:grid-cols-3", !headline && "mt-14")}>
            <Link href="/spor" className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-dicle-600 to-emerald-900 p-6 ring-1 ring-white/10 transition hover:-translate-y-1">
              <ArchMark size={64} className="absolute -right-2 top-3 opacity-25 transition group-hover:opacity-50" />
              <p className="eyebrow text-dicle-200">{t("Spor")}</p>
              <h3 className="mt-2 font-display text-3xl font-semibold uppercase">{t("Gençlik Ligleri")}</h3>
              <p className="mt-1 text-sm text-white/70">{t("4 branş · Erkek & Kadın · {n} lig", { n: leagues.length })}</p>
              <div className="mt-6 flex gap-2 text-2xl">{SPORT_LIST.map((s) => <span key={s.key} title={t(s.label)}>{s.emoji}</span>)}</div>
              <ArrowRight className="absolute bottom-6 right-6 h-6 w-6 transition group-hover:translate-x-1" />
            </Link>
            <Link href="/muzik" className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-fuchsia-600 via-purple-700 to-[#1a0b2e] p-6 ring-1 ring-white/10 transition hover:-translate-y-1">
              <Mic2 className="absolute -right-4 -top-4 h-32 w-32 text-white/10 transition group-hover:-rotate-12" />
              <p className="eyebrow text-fuchsia-200">{t("Müzik Yarışması")}</p>
              <h3 className="mt-2 font-music text-2xl font-bold uppercase">{competition ? `${competition.name} ${competition.edition}` : t("Genç Sesler")}</h3>
              <p className="mt-1 text-sm text-white/70">{competition ? `${music?.contestants.length ?? 0} ${t("yarışmacı")} · ${nextRound ? `${t("Sıradaki")}: ${nextRound.name}` : t("Tamamlandı")}` : t("Yakında")}</p>
              {nextRound && <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold"><CalendarDays className="h-3.5 w-3.5" /> {formatDate(nextRound.date)}</p>}
              <ArrowRight className="absolute bottom-6 right-6 h-6 w-6 transition group-hover:translate-x-1" />
            </Link>
            <Link href="/tiyatro" className="group relative overflow-hidden rounded-3xl bg-stage-950 p-6 ring-1 ring-rose-500/40 transition hover:-translate-y-1">
              <Drama className="absolute -right-4 -top-4 h-32 w-32 text-rose-500/15 transition group-hover:rotate-12" />
              <p className="eyebrow text-rose-400">{t("Festival")}</p>
              <h3 className="mt-2 font-stage text-3xl uppercase">{festival ? `${festival.edition} ${t("Tiyatro Festivali")}` : t("Tiyatro Festivali")}</h3>
              <p className="mt-1 text-sm text-white/70">{festival ? `${plays.length} ${t("oyun")} · ${formatShortDate(festival.startDate)} – ${formatShortDate(festival.endDate)}` : t("Yakında")}</p>
              <p className="mt-6 inline-flex items-center gap-2 border border-rose-500/50 px-3 py-1 text-xs font-semibold text-rose-200"><PenMark size={14} /> {t("Genç Kalemler yazarlık yarışması")}</p>
              <ArrowRight className="absolute bottom-6 right-6 h-6 w-6 transition group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Rakamlar */}
          <div className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-white/10 ring-1 ring-white/10 sm:grid-cols-4">
            {[
              [teamCount, t("Takım"), Shield], [playerCount, t("Lisanslı Sporcu"), Users], [matchCount, t("Oynanan Maç"), Trophy], [17, t("İlçe"), MapPin],
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

      </section>

      {/* ───────────── AÇIK BAŞVURU ───────────── */}
      {openPeriod && (
        <section className="container-x -mt-px pt-10">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-500 to-dicle-600 p-6 text-white shadow-xl sm:p-8">
            <Sparkles className="absolute -right-6 -top-6 h-40 w-40 text-white/10" />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <Badge tone="dark" dot>{t("Başvurular Açık")} · {t("{n} gün kaldı", { n: daysLeft(openPeriod.endDate) })}</Badge>
                <h2 className="mt-3 font-display text-2xl font-semibold uppercase sm:text-3xl">{openPeriod.title}</h2>
                <p className="mt-1 max-w-2xl text-white/85">{openPeriod.summary}</p>
              </div>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <Countdown to={openPeriod.endDate} label={t("Son başvuruya")} />
                <Link href={`/basvuru/detay?s=${openPeriod.slug}`} className="btn bg-white px-6 py-3 text-emerald-800 hover:bg-emerald-50">{t("Hemen Başvur")} <ArrowRight className="h-4 w-4" /></Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ───────────── HAFTANIN ÖNE ÇIKANLARI ───────────── */}
      {weekly.length > 0 && (
        <section className="container-x pt-16">
          <SectionHeader eyebrow="Oyunlaştırma Paneli" title="Haftanın Öne Çıkanları" description="Haftanın oyuncusu, haftanın sanatçısı ve sahada ya da kuliste birbirine destek olan gençlerin centilmenlik hikâyeleri." action={<Link href="/gencligin-sesi" className="btn-outline">{t("Tümü")} <ArrowRight className="h-4 w-4" /></Link>} />
          <div className="grid gap-5 md:grid-cols-3">{weekly.map((h) => <HighlightCard key={h.id} h={h} />)}</div>
        </section>
      )}

      {/* ───────────── GENÇLİĞİN SESİ ───────────── */}
      {feed.length > 0 && (
        <section className="container-x pt-16">
          <SectionHeader eyebrow="Haber Akışı" title="Gençliğin Sesi" description="Röportajlar, Genç Kalemler'in köşe yazıları, maçlardan ve provalardan anlık fotoğraflar." action={<Link href="/gencligin-sesi" className="btn-outline">{t("Akışa Git")} <ArrowRight className="h-4 w-4" /></Link>} />
          <div className="grid items-start gap-5 md:grid-cols-3">{feed.map((p) => <PostCard key={p.id} p={p} compact />)}</div>
        </section>
      )}

      {/* ───────────── MAÇLAR ───────────── */}
      <section className="container-x pt-16">
        <SectionHeader eyebrow={t("Maç Merkezi")} title={t("Sıradaki Maçlar")} description={t("Bu hafta şehrin sahalarında ve salonlarında oynanacak karşılaşmalar.")} action={<Link href="/spor/fikstur" className="btn-outline">{t("Tüm Fikstür")} <ArrowRight className="h-4 w-4" /></Link>} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {upcoming.slice(0, 4).map((m) => <MatchCard key={m.id} m={m} />)}
        </div>
        <h3 className="mb-4 mt-10 font-display text-xl font-semibold uppercase tracking-wide text-basalt-800">{t("Son Sonuçlar")}</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {recent.slice(0, 8).map((m) => <MatchCard key={m.id} m={m} />)}
        </div>
      </section>

      {/* ───────────── PUAN DURUMLARI ───────────── */}
      <section className="container-x pt-16">
        <SectionHeader eyebrow={t("Puan Durumu")} title={t("Liglerin Zirvesi")} description={t("Her branşta erkek ve kadın liglerinin ilk üç sırası.")} action={<Link href="/spor" className="btn-outline">{t("Tüm Ligler")} <ArrowRight className="h-4 w-4" /></Link>} />
        <div className="grid gap-5 md:grid-cols-2">
          {leagueCards.map(({ sport, byGender }) => (
            <div key={sport.key} className="card overflow-hidden">
              <div className={cn("flex items-center justify-between bg-gradient-to-r px-5 py-3 text-white", sport.gradient)}>
                <h3 className="font-display text-lg font-semibold uppercase tracking-wider">{sport.emoji} {t(sport.label)}</h3>
              </div>
              <div className="grid divide-y divide-basalt-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                {byGender.map(({ gender, league, rows }) => (
                  <div key={gender} className="p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className={cn("text-xs font-bold uppercase tracking-wider", gender === "KADIN" ? "text-rose-600" : "text-sky-600")}>{gender === "KADIN" ? t("Kadınlar") : t("Erkekler")}</span>
                      {league && <Link href={`/spor/lig?s=${league.slug}`} className="text-xs font-medium text-basalt-500 hover:text-basalt-900">{t("Tablo →")}</Link>}
                    </div>
                    {rows.length === 0 ? <p className="text-sm text-basalt-400">{t("Lig henüz başlamadı")}</p> : (
                      <ol className="space-y-1.5">
                        {rows.map((r) => (
                          <li key={r.teamId}>
                            <Link href={`/spor/takim?s=${r.slug}`} className="flex items-center gap-2 rounded-lg px-1 py-1 text-sm hover:bg-basalt-50">
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
        <SectionHeader eyebrow={t("İstatistikler")} title={t("Ligin Yıldızları")} action={<Link href="/spor/istatistik" className="btn-outline">{t("Tüm Sıralamalar")} <ArrowRight className="h-4 w-4" /></Link>} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {scorerHighlights.map(({ sport, erkek, kadin }) => (
            <div key={sport.key} className="card p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-basalt-500">{sport.emoji} {t(sport.label)} · {t(sport.scorerTitle)}</p>
              {[erkek, kadin].map((p, i) =>
                p ? (
                  <Link key={p.playerId} href={`/spor/oyuncu?s=${p.slug}`} className="mt-4 flex items-center gap-3 rounded-xl p-1 hover:bg-basalt-50">
                    <Avatar name={p.name} src={p.photoUrl} size={44} color={p.teamColor} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{p.name}</p>
                      <p className="truncate text-xs text-basalt-500"><span className={i === 0 ? "text-sky-600" : "text-rose-600"}>{i === 0 ? t("Erkek") : t("Kadın")}</span> · {p.teamName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-2xl font-bold">{p.total}</p>
                      <p className="text-[10px] uppercase text-basalt-400">{t(sport.scorerUnit)}</p>
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
                <p className="eyebrow flex items-center gap-2 text-fuchsia-300"><Music2 className="h-4 w-4" /> {t("Müzik Yarışması")}</p>
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
                  <Link href="/muzik" className="btn bg-fuchsia-600 px-6 py-3 text-white hover:bg-fuchsia-500">{t("Yarışmaya Git")}</Link>
                  {competition.votingOpen && <Link href="/muzik#oylama" className="btn border border-white/20 px-6 py-3 text-white hover:bg-white/10">{t("Oy Ver")}</Link>}
                </div>
              </div>
              {nextRound && nextRound.performances.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {nextRound.performances.map((p, i) => (
                    <Link key={p.contestantId} href={`/muzik/yarismaci?s=${p.contestantSlug}`} className="group rounded-2xl bg-white/5 p-4 ring-1 ring-white/10 transition hover:bg-white/10 hover:shadow-glow">
                      <div className="flex h-24 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-600/40 to-cyan-500/20 font-music text-3xl font-black">
                        {p.contestantName.split(" ").map((x) => x[0]).slice(0, 2).join("")}
                      </div>
                      <p className="mt-3 truncate font-semibold">{p.contestantName}</p>
                      <p className="truncate text-xs text-white/50">{contestantsById.get(p.contestantId)?.genre} · #{i + 1}</p>
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
          <div className="relative overflow-hidden rounded-3xl bg-stage-950 p-6 font-grotesk text-stone-100 sm:p-10">
            <div className="pointer-events-none absolute -right-20 top-0 h-72 w-72 rounded-full bg-rose-600/20 blur-3xl" />
            <div className="relative grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-center">
              <div>
                <p className="eyebrow flex items-center gap-2 text-rose-400"><StageBadge size={22} /> {t("Festival")}</p>
                <h2 className="mt-3 font-stage text-5xl uppercase leading-[0.95] sm:text-6xl">
                  {festival.edition} {festival.name}
                </h2>
                {festival.theme && <p className="mt-3 text-lg font-bold uppercase tracking-[0.15em] text-rose-400">{festival.theme}</p>}
                <p className="mt-4 max-w-md text-stone-400">{festival.tagline}</p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link href="/tiyatro" className="inline-flex h-12 items-center bg-rose-500 px-6 font-bold uppercase tracking-wider text-stage-950 hover:bg-rose-400">{t("Festival Programı")}</Link>
                  <Link href="/tiyatro/yazarlik" className="inline-flex h-12 items-center gap-2 border border-stone-200/70 px-6 font-bold uppercase tracking-wider hover:bg-white hover:text-stage-950"><PenMark size={18} /> {t("Genç Kalemler")}</Link>
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-widest text-stone-500">{t("Sıradaki Gösterimler")}</p>
                {nextShows.length === 0 && <p className="text-stone-400">{t("Festival programı tamamlandı.")}</p>}
                {nextShows.map((s) => (
                  <Link key={s.id} href={`/tiyatro/oyun?s=${s.play.slug}`} className="group flex items-center gap-4 bg-stage-900 p-4 transition hover:bg-[#232327]">
                    <div className="w-16 shrink-0 text-center">
                      <p className="font-stage text-4xl leading-none text-rose-500">{new Date(s.date).toLocaleDateString("tr-TR", { day: "numeric", timeZone: "Europe/Istanbul" })}</p>
                      <p className="text-[10px] uppercase tracking-wider text-white/60">{formatWeekday(s.date).slice(0, 3)} · {formatTime(s.date)}</p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-stage text-2xl uppercase group-hover:text-rose-400">{s.play.title}</p>
                      <p className="truncate text-sm text-stone-400">{s.play.groupName} · {s.venueName}</p>
                    </div>
                    <Badge tone="rose">{t(s.play.genre)}</Badge>
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
          <SectionHeader eyebrow={t("Başvuru Dönemleri")} title={t("Sen de Katıl")} description={t("Takımını kur, grubunla sahneye çık ya da topluluğunla festivale katıl.")} action={<Link href="/basvuru" className="btn-outline">{t("Tüm Başvurular")} <ArrowRight className="h-4 w-4" /></Link>} />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {periods.map((p) => {
              const st = periodState(p);
              const cat = CATEGORIES[p.category as keyof typeof CATEGORIES];
              return (
                <Link key={p.id} href={`/basvuru/detay?s=${p.slug}`} className="card group flex flex-col p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
                  <div className="flex items-center justify-between">
                    <Badge tone={p.category === "SPOR" ? "green" : p.category === "MUZIK" ? "fuchsia" : p.category === "YAZARLIK" ? "rose" : p.category === "GONULLU" ? "blue" : "amber"}>{t(cat?.label ?? "")}</Badge>
                    <Badge tone={st === "OPEN" ? "green" : "amber"} dot={st === "OPEN"}>{st === "OPEN" ? t("{n} gün kaldı", { n: daysLeft(p.endDate) }) : t("{d} tarihinde açılıyor", { d: formatShortDate(p.startDate) })}</Badge>
                  </div>
                  <h3 className="mt-4 font-semibold leading-snug text-basalt-900 group-hover:text-dicle-700">{p.title}</h3>
                  <p className="mt-2 line-clamp-3 flex-1 text-sm text-basalt-500">{p.summary}</p>
                  <p className="mt-4 text-sm font-semibold text-dicle-700">{t("Şartları incele →")}</p>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ───────────── VİDEOLAR & DUYURULAR ───────────── */}
      <section className="container-x grid gap-10 pt-16 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <SectionHeader eyebrow={t("Video Arşivi")} title={t("İzle")} action={<Link href="/videolar" className="btn-outline"><VideoIcon className="h-4 w-4" /> {t("Tümü")}</Link>} />
          <div className="grid gap-4 sm:grid-cols-2">
            {videos.map((v) => (
              <Link key={v.id} href={`/videolar?v=${v.id}`} className="group overflow-hidden rounded-2xl bg-white shadow-card">
                <YouTubeThumb url={v.youtubeUrl} />
                <div className="p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-basalt-400">{t(ANNOUNCEMENT_CATEGORIES[v.category] ?? "")}</p>
                  <p className="line-clamp-1 font-semibold">{v.title}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
        <div>
          <SectionHeader eyebrow={t("Duyurular")} title={t("Haberler")} action={<Link href="/duyurular" className="btn-outline">{t("Tümü")}</Link>} />
          <div className="card divide-y divide-basalt-100">
            {announcements.map((a) => (
              <Link key={a.id} href={`/duyurular/oku?s=${a.slug}`} className="block p-4 transition hover:bg-basalt-50">
                <div className="flex items-center gap-2 text-xs text-basalt-500">
                  {a.isPinned && <Badge tone="red">{t("Önemli")}</Badge>}
                  <span className="font-semibold uppercase tracking-wider">{t(ANNOUNCEMENT_CATEGORIES[a.category] ?? "")}</span>
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
