import Link from "next/link";
import type { Metadata } from "next";
import { Search, FileText } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { APPLICATION_STATUS, CATEGORIES } from "@/lib/constants";
import { formatDateTime, parseJson } from "@/lib/utils";
import { Badge, EmptyState } from "@/components/ui";
import { AdminHeader } from "@/components/admin/fields";
import { FilterChips, Pagination } from "@/components/FilterBar";

export const metadata: Metadata = { title: "Başvurular" };
const PER = 25;

export default async function ApplicationsAdmin({ searchParams }: { searchParams: Promise<{ durum?: string; kategori?: string; donem?: string; q?: string; sayfa?: string }> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.sayfa) || 1);
  const allowed = user.role === "SUPER_ADMIN" || user.scope === "ALL" ? ["SPOR", "MUZIK", "TIYATRO"] : [user.scope];
  const cat = sp.kategori && allowed.includes(sp.kategori) ? [sp.kategori] : allowed;
  const where = {
    period: { category: { in: cat }, ...(sp.donem ? { id: sp.donem } : {}) },
    ...(sp.durum ? { status: sp.durum } : {}),
    ...(sp.q ? { OR: [{ title: { contains: sp.q } }, { applicantName: { contains: sp.q } }, { trackingCode: { contains: sp.q.toUpperCase() } }] } : {}),
  };
  const [total, apps, counts] = await Promise.all([
    db.application.count({ where }),
    db.application.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PER, take: PER, include: { period: true, _count: { select: { documents: true } } } }),
    db.application.groupBy({ by: ["status"], where: { period: { category: { in: allowed } } }, _count: { _all: true } }),
  ]);
  const cnt = (s: string) => counts.find((c) => c.status === s)?._count._all ?? 0;
  const params = { durum: sp.durum, kategori: sp.kategori, donem: sp.donem, q: sp.q };

  return (
    <>
      <AdminHeader title="Başvurular" description={`${total} başvuru listeleniyor`} />
      <div className="mb-6 space-y-3">
        <form className="flex max-w-md gap-2">
          {Object.entries(params).filter(([k, v]) => v && k !== "q").map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-basalt-400" /><input name="q" defaultValue={sp.q} placeholder="Ad, başvuran veya takip kodu" className="input pl-9" /></div>
          <button className="btn-outline">Ara</button>
        </form>
        <FilterChips name="durum" basePath="/yonetim/basvurular" params={params} value={sp.durum} options={Object.entries(APPLICATION_STATUS).map(([k, v]) => ({ value: k, label: `${v.label} (${cnt(k)})` }))} />
        {allowed.length > 1 && <FilterChips name="kategori" basePath="/yonetim/basvurular" params={params} value={sp.kategori} options={allowed.map((c) => ({ value: c, label: CATEGORIES[c as keyof typeof CATEGORIES].label }))} />}
      </div>
      {apps.length === 0 ? <EmptyState title="Başvuru bulunamadı" /> : (
        <div className="card overflow-x-auto">
          <table className="table-base">
            <thead><tr><th>Takip</th><th>Başvuru</th><th>Dönem</th><th className="text-center">Kişi</th><th className="text-center">Belge</th><th>Tarih</th><th>Durum</th></tr></thead>
            <tbody>
              {apps.map((a) => (
                <tr key={a.id} className="hover:bg-basalt-50">
                  <td className="font-mono text-xs">{a.trackingCode}</td>
                  <td><Link href={`/yonetim/basvurular/${a.id}`} className="font-semibold hover:text-dicle-700">{a.title}</Link><p className="text-xs text-basalt-500">{a.applicantName} · {a.district}</p></td>
                  <td className="max-w-[16rem] truncate text-basalt-600"><Badge tone={a.period.category === "SPOR" ? "green" : a.period.category === "MUZIK" ? "fuchsia" : "amber"}>{CATEGORIES[a.period.category as keyof typeof CATEGORIES]?.label}</Badge> {a.period.title}</td>
                  <td className="text-center tabular-nums">{parseJson<unknown[]>(a.members, []).length}</td>
                  <td className="text-center"><span className="inline-flex items-center gap-1 text-basalt-600"><FileText className="h-3.5 w-3.5" />{a._count.documents}</span></td>
                  <td className="text-xs text-basalt-500">{formatDateTime(a.createdAt)}</td>
                  <td><Badge tone={APPLICATION_STATUS[a.status]?.tone}>{APPLICATION_STATUS[a.status]?.label}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} total={total} perPage={PER} basePath="/yonetim/basvurular" params={params} />
    </>
  );
}
