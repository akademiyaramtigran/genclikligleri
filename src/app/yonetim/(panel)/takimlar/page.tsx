import Link from "next/link";
import type { Metadata } from "next";
import { Search } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { SPORT_LIST, sportDef } from "@/lib/constants";
import { Badge, TeamCrest } from "@/components/ui";
import { AdminHeader } from "@/components/admin/fields";
import { FilterChips } from "@/components/FilterBar";

export const metadata: Metadata = { title: "Takımlar" };

export default async function TeamsAdmin({ searchParams }: { searchParams: Promise<{ brans?: string; cinsiyet?: string; q?: string }> }) {
  await requireUser("SPOR");
  const sp = await searchParams;
  const teams = await db.team.findMany({
    where: { ...(sp.brans ? { sport: sp.brans } : {}), ...(sp.cinsiyet ? { gender: sp.cinsiyet } : {}), ...(sp.q ? { name: { contains: sp.q } } : {}) },
    include: { _count: { select: { players: true } }, entries: { include: { league: true } } },
    orderBy: [{ sport: "asc" }, { gender: "asc" }, { name: "asc" }],
  });
  const params = { brans: sp.brans, cinsiyet: sp.cinsiyet, q: sp.q };
  return (
    <>
      <AdminHeader title="Takımlar" description={`${teams.length} takım`} actions={<Link href="/yonetim/takimlar/yeni" className="btn-primary">+ Yeni Takım</Link>} />
      <div className="mb-6 space-y-3">
        <form className="flex max-w-md gap-2">
          {sp.brans && <input type="hidden" name="brans" value={sp.brans} />}{sp.cinsiyet && <input type="hidden" name="cinsiyet" value={sp.cinsiyet} />}
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-basalt-400" /><input name="q" defaultValue={sp.q} placeholder="Takım ara" className="input pl-9" /></div>
          <button className="btn-outline">Ara</button>
        </form>
        <FilterChips name="brans" basePath="/yonetim/takimlar" params={params} value={sp.brans} options={SPORT_LIST.map((s) => ({ value: s.key, label: `${s.emoji} ${s.label}` }))} />
        <FilterChips name="cinsiyet" basePath="/yonetim/takimlar" params={params} value={sp.cinsiyet} options={[{ value: "ERKEK", label: "Erkek" }, { value: "KADIN", label: "Kadın" }]} />
      </div>
      <div className="card overflow-x-auto">
        <table className="table-base">
          <thead><tr><th>Takım</th><th>Branş</th><th>İlçe</th><th>Lig</th><th className="text-center">Oyuncu</th><th>Durum</th></tr></thead>
          <tbody>
            {teams.map((t) => (
              <tr key={t.id} className="hover:bg-basalt-50">
                <td><Link href={`/yonetim/takimlar/${t.id}`} className="flex items-center gap-2 font-semibold hover:text-dicle-700"><TeamCrest team={t} size={28} /> {t.name}</Link></td>
                <td>{sportDef(t.sport).emoji} {sportDef(t.sport).label} <Badge tone={t.gender === "KADIN" ? "rose" : "blue"}>{t.gender === "KADIN" ? "K" : "E"}</Badge></td>
                <td className="text-basalt-600">{t.district}</td>
                <td className="max-w-[14rem] truncate text-xs text-basalt-600">{t.entries.map((e) => e.league.name).join(", ") || <span className="text-amber-600">Ligi yok</span>}</td>
                <td className="text-center tabular-nums">{t._count.players}</td>
                <td><Badge tone={t.status === "ACTIVE" ? "green" : "zinc"}>{t.status === "ACTIVE" ? "Aktif" : "Pasif"}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
