import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/auth";
import { formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui";
import { AdminHeader } from "@/components/admin/fields";
import { Pagination } from "@/components/FilterBar";

export const metadata: Metadata = { title: "İşlem Kayıtları" };
const PER = 50;

export default async function LogsAdmin({ searchParams }: { searchParams: Promise<{ sayfa?: string }> }) {
  await requireSuperAdmin();
  const page = Math.max(1, Number((await searchParams).sayfa) || 1);
  const [total, logs] = await Promise.all([db.activityLog.count(), db.activityLog.findMany({ orderBy: { createdAt: "desc" }, skip: (page - 1) * PER, take: PER, include: { user: true } })]);
  return (
    <>
      <AdminHeader title="İşlem Kayıtları" description="Yönetim panelinde yapılan tüm önemli işlemler." />
      <div className="card overflow-x-auto">
        <table className="table-base">
          <thead><tr><th>Zaman</th><th>Kullanıcı</th><th>İşlem</th><th>Kayıt</th><th>Detay</th></tr></thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id}>
                <td className="text-xs text-basalt-500">{formatDateTime(l.createdAt)}</td>
                <td className="text-sm">{l.user?.name ?? "Sistem"}</td>
                <td><Badge tone={l.action === "SIL" ? "red" : l.action === "ONAY" ? "green" : "slate"}>{l.action}</Badge></td>
                <td className="text-sm">{l.entity}</td>
                <td className="max-w-md truncate text-xs text-basalt-600">{l.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} total={total} perPage={PER} basePath="/yonetim/kayitlar" params={{}} />
    </>
  );
}
