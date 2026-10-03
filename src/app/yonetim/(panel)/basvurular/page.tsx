"use client";

import Link from "next/link";
import { Search, FileText } from "lucide-react";
import { getApplications } from "@/lib/admin-data";
import { useData } from "@/lib/hooks";
import { useAdmin } from "../../AdminContext";
import { ErrorBox, PageLoader, Suspended, useParam } from "@/components/client";
import { APPLICATION_STATUS, CATEGORIES, unitCategories } from "@/lib/constants";
import { formatDateTime } from "@/lib/utils";
import { Badge, EmptyState } from "@/components/ui";
import { AdminHeader } from "@/components/admin/fields";
import { FilterChips, Pagination } from "@/components/FilterBar";

const PER = 25;

export default function ApplicationsAdmin() {
  return <Suspended><Inner /></Suspended>;
}

function Inner() {
  const user = useAdmin();
  const sp = { durum: useParam("durum"), kategori: useParam("kategori"), donem: useParam("donem"), q: useParam("q"), sayfa: useParam("sayfa") };
  const page = Math.max(1, Number(sp.sayfa) || 1);
  const allowed = user.role === "SUPER_ADMIN" || user.scope === "ALL" ? Object.keys(CATEGORIES) : unitCategories(user.scope);
  const { data, error } = useData(() => getApplications(user), []);
  if (error) return <ErrorBox message={error} />;
  if (!data) return <PageLoader />;
  const q = sp.q?.toLocaleLowerCase("tr-TR");
  const base = data.filter((a) => allowed.includes(a.category));
  const filtered = base.filter((a) => (!sp.kategori || a.category === sp.kategori) && (!sp.donem || a.periodId === sp.donem) && (!sp.durum || a.status === sp.durum)
    && (!q || `${a.title} ${a.applicantName} ${a.trackingCode}`.toLocaleLowerCase("tr-TR").includes(q)));
  const total = filtered.length;
  const apps = filtered.slice((page - 1) * PER, page * PER);
  const cnt = (s: string) => base.filter((a) => a.status === s).length;
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
                  <td><Link href={`/yonetim/basvurular/duzenle?id=${a.id}`} className="font-semibold hover:text-dicle-700">{a.title}</Link><p className="text-xs text-basalt-500">{a.applicantName} · {a.district}</p></td>
                  <td className="max-w-[16rem] truncate text-basalt-600"><Badge tone={a.category === "SPOR" ? "green" : a.category === "MUZIK" ? "fuchsia" : a.category === "YAZARLIK" ? "rose" : a.category === "GONULLU" ? "blue" : "amber"}>{CATEGORIES[a.category as keyof typeof CATEGORIES]?.label}</Badge> {a.periodTitle}</td>
                  <td className="text-center tabular-nums">{a.members.length}</td>
                  <td className="text-center"><span className="inline-flex items-center gap-1 text-basalt-600"><FileText className="h-3.5 w-3.5" />{a.documents.length}</span></td>
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
