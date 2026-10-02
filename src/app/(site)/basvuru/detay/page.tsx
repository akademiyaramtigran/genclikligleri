"use client";

import Link from "next/link";
import { CalendarClock, CheckCircle2, FileText, Info, Mail, Target, Wallet, Clock } from "lucide-react";
import { getPeriod } from "@/lib/data";
import { useData, useTitle } from "@/lib/hooks";
import { ErrorBox, NotFoundBox, PageLoader, Suspended, useParam } from "@/components/client";
import { CATEGORIES, SPORTS, type SportKey } from "@/lib/constants";
import { periodState, daysLeft, PERIOD_STATE_LABEL } from "@/lib/periods";
import { cn, formatDate, formatDateTime, lines } from "@/lib/utils";
import { Badge, KeyValue } from "@/components/ui";
import { Countdown } from "@/components/Countdown";
import { ApplicationForm } from "../ApplicationForm";

import { useT } from "@/lib/i18n";
const HERO: Record<string, string> = {
  SPOR: "bg-basalt-wall",
  MUZIK: "bg-[#0b0614]",
  TIYATRO: "bg-curtain",
  YAZARLIK: "bg-[#0c0c0e]",
};

export default function PeriodPage() {
  return <Suspended><Inner /></Suspended>;
}

function Inner() {
  const t = useT();
  const slug = useParam("s") ?? "";
  const { data: period, error } = useData(() => getPeriod(slug), [slug]);
  useTitle(period?.title);
  if (error) return <ErrorBox message={error} />;
  if (period === undefined) return <PageLoader />;
  if (!period || !period.isPublished) return <NotFoundBox title={t("Başvuru dönemi bulunamadı")} />;
  const st = periodState(period);
  const docs = period.requiredDocuments ?? [];
  const reqs = lines(period.requirements);
  const sport = period.sport ? SPORTS[period.sport as SportKey] : null;

  return (
    <>
      <section className={cn("relative overflow-hidden text-white", HERO[period.category])}>
        {period.category === "SPOR" && <div className="pointer-events-none absolute -right-20 -top-20 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl" />}
        {period.category === "YAZARLIK" && <div className="pointer-events-none absolute -right-24 top-0 h-80 w-80 rounded-full bg-rose-500/20 blur-3xl" />}
        {period.category === "MUZIK" && <div className="pointer-events-none absolute -top-20 left-1/3 h-[30rem] w-48 origin-top animate-spot bg-gradient-to-b from-fuchsia-500/40 to-transparent blur-2xl" />}
        <div className="container-x relative py-12 sm:py-16">
          <Link href="/basvuru" className="text-sm text-white/60 hover:text-white">{t("← Tüm başvurular")}</Link>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge tone={PERIOD_STATE_LABEL[st].tone} dot={st === "OPEN"}>{t(PERIOD_STATE_LABEL[st].label ?? "")}</Badge>
            <Badge tone="dark">{CATEGORIES[period.category as keyof typeof CATEGORIES]?.label}</Badge>
            {sport && <Badge tone="dark">{sport.emoji} {t(sport.label)}</Badge>}
            {period.gender && <Badge tone="dark">{period.gender === "KADIN" ? "Kadınlar" : "Erkekler"}</Badge>}
          </div>
          <h1 className={cn("mt-4 max-w-3xl text-4xl font-bold leading-tight sm:text-5xl", period.category === "YAZARLIK" ? "font-stage uppercase tracking-normal" : period.category === "TIYATRO" ? "font-serif" : period.category === "MUZIK" ? "font-music uppercase" : "font-display font-semibold uppercase tracking-wide")}>{period.title}</h1>
          <p className="mt-4 max-w-2xl text-lg text-white/75">{period.summary}</p>
          <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-end">
            {st === "OPEN" && <Countdown to={period.endDate} label={t("Başvuruların kapanmasına")} />}
            {st === "UPCOMING" && <Countdown to={period.startDate} label={t("Başvuruların açılmasına")} />}
            <div className="text-sm text-white/70">
              <p className="flex items-center gap-2"><CalendarClock className="h-4 w-4" /> {formatDateTime(period.startDate)} – {formatDateTime(period.endDate)}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="container-x grid gap-8 py-10 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-8">
          {period.description && (
            <div className="card p-6">
              <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold"><Info className="h-5 w-5 text-dicle-600" /> {t("Bilgilendirme")}</h2>
              <p className="whitespace-pre-line leading-relaxed text-basalt-600">{period.description}</p>
            </div>
          )}

          <div className="card p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><Target className="h-5 w-5 text-dicle-600" /> {t("Başvuru Şartları")}</h2>
            <ul className="space-y-3">
              {reqs.map((r, i) => (
                <li key={i} className="flex gap-3 text-sm text-basalt-700"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" /> {r}</li>
              ))}
            </ul>
          </div>

          <div className="card p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><FileText className="h-5 w-5 text-dicle-600" /> {t("İstenen Belgeler")}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {docs.map((d) => (
                <div key={d.key} className="flex gap-3 rounded-xl border border-basalt-200 p-3">
                  <FileText className={cn("h-5 w-5 shrink-0", d.required ? "text-red-500" : "text-basalt-400")} />
                  <div>
                    <p className="text-sm font-medium">{t(d.label)}</p>
                    <p className="text-xs text-basalt-500">{d.required ? "Zorunlu" : "İsteğe bağlı"}{d.hint ? ` · ${d.hint}` : ""}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div id="form" className="scroll-mt-32">
            {st === "OPEN" ? (
              <>
                <h2 className="mb-4 font-display text-2xl font-semibold uppercase tracking-wide">{t("Başvuru Formu")}</h2>
                <ApplicationForm
                  period={{ id: period.id, title: period.title, category: period.category as "SPOR", sport: period.sport, gender: period.gender, minMembers: period.minMembers, maxMembers: period.maxMembers, minAge: period.minAge, maxAge: period.maxAge }}
                  docs={docs}
                />
              </>
            ) : (
              <div className="card flex flex-col items-center p-10 text-center">
                <Clock className="h-12 w-12 text-basalt-300" />
                <h2 className="mt-4 text-xl font-semibold">{st === "UPCOMING" ? "Başvurular henüz açılmadı" : "Başvuru dönemi sona erdi"}</h2>
                <p className="mt-2 max-w-md text-sm text-basalt-500">
                  {st === "UPCOMING" ? `Başvuru formu ${formatDate(period.startDate, { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })} tarihinde burada aktif olacak. Belgelerinizi şimdiden hazırlayabilirsiniz.` : "Yeni dönemler için duyuruları takip edin."}
                </p>
                <Link href="/duyurular" className="btn-outline mt-5">{t("Duyurular")}</Link>
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:h-fit">
          <div className="card p-5">
            <h3 className="mb-2 font-semibold">{t("Özet")}</h3>
            <KeyValue items={[
              ["Durum", <Badge key="s" tone={PERIOD_STATE_LABEL[st].tone}>{t(PERIOD_STATE_LABEL[st].label ?? "")}</Badge>],
              ["Başlangıç", formatDate(period.startDate)],
              ["Bitiş", formatDate(period.endDate)],
              ...(st === "OPEN" ? [["Kalan Süre", `${daysLeft(period.endDate)} gün`] as [string, string]] : []),
              ["Kişi Sayısı", period.minMembers || period.maxMembers ? `${period.minMembers ?? 1} – ${period.maxMembers ?? "∞"}` : "—"],
              ["Yaş Aralığı", period.minAge || period.maxAge ? `${period.minAge ?? "—"} – ${period.maxAge ?? "—"}` : "—"],
              ["Kontenjan", period.quota ? `${period.quota}` : "Sınırsız"],
              ["Katılım Ücreti", period.fee ?? "—"],
              ["Lig", period.leagueId ? <Link key="l" href={`/spor/lig?s=${period.leagueId}`} className="link">{period.leagueName ?? "Lig"}</Link> : "—"],
            ]} />
            {st === "OPEN" && <a href="#form" className="btn-accent mt-4 w-full">{t("Başvuru Formuna Git")}</a>}
          </div>
          <div className="card space-y-3 p-5 text-sm text-basalt-600">
                        {period.fee && <p className="flex items-center gap-2"><Wallet className="h-4 w-4" /> {period.fee}</p>}
            {period.contactInfo && <p className="flex items-start gap-2"><Mail className="mt-0.5 h-4 w-4 shrink-0" /> {period.contactInfo}</p>}
            <Link href="/basvuru/takip" className="link block">{t("Başvurumu sorgula →")}</Link>
          </div>
        </aside>
      </div>
    </>
  );
}
