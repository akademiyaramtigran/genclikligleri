import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { CATEGORIES } from "@/lib/constants";
import { periodState, PERIOD_STATE_LABEL } from "@/lib/periods";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui";
import { AdminHeader } from "@/components/admin/fields";

export const metadata: Metadata = { title: "Başvuru Dönemleri" };

export default async function PeriodsAdmin() {
  const user = await requireUser();
  const allowed = user.role === "SUPER_ADMIN" || user.scope === "ALL" ? ["SPOR", "MUZIK", "TIYATRO"] : [user.scope];
  const periods = await db.applicationPeriod.findMany({ where: { category: { in: allowed } }, orderBy: { startDate: "desc" }, include: { _count: { select: { applications: true } } } });
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
                  <td><Link href={`/yonetim/donemler/${p.id}`} className="font-semibold hover:text-dicle-700">{p.title}</Link>{!p.isPublished && <Badge tone="zinc" className="ml-2">Taslak</Badge>}</td>
                  <td>{CATEGORIES[p.category as keyof typeof CATEGORIES]?.label}</td>
                  <td className="text-xs text-basalt-600">{formatDate(p.startDate)} – {formatDate(p.endDate)}</td>
                  <td className="text-center"><Link href={`/yonetim/basvurular?donem=${p.id}`} className="link">{p._count.applications}</Link></td>
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
