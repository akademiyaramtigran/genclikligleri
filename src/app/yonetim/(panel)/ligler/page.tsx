"use client";

import Link from "next/link";
import { getLeagues, getSeasons } from "@/lib/data";
import { getAllMatches } from "@/lib/admin-data";
import { useData } from "@/lib/hooks";
import { RequireUnit } from "../../AdminContext";
import { ErrorBox, PageLoader } from "@/components/client";
import { LEAGUE_STATUS, sportDef } from "@/lib/constants";
import { formatDate, toDateInput } from "@/lib/utils";
import { Badge, StatusBadge } from "@/components/ui";
import { AdminHeader, CheckField, FormGrid, Panel, TextField } from "@/components/admin/fields";
import { AdminForm } from "@/components/admin/AdminForm";
import { saveLeague, saveSeason } from "@/actions/spor";
import { LeagueFields } from "./LeagueFields";


export default function LeaguesAdmin() {
  return <RequireUnit unit="SPOR"><Inner /></RequireUnit>;
}

function Inner() {
  const { data, error } = useData(async () => {
    const [seasons, leagues, matches] = await Promise.all([getSeasons(), getLeagues(), getAllMatches()]);
    return {
      seasons: [...seasons].sort((a, b) => b.startDate.getTime() - a.startDate.getTime()),
      leagues: [...leagues].sort((a, b) => Number(b.seasonActive) - Number(a.seasonActive) || a.sport.localeCompare(b.sport) || a.gender.localeCompare(b.gender))
        .map((l) => ({ ...l, played: matches.filter((m) => m.leagueId === l.id && m.status === "FINISHED").length, total: matches.filter((m) => m.leagueId === l.id).length })),
    };
  }, []);
  if (error) return <ErrorBox message={error} />;
  if (!data) return <PageLoader />;
  const { seasons, leagues } = data;
  return (
    <>
      <AdminHeader title="Sezonlar & Ligler" description="Branş ve kategori bazında ligleri oluşturun, takımları ekleyin ve fikstür üretin." />
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <div className="card overflow-x-auto">
            <table className="table-base">
              <thead><tr><th>Lig</th><th>Sezon</th><th className="text-center">Takım</th><th className="text-center">Maç</th><th>Durum</th></tr></thead>
              <tbody>
                {leagues.map((l) => (
                  <tr key={l.id} className="hover:bg-basalt-50">
                    <td><Link href={`/yonetim/ligler/duzenle?id=${l.id}`} className="font-semibold hover:text-dicle-700">{sportDef(l.sport).emoji} {l.name}</Link> <Badge tone={l.gender === "KADIN" ? "rose" : "blue"}>{l.gender === "KADIN" ? "K" : "E"}</Badge></td>
                    <td className="text-basalt-600">{l.seasonName}</td>
                    <td className="text-center tabular-nums">{l.entries.length}</td>
                    <td className="text-center tabular-nums">{l.played}/{l.total}</td>
                    <td><StatusBadge map={LEAGUE_STATUS} value={l.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Panel title="Yeni Lig Oluştur">
            <AdminForm action={saveLeague} submitLabel="Ligi Oluştur"><LeagueFields seasons={seasons} /></AdminForm>
          </Panel>
        </div>
        <aside className="space-y-6">
          <Panel title="Sezonlar">
            <ul className="mb-4 space-y-3">
              {seasons.map((s) => (
                <li key={s.id} className="rounded-xl border border-basalt-200 p-3">
                  <details>
                    <summary className="flex cursor-pointer items-center justify-between text-sm font-semibold">{s.name} {s.isActive && <Badge tone="green">Aktif</Badge>}</summary>
                    <AdminForm action={saveSeason} compact className="mt-3">
                      <input type="hidden" name="id" value={s.id} />
                      <div className="space-y-3">
                        <TextField label="Ad" name="name" defaultValue={s.name} required />
                        <FormGrid><TextField label="Başlangıç" name="startDate" type="date" defaultValue={toDateInput(s.startDate)} required /><TextField label="Bitiş" name="endDate" type="date" defaultValue={toDateInput(s.endDate)} required /></FormGrid>
                        <CheckField label="Aktif sezon" name="isActive" defaultChecked={s.isActive} />
                      </div>
                    </AdminForm>
                  </details>
                  <p className="mt-1 text-xs text-basalt-500">{formatDate(s.startDate)} – {formatDate(s.endDate)}</p>
                </li>
              ))}
            </ul>
            <p className="mb-2 text-sm font-semibold">Yeni Sezon</p>
            <AdminForm action={saveSeason} compact resetOnSuccess submitLabel="Ekle">
              <div className="space-y-3">
                <TextField label="Ad" name="name" placeholder="2027-2028" required />
                <FormGrid><TextField label="Başlangıç" name="startDate" type="date" required /><TextField label="Bitiş" name="endDate" type="date" required /></FormGrid>
                <CheckField label="Aktif sezon yap" name="isActive" />
              </div>
            </AdminForm>
          </Panel>
        </aside>
      </div>
    </>
  );
}
