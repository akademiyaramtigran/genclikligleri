import Link from "next/link";
import type { Metadata } from "next";
import { Search } from "lucide-react";
import { db } from "@/lib/db";
import { SPORT_LIST, sportBySlug, sportDef } from "@/lib/constants";
import { age } from "@/lib/utils";
import { Avatar, EmptyState, PageHero, Badge } from "@/components/ui";
import { FilterChips, Pagination } from "@/components/FilterBar";

export const metadata: Metadata = { title: "Oyuncular", description: "Gençlik liglerindeki lisanslı sporcuların profilleri." };
const PER = 36;

export default async function PlayersPage({ searchParams }: { searchParams: Promise<{ q?: string; brans?: string; cinsiyet?: string; sayfa?: string }> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.sayfa) || 1);
  const sport = sportBySlug(sp.brans ?? "")?.key;
  const gender = sp.cinsiyet === "kadin" ? "KADIN" : sp.cinsiyet === "erkek" ? "ERKEK" : undefined;
  const q = sp.q?.trim();
  const where = {
    status: { not: "PASSIVE" },
    ...(gender ? { gender } : {}),
    ...(sport ? { team: { sport } } : {}),
    ...(q ? { OR: [{ firstName: { contains: q } }, { lastName: { contains: q } }, { team: { name: { contains: q } } }] } : {}),
  };
  const [total, players] = await Promise.all([
    db.player.count({ where }),
    db.player.findMany({ where, include: { team: true }, orderBy: [{ lastName: "asc" }, { firstName: "asc" }], skip: (page - 1) * PER, take: PER }),
  ]);
  const params = { q: sp.q, brans: sp.brans, cinsiyet: sp.cinsiyet };

  return (
    <>
      <PageHero eyebrow="Sporcular" title="Oyuncu Profilleri" description={`${total.toLocaleString("tr-TR")} lisanslı sporcu`}>
        <form className="mt-6 flex max-w-lg gap-2" action="/spor/oyuncular">
          {sp.brans && <input type="hidden" name="brans" value={sp.brans} />}
          {sp.cinsiyet && <input type="hidden" name="cinsiyet" value={sp.cinsiyet} />}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-basalt-400" />
            <input name="q" defaultValue={sp.q} placeholder="Oyuncu veya takım ara…" className="input pl-9" />
          </div>
          <button className="btn bg-white text-basalt-900">Ara</button>
        </form>
      </PageHero>
      <div className="container-x py-10">
        <div className="mb-8 space-y-3">
          <FilterChips name="brans" basePath="/spor/oyuncular" params={params} value={sp.brans} allLabel="Tüm Branşlar" options={SPORT_LIST.map((s) => ({ value: s.slug, label: `${s.emoji} ${s.label}` }))} />
          <FilterChips name="cinsiyet" basePath="/spor/oyuncular" params={params} value={sp.cinsiyet} allLabel="Erkek & Kadın" options={[{ value: "erkek", label: "Erkekler" }, { value: "kadin", label: "Kadınlar" }]} />
        </div>
        {players.length === 0 && <EmptyState title="Oyuncu bulunamadı" description="Farklı bir arama deneyin." />}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {players.map((p) => (
            <Link key={p.id} href={`/spor/oyuncu/${p.slug}`} className="card group flex items-center gap-3 p-3 transition hover:shadow-lg">
              <Avatar name={`${p.firstName} ${p.lastName}`} src={p.photoUrl} size={52} color={p.team?.primaryColor} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold group-hover:text-dicle-700">{p.firstName} {p.lastName}</p>
                <p className="truncate text-xs text-basalt-500">{p.team?.name ?? "Takımsız"}</p>
                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-basalt-500">
                  {p.team && <span>{sportDef(p.team.sport).emoji}</span>}
                  <span>{p.position}</span>
                  {age(p.birthDate) && <span>· {age(p.birthDate)} yaş</span>}
                </div>
              </div>
              {p.jerseyNumber != null && <Badge>#{p.jerseyNumber}</Badge>}
            </Link>
          ))}
        </div>
        <Pagination page={page} total={total} perPage={PER} basePath="/spor/oyuncular" params={params} />
      </div>
    </>
  );
}
