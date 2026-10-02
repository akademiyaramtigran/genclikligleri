import Link from "next/link";
import type { Metadata } from "next";
import { Users } from "lucide-react";
import { db } from "@/lib/db";
import { SPORT_LIST, sportBySlug, sportDef, DISTRICTS } from "@/lib/constants";
import { EmptyState, PageHero, TeamCrest, Badge } from "@/components/ui";
import { FilterChips } from "@/components/FilterBar";

export const metadata: Metadata = { title: "Takımlar", description: "Diyarbakır gençlik liglerindeki tüm takımlar." };

export default async function TeamsPage({ searchParams }: { searchParams: Promise<{ brans?: string; cinsiyet?: string; ilce?: string }> }) {
  const sp = await searchParams;
  const sport = sportBySlug(sp.brans ?? "")?.key;
  const gender = sp.cinsiyet === "kadin" ? "KADIN" : sp.cinsiyet === "erkek" ? "ERKEK" : undefined;
  const teams = await db.team.findMany({
    where: { status: "ACTIVE", ...(sport ? { sport } : {}), ...(gender ? { gender } : {}), ...(sp.ilce ? { district: sp.ilce } : {}) },
    include: { _count: { select: { players: true } } },
    orderBy: [{ sport: "asc" }, { name: "asc" }],
  });
  const params = { brans: sp.brans, cinsiyet: sp.cinsiyet, ilce: sp.ilce };
  const districts = DISTRICTS.map((d) => ({ value: d, label: d }));

  return (
    <>
      <PageHero eyebrow="Kulüpler" title="Takımlar" description={`${teams.length} takım listeleniyor.`} />
      <div className="container-x py-10">
        <div className="mb-8 space-y-3">
          <FilterChips name="brans" basePath="/spor/takimlar" params={params} value={sp.brans} allLabel="Tüm Branşlar" options={SPORT_LIST.map((s) => ({ value: s.slug, label: `${s.emoji} ${s.label}` }))} />
          <FilterChips name="cinsiyet" basePath="/spor/takimlar" params={params} value={sp.cinsiyet} allLabel="Erkek & Kadın" options={[{ value: "erkek", label: "Erkekler" }, { value: "kadin", label: "Kadınlar" }]} />
          <FilterChips name="ilce" basePath="/spor/takimlar" params={params} value={sp.ilce} allLabel="Tüm İlçeler" options={districts} />
        </div>
        {teams.length === 0 && <EmptyState title="Takım bulunamadı" />}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {teams.map((t) => (
            <Link key={t.id} href={`/spor/takim/${t.slug}`} className="card group relative overflow-hidden p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
              <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: `linear-gradient(90deg, ${t.primaryColor}, ${t.secondaryColor})` }} />
              <div className="flex items-center gap-3">
                <TeamCrest team={t} size={52} />
                <div className="min-w-0">
                  <p className="truncate font-semibold group-hover:text-dicle-700">{t.name}</p>
                  <p className="text-xs text-basalt-500">{t.district}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <Badge>{sportDef(t.sport).emoji} {sportDef(t.sport).label}</Badge>
                <Badge tone={t.gender === "KADIN" ? "rose" : "blue"}>{t.gender === "KADIN" ? "Kadın" : "Erkek"}</Badge>
                <span className="ml-auto flex items-center gap-1 text-xs text-basalt-500"><Users className="h-3.5 w-3.5" /> {t._count.players}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
