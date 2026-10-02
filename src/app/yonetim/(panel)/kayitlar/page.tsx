"use client";

import { getLogs } from "@/lib/admin-data";
import { useData } from "@/lib/hooks";
import { RequireUnit } from "../../AdminContext";
import { ErrorBox, PageLoader } from "@/components/client";
import { formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui";
import { AdminHeader } from "@/components/admin/fields";


export default function LogsAdmin() {
  return <RequireUnit superOnly><Inner /></RequireUnit>;
}

function Inner() {
  const { data: logs, error } = useData(() => getLogs(200), []);
  if (error) return <ErrorBox message={error} />;
  if (!logs) return <PageLoader />;
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
                <td className="text-sm">{l.userName ?? "Sistem"}</td>
                <td><Badge tone={l.action === "SIL" ? "red" : l.action === "ONAY" ? "green" : "slate"}>{l.action}</Badge></td>
                <td className="text-sm">{l.entity}</td>
                <td className="max-w-md truncate text-xs text-basalt-600">{l.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
    </>
  );
}
