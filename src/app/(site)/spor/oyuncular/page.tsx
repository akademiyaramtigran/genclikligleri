"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { getPlayers, teamMap } from "@/lib/data";
import { useData, useTitle } from "@/lib/hooks";
import { ErrorBox, PageLoader, Suspended, useParam, withBase } from "@/components/client";
import { SPORT_LIST, sportBySlug, sportDef } from "@/lib/constants";
import { age } from "@/lib/utils";
import { Avatar, EmptyState, PageHero, Badge } from "@/components/ui";
import { FilterChips, Pagination } from "@/components/FilterBar";

import { useT } from "@/lib/i18n";
const PER = 36;

export default function PlayersPage() {
  return <Suspended><Inner /></Suspended>;
}

function Inner() {
  const t = useT();
  useTitle(t("Oyuncular"));
  const sp = { q: useParam("q"), brans: useParam("brans"), cinsiyet: useParam("cinsiyet"), sayfa: useParam("sayfa") };
  const page = Math.max(1, Number(sp.sayfa) || 1);
  const sport = sportBySlug(sp.brans ?? "")?.key;
  const gender = sp.cinsiyet === "kadin" ? "KADIN" : sp.cinsiyet === "erkek" ? "ERKEK" : undefined;
  const q = sp.q?.trim().toLocaleLowerCase("tr-TR");
  const { data, error } = useData(async () => ({ players: await getPlayers(), teams: await teamMap() }), []);
  if (error) return <ErrorBox message={error} />;
  if (!data) return <PageLoader />;
  const all = data.players
    .map((p) => ({ ...p, team: p.teamId ? data.teams.get(p.teamId) : undefined }))
    .filter((p) => p.status !== "PASSIVE" && (!gender || p.gender === gender) && (!sport || p.team?.sport === sport)
      && (!q || `${p.firstName} ${p.lastName} ${p.team?.name ?? ""}`.toLocaleLowerCase("tr-TR").includes(q)))
    .sort((a, b) => a.lastName.localeCompare(b.lastName, "tr") || a.firstName.localeCompare(b.firstName, "tr"));
  const total = all.length;
  const players = all.slice((page - 1) * PER, page * PER);
  const params = { q: sp.q, brans: sp.brans, cinsiyet: sp.cinsiyet };

  return (
    <>
      <PageHero eyebrow={t("Sporcular")} title={t("Oyuncu Profilleri")} description={`${total.toLocaleString("tr-TR")} lisanslı sporcu`}>
        <form className="mt-6 flex max-w-lg gap-2" action={withBase("/spor/oyuncular/")}>
          {sp.brans && <input type="hidden" name="brans" value={sp.brans} />}
          {sp.cinsiyet && <input type="hidden" name="cinsiyet" value={sp.cinsiyet} />}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-basalt-400" />
            <input name="q" defaultValue={sp.q} placeholder={t("Oyuncu veya takım ara…")} className="input pl-9" />
          </div>
          <button className="btn bg-white text-basalt-900">{t("Ara")}</button>
        </form>
      </PageHero>
      <div className="container-x py-10">
        <div className="mb-8 space-y-3">
          <FilterChips name="brans" basePath="/spor/oyuncular" params={params} value={sp.brans} allLabel={t("Tüm Branşlar")} options={SPORT_LIST.map((s) => ({ value: s.slug, label: `${s.emoji} ${t(s.label ?? "")}` }))} />
          <FilterChips name="cinsiyet" basePath="/spor/oyuncular" params={params} value={sp.cinsiyet} allLabel={t("Erkek & Kadın")} options={[{ value: "erkek", label: "Erkekler" }, { value: "kadin", label: "Kadınlar" }]} />
        </div>
        {players.length === 0 && <EmptyState title={t("Oyuncu bulunamadı")} description={t("Farklı bir arama deneyin.")} />}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {players.map((p) => (
            <Link key={p.id} href={`/spor/oyuncu?s=${p.slug}`} className="card group flex items-center gap-3 p-3 transition hover:shadow-lg">
              <Avatar name={`${p.firstName} ${p.lastName}`} src={p.photoUrl} size={52} color={p.team?.primaryColor} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold group-hover:text-dicle-700">{p.firstName} {p.lastName}</p>
                <p className="truncate text-xs text-basalt-500">{p.team?.name ?? "Takımsız"}</p>
                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-basalt-500">
                  {p.team && <span>{sportDef(p.team.sport).emoji}</span>}
                  <span>{p.position}</span>
                  {age(p.birthDate) && <span>· {age(p.birthDate)} {t("yaş")}</span>}
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
