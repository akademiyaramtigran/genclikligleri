"use client";

import Link from "next/link";
import { CalendarDays, MapPin, Phone, User2, Users } from "lucide-react";
import { getLeague, getTeam, getTeamMatches, getTeamPlayers } from "@/lib/data";
import { useData, useTitle } from "@/lib/hooks";
import { sportDef, GENDERS, PLAYER_STATUS } from "@/lib/constants";
import { computeLeaders } from "@/lib/stats";
import { age } from "@/lib/utils";
import { Avatar, Badge, EmptyState, FormBadge, KeyValue, SectionHeader, StatTile, StatusBadge, TeamCrest } from "@/components/ui";
import { LeaderTable, MatchCard, MatchRow } from "@/components/sport";
import { ErrorBox, NotFoundBox, PageLoader, Suspended, useParam } from "@/components/client";

import { useT } from "@/lib/i18n";
import { CalendarButton, pageUrl } from "@/components/tools";
export default function TeamPage() {
  return <Suspended><Inner /></Suspended>;
}

function Inner() {
  const t = useT();
  const slug = useParam("s") ?? "";
  const { data, error } = useData(async () => {
    const team = await getTeam(slug);
    if (!team) return null;
    const [players, matches, league] = await Promise.all([getTeamPlayers(team.id), getTeamMatches(team.id), team.leagueIds[0] ? getLeague(team.leagueIds[team.leagueIds.length - 1]!) : null]);
    return { team, players, matches, league };
  }, [slug]);
  useTitle(data?.team?.name);
  if (error) return <ErrorBox message={error} />;
  if (data === undefined) return <PageLoader />;
  if (!data) return <NotFoundBox title={t("Takım bulunamadı")} />;
  const { team, matches, league } = data;
  const def = sportDef(team.sport);
  const row = league?.summary?.standings.find((r) => r.teamId === team.id);
  const played = matches.filter((m) => m.status === "FINISHED");
  const next = matches.find((m) => m.status === "SCHEDULED");
  const scorers = computeLeaders(matches, def.scoringEvents, new Map([[team.id, team]]), 5).filter((r) => r.teamSlug === team.slug);
  const players = data.players;

  const byPosition = def.positions.map((pos) => ({ pos, players: players.filter((p) => p.position === pos) })).filter((g) => g.players.length);
  const others = players.filter((p) => !def.positions.includes(p.position ?? ""));
  if (others.length) byPosition.push({ pos: "Diğer", players: others });

  return (
    <>
      <section className="relative overflow-hidden text-white" style={{ background: `linear-gradient(135deg, ${team.primaryColor} 0%, #0a0d15 75%)` }}>
        <div className="bg-basalt-wall absolute inset-0 opacity-50 mix-blend-overlay" />
        <div className="container-x relative py-12">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <TeamCrest team={team} size={112} className="ring-4" />
            <div className="flex-1">
              <div className="flex flex-wrap gap-2">
                <Badge tone="dark">{def.emoji} {t(def.label ?? "")}</Badge>
                <Badge tone="dark">{GENDERS[team.gender as "ERKEK"]?.league}</Badge>
                {team.status !== "ACTIVE" && <Badge tone="zinc">{t("Pasif")}</Badge>}
              </div>
              <h1 className="mt-3 font-display text-4xl font-semibold uppercase tracking-wide sm:text-5xl">{team.name}</h1>
              <p className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-white/75">
                <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {team.district}{team.neighborhood ? ` · ${team.neighborhood}` : ""}</span>
                {team.foundedYear && <span className="flex items-center gap-1"><CalendarDays className="h-4 w-4" /> {t("Kuruluş")} {team.foundedYear}</span>}
                <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {players.length} {t("oyuncu")}</span>
              </p>
            </div>
            {row && league && (
              <Link href={`/spor/lig?s=${league.slug}`} className="rounded-2xl bg-white/10 px-6 py-4 text-center ring-1 ring-white/20 backdrop-blur transition hover:bg-white/15">
                <p className="font-display text-5xl font-bold">{row.position}.</p>
                <p className="text-xs uppercase tracking-wider text-white/70">{row.points} {t("puan · Sıralama")}</p>
              </Link>
            )}
          </div>
        </div>
      </section>

      <div className="container-x grid gap-8 py-10 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-10">
          {row && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatTile label={t("Oynanan")} value={row.played} sub={`${row.won}G ${def.allowsDraw ? `${row.drawn}B ` : ""}${row.lost}M`} />
              <StatTile label={`Atılan ${def.scoreLabel}`} value={row.scored} sub={`Maç başı ${row.played ? (row.scored / row.played).toFixed(1) : 0}`} />
              <StatTile label={`Yenilen ${def.scoreLabel}`} value={row.conceded} sub={`Averaj ${row.diff > 0 ? "+" : ""}${row.diff}`} />
              <div className="card p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-basalt-500">{t("Son Form")}</p>
                <div className="mt-3 flex gap-1">{row.form.length ? row.form.map((f, i) => <FormBadge key={i} r={f} />) : <span className="text-sm text-basalt-400">—</span>}</div>
              </div>
            </div>
          )}

          {next && (
            <div>
              <SectionHeader title={t("Sıradaki Maç")} />
              <div className="max-w-md"><MatchCard m={next} /></div>
            </div>
          )}

          <div>
            <SectionHeader eyebrow={t("Kadro")} title={`${players.length} Oyuncu`} />
            {players.length === 0 ? <EmptyState title={t("Kadro henüz girilmedi")} /> : (
              <div className="space-y-6">
                {byPosition.map((g) => (
                  <div key={g.pos}>
                    <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-basalt-500">{g.pos}</h3>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {g.players.map((p) => (
                        <Link key={p.id} href={`/spor/oyuncu?s=${p.slug}`} className="card group flex items-center gap-3 p-3 transition hover:shadow-lg">
                          <div className="relative">
                            <Avatar name={`${p.firstName} ${p.lastName}`} src={p.photoUrl} size={48} color={team.primaryColor} />
                            {p.jerseyNumber != null && <span className="absolute -bottom-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-basalt-900 px-1 text-[10px] font-bold text-white ring-2 ring-white">{p.jerseyNumber}</span>}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold group-hover:text-dicle-700">{p.firstName} {p.lastName} {p.isCaptain && <span title={t("Kaptan")} className="ml-1 rounded bg-amber-400 px-1 text-[10px] font-bold text-amber-950">C</span>}</p>
                            <p className="text-xs text-basalt-500">{age(p.birthDate) ? `${age(p.birthDate)} yaş` : ""}{p.heightCm ? ` · ${p.heightCm} cm` : ""}</p>
                          </div>
                          {p.status !== "ACTIVE" && <StatusBadge map={PLAYER_STATUS} value={p.status} />}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <SectionHeader eyebrow={t("Maçlar")} title={t("Fikstür & Sonuçlar")} action={<CalendarButton label="Maçları Takvime Ekle" filename={`${team.slug}-fikstur`} events={matches.filter((m) => m.status === "SCHEDULED" && m.date > new Date()).map((m) => ({ uid: m.id, title: `${m.home.name} - ${m.away.name}`, start: m.date, minutes: 120, location: m.venueName, description: m.leagueName, url: pageUrl(`/spor/mac/?id=${m.id}`) }))} />} />
            <div className="card divide-y divide-basalt-100 overflow-hidden">
              {matches.length === 0 ? <p className="p-6 text-center text-sm text-basalt-500">{t("Maç bulunmuyor")}</p> : matches.map((m) => <MatchRow key={m.id} m={m} />)}
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="card p-5">
            <h3 className="mb-2 font-semibold">{t("Kulüp Bilgileri")}</h3>
            <KeyValue items={[
              ["Lig", league ? <Link href={`/spor/lig?s=${league.slug}`} className="link">{league.name}</Link> : "—"],
              ["Antrenör", team.coachName], ["Takım Sorumlusu", team.managerName], ["İç Saha", team.venueName],
              ["Renkler", <span key="c" className="inline-flex gap-1"><span className="h-4 w-4 rounded-full ring-1 ring-basalt-200" style={{ background: team.primaryColor }} /><span className="h-4 w-4 rounded-full ring-1 ring-basalt-200" style={{ background: team.secondaryColor }} /></span>],
            ]} />
            {team.description && <p className="mt-4 text-sm leading-relaxed text-basalt-600">{team.description}</p>}
          </div>
          <div className="card overflow-hidden">
            <h3 className="border-b border-basalt-100 px-4 py-3 font-semibold">{t("Takımın")} {def.scorerTitle === "Gol Krallığı" ? "Golcüleri" : "Skorerleri"}</h3>
            <LeaderTable rows={scorers} unit={t(def.scorerUnit)} compact />
          </div>
          <div className="card p-5 text-sm text-basalt-600">
            <p className="flex items-center gap-2 font-semibold text-basalt-800"><User2 className="h-4 w-4" /> {t("Takıma katılmak ister misin?")}</p>
            <p className="mt-1">{t("Oyuncu transferleri ve takım başvuruları başvuru dönemlerinde organizasyon üzerinden yapılır.")}</p>
            <Link href="/basvuru" className="mt-3 inline-flex items-center gap-1 font-semibold text-dicle-700"><Phone className="h-4 w-4" /> {t("Başvuru dönemleri →")}</Link>
          </div>
          <p className="text-xs text-basalt-400">{t("Toplam")} {played.length} {t("resmi maç oynandı.")}</p>
        </aside>
      </div>
    </>
  );
}
