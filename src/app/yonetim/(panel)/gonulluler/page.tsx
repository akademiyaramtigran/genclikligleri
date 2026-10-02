"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import type { Volunteer } from "@/lib/types";
import { getAll } from "@/lib/data";
import { useData } from "@/lib/hooks";
import { ErrorBox, PageLoader, Suspended, useParam } from "@/components/client";
import { VOLUNTEER_ROLES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { Badge, EmptyState } from "@/components/ui";
import { AdminHeader, Panel } from "@/components/admin/fields";
import { ActionButton } from "@/components/admin/AdminForm";
import { FilterChips } from "@/components/FilterBar";
import { toggleVolunteer } from "@/actions/icerik";

export default function VolunteersAdmin() {
  return <Suspended><Inner /></Suspended>;
}

function Inner() {
  const gorev = useParam("gorev");
  const { data, error } = useData(async () => (await getAll<Volunteer>("volunteers")).sort((a, b) => a.name.localeCompare(b.name, "tr")), []);
  if (error) return <ErrorBox message={error} />;
  if (!data) return <PageLoader />;
  const list = data.filter((v) => !gorev || v.role === gorev);
  return (
    <>
      <AdminHeader title="Hakem & Gönüllüler" description={<>Onaylanan &quot;Hakem &amp; Gönüllü&quot; başvuruları bu havuza düşer. Başvuru almak için <Link href="/yonetim/donemler/yeni?kategori=GONULLU" className="link">bu kategoride dönem açın</Link>.</>} />
      <div className="mb-4"><FilterChips name="gorev" basePath="/yonetim/gonulluler" params={{ gorev }} value={gorev} options={Object.entries(VOLUNTEER_ROLES).map(([k, v]) => ({ value: k, label: `${v} (${data.filter((x) => x.role === k).length})` }))} /></div>
      <Panel>
        {list.length === 0 ? <EmptyState title="Havuzda kimse yok" /> : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead><tr><th>Ad Soyad</th><th>Görev</th><th>Branş</th><th>İlçe</th><th>İletişim</th><th>Katılım</th><th>Durum</th><th /></tr></thead>
              <tbody>
                {list.map((v) => (
                  <tr key={v.id}>
                    <td className="font-medium">{v.name}</td>
                    <td>{VOLUNTEER_ROLES[v.role] ?? v.role}</td>
                    <td>{v.branch ?? "—"}</td>
                    <td>{v.district}</td>
                    <td className="text-xs"><a href={`tel:${v.phone}`} className="link">{v.phone}</a><br /><a href={`mailto:${v.email}`} className="link">{v.email}</a></td>
                    <td className="text-xs text-basalt-500">{formatDate(v.createdAt)}</td>
                    <td>
                      <ActionButton action={toggleVolunteer} fields={{ id: v.id, active: v.active ? "0" : "1" }} label={v.active ? <Badge tone="green">Aktif</Badge> : <Badge tone="zinc">Pasif</Badge>} className="!p-0" />
                    </td>
                    <td><ActionButton action={toggleVolunteer} fields={{ id: v.id, remove: "on" }} label="" icon={<Trash2 className="h-3.5 w-3.5" />} confirm="Kişi havuzdan silinsin mi?" className="btn-ghost btn-sm text-red-500" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}
