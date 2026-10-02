"use client";

import Link from "next/link";
import { ArrowRight, CalendarClock, FileCheck2, Search, Users } from "lucide-react";
import { getPeriods } from "@/lib/data";
import { useData, useTitle } from "@/lib/hooks";
import { ErrorBox, PageLoader, Suspended, useParam } from "@/components/client";
import { CATEGORIES, SPORTS, type SportKey } from "@/lib/constants";
import { periodState, daysLeft, PERIOD_STATE_LABEL, type PeriodState } from "@/lib/periods";
import { cn, formatDate } from "@/lib/utils";
import { Badge, EmptyState, PageHero } from "@/components/ui";
import { FilterChips } from "@/components/FilterBar";


import { useT } from "@/lib/i18n";
const CAT_STYLE: Record<string, { grad: string; tone: string; icon: string }> = {
  SPOR: { grad: "from-emerald-500 to-dicle-700", tone: "green", icon: "🏆" },
  MUZIK: { grad: "from-fuchsia-600 to-purple-900", tone: "fuchsia", icon: "🎤" },
  TIYATRO: { grad: "from-amber-600 to-curtain-900", tone: "amber", icon: "🎭" },
  YAZARLIK: { grad: "from-rose-500 to-zinc-950", tone: "rose", icon: "✒️" },
};

export default function ApplyIndex() {
  return <Suspended><Inner /></Suspended>;
}

function Inner() {
  const t = useT();
  useTitle(t("Başvurular"));
  const sp = { kategori: useParam("kategori") };
  const cat = sp.kategori?.toUpperCase();
  const { data, error } = useData(getPeriods, []);
  if (error) return <ErrorBox message={error} />;
  if (!data) return <PageLoader />;
  const periods = data.filter((p) => !cat || !(cat in CATEGORIES) || p.category === cat);
  const groups: Record<PeriodState, typeof periods> = { OPEN: [], UPCOMING: [], CLOSED: [] };
  for (const p of periods) groups[periodState(p)].push(p);
  groups.OPEN.sort((a, b) => a.endDate.getTime() - b.endDate.getTime());
  groups.UPCOMING.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

  return (
    <>
      <PageHero eyebrow={t("Katılım")} title={t("Başvuru Dönemleri")} description={t("Takımını kur, sahneye çık, perdeyi aç. Açık başvuruları, şartları ve istenen belgeleri buradan inceleyebilirsin.")}>
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {[
            [CalendarClock, "1. Dönemi seç", "Açık başvuru dönemini ve şartlarını incele."],
            [FileCheck2, "2. Formu doldur", "Kadronu ekle, istenen belgeleri yükle."],
            [Search, "3. Takip et", "Takip kodunla başvurunun durumunu sorgula."],
          ].map(([I, t, d]) => {
            const Icon = I as typeof Search;
            return (
              <div key={t as string} className="card-dark flex gap-3 p-4">
                <Icon className="h-6 w-6 shrink-0 text-dicle-300" />
                <div><p className="font-semibold">{t as string}</p><p className="text-sm text-white/60">{d as string}</p></div>
              </div>
            );
          })}
        </div>
        <Link href="/basvuru/takip" className="btn mt-6 bg-white text-basalt-900 hover:bg-dicle-300"><Search className="h-4 w-4" /> {t("Başvuru Takip")}</Link>
      </PageHero>

      <div className="container-x py-10">
        <div className="mb-8">
          <FilterChips name="kategori" basePath="/basvuru" params={{ kategori: sp.kategori }} value={sp.kategori} options={[{ value: "spor", label: "🏆 Spor" }, { value: "muzik", label: "🎤 Müzik" }, { value: "tiyatro", label: "🎭 Tiyatro" }]} />
        </div>
        {periods.length === 0 && <EmptyState title={t("Yayımlanmış başvuru dönemi yok")} />}
        {(["OPEN", "UPCOMING", "CLOSED"] as PeriodState[]).map((st) =>
          groups[st].length === 0 ? null : (
            <section key={st} className="mb-12">
              <h2 className="mb-4 flex items-center gap-3 font-display text-2xl font-semibold uppercase tracking-wide">
                {t(PERIOD_STATE_LABEL[st].label ?? "")}
                <Badge tone={PERIOD_STATE_LABEL[st].tone} dot={st === "OPEN"}>{groups[st].length}</Badge>
              </h2>
              <div className={cn("grid gap-5", st === "CLOSED" ? "md:grid-cols-2 lg:grid-cols-3" : "lg:grid-cols-2")}>
                {groups[st].map((p) => {
                  const style = CAT_STYLE[p.category]!;
                  const docs = p.requiredDocuments ?? [];
                  return (
                    <Link key={p.id} href={`/basvuru/detay?s=${p.slug}`} className={cn("card group flex overflow-hidden transition hover:-translate-y-0.5 hover:shadow-xl", st === "CLOSED" && "opacity-75")}>
                      <div className={cn("hidden w-28 shrink-0 flex-col items-center justify-center bg-gradient-to-b text-5xl sm:flex", style.grad)}>{style.icon}</div>
                      <div className="flex flex-1 flex-col p-5">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge tone={style.tone}>{CATEGORIES[p.category as keyof typeof CATEGORIES]?.label}</Badge>
                          {p.sport && <Badge>{SPORTS[p.sport as SportKey]?.emoji} {SPORTS[p.sport as SportKey]?.label}</Badge>}
                          {p.gender && <Badge tone={p.gender === "KADIN" ? "rose" : "blue"}>{p.gender === "KADIN" ? "Kadın" : "Erkek"}</Badge>}
                        </div>
                        <h3 className="mt-3 text-lg font-semibold leading-snug group-hover:text-dicle-700">{p.title}</h3>
                        <p className="mt-1 line-clamp-2 text-sm text-basalt-500">{p.summary}</p>
                        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-basalt-500">
                          <span className="flex items-center gap-1"><CalendarClock className="h-3.5 w-3.5" /> {formatDate(p.startDate, { day: "numeric", month: "short" })} – {formatDate(p.endDate, { day: "numeric", month: "short", year: "numeric" })}</span>
                          <span className="flex items-center gap-1"><FileCheck2 className="h-3.5 w-3.5" /> {docs.length} {t("belge")}</span>
                          {(p.minMembers || p.maxMembers) && <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {p.minMembers ?? 1}–{p.maxMembers ?? "∞"} {t("kişi")}</span>}
                        </div>
                        <div className="mt-4 flex items-center justify-between border-t border-basalt-100 pt-4">
                          <Badge tone={PERIOD_STATE_LABEL[st].tone} dot={st === "OPEN"}>
                            {st === "OPEN" ? `Son ${daysLeft(p.endDate)} gün` : st === "UPCOMING" ? `${formatDate(p.startDate, { day: "numeric", month: "long" })}'da açılıyor` : "Kapandı"}
                          </Badge>
                          <span className="flex items-center gap-1 text-sm font-semibold text-dicle-700">{st === "OPEN" ? "Başvur" : "Detaylar"} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          ),
        )}
      </div>
    </>
  );
}
