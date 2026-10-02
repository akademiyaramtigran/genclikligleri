import Link from "next/link";
import type { Metadata } from "next";
import { Trash2 } from "lucide-react";
import type { TheatreGroup } from "@prisma/client";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { DISTRICTS } from "@/lib/constants";
import { AdminHeader, FileField, FormGrid, Panel, SelectField, TextArea, TextField } from "@/components/admin/fields";
import { AdminForm, ActionButton } from "@/components/admin/AdminForm";
import { deleteGroup, saveGroup } from "@/actions/kultur";
import { PlayForm } from "./PlayForm";

export const metadata: Metadata = { title: "Topluluklar & Oyunlar" };

function GroupFields({ g }: { g?: TheatreGroup }) {
  return (
    <div className="space-y-3">
      {g && <input type="hidden" name="id" value={g.id} />}
      <TextField label="Topluluk Adı" name="name" required defaultValue={g?.name} />
      <FormGrid cols={3}><SelectField label="İlçe" name="district" required defaultValue={g?.district} empty="Seçiniz" options={DISTRICTS.map((d) => ({ value: d, label: d }))} /><TextField label="Kuruluş" name="foundedYear" type="number" defaultValue={g?.foundedYear} /><TextField label="Üye Sayısı" name="memberCount" type="number" defaultValue={g?.memberCount} /></FormGrid>
      <FormGrid><TextField label="Sanat Yönetmeni" name="director" defaultValue={g?.director} /><TextField label="Instagram" name="instagram" defaultValue={g?.instagram} /></FormGrid>
      <FileField label="Logo" name="logo" current={g?.logoUrl} />
      <TextArea label="Tanıtım" name="description" rows={2} defaultValue={g?.description} />
    </div>
  );
}

export default async function PlaysAdmin() {
  await requireUser("TIYATRO");
  const [groups, plays] = await Promise.all([
    db.theatreGroup.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { plays: true } } } }),
    db.theatrePlay.findMany({ include: { group: true, festival: true, _count: { select: { shows: true } } }, orderBy: [{ festival: { startDate: "desc" } }, { title: "asc" }] }),
  ]);
  return (
    <>
      <AdminHeader back={{ href: "/yonetim/tiyatro", label: "Festival" }} title="Topluluklar & Oyunlar" />
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <Panel title={`Oyunlar (${plays.length})`}>
            <div className="divide-y divide-basalt-100">
              {plays.map((p) => (
                <Link key={p.id} href={`/yonetim/tiyatro/oyunlar/${p.id}`} className="flex items-center gap-3 py-2 hover:bg-basalt-50">
                  <span className="min-w-0 flex-1"><span className="block truncate font-medium">{p.title}</span><span className="text-xs text-basalt-500">{p.group.name} · {p.genre} · {p.festival.edition} ({p.festival.startDate.getFullYear()})</span></span>
                  <span className="text-xs text-basalt-500">{p._count.shows} gösterim</span>
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
                  <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2 text-sm"><span className="font-medium">{g.name}</span><span className="text-xs text-basalt-500">{g.district} · {g._count.plays} oyun</span></summary>
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
