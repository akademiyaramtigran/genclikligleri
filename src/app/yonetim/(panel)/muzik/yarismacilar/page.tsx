"use client";

import Link from "next/link";
import { getAll, withVotes } from "@/lib/data";
import { useData } from "@/lib/hooks";
import type { MusicCompetition, MusicContestant } from "@/lib/types";
import { RequireUnit } from "../../../AdminContext";
import { ErrorBox, PageLoader } from "@/components/client";
import { CONTESTANT_STATUS } from "@/lib/constants";
import { StatusBadge } from "@/components/ui";
import { AdminHeader, Panel } from "@/components/admin/fields";
import { ContestantForm } from "./ContestantForm";


export default function ContestantsAdmin() {
  return <RequireUnit unit="MUZIK"><Inner /></RequireUnit>;
}

function Inner() {
  const { data, error } = useData(async () => {
    const [list, comps] = await Promise.all([getAll<MusicContestant>("musicContestants"), getAll<MusicCompetition>("musicCompetitions")]);
    const withV = await withVotes(list);
    return withV.map((c) => ({ ...c, competition: comps.find((x) => x.id === c.competitionId) })).sort((a, b) => a.name.localeCompare(b.name, "tr"));
  }, []);
  if (error) return <ErrorBox message={error} />;
  if (!data) return <PageLoader />;
  const list = data;
  return (
    <>
      <AdminHeader back={{ href: "/yonetim/muzik", label: "Müzik Yarışması" }} title="Yarışmacılar" description={`${list.length} yarışmacı`} />
      <div className="grid gap-6 xl:grid-cols-[1fr_28rem]">
        <div className="card overflow-x-auto">
          <table className="table-base">
            <thead><tr><th>Yarışmacı</th><th>Tür</th><th>İlçe</th><th>Yarışma</th><th className="text-center">Oy</th><th>Durum</th></tr></thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.id} className="hover:bg-basalt-50">
                  <td><Link href={`/yonetim/muzik/yarismacilar/duzenle?id=${c.id}`} className="font-semibold hover:text-dicle-700">{c.name}</Link><p className="text-xs text-basalt-500">{c.type === "GRUP" ? "Grup" : "Solo"}</p></td>
                  <td>{c.genre}</td><td>{c.district}</td><td className="text-xs">{c.competition?.name} {c.competition?.edition}</td>
                  <td className="text-center tabular-nums">{c.votes ?? 0}</td>
                  <td><StatusBadge map={CONTESTANT_STATUS} value={c.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Panel title="Yeni Yarışmacı"><ContestantForm /></Panel>
      </div>
    </>
  );
}
