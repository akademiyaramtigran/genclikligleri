import Link from "next/link";
import type { Metadata } from "next";
import { Award, CalendarDays, Gavel, MapPin, Mic2, Music2, Radio, Sparkles, Trophy, Users } from "lucide-react";
import { db } from "@/lib/db";
import { CONTESTANT_STATUS, ROUND_STATUS } from "@/lib/constants";
import { cn, formatDate, initials, lines, pct } from "@/lib/utils";
import { periodState } from "@/lib/periods";
import { Badge, EmptyState, StatusBadge } from "@/components/ui";
import { Countdown } from "@/components/Countdown";
import { YouTubeEmbed } from "@/components/YouTubeEmbed";
import { VoteButton } from "./VoteButton";

export const metadata: Metadata = { title: "Genç Sesler Müzik Yarışması", description: "Diyarbakır'ın genç seslerinin yarıştığı müzik yarışması: yarışmacılar, turlar, jüri puanları ve halk oylaması." };

const GRADS = ["from-fuchsia-600 to-purple-900", "from-cyan-500 to-blue-900", "from-pink-500 to-rose-900", "from-violet-500 to-indigo-900", "from-amber-500 to-orange-900", "from-emerald-500 to-teal-900"];

export default async function MusicPage({ searchParams }: { searchParams: Promise<{ tur?: string }> }) {
  const { tur } = await searchParams;
  const comp = await db.musicCompetition.findFirst({
    where: { isCurrent: true },
    include: {
      contestants: { include: { _count: { select: { votes: { where: { NOT: { dayKey: { endsWith: "#ip" } } } } } } } },
      rounds: { orderBy: { order: "asc" }, include: { venue: true, performances: { include: { contestant: true }, orderBy: [{ rank: "asc" }, { order: "asc" }] } } },
      jury: { orderBy: { order: "asc" } },
    },
  });
  const period = await db.applicationPeriod.findFirst({ where: { category: "MUZIK", isPublished: true, endDate: { gte: new Date() } }, orderBy: { startDate: "asc" } });

  if (!comp) {
    return (
      <div className="min-h-[60vh] bg-[#0b0614] py-20 text-white">
        <div className="container-x"><EmptyState dark title="Yeni yarışma sezonu yakında" description="Başvuru dönemi açıldığında duyuracağız." icon="🎤" /></div>
      </div>
    );
  }

  const ORDER: Record<string, number> = { WINNER: 0, FINALIST: 1, ACTIVE: 2, ELIMINATED: 3 };
  comp.contestants.sort((a, b) => (ORDER[a.status] ?? 9) - (ORDER[b.status] ?? 9) || a.name.localeCompare(b.name, "tr"));
  const nextRound = comp.rounds.find((r) => r.status !== "COMPLETED");
  const completed = comp.rounds.filter((r) => r.status === "COMPLETED");
  const selected = comp.rounds.find((r) => r.id === tur) ?? completed[completed.length - 1] ?? comp.rounds[0];
  const active = comp.contestants.filter((c) => c.status !== "ELIMINATED");
  const totalVotes = active.reduce((s, c) => s + c._count.votes, 0);
  const voteBoard = [...active].sort((a, b) => b._count.votes - a._count.votes);
  const colorOf = (id: string) => GRADS[comp.contestants.findIndex((c) => c.id === id) % GRADS.length];

  return (
    <div className="bg-[#0b0614] text-white">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -left-10 -top-20 h-[42rem] w-56 origin-top animate-spot bg-gradient-to-b from-fuchsia-500/50 via-fuchsia-500/10 to-transparent blur-2xl" />
        <div className="pointer-events-none absolute -top-20 left-1/2 h-[42rem] w-56 origin-top animate-spot bg-gradient-to-b from-cyan-400/40 via-cyan-400/5 to-transparent blur-2xl [animation-delay:-3s]" />
        <div className="pointer-events-none absolute -right-10 -top-20 h-[42rem] w-56 origin-top animate-spot bg-gradient-to-b from-pink-500/40 via-pink-500/5 to-transparent blur-2xl [animation-delay:-6s]" />
        <div className="bg-noise pointer-events-none absolute inset-0 opacity-40" />
        {/* Ekolayzır */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-32 items-end justify-center gap-1 opacity-30">
          {Array.from({ length: 64 }).map((_, i) => (
            <span key={i} className="w-2 rounded-t bg-gradient-to-t from-fuchsia-600 to-cyan-300" style={{ height: `${20 + Math.abs(Math.sin(i * 1.7) * 80)}%` }} />
          ))}
        </div>

        <div className="container-x relative py-16 text-center sm:py-24">
          <Badge tone="dark" dot className="mb-6">{comp.status === "ONGOING" ? "Yarışma Sürüyor" : comp.status === "COMPLETED" ? "Yarışma Tamamlandı" : "Yakında"}</Badge>
          <h1 className="font-music text-6xl font-black uppercase leading-none tracking-tight sm:text-8xl">
            {comp.name}
            <span className="mt-2 block bg-gradient-to-r from-fuchsia-400 via-pink-300 to-cyan-300 bg-clip-text text-transparent">{comp.edition}</span>
          </h1>
          {comp.tagline && <p className="mx-auto mt-6 max-w-xl text-lg text-white/70">{comp.tagline}</p>}

          <div className="mx-auto mt-10 grid max-w-3xl grid-cols-3 gap-3">
            {[[comp.contestants.length, "Yarışmacı", Users], [active.length, "Sahnede Kalan", Mic2], [comp.rounds.length, "Tur", Radio]].map(([v, l, I]) => {
              const Icon = I as typeof Users;
              return (
                <div key={l as string} className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10 backdrop-blur">
                  <Icon className="mx-auto h-5 w-5 text-fuchsia-300" />
                  <p className="mt-2 font-music text-3xl font-black">{v as number}</p>
                  <p className="text-xs uppercase tracking-wider text-white/50">{l as string}</p>
                </div>
              );
            })}
          </div>

          {nextRound && (
            <div className="mx-auto mt-10 inline-flex flex-col items-center gap-4 rounded-3xl bg-gradient-to-r from-fuchsia-600/20 to-cyan-500/20 px-8 py-6 ring-1 ring-white/15">
              <p className="flex items-center gap-2 text-sm font-semibold"><Sparkles className="h-4 w-4 text-amber-300" /> Sıradaki: {nextRound.name}</p>
              <Countdown to={nextRound.date} />
              <p className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-white/60">
                <span className="flex items-center gap-1"><CalendarDays className="h-4 w-4" /> {formatDate(nextRound.date, { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}</span>
                {nextRound.venue && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {nextRound.venue.name}</span>}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* TUR ZAMAN ÇİZELGESİ */}
      <section className="container-x py-12">
        <h2 className="mb-6 font-music text-2xl font-bold uppercase">Yarışma Yolu</h2>
        <div className="relative grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="absolute left-0 right-0 top-6 hidden h-0.5 bg-gradient-to-r from-fuchsia-500 via-pink-400 to-cyan-400 opacity-40 lg:block" />
          {comp.rounds.map((r) => {
            const on = selected?.id === r.id;
            return (
              <Link key={r.id} href={`/muzik?tur=${r.id}#sonuclar`} scroll={false} className={cn("relative rounded-2xl p-5 ring-1 transition", on ? "bg-white/10 ring-fuchsia-400/60 shadow-glow" : "bg-white/[0.03] ring-white/10 hover:bg-white/[0.07]")}>
                <span className={cn("relative z-10 flex h-12 w-12 items-center justify-center rounded-full font-music text-lg font-black", r.status === "COMPLETED" ? "bg-fuchsia-600" : r.status === "LIVE" ? "bg-red-600" : "bg-white/10 ring-1 ring-white/20")}>{r.order}</span>
                <p className="mt-4 font-music text-lg font-bold">{r.name}</p>
                <p className="text-sm text-white/60">{formatDate(r.date, { day: "numeric", month: "long" })}</p>
                <div className="mt-3 flex items-center gap-2">
                  <StatusBadge map={ROUND_STATUS} value={r.status} dot={r.status === "LIVE"} />
                  <span className="text-xs text-white/50">{r.performances.length} performans</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* SEÇİLİ TUR SONUÇLARI */}
      {selected && (
        <section id="sonuclar" className="container-x scroll-mt-24 pb-12">
          <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
            <div className="overflow-hidden rounded-3xl bg-white/[0.03] ring-1 ring-white/10">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-6 py-4">
                <h2 className="font-music text-xl font-bold uppercase">{selected.name} {selected.status === "COMPLETED" ? "Sonuçları" : "Sahne Sırası"}</h2>
                {selected.status === "COMPLETED" && <span className="text-xs text-white/50">Jüri %70 · Halk %30</span>}
              </div>
              {selected.performances.length === 0 ? <p className="p-8 text-center text-white/50">Bu turun yarışmacıları henüz belirlenmedi.</p> : (
                <ol className="divide-y divide-white/5">
                  {selected.performances.map((p, i) => (
                    <li key={p.id}>
                      <Link href={`/muzik/yarismaci/${p.contestant.slug}`} className="flex items-center gap-4 px-6 py-4 transition hover:bg-white/5">
                        <span className={cn("w-8 text-center font-music text-xl font-black", selected.status === "COMPLETED" ? (i === 0 ? "text-amber-300" : i < 3 ? "text-fuchsia-300" : "text-white/30") : "text-white/40")}>{selected.status === "COMPLETED" ? p.rank ?? i + 1 : p.order}</span>
                        <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br font-music text-sm font-black", colorOf(p.contestantId))}>{initials(p.contestant.name)}</span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold">{p.contestant.name}</p>
                          <p className="truncate text-xs text-white/50">♪ {p.songTitle}{p.songArtist ? ` — ${p.songArtist}` : ""}</p>
                          {p.totalScore != null && (
                            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10">
                              <div className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-400" style={{ width: `${p.totalScore}%` }} />
                            </div>
                          )}
                        </div>
                        {p.totalScore != null ? (
                          <div className="text-right">
                            <p className="font-music text-2xl font-black tabular-nums">{p.totalScore.toFixed(1)}</p>
                            <p className="text-[10px] text-white/40">J {p.juryScore} · H {p.publicScore}</p>
                          </div>
                        ) : <Badge tone="dark">{p.contestant.genre}</Badge>}
                        {selected.status === "COMPLETED" && (p.advanced ? <Badge tone="green">Tur atladı</Badge> : <Badge tone="dark">Elendi</Badge>)}
                      </Link>
                    </li>
                  ))}
                </ol>
              )}
            </div>
            <div className="space-y-4">
              <h3 className="font-music text-lg font-bold uppercase">Tur Kaydı</h3>
              <YouTubeEmbed url={selected.youtubeUrl} title={`${comp.name} ${comp.edition} — ${selected.name}`} />
              {selected.description && <p className="text-sm text-white/60">{selected.description}</p>}
              {selected.venue && <p className="flex items-center gap-2 text-sm text-white/60"><MapPin className="h-4 w-4 text-fuchsia-300" /> {selected.venue.name}</p>}
            </div>
          </div>
        </section>
      )}

      {/* HALK OYLAMASI */}
      {comp.votingOpen && active.length > 0 && (
        <section id="oylama" className="scroll-mt-24 border-y border-white/10 bg-gradient-to-b from-fuchsia-950/40 to-transparent py-14">
          <div className="container-x">
            <div className="mb-8 text-center">
              <p className="eyebrow text-pink-300">Halk Oylaması Açık</p>
              <h2 className="mt-2 font-music text-3xl font-black uppercase sm:text-4xl">Favorini Seç</h2>
              <p className="mx-auto mt-2 max-w-lg text-sm text-white/60">Her gün bir oy kullanabilirsin. Halk oyları sonuçların %30&apos;unu belirler. Toplam {totalVotes.toLocaleString("tr-TR")} oy kullanıldı.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {voteBoard.map((c, i) => (
                <div key={c.id} className="group relative overflow-hidden rounded-3xl bg-white/5 p-5 ring-1 ring-white/10 transition hover:ring-fuchsia-400/50">
                  {i === 0 && c._count.votes > 0 && <Badge tone="yellow" className="absolute right-4 top-4">Lider</Badge>}
                  <Link href={`/muzik/yarismaci/${c.slug}`}>
                    <div className={cn("flex aspect-square items-center justify-center rounded-2xl bg-gradient-to-br font-music text-5xl font-black transition group-hover:scale-[1.02]", colorOf(c.id))}>
                      {c.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.photoUrl} alt={c.name} className="h-full w-full rounded-2xl object-cover" />
                      ) : initials(c.name)}
                    </div>
                    <p className="mt-4 font-music text-lg font-bold">{c.name}</p>
                    <p className="text-sm text-white/50">{c.genre} · {c.type === "GRUP" ? "Grup" : "Solo"} · {c.district}</p>
                  </Link>
                  <div className="mt-4">
                    <div className="mb-1 flex justify-between text-xs text-white/60"><span>{c._count.votes} oy</span><span>%{pct(c._count.votes, totalVotes)}</span></div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-pink-400" style={{ width: `${pct(c._count.votes, totalVotes)}%` }} /></div>
                  </div>
                  <VoteButton contestantId={c.id} name={c.name} className="mt-4" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* TÜM YARIŞMACILAR */}
      <section className="container-x py-14">
        <h2 className="mb-6 font-music text-2xl font-bold uppercase">Yarışmacılar</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {comp.contestants.map((c) => (
            <Link key={c.id} href={`/muzik/yarismaci/${c.slug}`} className={cn("group rounded-2xl bg-white/[0.03] p-3 ring-1 ring-white/10 transition hover:bg-white/[0.08]", c.status === "ELIMINATED" && "opacity-50 hover:opacity-100")}>
              <div className={cn("flex aspect-square items-center justify-center rounded-xl bg-gradient-to-br font-music text-3xl font-black", colorOf(c.id), c.status === "ELIMINATED" && "grayscale")}>{initials(c.name)}</div>
              <p className="mt-3 truncate text-sm font-bold">{c.name}</p>
              <p className="truncate text-xs text-white/50">{c.genre}</p>
              <div className="mt-2"><StatusBadge map={CONTESTANT_STATUS} value={c.status} /></div>
            </Link>
          ))}
        </div>
      </section>

      {/* JÜRİ & ÖDÜLLER */}
      <section className="container-x grid gap-8 pb-16 lg:grid-cols-2">
        <div className="rounded-3xl bg-white/[0.03] p-6 ring-1 ring-white/10">
          <h2 className="mb-5 flex items-center gap-2 font-music text-xl font-bold uppercase"><Gavel className="h-5 w-5 text-fuchsia-300" /> Jüri</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {comp.jury.map((j) => (
              <div key={j.id} className="flex items-center gap-3">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 to-cyan-500 font-bold">{initials(j.name)}</span>
                <div><p className="font-semibold">{j.name}</p><p className="text-xs text-white/50">{j.title}</p></div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-3xl bg-gradient-to-br from-amber-500/15 to-fuchsia-600/10 p-6 ring-1 ring-amber-300/20">
          <h2 className="mb-5 flex items-center gap-2 font-music text-xl font-bold uppercase"><Trophy className="h-5 w-5 text-amber-300" /> Ödüller</h2>
          <ul className="space-y-3">
            {lines(comp.prizes).map((p, i) => (
              <li key={i} className="flex gap-3 text-sm"><Award className={cn("h-5 w-5 shrink-0", i === 0 ? "text-amber-300" : i === 1 ? "text-slate-300" : i === 2 ? "text-orange-400" : "text-fuchsia-300")} /> {p}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-3xl bg-white/[0.03] p-6 ring-1 ring-white/10 lg:col-span-2">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="flex items-center gap-2 font-music text-xl font-bold uppercase"><Music2 className="h-5 w-5 text-cyan-300" /> Sahne Senin Olsun</h2>
              <p className="mt-1 text-sm text-white/60">{comp.description}</p>
              {period && <p className="mt-2 text-sm text-pink-200">{period.title} — {periodState(period) === "OPEN" ? "başvurular açık!" : `${formatDate(period.startDate)} tarihinde açılıyor.`}</p>}
            </div>
            <Link href={period ? `/basvuru/${period.slug}` : "/basvuru"} className="btn shrink-0 bg-white px-6 py-3 text-[#0b0614] hover:bg-fuchsia-100">Başvuru Bilgileri</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
