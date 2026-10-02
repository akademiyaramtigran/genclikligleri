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

export default function PlayPage() {
  return <Suspended><Inner /></Suspended>;
}

function Inner() {
  const slug = useParam("s") ?? "";
  const { data, error } = useData(async () => {
    const play = await getPlay(slug);
    if (!play) return null;
    const [festival, group] = await Promise.all([getOne<TheatreFestival>("theatreFestivals", play.festivalId), getGroup(play.groupId)]);
    return { play, festival, group, awards: (festival?.awards ?? []).filter((a) => a.playId === play.id) };
  }, [slug]);
  useTitle(data?.play ? `${data.play.title} — ${data.play.groupName}` : undefined);
  if (error) return <ErrorBox message={error} />;
  if (data === undefined) return <PageLoader className="bg-[#160404]" />;
  if (!data) return <NotFoundBox title="Oyun bulunamadı" />;
  const { play, festival, group, awards } = data;
  const cast = play.cast ?? [];

  return (
    <div className="bg-[#160404] pb-16 text-white">
      <section className="bg-curtain relative overflow-hidden">
        <div className="pointer-events-none absolute left-1/2 top-0 h-80 w-[40rem] -translate-x-1/2 rounded-full bg-amber-200/20 blur-3xl" />
        <div className="container-x relative py-12">
          <Link href="/tiyatro" className="inline-flex items-center gap-1 text-sm text-amber-100/70 hover:text-white"><ArrowLeft className="h-4 w-4" /> {festival?.edition} {festival?.name}</Link>
          <div className="mt-8 grid gap-10 md:grid-cols-[16rem_1fr] md:items-end">
            <div className="relative flex aspect-[3/4] flex-col justify-end overflow-hidden rounded-2xl bg-gradient-to-b from-red-800 to-curtain-950 p-5 shadow-2xl ring-1 ring-amber-200/30">
              {play.posterUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={play.posterUrl} alt={play.title} className="absolute inset-0 h-full w-full object-cover" />
              )}
              {!play.posterUrl && <p className="relative font-serif text-3xl font-bold leading-tight">{play.title}</p>}
            </div>
            <div>
              <div className="flex flex-wrap gap-2">
                <Badge tone="amber">{play.genre}</Badge>
                {play.ageLimit && <Badge tone="dark">{play.ageLimit}</Badge>}
                <Badge tone="dark">{play.inCompetition ? "Yarışmalı" : "Yarışma Dışı"}</Badge>
              </div>
              <h1 className="mt-4 font-serif text-5xl font-bold leading-tight sm:text-6xl">{play.title}</h1>
              <Link href={`/tiyatro/topluluk?s=${play.groupSlug}`} className="mt-3 inline-block font-serif text-xl italic text-amber-200 hover:text-amber-100">{play.groupName}</Link>
              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/70">
                <span className="flex items-center gap-2"><PenLine className="h-4 w-4 text-amber-400" /> {play.playwright}</span>
                <span className="flex items-center gap-2"><Clapperboard className="h-4 w-4 text-amber-400" /> {play.director}</span>
                {play.durationMin && <span className="flex items-center gap-2"><Clock className="h-4 w-4 text-amber-400" /> {play.durationMin} dakika</span>}
                <span className="flex items-center gap-2"><Globe2 className="h-4 w-4 text-amber-400" /> {play.language}</span>
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
              <h2 className="mb-3 font-serif text-2xl font-bold">Oyun Hakkında</h2>
              <p className="whitespace-pre-line leading-relaxed text-white/75">{play.synopsis}</p>
            </div>
          )}
          {play.youtubeUrl && <YouTubeEmbed url={play.youtubeUrl} title={play.title} />}
          {cast.length > 0 && (
            <div>
              <h2 className="mb-4 flex items-center gap-2 font-serif text-2xl font-bold"><Users className="h-5 w-5 text-amber-400" /> Oyuncular</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {cast.map((c, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-red-700 text-xs font-bold">{initials(c.name)}</span>
                    <div><p className="font-semibold">{c.name}</p><p className="text-xs italic text-white/50">{c.role}</p></div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <aside className="space-y-4">
          <h2 className="font-serif text-2xl font-bold">Gösterimler</h2>
          {play.shows.length === 0 && <p className="text-white/50">Gösterim tarihi henüz açıklanmadı.</p>}
          {play.shows.map((s) => (
            <div key={s.id} className="rounded-2xl bg-white/5 p-5 ring-1 ring-amber-200/15">
              <p className="flex items-center gap-2 font-serif text-xl font-bold text-amber-200"><CalendarDays className="h-5 w-5" /> {formatDate(s.date, { weekday: "long", day: "numeric", month: "long" })}</p>
              <p className="mt-1 text-sm text-white/70">Saat {formatTime(s.date)}</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-white/70"><MapPin className="h-4 w-4" /> {s.venueName ?? "Mekân açıklanacak"}</p>
              <div className="mt-3 flex items-center justify-between"><StatusBadge map={SHOW_STATUS} value={s.status} /><span className="text-xs text-white/50">{s.ticketInfo}</span></div>
            </div>
          ))}
          <div className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10 [&_dd]:text-white [&_dt]:text-white/50 [&_dl]:divide-white/10">
            <KeyValue items={[["Topluluk", play.groupName], ["İlçe", group?.district ?? "—"], ["Yönetmen", play.director], ["Tür", play.genre]]} />
          </div>
        </aside>
      </div>
    </div>
  );
}
