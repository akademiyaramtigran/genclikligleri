"use client";

import Link from "next/link";
import { ArrowLeft, MapPin, Music, Users } from "lucide-react";
import { getCompetitionData, getContestant, getOne, voteCount } from "@/lib/data";
import { useData, useTitle } from "@/lib/hooks";
import type { MusicCompetition } from "@/lib/types";
import { ErrorBox, NotFoundBox, PageLoader, Suspended, useParam } from "@/components/client";
import { CONTESTANT_STATUS } from "@/lib/constants";
import { cn, formatDate, initials } from "@/lib/utils";
import { Badge, StatusBadge } from "@/components/ui";
import { YouTubeEmbed } from "@/components/YouTubeEmbed";
import { VoteButton } from "../VoteButton";

import { useT } from "@/lib/i18n";
export default function ContestantPage() {
  return <Suspended dark><Inner /></Suspended>;
}

function Inner() {
  const t = useT();
  const slug = useParam("s") ?? "";
  const { data, error } = useData(async () => {
    const c = await getContestant(slug);
    if (!c) return null;
    const [competition, { rounds }, votes] = await Promise.all([getOne<MusicCompetition>("musicCompetitions", c.competitionId), getCompetitionData(c.competitionId), voteCount(c.id).catch(() => 0)]);
    const performances = rounds.flatMap((r) => r.performances.filter((p) => p.contestantId === c.id).map((p) => ({ ...p, round: r })));
    return { c, competition, performances, votes };
  }, [slug]);
  useTitle(data?.c ? `${data.c.name} — Genç Sesler` : undefined);
  if (error) return <ErrorBox message={error} dark />;
  if (data === undefined) return <PageLoader dark />;
  if (!data) return <NotFoundBox title={t("Yarışmacı bulunamadı")} />;
  const { c, competition, performances, votes } = data;
  const members = c.members ?? [];
  const video = performances.find((p) => p.youtubeUrl)?.youtubeUrl ?? c.youtubeUrl;
  const scored = performances.filter((p) => p.totalScore != null);
  const avg = scored.length ? scored.reduce((s, p) => s + (p.totalScore ?? 0), 0) / scored.length : null;

  return (
    <div className="bg-[#0b0614] pb-16 text-white">
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-20 left-1/4 h-[36rem] w-64 origin-top animate-spot bg-gradient-to-b from-fuchsia-500/40 to-transparent blur-2xl" />
        <div className="container-x relative py-12">
          <Link href="/muzik" className="inline-flex items-center gap-1 text-sm text-white/60 hover:text-white"><ArrowLeft className="h-4 w-4" /> {competition?.name} {competition?.edition}</Link>
          <div className="mt-8 flex flex-col gap-8 md:flex-row md:items-end">
            <div className="flex h-48 w-48 shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-fuchsia-600 to-cyan-600 font-music text-6xl font-black shadow-glow">
              {c.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.photoUrl} alt={c.name} className="h-full w-full object-cover" />
              ) : initials(c.name)}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap gap-2">
                <StatusBadge map={CONTESTANT_STATUS} value={c.status} />
                <Badge tone="dark">{c.type === "GRUP" ? "Grup" : "Solo"}</Badge>
                <Badge tone="dark">{c.genre}</Badge>
              </div>
              <h1 className="mt-4 font-music text-5xl font-black uppercase leading-none sm:text-6xl">{c.name}</h1>
              <p className="mt-3 flex items-center gap-1.5 text-white/60"><MapPin className="h-4 w-4" /> {c.district}{t(", Diyarbakır")}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 md:w-72">
              <div className="rounded-2xl bg-white/5 p-4 text-center ring-1 ring-white/10"><p className="font-music text-3xl font-black">{votes}</p><p className="text-xs text-white/50">{t("Halk Oyu")}</p></div>
              <div className="rounded-2xl bg-white/5 p-4 text-center ring-1 ring-white/10"><p className="font-music text-3xl font-black">{avg ? avg.toFixed(1) : "—"}</p><p className="text-xs text-white/50">{t("Ort. Puan")}</p></div>
              {competition?.votingOpen && c.status !== "ELIMINATED" && <VoteButton contestantId={c.id} name={c.name} className="col-span-2" big />}
            </div>
          </div>
        </div>
      </section>

      <div className="container-x grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-8">
          {video && <YouTubeEmbed url={video} title={`${c.name} performansı`} />}
          <div className="overflow-hidden rounded-3xl bg-white/[0.03] ring-1 ring-white/10">
            <h2 className="border-b border-white/10 px-6 py-4 font-music text-lg font-bold uppercase">{t("Yarışma Yolculuğu")}</h2>
            {performances.length === 0 ? <p className="p-6 text-white/50">{t("Henüz sahneye çıkmadı.")}</p> : (
              <ol className="divide-y divide-white/5">
                {performances.map((p) => (
                  <li key={p.round.id} className="px-6 py-5">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-fuchsia-600/30 font-music font-black">{p.round.order}</span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{p.round.name}</p>
                        <p className="text-xs text-white/50">{formatDate(p.round.date)}{p.round.venueName ? ` · ${p.round.venueName}` : ""}</p>
                      </div>
                      {p.totalScore != null ? (
                        <div className="text-right"><p className="font-music text-2xl font-black">{p.totalScore.toFixed(1)}</p><p className="text-[10px] text-white/40">{p.rank}{t(". sıra")}</p></div>
                      ) : <Badge tone="dark">{t("Sahne sırası #")}{p.order}</Badge>}
                      {p.totalScore != null && (p.advanced ? <Badge tone="green">{t("Tur atladı")}</Badge> : <Badge tone="zinc">{t("Elendi")}</Badge>)}
                    </div>
                    <p className="mt-3 flex items-center gap-2 text-sm text-white/70"><Music className="h-4 w-4 text-fuchsia-300" /> {p.songTitle}{p.songArtist ? ` — ${p.songArtist}` : ""}</p>
                    {p.juryScore != null && (
                      <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                        {[["Jüri", p.juryScore], ["Halk", p.publicScore]].map(([l, v]) => (
                          <div key={l as string}>
                            <div className="mb-1 flex justify-between text-white/60"><span>{l}</span><span>{v as number}</span></div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className={cn("h-full rounded-full", l === "Jüri" ? "bg-fuchsia-500" : "bg-cyan-400")} style={{ width: `${v}%` }} /></div>
                          </div>
                        ))}
                      </div>
                    )}
                    {p.juryComment && <p className="mt-3 rounded-xl bg-white/5 p-3 text-sm italic text-white/70">“{p.juryComment}” <span className="not-italic text-white/40">{t("— Jüri")}</span></p>}
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
        <aside className="space-y-6">
          {c.bio && <div className="rounded-3xl bg-white/[0.03] p-6 ring-1 ring-white/10"><h2 className="mb-2 font-music font-bold uppercase">{t("Hakkında")}</h2><p className="text-sm leading-relaxed text-white/70">{c.bio}</p></div>}
          {members.length > 0 && (
            <div className="rounded-3xl bg-white/[0.03] p-6 ring-1 ring-white/10">
              <h2 className="mb-4 flex items-center gap-2 font-music font-bold uppercase"><Users className="h-4 w-4" /> {t("Grup Üyeleri")}</h2>
              <ul className="space-y-3">
                {members.map((m, i) => (
                  <li key={i} className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xs font-bold">{initials(m.name)}</span><span className="flex-1 text-sm">{m.name}</span><span className="text-xs text-white/50">{m.role}</span></li>
                ))}
              </ul>
            </div>
          )}
          {c.instagram && <a href={c.instagram} target="_blank" rel="noreferrer" className="btn w-full border border-white/15 text-white hover:bg-white/10">Instagram&apos;da takip et</a>}
        </aside>
      </div>
    </div>
  );
}
