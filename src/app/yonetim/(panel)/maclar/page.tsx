"use client";

import Link from "next/link";
import { PlayCircle } from "lucide-react";
import { getActiveLeagues } from "@/lib/data";
import { getAllMatches } from "@/lib/admin-data";
import { useData } from "@/lib/hooks";
import { RequireUnit } from "../../AdminContext";
import { ErrorBox, PageLoader, Suspended, useParam } from "@/components/client";
import { MATCH_STATUS, sportDef } from "@/lib/constants";
import { formatShortDate, formatTime } from "@/lib/utils";
import { StatusBadge, TeamCrest } from "@/components/ui";
import { AdminHeader } from "@/components/admin/fields";
import { FilterChips, Pagination } from "@/components/FilterBar";

const PER = 40;

export default function MatchesAdmin() {
  return <RequireUnit unit="SPOR"><Suspended><Inner /></Suspended></RequireUnit>;
}

function Inner() {
  const sp = { lig: useParam("lig"), durum: useParam("durum"), sayfa: useParam("sayfa") };
  const page = Math.max(1, Number(sp.sayfa) || 1);
  const { data, error } = useData(async () => ({ leagues: await getActiveLeagues(), matches: await getAllMatches() }), []);
  if (error) return <ErrorBox message={error} />;
  if (!data) return <PageLoader />;
  const leagues = [...data.leagues].sort((a, b) => a.sport.localeCompare(b.sport) || a.gender.localeCompare(b.gender));
  const now = new Date();
  let list = data.matches.filter((m) => (!sp.lig || m.leagueId === sp.lig) && (sp.durum === "bekleyen" ? m.status === "SCHEDULED" && m.date < now : !sp.durum || m.status === sp.durum));
  if (sp.durum === "FINISHED") list = [...list].reverse();
  const total = list.length;
  const matches = list.slice((page - 1) * PER, page * PER);
  const params = { lig: sp.lig, durum: sp.durum };
  return (
    <>
      <AdminHeader title="Maçlar & Sonuçlar" description={`${total} maç`} actions={<Link href={`/yonetim/maclar/yeni${sp.lig ? `?lig=${sp.lig}` : ""}`} className="btn-primary">+ Yeni Maç</Link>} />
      <div className="mb-6 space-y-3">
        <FilterChips name="durum" basePath="/yonetim/maclar" params={params} value={sp.durum} options={[{ value: "bekleyen", label: "⚠ Sonuç Bekleyen" }, ...Object.entries(MATCH_STATUS).map(([k, v]) => ({ value: k, label: v.label }))]} />
        <FilterChips name="lig" basePath="/yonetim/maclar" params={params} value={sp.lig} allLabel="Tüm Ligler" options={leagues.map((l) => ({ value: l.id, label: `${sportDef(l.sport).emoji} ${l.name.replace(" Gençlik Ligi", "")}` }))} />
      </div>
      <div className="card overflow-x-auto">
        <table className="table-base">
          <thead><tr><th>Tarih</th><th>Lig / Hafta</th><th className="text-right">Ev Sahibi</th><th className="text-center">Skor</th><th>Deplasman</th><th className="text-center">Olay</th><th>Durum</th></tr></thead>
          <tbody>
            {matches.map((m) => (
              <tr key={m.id} className="hover:bg-basalt-50">
                <td className="text-xs"><Link href={`/yonetim/maclar/duzenle?id=${m.id}`} className="font-semibold hover:text-dicle-700">{formatShortDate(m.date)} {formatTime(m.date)}</Link></td>
                <td className="text-xs text-basalt-600">{sportDef(m.sport).emoji} {m.leagueName.replace(" Gençlik Ligi", "")} · {m.round}. H</td>
                <td className="text-right"><span className="inline-flex items-center gap-2">{m.home.name}<TeamCrest team={m.home} size={22} /></span></td>
                <td className="text-center"><Link href={`/yonetim/maclar/duzenle?id=${m.id}`} className="rounded bg-basalt-100 px-2 py-1 font-display font-bold tabular-nums hover:bg-basalt-200">{m.homeScore ?? "–"} : {m.awayScore ?? "–"}</Link></td>
                <td><span className="inline-flex items-center gap-2"><TeamCrest team={m.away} size={22} />{m.away.name}</span></td>
                <td className="text-center text-xs">{m.events.length} {m.youtubeUrl && <PlayCircle className="ml-1 inline h-4 w-4 text-red-500" />}</td>
                <td><StatusBadge map={MATCH_STATUS} value={m.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} total={total} perPage={PER} basePath="/yonetim/maclar" params={params} />
    </>
  );
}
