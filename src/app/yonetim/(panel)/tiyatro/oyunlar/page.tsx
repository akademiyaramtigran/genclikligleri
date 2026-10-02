"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import type { TheatreGroup, TheatrePlay } from "@/lib/types";
import { getAll, getFestivals, getGroups } from "@/lib/data";
import { useData } from "@/lib/hooks";
import { RequireUnit } from "../../../AdminContext";
import { ErrorBox, PageLoader } from "@/components/client";
import { DISTRICTS } from "@/lib/constants";
import { AdminHeader, FileField, FormGrid, Panel, SelectField, TextArea, TextField } from "@/components/admin/fields";
import { AdminForm, ActionButton } from "@/components/admin/AdminForm";
import { deleteGroup, saveGroup } from "@/actions/kultur";
import { PlayForm } from "./PlayForm";


function GroupFields({ g }: { g?: TheatreGroup }) {
  return (
    <div className="space-y-3">
      {g && <input type="hidden" name="id" value={g.id} />}
      <TextField label="Topluluk Adı" name="name" required defaultValue={g?.name} />
      <FormGrid cols={3}><SelectField label="İlçe" name="district" required defaultValue={g?.district} empty="Seçiniz" options={DISTRICTS.map((d) => ({ value: d, label: d }))} /><TextField label="Kuruluş" name="foundedYear" type="number" defaultValue={g?.foundedYear} /><TextField label="Üye Sayısı" name="memberCount" type="number" defaultValue={g?.memberCount} /></FormGrid>
      <FormGrid><TextField label="Sanat Yönetmeni" name="director" defaultValue={g?.director} /><TextField label="Instagram" name="instagram" defaultValue={g?.instagram} /></FormGrid>
      <FileField label="Topluluk Logosu" name="logo" current={g?.logoUrl} accept="image/png,image/jpeg,image/webp" hint="Kare, mümkünse saydam arka planlı PNG önerilir." />
      <TextArea label="Tanıtım" name="description" rows={2} defaultValue={g?.description} />
    </div>
  );
}

export default function PlaysAdmin() {
  return <RequireUnit unit="TIYATRO"><Inner /></RequireUnit>;
}

function Inner() {
  const { data, error } = useData(async () => {
    const [groups, plays, fests] = await Promise.all([getGroups(), getAll<TheatrePlay>("theatrePlays"), getFestivals()]);
    return {
      groups: groups.map((g) => ({ ...g, playCount: plays.filter((p) => p.groupId === g.id).length })),
      plays: plays.map((p) => ({ ...p, festival: fests.find((x) => x.id === p.festivalId) })).sort((a, b) => (b.festival?.startDate.getTime() ?? 0) - (a.festival?.startDate.getTime() ?? 0) || a.title.localeCompare(b.title, "tr")),
    };
  }, []);
  if (error) return <ErrorBox message={error} />;
  if (!data) return <PageLoader />;
  const { groups, plays } = data;
  return (
    <>
      <AdminHeader back={{ href: "/yonetim/tiyatro", label: "Festival" }} title="Topluluklar & Oyunlar" />
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <Panel title={`Oyunlar (${plays.length})`}>
            <div className="divide-y divide-basalt-100">
              {plays.map((p) => (
                <Link key={p.id} href={`/yonetim/tiyatro/oyunlar/duzenle?id=${p.id}`} className="flex items-center gap-3 py-2 hover:bg-basalt-50">
                  <span className="min-w-0 flex-1"><span className="block truncate font-medium">{p.title}</span><span className="text-xs text-basalt-500">{p.groupName} · {p.genre} · {p.festival?.edition} ({p.festival?.startDate.getFullYear()})</span></span>
                  <span className="text-xs text-basalt-500">{p.shows.length} gösterim</span>
                </Link>
              ))}
            </div>
          </Panel>
          <Panel title="Yeni Oyun"><PlayForm /></Panel>
        </div>
        <div className="space-y-6">
          <Panel title={`Topluluklar (${groups.length})`}>
            <div className="space-y-2">
              {groups.map((g) => (
                <details key={g.id} className="rounded-xl border border-basalt-200">
                  <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2 text-sm"><span className="font-medium">{g.name}</span><span className="text-xs text-basalt-500">{g.district} · {g.playCount} oyun</span></summary>
                  <div className="border-t border-basalt-100 p-3">
                    <AdminForm action={saveGroup} compact><GroupFields g={g} /></AdminForm>
                    <div className="mt-2"><ActionButton action={deleteGroup} fields={{ id: g.id }} label="Topluluğu sil" icon={<Trash2 className="h-3.5 w-3.5" />} confirm="Topluluk ve tüm oyunları silinsin mi?" className="btn-ghost btn-sm text-red-600" /></div>
                  </div>
                </details>
              ))}
            </div>
          </Panel>
          <Panel title="Yeni Topluluk"><AdminForm action={saveGroup} submitLabel="Ekle" resetOnSuccess><GroupFields /></AdminForm></Panel>
        </div>
      </div>
    </>
  );
}
