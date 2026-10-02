"use client";

import Link from "next/link";
import { Crown, Medal, Trophy } from "lucide-react";
import { getLeagues } from "@/lib/data";
import { useData, useTitle } from "@/lib/hooks";
import { ErrorBox, PageLoader } from "@/components/client";
import { SPORT_LIST, sportDef } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Avatar, EmptyState, PageHero, TeamCrest } from "@/components/ui";
import { useT } from "@/lib/i18n";

/** Sezon arşivi: geçmiş sezonların şampiyonları, kürsüleri ve krallık liderleri */
export default function ArchivePage() {
  const t = useT();
  useTitle(t("Sezon Arşivi"));
  const { data, error } = useData(async () => (await getLeagues()).filter((l) => !l.seasonActive && l.summary?.standings?.length), []);
  if (error) return <ErrorBox message={error} />;
  if (!data) return <PageLoader />;
  const seasons = [...new Set(data.map((l) => l.seasonName ?? "—"))].sort().reverse();

  return (
    <>
      <PageHero eyebrow={t("Onur Listesi")} title={t("Sezon Arşivi")} description={t("Geçmiş sezonların şampiyonları, kürsüleri ve krallık yarışını kazananlar.")} />
      <div className="container-x space-y-14 py-10">
        {seasons.length === 0 && <EmptyState title="Henüz tamamlanmış sezon yok" description="Sezon kapandığında şampiyonlar burada listelenir." />}
        {seasons.map((season) => {
          const leagues = data.filter((l) => (l.seasonName ?? "—") === season)
            .sort((a, b) => SPORT_LIST.findIndex((s) => s.key === a.sport) - SPORT_LIST.findIndex((s) => s.key === b.sport) || a.gender.localeCompare(b.gender));
          return (
            <section key={season}>
              <div className="mb-6 flex items-end gap-4">
                <h2 className="font-display text-4xl font-semibold uppercase tracking-wide">{season} {t("Sezonu")}</h2>
                <span className="mb-1.5 text-sm text-basalt-500">{leagues.length} {t("lig")}</span>
              </div>
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                {leagues.map((l) => {
                  const def = sportDef(l.sport);
                  const [champ, second, third] = l.summary!.standings;
                  const king = l.summary!.leaders?.[def.scoringEvents[0]!]?.[0];
                  return (
                    <article key={l.id} className="overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-basalt-200/70">
                      <div className={cn("relative bg-gradient-to-br p-5 text-white", def.gradient)}>
                        <p className="text-xs font-bold uppercase tracking-wider text-white/80">{def.emoji} {t(def.label)} · {l.gender === "KADIN" ? t("Kadınlar") : t("Erkekler")}</p>
                        {champ && (
                          <Link href={`/spor/takim?s=${champ.slug}`} className="mt-4 flex items-center gap-3">
                            <TeamCrest team={champ} size={56} />
                            <span className="min-w-0">
                              <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-yellow-200"><Crown className="h-3.5 w-3.5" /> {t("Şampiyon")}</span>
                              <span className="block truncate font-display text-xl font-semibold uppercase">{champ.name}</span>
                              <span className="text-xs text-white/75">{champ.points} {t("puan")} · {champ.won}G {champ.drawn}B {champ.lost}M</span>
                            </span>
                          </Link>
                        )}
                        <Trophy className="absolute -right-3 -top-3 h-24 w-24 text-white/10" />
                      </div>
                      <div className="space-y-2 p-4 text-sm">
                        {[second, third].filter(Boolean).map((r, i) => (
                          <Link key={r!.teamId} href={`/spor/takim?s=${r!.slug}`} className="flex items-center gap-2 rounded-lg p-1 hover:bg-basalt-50">
                            <Medal className={cn("h-4 w-4", i === 0 ? "text-slate-400" : "text-amber-700")} />
                            <TeamCrest team={r!} size={22} />
                            <span className="flex-1 truncate">{r!.name}</span>
                            <span className="font-display font-bold">{r!.points}</span>
                          </Link>
                        ))}
                        {king && (
                          <div className="mt-2 flex items-center gap-2 border-t border-basalt-100 pt-3">
                            <Avatar name={king.name} size={32} color={king.teamColor} />
                            <span className="min-w-0 flex-1"><span className="block text-[11px] font-bold uppercase tracking-wider text-basalt-400">{t(def.scorerTitle)}</span><span className="block truncate font-semibold">{king.name}</span></span>
                            <span className="font-display text-xl font-bold">{king.total}</span>
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
