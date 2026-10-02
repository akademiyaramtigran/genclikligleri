"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { getCurrentWritingContest, getPeriods, getWritingContests } from "@/lib/data";
import { useData, useTitle } from "@/lib/hooks";
import { ErrorBox, PageLoader, Suspended } from "@/components/client";
import { ENTRY_STATUS, WRITING_CATEGORIES, WRITING_CATEGORY_HINT, WRITING_LANGUAGES, WRITING_STATUS } from "@/lib/constants";
import { cn, formatDate, lines } from "@/lib/utils";
import { periodState } from "@/lib/periods";
import { Countdown } from "@/components/Countdown";
import { YouTubeEmbed } from "@/components/YouTubeEmbed";
import { PenMark } from "@/components/Logos";
import { useT } from "@/lib/i18n";
import type { WritingEntry } from "@/lib/types";

// Sonuç sırası: birinci → mansiyon → finalist → kısa liste
const ORDER = ["WINNER", "MENTION", "FINALIST", "SHORTLIST"];

export default function WritingPage() {
  return <Suspended><Inner /></Suspended>;
}

function Inner() {
  const t = useT();
  useTitle(t("Genç Kalemler — Oyun Yazarlığı Yarışması"));
  const { data, error } = useData(async () => {
    const [current, all, periods] = await Promise.all([getCurrentWritingContest(), getWritingContests(), getPeriods()]);
    const contest = current ?? all[0] ?? null;
    const period = periods.filter((p) => p.category === "YAZARLIK" && p.endDate >= new Date()).sort((x, y) => x.startDate.getTime() - y.startDate.getTime())[0] ?? null;
    return { contest, archive: all.filter((c) => c.id !== contest?.id), period };
  }, []);
  if (error) return <ErrorBox message={error} />;
  if (!data) return <PageLoader className="bg-stage-950" />;
  const { contest, archive, period } = data;
  const open = period && periodState(period) === "OPEN";
  const applyHref = period ? `/basvuru/detay?s=${period.slug}` : "/basvuru?kategori=yazarlik";
  const deadline = period?.endDate ?? contest?.deadline;
  const status = contest ? WRITING_STATUS[contest.status] : null;
  const published = (contest?.entries ?? []).filter((e) => ENTRY_STATUS[e.status]?.public).sort((a, b) => ORDER.indexOf(a.status) - ORDER.indexOf(b.status));
  const ageText = contest?.minAge || contest?.maxAge ? t("{a}-{b} yaş arası gençler", { a: contest?.minAge ?? 15, b: contest?.maxAge ?? 26 }) : t("Gençler");

  return (
    <div className="bg-stage-950 font-grotesk text-stone-100">
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-stage-line">
        <div className="pointer-events-none absolute -left-32 top-20 h-96 w-96 rounded-full bg-rose-600/15 blur-[120px]" />
        <div className="container-x relative py-10 sm:py-14">
          <Link href="/tiyatro" className="inline-flex items-center gap-1 text-sm text-stone-400 hover:text-white"><ArrowLeft className="h-4 w-4" /> {t("Tiyatro Festivali")}</Link>
          <div className="mt-8 grid gap-10 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-8">
              <p className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.25em] text-rose-500">
                <PenMark size={28} /> {contest ? `${contest.edition} ${t("Dönem")}` : t("Yeni")} · {status ? t(status.label) : t("Yakında")}
              </p>
              <h1 className="mt-5 font-stage text-6xl uppercase leading-[0.9] sm:text-8xl lg:text-[7.5rem]">
                {contest?.name ?? t("Genç Kalemler")}
                <span className="block text-rose-500">{t("Oyun yazarlığı yarışması")}</span>
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-stone-300">
                {contest?.tagline ?? t("{age}; Türkçe, Kurmancî veya Zazakî yazdıkları özgün tiyatro metinleriyle katılabilir. Kazanan metin bir sonraki festivalde sahnelenir.", { age: ageText })}
              </p>
            </div>
            <div className="border border-stage-line bg-stage-900 p-6 lg:col-span-4">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-rose-500">{open ? t("Son başvuru") : period ? t("Başvurular açılıyor") : t("Başvuru dönemi")}</p>
              {open && deadline && <Countdown to={deadline} className="mt-4" />}
              {!open && period && <Countdown to={period.startDate} className="mt-4" />}
              {deadline && <p className="mt-4 text-sm text-stone-400">{formatDate(open || !period ? deadline : period.startDate, { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>}
              {!period && <p className="mt-3 text-sm text-stone-400">{t("Başvuru dönemi yakında duyurulacak.")}</p>}
              <Link href={applyHref} className={cn("mt-5 flex h-12 items-center justify-center gap-2 font-bold uppercase tracking-wider transition", open ? "bg-rose-500 text-stage-950 hover:bg-rose-400" : "border border-stone-200/70 hover:bg-white hover:text-stage-950")}>
                {open ? t("Metnini Gönder") : t("Şartları İncele")} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* KATEGORİ · DİL · ÖDÜL */}
      <section className="container-x"><div className="grid gap-px bg-stage-line py-px md:grid-cols-3">
        <div className="bg-stage-950 p-7">
          <h2 className="font-stage text-3xl uppercase">{t("Kategoriler")}</h2>
          <ul className="mt-4 space-y-3">
            {Object.entries(WRITING_CATEGORIES).map(([k, v]) => (
              <li key={k}><p className="font-bold">{t(v)}</p><p className="text-sm text-stone-400">{t(WRITING_CATEGORY_HINT[k])}</p></li>
            ))}
          </ul>
        </div>
        <div className="bg-stage-950 p-7">
          <h2 className="font-stage text-3xl uppercase">{t("Diller")}</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {Object.values(WRITING_LANGUAGES).map((l) => <span key={l} className="border border-rose-500 px-4 py-2 text-sm font-semibold text-rose-200">{l}</span>)}
          </div>
          <p className="mt-4 text-sm text-stone-400">{t("Her dil kendi jürisiyle ayrı değerlendirilir. Her dilde ayrı birincilik verilir.")}</p>
        </div>
        <div className="bg-stage-950 p-7">
          <h2 className="font-stage text-3xl uppercase">{t("Ödüller")}</h2>
          <ul className="mt-4 space-y-2">
            {(contest?.prizes.length ? contest.prizes : [t("Festivalde sahnelenme"), t("Basılı kitapta yayın")]).map((p, i) => (
              <li key={i} className="flex gap-2 text-stone-200"><Check className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" /> {p}</li>
            ))}
          </ul>
        </div>
      </div></section>

      {/* TAKVİM */}
      {contest && contest.timeline.length > 0 && (
        <section className="container-x py-12">
          <h2 className="mb-6 font-stage text-5xl uppercase">{t("Yarışma takvimi")}</h2>
          <ol className={cn("grid border-t-2 border-rose-500", contest.timeline.length >= 4 ? "md:grid-cols-4" : "md:grid-cols-3")}>
            {contest.timeline.map((s, i) => (
              <li key={i} className="relative border-b border-stage-line py-5 pr-6 md:border-b-0">
                <span className="absolute -top-[7px] left-0 h-3 w-3 rounded-full bg-rose-500" />
                <p className="font-stage text-sm uppercase tracking-[0.2em] text-stone-500">{String(i + 1).padStart(2, "0")}</p>
                <p className="mt-1 text-lg font-bold text-rose-300">{s.title}</p>
                {s.date && <p className="text-sm font-semibold">{formatDate(s.date, { day: "numeric", month: "long" })}</p>}
                {s.text && <p className="mt-1 text-sm text-stone-400">{s.text}</p>}
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* SONUÇLAR */}
      {published.length > 0 && contest && (
        <section className="container-x pb-12">
          <h2 className="mb-6 font-stage text-5xl uppercase">{contest.status === "COMPLETED" ? t("Sonuçlar") : t("Finalistler")}</h2>
          <div className="space-y-8">
            {Object.entries(WRITING_LANGUAGES).map(([k, lang]) => {
              const list = published.filter((e) => e.language === k);
              if (!list.length) return null;
              return (
                <div key={k}>
                  <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-rose-500">{lang}</p>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{list.map((e) => <EntryCard key={e.id} e={e} />)}</div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ŞARTNAME & JÜRİ */}
      {contest && (lines(contest.rules).length > 0 || contest.jury.length > 0 || contest.description) && (
        <section className="container-x grid gap-10 pb-12 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <h2 className="mb-5 font-stage text-4xl uppercase">{t("Şartname")}</h2>
            {contest.description && <p className="mb-5 whitespace-pre-line leading-relaxed text-stone-300">{contest.description}</p>}
            <ol className="space-y-3">
              {lines(contest.rules).map((r, i) => (
                <li key={i} className="flex gap-4 border-b border-stage-line pb-3 text-stone-200"><span className="font-stage text-xl text-rose-500">{String(i + 1).padStart(2, "0")}</span><span>{r}</span></li>
              ))}
            </ol>
          </div>
          {contest.jury.length > 0 && (
            <div>
              <h2 className="mb-5 font-stage text-4xl uppercase">{t("Jüri")}</h2>
              <div className="space-y-6">
                {Object.entries(WRITING_LANGUAGES).map(([k, lang]) => {
                  const list = contest.jury.filter((j) => j.language === k);
                  if (!list.length) return null;
                  return (
                    <div key={k}>
                      <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-rose-500">{lang}</p>
                      <ul className="divide-y divide-stage-line border-y border-stage-line">
                        {list.map((j, i) => <li key={i} className="py-2.5"><p className="font-bold">{j.name}</p>{j.title && <p className="text-sm text-stone-400">{j.title}</p>}</li>)}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      )}

      {contest?.youtubeUrl && (
        <section className="container-x pb-12">
          <h2 className="mb-5 font-stage text-4xl uppercase">{t("Sahneden")}</h2>
          <YouTubeEmbed url={contest.youtubeUrl} title={contest.name} />
        </section>
      )}

      {/* NASIL KATILIRIM */}
      <section className="container-x pb-16">
        <div className="border border-rose-500 p-8">
          <h2 className="font-stage text-4xl uppercase">{t("Nasıl katılırım?")}</h2>
          <ol className="mt-6 grid gap-6 md:grid-cols-3">
            {[
              [t("Metnini hazırla"), t("Metnin üzerinde adın olmasın; yalnızca eser adı ve rumuz yaz. PDF veya Word olarak kaydet.")],
              [t("Formu doldur"), t("Başvuru formunda dilini ve kategorini seç, metnini ve belgelerini yükle.")],
              [t("Takip et"), t("Takip kodunla başvurunun durumunu sorgula. Kısa liste ve finalistler bu sayfada açıklanır.")],
            ].map(([h, d], i) => (
              <li key={i}>
                <p className="font-stage text-5xl text-rose-500">{i + 1}</p>
                <p className="mt-1 text-lg font-bold">{h}</p>
                <p className="text-sm text-stone-400">{d}</p>
              </li>
            ))}
          </ol>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={applyHref} className="inline-flex h-12 items-center gap-2 bg-rose-500 px-6 font-bold uppercase tracking-wider text-stage-950 hover:bg-rose-400">{open ? t("Metnini Gönder") : t("Şartları İncele")} <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/basvuru/takip" className="inline-flex h-12 items-center gap-2 border border-stone-200/70 px-6 font-bold uppercase tracking-wider hover:bg-white hover:text-stage-950">{t("Başvuru Takip")}</Link>
          </div>
        </div>
      </section>

      {/* ARŞİV */}
      {archive.some((a) => a.entries.some((e) => e.status === "WINNER" || e.status === "MENTION")) && (
        <section className="container-x pb-16">
          <h2 className="mb-6 font-stage text-4xl uppercase">{t("Önceki dönemler")}</h2>
          {archive.map((a) => {
            const winners = a.entries.filter((e) => e.status === "WINNER" || e.status === "MENTION");
            if (!winners.length) return null;
            return (
              <div key={a.id} className="mb-6">
                <p className="mb-3 text-sm font-semibold uppercase tracking-[0.15em] text-stone-400">{a.name} {a.edition} ({a.deadline.getFullYear()})</p>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{winners.map((e) => <EntryCard key={e.id} e={e} />)}</div>
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}

function EntryCard({ e }: { e: WritingEntry }) {
  const t = useT();
  const win = e.status === "WINNER";
  return (
    <div className={cn("flex flex-col gap-2 p-5", win ? "bg-rose-500 text-stage-950" : "border border-stage-line bg-stage-900")}>
      <p className={cn("text-xs font-bold uppercase tracking-[0.2em]", win ? "" : "text-rose-400")}>{t(ENTRY_STATUS[e.status]?.label ?? e.status)}</p>
      <p className="font-stage text-2xl uppercase leading-tight">{e.title}</p>
      <p className={cn("text-sm", win ? "text-stage-900" : "text-stone-400")}>{e.author} · {WRITING_LANGUAGES[e.language] ?? e.language} · {t(WRITING_CATEGORIES[e.category] ?? e.category)}</p>
      {e.synopsis && <p className={cn("text-sm leading-relaxed", win ? "text-stage-950/80" : "text-stone-300")}>{e.synopsis}</p>}
    </div>
  );
}
