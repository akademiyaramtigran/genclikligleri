"use client";

import { getSeasonMatches } from "@/lib/data";
import { useData, useTitle } from "@/lib/hooks";
import { SPORT_LIST, SPORTS, type SportKey } from "@/lib/constants";
import { formatDate, dayKey } from "@/lib/utils";
import type { Match } from "@/lib/types";
import { EmptyState, PageHero } from "@/components/ui";
import { FilterChips } from "@/components/FilterBar";
import { MatchRow } from "@/components/sport";
import { ErrorBox, PageLoader, Suspended, useParam } from "@/components/client";

import { useT } from "@/lib/i18n";
export default function FixturePage() {
  return <Suspended><Inner /></Suspended>;
}

function Inner() {
  const t = useT();
  useTitle(t("Fikstür & Sonuçlar"));
  const sp = { brans: useParam("brans"), cinsiyet: useParam("cinsiyet"), durum: useParam("durum") };
  const { data, error } = useData(getSeasonMatches, []);
  const sport = SPORT_LIST.find((s) => s.slug === sp.brans)?.key;
  const gender = sp.cinsiyet === "kadin" ? "KADIN" : sp.cinsiyet === "erkek" ? "ERKEK" : undefined;
  const results = sp.durum === "sonuclar";
  const now = Date.now();
  let matches = (data ?? []).filter((m) => (!sport || m.sport === sport) && (!gender || m.gender === gender));
  matches = results
    ? matches.filter((m) => m.status === "FINISHED").sort((a, b) => b.date.getTime() - a.date.getTime())
    : matches.filter((m) => ["SCHEDULED", "LIVE", "POSTPONED"].includes(m.status) && m.date.getTime() >= now - 6 * 3_600_000);
  matches = matches.slice(0, 80);
  const days = new Map<string, Match[]>();
  for (const m of matches) days.set(dayKey(m.date), [...(days.get(dayKey(m.date)) ?? []), m]);

  return (
    <>
      <PageHero eyebrow={t("Maç Merkezi")} title={t("Fikstür & Sonuçlar")} description={t("Şehrin dört bir yanındaki sahalarda ve salonlarda oynanan tüm gençlik ligi maçları.")} />
      <div className="container-x py-10">
        <div className="mb-8 space-y-3">
          <FilterChips name="durum" basePath="/spor/fikstur" params={sp} value={sp.durum} allLabel={t("Gelecek Maçlar")} options={[{ value: "sonuclar", label: "Sonuçlar" }]} />
          <FilterChips name="brans" basePath="/spor/fikstur" params={sp} value={sp.brans} allLabel={t("Tüm Branşlar")} options={SPORT_LIST.map((s) => ({ value: s.slug, label: `${s.emoji} ${t(s.label)}` }))} />
          <FilterChips name="cinsiyet" basePath="/spor/fikstur" params={sp} value={sp.cinsiyet} allLabel={t("Erkek & Kadın")} options={[{ value: "erkek", label: "Erkekler" }, { value: "kadin", label: "Kadınlar" }]} />
        </div>
        {error ? <ErrorBox message={error} /> : !data ? <PageLoader className="min-h-[30vh]" /> : days.size === 0 ? <EmptyState title={t("Bu filtrelere uygun maç bulunamadı")} icon="📅" /> : (
          <div className="space-y-6">
            {[...days.entries()].map(([k, list]) => (
              <div key={k} className="card overflow-hidden">
                <div className="border-b border-basalt-100 bg-basalt-50 px-4 py-2.5">
                  <h2 className="font-semibold capitalize">{formatDate(list[0]!.date, { weekday: "long", day: "numeric", month: "long" })}</h2>
                </div>
                <div className="divide-y divide-basalt-100">
                  {list.map((m) => (
                    <div key={m.id}>
                      <p className="px-4 pt-2 text-[11px] font-semibold uppercase tracking-wider text-basalt-400">{SPORTS[m.sport as SportKey]?.emoji} {m.leagueName}{m.venueName ? ` · ${m.venueName}` : ""}</p>
                      <MatchRow m={m} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
