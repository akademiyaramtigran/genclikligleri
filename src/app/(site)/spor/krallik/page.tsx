"use client";

import { Crown } from "lucide-react";
import { SPORT_LIST, sportBySlug, genderBySlug } from "@/lib/constants";
import { getActiveLeagues } from "@/lib/data";
import { useData, useTitle } from "@/lib/hooks";
import { ErrorBox, PageLoader, Suspended, useParam } from "@/components/client";
import { cn } from "@/lib/utils";
import { PageHero, Avatar } from "@/components/ui";
import { FilterChips } from "@/components/FilterBar";
import { GenderSwitch, LeaderTable } from "@/components/sport";
import Link from "next/link";


import { useT } from "@/lib/i18n";
export default function KrallikPage() {
  return <Suspended><Inner /></Suspended>;
}

function Inner() {
  const t = useT();
  useTitle(t("Krallık Yarışı"));
  const sp = { brans: useParam("brans"), cinsiyet: useParam("cinsiyet") };
  const sport = sportBySlug(sp.brans ?? "futbol") ?? SPORT_LIST[0]!;
  const gender = genderBySlug(sp.cinsiyet);
  const { data: leagues, error } = useData(getActiveLeagues, []);
  if (error) return <ErrorBox message={error} />;
  if (!leagues) return <PageLoader />;
  const ls = leagues.filter((l) => l.sport === sport.key && l.gender === gender);
  const merge = (key: string) => ls.flatMap((l) => l.summary?.leaders?.[key] ?? []).sort((x, y) => y.total - x.total).slice(0, 15);
  const data = sport.events.filter((e) => e.leaderboard).map((b) => ({ b, rows: merge(b.key) }));
  const [main, ...rest] = data;
  const podium = main?.rows.slice(0, 3) ?? [];

  return (
    <>
      <PageHero eyebrow={t("Bireysel İstatistikler")} title={t("Krallık Yarışı")} description={t("Ligin en golcü, en skorer ve en üretken oyuncuları.")}>
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <GenderSwitch active={gender} hrefFor={(g) => `/spor/krallik?brans=${sport.slug}&cinsiyet=${g}`} />
        </div>
      </PageHero>
      <div className="container-x py-10">
        <div className="mb-8">
          <FilterChips name="brans" basePath="/spor/krallik" params={sp} value={sport.slug} allLabel={null} options={SPORT_LIST.map((s) => ({ value: s.slug, label: `${s.emoji} ${t(s.label ?? "")}` }))} />
        </div>

        {podium.length > 0 && (
          <div className="mb-10">
            <h2 className="mb-6 flex items-center gap-2 font-display text-2xl font-semibold uppercase tracking-wide"><Crown className="h-6 w-6 text-amber-500" /> {t(sport.scorerTitle)} {t("Kürsüsü")}</h2>
            <div className="grid items-end gap-4 sm:grid-cols-3">
              {[podium[1], podium[0], podium[2]].map((p, i) => {
                if (!p) return <div key={i} />;
                const rank = i === 1 ? 1 : i === 0 ? 2 : 3;
                return (
                  <Link key={p.playerId} href={`/spor/oyuncu?s=${p.slug}`} className={cn("group relative overflow-hidden rounded-3xl p-6 text-center text-white shadow-xl transition hover:-translate-y-1", rank === 1 ? "bg-gradient-to-b from-amber-400 to-amber-700 sm:pb-12" : rank === 2 ? "bg-gradient-to-b from-slate-400 to-slate-700" : "bg-gradient-to-b from-orange-600 to-orange-900", rank === 1 ? "order-first sm:order-none" : "")}>
                    <span className="absolute right-4 top-2 font-display text-6xl font-bold opacity-25">{rank}</span>
                    <Avatar name={p.name} src={p.photoUrl} size={rank === 1 ? 96 : 76} color={p.teamColor} className="mx-auto ring-4 ring-white/40" />
                    <p className="mt-4 font-display text-xl font-semibold uppercase">{p.name}</p>
                    <p className="text-sm opacity-80">{p.teamName}</p>
                    <p className="mt-3 font-display text-5xl font-bold">{p.total}</p>
                    <p className="text-xs uppercase tracking-widest opacity-75">{t(sport.scorerUnit)} · {p.perMatch}{t("/maç")}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {main && (
            <div className="card overflow-hidden lg:row-span-2">
              <h3 className="flex items-center gap-2 border-b border-basalt-100 px-4 py-3 font-semibold"><Crown className="h-4 w-4 text-amber-500" /> {main.b.leaderboard}</h3>
              <LeaderTable rows={main.rows} unit={t(sport.scorerUnit)} />
            </div>
          )}
          {rest.map(({ b, rows }) => (
            <div key={b.key} className="card overflow-hidden">
              <h3 className="border-b border-basalt-100 px-4 py-3 font-semibold">{b.leaderboard}</h3>
              <LeaderTable rows={rows.slice(0, 8)} unit={t(b.label ?? "")} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
