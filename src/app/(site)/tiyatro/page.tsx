import Link from "next/link";
import type { Metadata } from "next";
import { Award, CalendarDays, Clock, Drama, MapPin, Sparkles, Ticket, Users } from "lucide-react";
import { db } from "@/lib/db";
import { FESTIVAL_STATUS, SHOW_STATUS } from "@/lib/constants";
import { cn, dayKey, formatDate, formatTime, formatWeekday } from "@/lib/utils";
import { periodState } from "@/lib/periods";
import { Badge, EmptyState, StatusBadge } from "@/components/ui";
import { YouTubeEmbed } from "@/components/YouTubeEmbed";
import { Countdown } from "@/components/Countdown";

export const metadata: Metadata = { title: "Gençlik Tiyatro Festivali", description: "Diyarbakır Gençlik Tiyatro Festivali: program, oyunlar, topluluklar, atölyeler ve ödüller." };

const POSTER = ["from-red-800 to-curtain-950", "from-amber-700 to-curtain-900", "from-rose-900 to-black", "from-orange-800 to-curtain-950", "from-yellow-800 to-curtain-900", "from-red-900 to-amber-950"];

export default async function TheatrePage({ searchParams }: { searchParams: Promise<{ gun?: string }> }) {
  const { gun } = await searchParams;
  const [festival, archive, period] = await Promise.all([
    db.theatreFestival.findFirst({
      where: { isCurrent: true },
      include: {
        plays: { include: { group: true, shows: { include: { venue: true }, orderBy: { date: "asc" } } }, orderBy: { title: "asc" } },
        workshops: { orderBy: { date: "asc" } },
        awards: { include: { play: true } },
      },
    }),
    db.theatreFestival.findMany({ where: { isCurrent: false }, include: { awards: true, _count: { select: { plays: true } } }, orderBy: { startDate: "desc" } }),
    db.applicationPeriod.findFirst({ where: { category: "TIYATRO", isPublished: true, endDate: { gte: new Date() } }, orderBy: { startDate: "asc" } }),
  ]);

  if (!festival) {
    return <div className="bg-curtain-950 py-20"><div className="container-x"><EmptyState dark title="Yeni festival yakında duyurulacak" icon="🎭" /></div></div>;
  }

  const shows = festival.plays.flatMap((p) => p.shows.map((s) => ({ ...s, play: p }))).sort((a, b) => a.date.getTime() - b.date.getTime());
  const days = [...new Set(shows.map((s) => dayKey(s.date)))];
  const today = dayKey();
  const activeDay = gun && days.includes(gun) ? gun : days.includes(today) ? today : days[0];
  const dayShows = shows.filter((s) => dayKey(s.date) === activeDay);
  const dayWorkshops = festival.workshops.filter((w) => dayKey(w.date) === activeDay);
  const groups = [...new Map(festival.plays.map((p) => [p.group.id, p.group])).values()];
  const featured = festival.plays.find((p) => p.youtubeUrl);
  const posterOf = (id: string) => POSTER[festival.plays.findIndex((p) => p.id === id) % POSTER.length];

  return (
    <div className="bg-[#160404] text-white">
      {/* PERDE HERO */}
      <section className="bg-curtain relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/70 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-6" style={{ background: "repeating-radial-gradient(circle at 50% -10px, #5c1414 0 18px, transparent 18px 36px)" }} />
        <div className="pointer-events-none absolute left-1/2 top-0 h-[34rem] w-[50rem] -translate-x-1/2 rounded-full bg-amber-200/20 blur-[100px]" />
        <div className="container-x relative py-20 text-center sm:py-28">
          <StatusBadge map={FESTIVAL_STATUS} value={festival.status} dot={festival.status === "ONGOING"} />
          <p className="mt-6 font-serif text-xl italic text-amber-200">{festival.edition}</p>
          <h1 className="mx-auto mt-2 max-w-4xl font-serif text-5xl font-bold leading-tight text-balance sm:text-7xl">{festival.name}</h1>
          {festival.theme && (
            <p className="mt-6 inline-flex items-center gap-3 font-serif text-2xl italic text-amber-300">
              <span className="h-px w-10 bg-amber-300/60" /> “{festival.theme}” <span className="h-px w-10 bg-amber-300/60" />
            </p>
          )}
          <p className="mx-auto mt-6 max-w-xl text-white/70">{festival.tagline}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-amber-100/80">
            <span className="flex items-center gap-2"><CalendarDays className="h-4 w-4" /> {formatDate(festival.startDate, { day: "numeric", month: "long" })} – {formatDate(festival.endDate)}</span>
            <span className="flex items-center gap-2"><Drama className="h-4 w-4" /> {festival.plays.length} oyun</span>
            <span className="flex items-center gap-2"><Users className="h-4 w-4" /> {groups.length} topluluk</span>
            <span className="flex items-center gap-2"><Ticket className="h-4 w-4" /> Tüm gösterimler ücretsiz</span>
          </div>
          {festival.status === "PLANNED" && <Countdown to={festival.startDate} className="mt-8 flex justify-center" label="Perde açılışına" />}
        </div>
      </section>

      {/* PROGRAM */}
      <section id="program" className="container-x scroll-mt-24 py-14">
        <div className="mb-8 text-center">
          <p className="eyebrow text-amber-400">Festival Programı</p>
          <h2 className="mt-2 font-serif text-4xl font-bold">Gün Gün Program</h2>
        </div>
        <div className="scrollbar-none -mx-4 mb-8 flex justify-start gap-2 overflow-x-auto px-4 sm:justify-center">
          {days.map((d) => {
            const date = new Date(`${d}T12:00:00+03:00`);
            const on = d === activeDay;
            return (
              <Link key={d} href={`/tiyatro?gun=${d}#program`} scroll={false} className={cn("flex w-20 shrink-0 flex-col items-center rounded-2xl py-3 ring-1 transition", on ? "bg-amber-400 text-curtain-950 ring-amber-300" : "bg-white/5 text-white/70 ring-white/10 hover:bg-white/10")}>
                <span className="text-[11px] font-bold uppercase tracking-wider">{formatWeekday(date).slice(0, 3)}</span>
                <span className="font-serif text-3xl font-bold leading-none">{date.toLocaleDateString("tr-TR", { day: "numeric", timeZone: "Europe/Istanbul" })}</span>
                <span className="text-[11px]">{date.toLocaleDateString("tr-TR", { month: "short", timeZone: "Europe/Istanbul" })}</span>
                {d === today && <span className="mt-1 h-1.5 w-1.5 rounded-full bg-current" />}
              </Link>
            );
          })}
        </div>
        <div className="mx-auto max-w-4xl space-y-4">
          {dayShows.length === 0 && dayWorkshops.length === 0 && <EmptyState dark title="Bu gün için program yok" />}
          {[...dayShows.map((s) => ({ kind: "show" as const, date: s.date, s })), ...dayWorkshops.map((w) => ({ kind: "ws" as const, date: w.date, w }))]
            .sort((a, b) => a.date.getTime() - b.date.getTime())
            .map((item) =>
              item.kind === "show" ? (
                <Link key={item.s.id} href={`/tiyatro/oyun/${item.s.play.slug}`} className="group flex flex-col gap-4 overflow-hidden rounded-3xl bg-gradient-to-r from-white/[0.07] to-white/[0.02] p-5 ring-1 ring-amber-200/10 transition hover:ring-amber-300/40 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-4 sm:w-28 sm:flex-col sm:items-start sm:gap-0">
                    <p className="font-serif text-4xl font-bold text-amber-300">{formatTime(item.s.date)}</p>
                    <p className="text-xs text-white/50">{item.s.play.durationMin ? `${item.s.play.durationMin} dk` : ""}</p>
                  </div>
                  <div className={cn("hidden h-24 w-20 shrink-0 items-center justify-center rounded-lg bg-gradient-to-b p-2 text-center font-serif text-xs font-bold leading-tight shadow-lg sm:flex", posterOf(item.s.play.id))}>{item.s.play.title}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap gap-2">
                      <Badge tone="amber">{item.s.play.genre}</Badge>
                      {item.s.play.ageLimit && <Badge tone="dark">{item.s.play.ageLimit}</Badge>}
                      {!item.s.play.inCompetition && <Badge tone="dark">Yarışma Dışı</Badge>}
                    </div>
                    <p className="mt-2 font-serif text-2xl font-bold group-hover:text-amber-200">{item.s.play.title}</p>
                    <p className="text-sm text-white/60">{item.s.play.group.name} · Yazan: {item.s.play.playwright} · Yöneten: {item.s.play.director}</p>
                  </div>
                  <div className="space-y-2 text-sm sm:text-right">
                    <p className="flex items-center gap-1.5 text-white/70 sm:justify-end"><MapPin className="h-4 w-4 text-amber-400" /> {item.s.venue?.name}</p>
                    <StatusBadge map={SHOW_STATUS} value={item.s.status} />
                  </div>
                </Link>
              ) : (
                <div key={item.w.id} className="flex flex-col gap-3 rounded-3xl border border-dashed border-amber-200/20 p-5 sm:flex-row sm:items-center">
                  <p className="font-serif text-3xl font-bold text-amber-200/80 sm:w-28">{formatTime(item.w.date)}</p>
                  <div className="flex-1">
                    <Badge tone="dark"><Sparkles className="h-3 w-3" /> Atölye / Söyleşi</Badge>
                    <p className="mt-2 font-serif text-xl font-semibold">{item.w.title}</p>
                    <p className="text-sm text-white/60">{item.w.instructor} · {item.w.location}</p>
                  </div>
                </div>
              ),
            )}
        </div>
      </section>

      {/* OYUNLAR */}
      <section className="border-y border-amber-200/10 bg-black/30 py-14">
        <div className="container-x">
          <div className="mb-8 text-center">
            <p className="eyebrow text-amber-400">Festival Seçkisi</p>
            <h2 className="mt-2 font-serif text-4xl font-bold">Oyunlar</h2>
          </div>
          <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
            {festival.plays.map((p) => (
              <Link key={p.id} href={`/tiyatro/oyun/${p.slug}`} className="group">
                <div className={cn("relative flex aspect-[3/4] flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-b p-5 shadow-2xl ring-1 ring-amber-200/20 transition duration-300 group-hover:-translate-y-1 group-hover:ring-amber-300/60", posterOf(p.id))}>
                  {p.posterUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.posterUrl} alt={p.title} className="absolute inset-0 h-full w-full object-cover" />
                  )}
                  <div className="relative text-[10px] font-bold uppercase tracking-[0.3em] text-amber-200/80">{p.group.name}</div>
                  <div className="relative">
                    <Drama className="mb-3 h-8 w-8 text-amber-300/60" />
                    <p className="font-serif text-2xl font-bold leading-tight">{p.title}</p>
                    <p className="mt-1 text-xs text-white/60">{p.playwright}</p>
                  </div>
                  <div className="relative flex items-center justify-between text-[11px] text-amber-100/70">
                    <span>{p.genre}</span>
                    {p.shows[0] && <span>{formatDate(p.shows[0].date, { day: "numeric", month: "short" })}</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* VİDEO & TOPLULUKLAR */}
      <section className="container-x grid gap-10 py-14 lg:grid-cols-[1.4fr_1fr]">
        {featured && (
          <div>
            <p className="eyebrow mb-2 text-amber-400">Sahneden</p>
            <h2 className="mb-5 font-serif text-3xl font-bold">{featured.title}</h2>
            <YouTubeEmbed url={featured.youtubeUrl} title={featured.title} />
          </div>
        )}
        <div>
          <p className="eyebrow mb-2 text-amber-400">Katılımcılar</p>
          <h2 className="mb-5 font-serif text-3xl font-bold">Topluluklar</h2>
          <div className="space-y-2">
            {groups.map((g) => (
              <Link key={g.id} href={`/tiyatro/topluluk/${g.slug}`} className="flex items-center gap-3 rounded-2xl bg-white/5 p-3 ring-1 ring-white/10 transition hover:bg-white/10">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-red-700 font-serif font-bold">{g.name[0]}</span>
                <span className="min-w-0 flex-1"><span className="block truncate font-semibold">{g.name}</span><span className="text-xs text-white/50">{g.district}{g.memberCount ? ` · ${g.memberCount} üye` : ""}</span></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ÖDÜLLER */}
      {(festival.awards.length > 0 || archive.some((a) => a.awards.length)) && (
        <section className="container-x pb-14">
          <div className="rounded-3xl bg-gradient-to-br from-amber-500/15 via-transparent to-red-900/30 p-8 ring-1 ring-amber-300/20">
            <h2 className="flex items-center gap-3 font-serif text-3xl font-bold"><Award className="h-8 w-8 text-amber-300" /> Ödüller</h2>
            {[{ f: festival, awards: festival.awards }, ...archive.map((a) => ({ f: a, awards: a.awards }))].filter((x) => x.awards.length).map(({ f, awards }) => (
              <div key={f.id} className="mt-6">
                <p className="mb-3 text-sm font-semibold text-amber-200/80">{f.edition} Festival ({new Date(f.startDate).getFullYear()}){f.theme ? ` — “${f.theme}”` : ""}</p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {awards.map((a) => (
                    <div key={a.id} className="rounded-2xl bg-black/30 p-4 ring-1 ring-amber-200/10">
                      <p className="text-xs font-bold uppercase tracking-wider text-amber-300">{a.category}</p>
                      <p className="mt-1 font-serif text-lg font-semibold">{a.winner}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* BAŞVURU */}
      <section className="container-x pb-16">
        <div className="bg-curtain flex flex-col items-center gap-4 rounded-3xl p-10 text-center ring-1 ring-amber-200/20">
          <Drama className="h-10 w-10 text-amber-300" />
          <h2 className="font-serif text-3xl font-bold">Topluluğunla sahneye çık</h2>
          <p className="max-w-lg text-white/70">{period ? `${period.title}: ${periodState(period) === "OPEN" ? "Başvurular açık!" : `${formatDate(period.startDate)} tarihinde açılıyor.`}` : "Bir sonraki festival için başvuru dönemi duyurulacak."}</p>
          <Link href={period ? `/basvuru/${period.slug}` : "/basvuru"} className="btn bg-amber-400 px-6 py-3 text-curtain-950 hover:bg-amber-300"><Clock className="h-4 w-4" /> Başvuru Şartları</Link>
        </div>
      </section>
    </div>
  );
}
