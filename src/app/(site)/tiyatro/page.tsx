"use client";

import Link from "next/link";
import { ArrowRight, Award, Sparkles } from "lucide-react";
import { getCurrentFestival, getCurrentWritingContest, getFestivalPlays, getFestivals, getGroups, getPeriods } from "@/lib/data";
import { useData, useTitle } from "@/lib/hooks";
import { ErrorBox, PageLoader, Suspended, useParam } from "@/components/client";
import { FESTIVAL_STATUS, SHOW_STATUS, WRITING_STATUS } from "@/lib/constants";
import { cn, dayKey, formatDate, formatTime, formatWeekday } from "@/lib/utils";
import { periodState } from "@/lib/periods";
import { EmptyState } from "@/components/ui";
import { YouTubeEmbed } from "@/components/YouTubeEmbed";
import { Countdown } from "@/components/Countdown";
import { PenMark } from "@/components/Logos";
import { useT } from "@/lib/i18n";

// Afiş renkleri (görsel yüklenmemiş oyunlar için)
const POSTER = ["bg-rose-500", "bg-stone-200", "bg-amber-400", "bg-rose-900", "bg-zinc-700", "bg-orange-500"];
const POSTER_TEXT = ["text-stage-950", "text-stage-950", "text-stage-950", "text-white", "text-white", "text-stage-950"];

export default function TheatrePage() {
  return <Suspended><Inner /></Suspended>;
}

function Inner() {
  const t = useT();
  useTitle(t("Gençlik Tiyatro Festivali"));
  const gun = useParam("gun");
  const { data, error } = useData(async () => {
    const [current, festivals, periods, allGroups, contest] = await Promise.all([getCurrentFestival(), getFestivals(), getPeriods(), getGroups(), getCurrentWritingContest()]);
    const plays = current ? await getFestivalPlays(current.id) : [];
    const upcoming = (cat: string) => periods.filter((p) => p.category === cat && p.endDate >= new Date()).sort((x, y) => x.startDate.getTime() - y.startDate.getTime())[0] ?? null;
    return {
      festival: current ? { ...current, plays } : null,
      archive: festivals.filter((f) => !f.isCurrent).sort((x, y) => y.startDate.getTime() - x.startDate.getTime()),
      period: upcoming("TIYATRO"),
      writingPeriod: upcoming("YAZARLIK"),
      allGroups,
      contest,
    };
  }, []);
  if (error) return <ErrorBox message={error} />;
  if (!data) return <PageLoader className="bg-stage-950" />;
  const { festival, archive, period, writingPeriod, allGroups, contest } = data;

  if (!festival) {
    return (
      <div className="bg-stage-950 py-20 font-grotesk text-white">
        <div className="container-x space-y-10">
          <EmptyState dark title={t("Yeni festival yakında duyurulacak")} icon="🎭" />
          <WritingBanner contest={contest} />
        </div>
      </div>
    );
  }

  const shows = festival.plays.flatMap((p) => p.shows.map((s) => ({ ...s, play: p }))).sort((a, b) => a.date.getTime() - b.date.getTime());
  const days = [...new Set(shows.map((s) => dayKey(s.date)))];
  const today = dayKey();
  const activeDay = gun && days.includes(gun) ? gun : days.includes(today) ? today : days[0];
  const dayShows = shows.filter((s) => dayKey(s.date) === activeDay);
  const dayWorkshops = festival.workshops.filter((w) => dayKey(w.date) === activeDay);
  const groups = allGroups.filter((g) => festival.plays.some((p) => p.groupId === g.id));
  const featured = festival.plays.find((p) => p.youtubeUrl);
  const posterIdx = (id: string) => festival.plays.findIndex((p) => p.id === id) % POSTER.length;
  const live = festival.status === "ONGOING";
  const venues = new Set(shows.map((s) => s.venueName).filter(Boolean)).size;
  const words = (festival.theme || festival.name).split(" ");

  return (
    <div className="bg-stage-950 font-grotesk text-stone-100">
      {/* AFİŞ HERO */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-32 top-10 h-[28rem] w-[28rem] rounded-full bg-rose-600/15 blur-[120px]" />
        <div className="container-x relative pb-14 pt-8 sm:pt-10">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stage-line pb-4 text-xs font-medium uppercase tracking-[0.2em] sm:text-sm">
            <span>{t("Festival")} · {festival.edition}</span>
            <span>{formatDate(festival.startDate, { day: "numeric", month: "short" })} — {formatDate(festival.endDate, { day: "numeric", month: "short" })}</span>
            <span className={cn("flex items-center gap-2", live ? "text-rose-500" : "text-stone-400")}>
              <span className={cn("h-2 w-2 rounded-full", live ? "animate-pulse-dot bg-rose-500" : "bg-stone-500")} />
              {live ? t("Perde Açık") : t(FESTIVAL_STATUS[festival.status]?.label ?? festival.status)}
            </span>
          </div>
          <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-9">
              {festival.theme && <p className="mb-3 text-sm font-medium uppercase tracking-[0.25em] text-stone-400">{festival.name}</p>}
              <h1 className="font-stage text-[3.4rem] uppercase leading-[0.9] tracking-tight sm:text-8xl lg:text-[8.5rem]">
                {words.map((w, i) => <span key={i} className={cn("block", i === words.length - 1 && "text-rose-500")}>{w}</span>)}
              </h1>
            </div>
            <div className="space-y-4 lg:col-span-3 lg:pb-3">
              {festival.tagline && <p className="text-base leading-relaxed text-stone-300">{festival.tagline}</p>}
              <a href="#program" className="flex h-12 items-center justify-center gap-2 bg-rose-500 font-bold uppercase tracking-wider text-stage-950 transition hover:bg-rose-400">{t("Program")} <ArrowRight className="h-4 w-4" /></a>
              <Link href="/tiyatro/yazarlik" className="flex h-12 items-center justify-center gap-2 border border-stone-200/70 font-bold uppercase tracking-wider transition hover:bg-white hover:text-stage-950">{t("Genç Kalemler")}</Link>
            </div>
          </div>
          <dl className="mt-12 grid grid-cols-2 border-y border-stage-line sm:grid-cols-4">
            {[[festival.plays.length, t("Oyun")], [groups.length, t("Topluluk")], [venues || "—", t("Sahne")], [t("Ücretsiz"), t("Giriş")]].map(([v, l], i) => (
              <div key={i} className={cn("py-5", i > 0 && "sm:border-l sm:border-stage-line sm:pl-6", i % 2 === 1 && "border-l border-stage-line pl-6 sm:pl-6")}>
                <dt className="text-xs uppercase tracking-[0.2em] text-stone-500">{l}</dt>
                <dd className="font-stage text-4xl uppercase">{v}</dd>
              </div>
            ))}
          </dl>
          {festival.status === "PLANNED" && <Countdown to={festival.startDate} className="mt-10" label={t("Perde açılışına")} />}
        </div>
      </section>

      {/* BİLET MASASI — PROGRAM */}
      <section id="program" className="container-x scroll-mt-24 py-12">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-stage text-5xl uppercase sm:text-6xl">{t("Bilet masası")}</h2>
          {activeDay && <span className="text-sm text-stone-400">{formatDate(new Date(`${activeDay}T12:00:00+03:00`), { weekday: "long", day: "numeric", month: "long" })}</span>}
        </div>
        <div className="scrollbar-none -mx-4 mb-6 flex gap-2 overflow-x-auto px-4">
          {days.map((d) => {
            const date = new Date(`${d}T12:00:00+03:00`);
            const on = d === activeDay;
            return (
              <Link key={d} href={`/tiyatro?gun=${d}#program`} scroll={false} className={cn("flex w-[4.5rem] shrink-0 flex-col items-center border py-2.5 transition", on ? "border-rose-500 bg-rose-500 text-stage-950" : "border-stage-line text-stone-300 hover:border-stone-400")}>
                <span className="text-[11px] font-bold uppercase tracking-wider">{formatWeekday(date).slice(0, 3)}</span>
                <span className="font-stage text-3xl leading-none">{date.toLocaleDateString("tr-TR", { day: "numeric", timeZone: "Europe/Istanbul" })}</span>
                <span className="text-[11px] uppercase">{date.toLocaleDateString("tr-TR", { month: "short", timeZone: "Europe/Istanbul" })}</span>
                {d === today && <span className="mt-1 h-1.5 w-1.5 rounded-full bg-current" />}
              </Link>
            );
          })}
        </div>
        <div className="space-y-3">
          {dayShows.length === 0 && dayWorkshops.length === 0 && <EmptyState dark title={t("Bu gün için program yok")} />}
          {[...dayShows.map((s) => ({ kind: "show" as const, date: s.date, s })), ...dayWorkshops.map((w) => ({ kind: "ws" as const, date: w.date, w }))]
            .sort((a, b) => a.date.getTime() - b.date.getTime())
            .map((item, idx) => {
              if (item.kind === "ws") {
                return (
                  <div key={item.w.id} className="flex flex-col border border-dashed border-stage-line sm:flex-row">
                    <div className="flex items-center gap-3 px-6 py-4 sm:w-40 sm:flex-col sm:justify-center sm:gap-0 sm:border-r sm:border-dashed sm:border-stage-line">
                      <span className="font-stage text-3xl">{formatTime(item.w.date)}</span>
                    </div>
                    <div className="flex-1 px-6 py-4">
                      <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.2em] text-rose-400"><Sparkles className="h-3.5 w-3.5" /> {t("Atölye / Söyleşi")}</p>
                      <p className="mt-1 text-xl font-bold">{item.w.title}</p>
                      <p className="text-sm text-stone-400">{item.w.instructor} · {item.w.location}</p>
                    </div>
                  </div>
                );
              }
              const s = item.s;
              const first = idx === 0;
              const full = s.status === "SOLD_OUT" || s.status === "DONE" || s.status === "CANCELLED";
              return (
                <Link key={s.id} href={`/tiyatro/oyun?s=${s.play.slug}`} className={cn("group flex flex-col transition sm:min-h-[6.5rem] sm:flex-row", first ? "bg-stone-100 text-stage-950" : "bg-stage-900 hover:bg-[#232327]")}>
                  <div className={cn("flex items-center gap-3 px-6 py-4 sm:w-40 sm:flex-col sm:justify-center sm:gap-0 sm:border-r-2 sm:border-dashed", first ? "border-stage-950" : "border-zinc-700")}>
                    <span className="font-stage text-4xl leading-none">{formatTime(s.date)}</span>
                    <span className={cn("text-xs uppercase tracking-[0.2em]", first ? "" : "text-stone-400")}>{formatWeekday(s.date).slice(0, 3)}</span>
                  </div>
                  <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-4">
                    <p className="font-stage text-3xl uppercase leading-none group-hover:text-rose-500">{s.play.title}</p>
                    <p className={cn("text-sm", first ? "text-stage-900" : "text-stone-300")}>
                      {[s.play.groupName, t(s.play.genre), s.play.language, s.play.durationMin ? `${s.play.durationMin} ${t("dk")}` : null, s.venueName].filter(Boolean).join(" · ")}
                    </p>
                    {!s.play.inCompetition && <p className="text-xs uppercase tracking-wider text-stone-500">{t("Yarışma Dışı")}</p>}
                  </div>
                  <div className={cn("flex items-center justify-center px-6 py-3 text-sm font-bold uppercase tracking-wider sm:w-48",
                    full ? (first ? "text-stage-900" : "border-l border-zinc-700 text-stone-500") : first ? "bg-rose-500" : "border-l border-zinc-700 group-hover:bg-rose-500 group-hover:text-stage-950")}>
                    {full ? t(SHOW_STATUS[s.status]?.label ?? s.status) : t("Ücretsiz · Detay")}
                  </div>
                </Link>
              );
            })}
        </div>
        <div className="mt-8"><WritingBanner contest={contest} /></div>
      </section>

      {/* AFİŞ DUVARI */}
      <section className="border-y border-stage-line bg-black/40 py-12">
        <div className="container-x">
          <h2 className="mb-8 font-stage text-5xl uppercase sm:text-6xl">{t("Afiş duvarı")}</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {festival.plays.map((p) => {
              const i = posterIdx(p.id);
              return (
                <Link key={p.id} href={`/tiyatro/oyun?s=${p.slug}`} className="group">
                  <div className={cn("relative flex aspect-[3/4] flex-col justify-between overflow-hidden p-4 transition duration-300 group-hover:-translate-y-1", POSTER[i], POSTER_TEXT[i])}>
                    {p.posterUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.posterUrl} alt={p.title} className="absolute inset-0 h-full w-full object-cover" />
                    )}
                    <div className="relative flex justify-between text-[10px] font-bold uppercase tracking-[0.2em]"><span className="truncate pr-2">{p.groupName}</span><span>{festival.edition}</span></div>
                    {!p.posterUrl && <p className="relative font-stage text-4xl uppercase leading-[0.9] sm:text-5xl">{p.title}</p>}
                    <div className="relative flex items-center justify-between border-t border-current pt-2 text-[11px] font-semibold uppercase tracking-wider">
                      <span>{t(p.genre)}</span>
                      {p.shows[0] && <span>{formatDate(p.shows[0].date, { day: "numeric", month: "short" })}</span>}
                    </div>
                  </div>
                  {p.posterUrl && <p className="mt-2 font-stage text-xl uppercase">{p.title}</p>}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* VİDEO & TOPLULUKLAR */}
      <section className="container-x grid gap-10 py-12 lg:grid-cols-[1.4fr_1fr]">
        {featured && (
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-rose-500">{t("Sahneden")}</p>
            <h2 className="mb-5 font-stage text-4xl uppercase">{featured.title}</h2>
            <YouTubeEmbed url={featured.youtubeUrl} title={featured.title} />
          </div>
        )}
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-rose-500">{t("Katılımcılar")}</p>
          <h2 className="mb-5 font-stage text-4xl uppercase">{t("Topluluklar")}</h2>
          <div className="divide-y divide-stage-line border-y border-stage-line">
            {groups.map((g) => (
              <Link key={g.id} href={`/tiyatro/topluluk?s=${g.slug}`} className="group flex items-center gap-4 py-3">
                {g.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={g.logoUrl} alt="" className="h-11 w-11 object-cover" />
                ) : <span className="flex h-11 w-11 items-center justify-center bg-stone-100 font-stage text-xl text-stage-950">{g.name[0]}</span>}
                <span className="min-w-0 flex-1"><span className="block truncate font-bold group-hover:text-rose-400">{g.name}</span><span className="text-xs text-stone-500">{g.district}{g.memberCount ? ` · ${g.memberCount} ${t("üye")}` : ""}</span></span>
                <ArrowRight className="h-4 w-4 text-stone-600 transition group-hover:translate-x-1 group-hover:text-rose-400" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ÖDÜLLER */}
      {(festival.awards.length > 0 || archive.some((a) => a.awards.length)) && (
        <section className="container-x pb-12">
          <h2 className="mb-6 flex items-center gap-3 font-stage text-5xl uppercase"><Award className="h-9 w-9 text-rose-500" /> {t("Ödüller")}</h2>
          {[{ f: festival, awards: festival.awards }, ...archive.map((a) => ({ f: a, awards: a.awards }))].filter((x) => x.awards.length).map(({ f, awards }) => (
            <div key={f.id} className="mb-8">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.15em] text-stone-400">{f.edition} {t("Festival")} ({new Date(f.startDate).getFullYear()}){f.theme ? ` — “${f.theme}”` : ""}</p>
              <div className="grid gap-px bg-stage-line sm:grid-cols-2 lg:grid-cols-3">
                {awards.map((a) => (
                  <div key={a.id} className="bg-stage-950 p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-rose-500">{a.category}</p>
                    <p className="mt-1 text-lg font-bold">{a.winner}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* BAŞVURU */}
      <section className="container-x pb-16">
        <div className="grid gap-px bg-stage-line md:grid-cols-2">
          <div className="flex flex-col items-start gap-4 bg-stage-900 p-8">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-rose-500">{t("Topluluklar için")}</p>
            <h2 className="font-stage text-4xl uppercase">{t("Topluluğunla sahneye çık")}</h2>
            <p className="text-stone-400">{period ? `${period.title}: ${periodState(period) === "OPEN" ? t("Başvurular açık!") : t("{d} tarihinde açılıyor.", { d: formatDate(period.startDate) })}` : t("Bir sonraki festival için başvuru dönemi duyurulacak.")}</p>
            <Link href={period ? `/basvuru/detay?s=${period.slug}` : "/basvuru"} className="mt-auto inline-flex h-12 items-center gap-2 bg-stone-100 px-6 font-bold uppercase tracking-wider text-stage-950 hover:bg-rose-500">{t("Başvuru Şartları")} <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="flex flex-col items-start gap-4 bg-stage-900 p-8">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-rose-500">{t("Yazarlar için")}</p>
            <h2 className="font-stage text-4xl uppercase">{t("Metnini gönder")}</h2>
            <p className="text-stone-400">{writingPeriod ? `${writingPeriod.title}: ${periodState(writingPeriod) === "OPEN" ? t("Başvurular açık!") : t("{d} tarihinde açılıyor.", { d: formatDate(writingPeriod.startDate) })}` : t("Türkçe, Kurmancî veya Zazakî yazdığın oyun metniyle Genç Kalemler'e katıl.")}</p>
            <Link href="/tiyatro/yazarlik" className="mt-auto inline-flex h-12 items-center gap-2 border border-stone-200/70 px-6 font-bold uppercase tracking-wider hover:bg-white hover:text-stage-950">{t("Genç Kalemler")} <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function WritingBanner({ contest }: { contest: Awaited<ReturnType<typeof getCurrentWritingContest>> }) {
  const t = useT();
  const status = contest ? WRITING_STATUS[contest.status] : null;
  return (
    <Link href="/tiyatro/yazarlik" className="group flex flex-col gap-4 border border-rose-500 p-6 transition hover:bg-rose-500/10 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <PenMark size={44} className="shrink-0" />
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-rose-500">{status ? `${t("Genç Kalemler")} · ${t(status.label)}` : t("Yeni · Genç Kalemler")}</p>
          <p className="font-stage text-3xl uppercase leading-tight">{t("Oyun yazarlığı yarışması")}</p>
          {contest && contest.status === "OPEN" && <p className="text-sm text-stone-400">{t("Son başvuru")}: {formatDate(contest.deadline, { day: "numeric", month: "long", year: "numeric" })}</p>}
        </div>
      </div>
      <span className="inline-flex h-12 items-center justify-center border border-stone-200 px-6 font-bold uppercase tracking-wider transition group-hover:bg-white group-hover:text-stage-950">{contest?.status === "OPEN" ? t("Metnini Gönder") : t("Yarışmayı İncele")}</span>
    </Link>
  );
}
