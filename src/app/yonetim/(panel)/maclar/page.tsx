import Link from "next/link";
import type { Metadata } from "next";
import { PlayCircle } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { MATCH_STATUS, sportDef } from "@/lib/constants";
import { formatShortDate, formatTime } from "@/lib/utils";
import { StatusBadge, TeamCrest } from "@/components/ui";
import { AdminHeader } from "@/components/admin/fields";
import { FilterChips, Pagination } from "@/components/FilterBar";

export const metadata: Metadata = { title: "Maçlar" };
const PER = 40;

export default async function MatchesAdmin({ searchParams }: { searchParams: Promise<{ lig?: string; durum?: string; sayfa?: string }> }) {
  await requireUser("SPOR");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.sayfa) || 1);
  const where = { ...(sp.lig ? { leagueId: sp.lig } : {}), ...(sp.durum === "bekleyen" ? { status: { in: ["SCHEDULED", "LIVE"] }, date: { lt: new Date() } } : sp.durum ? { status: sp.durum } : {}) };
  const [leagues, total, matches] = await Promise.all([
    db.league.findMany({ where: { season: { isActive: true } }, orderBy: [{ sport: "asc" }, { gender: "asc" }] }),
    db.match.count({ where }),
    db.match.findMany({ where, orderBy: sp.durum === "FINISHED" ? { date: "desc" } : { date: "asc" }, skip: (page - 1) * PER, take: PER, include: { homeTeam: true, awayTeam: true, league: true, _count: { select: { events: true } } } }),
  ]);
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
                <td className="text-xs"><Link href={`/yonetim/maclar/${m.id}`} className="font-semibold hover:text-dicle-700">{formatShortDate(m.date)} {formatTime(m.date)}</Link></td>
                <td className="text-xs text-basalt-600">{sportDef(m.league.sport).emoji} {m.league.name.replace(" Gençlik Ligi", "")} · {m.round}. H</td>
                <td className="text-right"><span className="inline-flex items-center gap-2">{m.homeTeam.name}<TeamCrest team={m.homeTeam} size={22} /></span></td>
                <td className="text-center"><Link href={`/yonetim/maclar/${m.id}`} className="rounded bg-basalt-100 px-2 py-1 font-display font-bold tabular-nums hover:bg-basalt-200">{m.homeScore ?? "–"} : {m.awayScore ?? "–"}</Link></td>
                <td><span className="inline-flex items-center gap-2"><TeamCrest team={m.awayTeam} size={22} />{m.awayTeam.name}</span></td>
                <td className="text-center text-xs">{m._count.events} {m.youtubeUrl && <PlayCircle className="ml-1 inline h-4 w-4 text-red-500" />}</td>
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
