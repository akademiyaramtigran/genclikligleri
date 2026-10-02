"use client";

import Link from "next/link";
import { Drama, Heart, Music2, Scale, Trophy, Users } from "lucide-react";
import { countOf } from "@/lib/data";
import { useData, useTitle } from "@/lib/hooks";
import { PageHero, StatTile } from "@/components/ui";


export default function AboutPage() {
  useTitle("Hakkımızda");
  const { data } = useData(() => Promise.all([countOf("teams"), countOf("players"), countOf("musicContestants"), countOf("theatreGroups")]).catch(() => [0, 0, 0, 0]), []);
  const [teams, players, contestants, groups] = data ?? ["…", "…", "…", "…"];
  const values = [
    [Users, "Kapsayıcılık", "17 ilçenin tamamından, her gençliğe eşit fırsat. Kadın ligleri erkek ligleriyle aynı imkânlara sahiptir."],
    [Scale, "Şeffaflık", "Tüm sonuçlar, puanlar ve istatistikler anlık olarak herkese açık yayımlanır; maçlar kayıt altına alınır."],
    [Heart, "Fair-Play", "Rekabet kadar dostluk, saygı ve centilmenlik de ödüllendirilir."],
  ] as const;
  return (
    <>
      <PageHero eyebrow="Organizasyon" title="Hakkımızda" description="Diyarbakır Gençlik Organizasyonu; şehrin gençlerini spor, müzik ve tiyatro etrafında bir araya getiren, tek merkezden yönetilen şehir çapında bir gençlik platformudur." />
      <div className="container-x space-y-12 py-12">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatTile label="Takım" value={teams} /><StatTile label="Sporcu" value={players} /><StatTile label="Müzisyen / Grup" value={contestants} /><StatTile label="Tiyatro Topluluğu" value={groups} />
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[[Trophy, "Spor Ligleri", "Futbol, basketbol, voleybol ve hentbolda erkek ve kadın gençlik ligleri.", "/spor", "from-emerald-500 to-teal-800"], [Music2, "Genç Sesler", "Tüm türlere açık, jüri ve halk oylamalı müzik yarışması.", "/muzik", "from-fuchsia-600 to-purple-900"], [Drama, "Tiyatro Festivali", "Gençlik topluluklarının sahne aldığı bir haftalık festival.", "/tiyatro", "from-amber-600 to-curtain-900"]].map(([I, t, d, h, g]) => {
            const Icon = I as typeof Trophy;
            return (
              <Link key={t as string} href={h as string} className={`rounded-3xl bg-gradient-to-br ${g} p-6 text-white transition hover:-translate-y-1`}>
                <Icon className="h-8 w-8" /><h2 className="mt-4 text-xl font-bold">{t as string}</h2><p className="mt-2 text-sm text-white/80">{d as string}</p>
              </Link>
            );
          })}
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {values.map(([I, t, d]) => (
            <div key={t} className="card p-6"><I className="h-6 w-6 text-dicle-600" /><h3 className="mt-3 font-semibold">{t}</h3><p className="mt-1 text-sm text-basalt-600">{d}</p></div>
          ))}
        </div>
      </div>
    </>
  );
}
