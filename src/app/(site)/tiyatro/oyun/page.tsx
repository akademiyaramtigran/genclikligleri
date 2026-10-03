"use client";

import Link from "next/link";
import { ArrowLeft, CalendarDays, Clock, Globe2, MapPin, PenLine, Clapperboard, Users } from "lucide-react";
import { getGroup, getOne, getPlay } from "@/lib/data";
import { useData, useTitle } from "@/lib/hooks";
import type { TheatreFestival } from "@/lib/types";
import { ErrorBox, NotFoundBox, PageLoader, Suspended, useParam } from "@/components/client";
import { SHOW_STATUS } from "@/lib/constants";
import { formatDate, formatTime, initials } from "@/lib/utils";
import { Badge, KeyValue, StatusBadge } from "@/components/ui";
import { YouTubeEmbed } from "@/components/YouTubeEmbed";
import { useT } from "@/lib/i18n";

import { CalendarButton, pageUrl } from "@/components/tools";
export default function PlayPage() {
  return <Suspended><Inner /></Suspended>;
}

function Inner() {
  const t = useT();
  const slug = useParam("s") ?? "";
  const { data, error } = useData(async () => {
    const play = await getPlay(slug);
    if (!play) return null;
    const [festival, group] = await Promise.all([getOne<TheatreFestival>("theatreFestivals", play.festivalId), getGroup(play.groupId)]);
    return { play, festival, group, awards: (festival?.awards ?? []).filter((a) => a.playId === play.id) };
  }, [slug]);
  useTitle(data?.play ? `${data.play.title} — ${data.play.groupName}` : undefined);
  if (error) return <ErrorBox message={error} />;
  if (data === undefined) return <PageLoader className="bg-stage-950" />;
  if (!data) return <NotFoundBox title={t("Oyun bulunamadı")} />;
  const { play, festival, group, awards } = data;
  const cast = play.cast ?? [];

  return (
    <div className="bg-stage-950 pb-16 font-grotesk text-stone-100">
      <section className="relative overflow-hidden border-b border-stage-line">
        <div className="pointer-events-none absolute -right-24 top-0 h-80 w-80 rounded-full bg-rose-600/15 blur-[100px]" />
        <div className="container-x relative py-12">
          <Link href="/tiyatro" className="inline-flex items-center gap-1 text-sm text-stone-400 hover:text-white"><ArrowLeft className="h-4 w-4" /> {festival?.edition} {festival?.name}</Link>
          <div className="mt-8 grid gap-10 md:grid-cols-[16rem_1fr] md:items-end">
            <div className="relative flex aspect-[3/4] flex-col justify-end overflow-hidden bg-rose-500 p-5 text-stage-950">
              {play.posterUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={play.posterUrl} alt={play.title} className="absolute inset-0 h-full w-full object-cover" />
              )}
              {!play.posterUrl && <p className="relative font-stage text-5xl uppercase leading-[0.9]">{play.title}</p>}
            </div>
            <div>
              <div className="flex flex-wrap gap-2">
                <Badge tone="rose">{t(play.genre)}</Badge>
                {play.ageLimit && <Badge tone="dark">{play.ageLimit}</Badge>}
                <Badge tone="dark">{play.inCompetition ? t("Yarışmalı") : t("Yarışma Dışı")}</Badge>
              </div>
              <h1 className="mt-4 font-stage text-6xl uppercase leading-[0.9] sm:text-8xl">{play.title}</h1>
              <Link href={`/tiyatro/topluluk?s=${play.groupSlug}`} className="mt-4 inline-block text-lg font-bold uppercase tracking-[0.15em] text-rose-400 hover:text-rose-300">{play.groupName}</Link>
              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/70">
                <span className="flex items-center gap-2"><PenLine className="h-4 w-4 text-rose-500" /> {play.playwright}</span>
                <span className="flex items-center gap-2"><Clapperboard className="h-4 w-4 text-rose-500" /> {play.director}</span>
                {play.durationMin && <span className="flex items-center gap-2"><Clock className="h-4 w-4 text-rose-500" /> {play.durationMin} {t("dakika")}</span>}
                <span className="flex items-center gap-2"><Globe2 className="h-4 w-4 text-rose-500" /> {play.language}</span>
              </div>
              {awards.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{awards.map((a) => <Badge key={a.id} tone="yellow">🏆 {a.category}</Badge>)}</div>}
            </div>
          </div>
        </div>
      </section>

      <div className="container-x mt-10 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-8">
          {play.synopsis && (
            <div>
              <h2 className="mb-3 font-stage text-4xl uppercase">{t("Oyun Hakkında")}</h2>
              <p className="whitespace-pre-line leading-relaxed text-white/75">{play.synopsis}</p>
            </div>
          )}
          {play.youtubeUrl && <YouTubeEmbed url={play.youtubeUrl} title={play.title} />}
          {cast.length > 0 && (
            <div>
              <h2 className="mb-4 flex items-center gap-2 font-stage text-4xl uppercase"><Users className="h-6 w-6 text-rose-500" /> {t("Oyuncular")}</h2>
              <div className="grid gap-px bg-stage-line sm:grid-cols-2">
                {cast.map((c, i) => (
                  <div key={i} className="flex items-center gap-3 bg-stage-950 p-3">
                    <span className="flex h-10 w-10 items-center justify-center bg-stone-100 font-stage text-sm text-stage-950">{initials(c.name)}</span>
                    <div><p className="font-semibold">{c.name}</p><p className="text-xs italic text-white/50">{c.role}</p></div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <aside className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-stage text-4xl uppercase">{t("Gösterimler")}</h2>
            <CalendarButton className="!rounded-none !border-stone-200/60 !bg-transparent !text-stone-100 hover:!bg-white hover:!text-stage-950" filename={`oyun-${play.slug}`} events={play.shows.filter((s) => s.date > new Date() && s.status !== "CANCELLED").map((s) => ({ uid: s.id, title: `🎭 ${play.title} — ${play.groupName}`, start: s.date, minutes: play.durationMin ?? 90, location: s.venueName, description: s.ticketInfo, url: pageUrl(`/tiyatro/oyun/?s=${play.slug}`) }))} />
          </div>
          {play.shows.length === 0 && <p className="text-stone-500">{t("Gösterim tarihi henüz açıklanmadı.")}</p>}
          {play.shows.map((s) => (
            <div key={s.id} className="flex flex-col bg-stone-100 p-5 text-stage-950">
              <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider"><CalendarDays className="h-4 w-4" /> {formatDate(s.date, { weekday: "long", day: "numeric", month: "long" })}</p>
              <p className="font-stage text-5xl leading-none">{formatTime(s.date)}</p>
              <p className="mt-2 flex items-center gap-1.5 text-sm text-stage-900"><MapPin className="h-4 w-4" /> {s.venueName ?? t("Mekân açıklanacak")}</p>
              <div className="mt-3 flex items-center justify-between"><StatusBadge map={SHOW_STATUS} value={s.status} /><span className="text-xs text-stage-900">{s.ticketInfo}</span></div>
            </div>
          ))}
          <div className="border border-stage-line p-5 [&_dd]:text-white [&_dt]:text-stone-500 [&_dl]:divide-stage-line">
            <KeyValue items={[[t("Topluluk"), play.groupName], [t("İlçe"), group?.district ?? "—"], [t("Yönetmen"), play.director], [t("Tür"), t(play.genre)]]} />
          </div>
        </aside>
      </div>
    </div>
  );
}
