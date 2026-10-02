"use client";

import Link from "next/link";
import { getAllPeriods, getApplications } from "@/lib/admin-data";
import { useData } from "@/lib/hooks";
import { useAdmin } from "../../AdminContext";
import { ErrorBox, PageLoader } from "@/components/client";
import { CATEGORIES } from "@/lib/constants";
import { periodState, PERIOD_STATE_LABEL } from "@/lib/periods";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui";
import { AdminHeader } from "@/components/admin/fields";


export default function PeriodsAdmin() {
  const user = useAdmin();
  const { data, error } = useData(async () => {
    const [periods, apps] = await Promise.all([getAllPeriods(user), getApplications(user)]);
    return periods.map((p) => ({ ...p, count: apps.filter((a) => a.periodId === p.id).length }));
  }, []);
  if (error) return <ErrorBox message={error} />;
  if (!data) return <PageLoader />;
  const periods = data;
  return (
    <>
      <AdminHeader title="Başvuru Dönemleri" description="Spor, müzik ve tiyatro başvuru dönemlerini; şartları ve istenen belgeleri yönetin." actions={<Link href="/yonetim/donemler/yeni" className="btn-primary">+ Yeni Dönem</Link>} />
      <div className="card overflow-x-auto">
        <table className="table-base">
          <thead><tr><th>Dönem</th><th>Kategori</th><th>Tarihler</th><th className="text-center">Başvuru</th><th>Durum</th></tr></thead>
          <tbody>
            {periods.map((p) => {
              const st = periodState(p);
              return (
                <tr key={p.id} className="hover:bg-basalt-50">
                  <td><Link href={`/yonetim/donemler/duzenle?id=${p.id}`} className="font-semibold hover:text-dicle-700">{p.title}</Link>{!p.isPublished && <Badge tone="zinc" className="ml-2">Taslak</Badge>}</td>
                  <td>{CATEGORIES[p.category as keyof typeof CATEGORIES]?.label}</td>
                  <td className="text-xs text-basalt-600">{formatDate(p.startDate)} – {formatDate(p.endDate)}</td>
                  <td className="text-center"><Link href={`/yonetim/basvurular?donem=${p.id}`} className="link">{p.count}</Link></td>
                  <td><Badge tone={PERIOD_STATE_LABEL[st].tone}>{PERIOD_STATE_LABEL[st].label}</Badge></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
