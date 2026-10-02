"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { getPlayers, teamMap } from "@/lib/data";
import { useData } from "@/lib/hooks";
import { RequireUnit } from "../../AdminContext";
import { ErrorBox, PageLoader, Suspended, useParam } from "@/components/client";
import { PLAYER_STATUS, sportDef } from "@/lib/constants";
import { age } from "@/lib/utils";
import { Avatar, StatusBadge } from "@/components/ui";
import { AdminHeader } from "@/components/admin/fields";
import { Pagination } from "@/components/FilterBar";

const PER = 40;

export default function PlayersAdmin() {
  return <RequireUnit unit="SPOR"><Suspended><Inner /></Suspended></RequireUnit>;
}

function Inner() {
  const q = useParam("q")?.trim();
  const page = Math.max(1, Number(useParam("sayfa")) || 1);
  const { data, error } = useData(async () => ({ players: await getPlayers(), teams: await teamMap() }), []);
  if (error) return <ErrorBox message={error} />;
  if (!data) return <PageLoader />;
  const needle = q?.toLocaleLowerCase("tr-TR");
  const all = data.players.map((p) => ({ ...p, team: p.teamId ? data.teams.get(p.teamId) : undefined }))
    .filter((p) => !needle || `${p.firstName} ${p.lastName} ${p.licenseNo ?? ""} ${p.team?.name ?? ""}`.toLocaleLowerCase("tr-TR").includes(needle))
    .sort((a, b) => a.lastName.localeCompare(b.lastName, "tr"));
  const total = all.length;
  const players = all.slice((page - 1) * PER, page * PER);
  return (
    <>
      <AdminHeader title="Oyuncular" description={`${total} oyuncu`} actions={<Link href="/yonetim/oyuncular/yeni" className="btn-primary">+ Yeni Oyuncu</Link>} />
      <form className="mb-6 flex max-w-md gap-2">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-basalt-400" /><input name="q" defaultValue={q} placeholder="Ad, takım veya lisans no" className="input pl-9" /></div>
        <button className="btn-outline">Ara</button>
      </form>
      <div className="card overflow-x-auto">
        <table className="table-base">
          <thead><tr><th>Oyuncu</th><th>Takım</th><th>Mevki</th><th>No</th><th>Yaş</th><th>Lisans</th><th>Durum</th></tr></thead>
          <tbody>
            {players.map((p) => (
              <tr key={p.id} className="hover:bg-basalt-50">
                <td><Link href={`/yonetim/oyuncular/duzenle?id=${p.id}`} className="flex items-center gap-2 font-semibold hover:text-dicle-700"><Avatar name={`${p.firstName} ${p.lastName}`} src={p.photoUrl} size={28} color={p.team?.primaryColor} /> {p.firstName} {p.lastName}</Link></td>
                <td className="text-basalt-600">{p.team ? `${sportDef(p.team.sport).emoji} ${p.team.name}` : "—"}</td>
                <td>{p.position ?? "—"}</td>
                <td className="tabular-nums">{p.jerseyNumber ?? "—"}</td>
                <td>{age(p.birthDate) ?? "—"}</td>
                <td className="font-mono text-xs">{p.licenseNo ?? "—"}</td>
                <td><StatusBadge map={PLAYER_STATUS} value={p.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} total={total} perPage={PER} basePath="/yonetim/oyuncular" params={{ q }} />
    </>
  );
}
