"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import { getPlay, getVenues } from "@/lib/data";
import { useData } from "@/lib/hooks";
import { RequireUnit } from "../../../../AdminContext";
import { ErrorBox, PageLoader, Suspended, useParam } from "@/components/client";
import { SHOW_STATUS } from "@/lib/constants";
import { formatDateTime } from "@/lib/utils";
import { EmptyState, StatusBadge } from "@/components/ui";
import { AdminHeader, FormGrid, Panel, SelectField, TextField } from "@/components/admin/fields";
import { AdminForm, ActionButton } from "@/components/admin/AdminForm";
import { deletePlay, saveShow } from "@/actions/kultur";
import { PlayForm } from "../PlayForm";

export default function EditPlay() {
  return <RequireUnit unit="TIYATRO"><Suspended><Inner /></Suspended></RequireUnit>;
}

function Inner() {
  const id = useParam("id") ?? "";
  const { data, error } = useData(async () => ({ play: await getPlay(id), venues: await getVenues() }), [id]);
  if (error) return <ErrorBox message={error} />;
  if (data === undefined) return <PageLoader />;
  if (!data.play) return <EmptyState title="Oyun bulunamadı" />;
  const { play, venues } = data;
  return (
    <>
      <AdminHeader back={{ href: "/yonetim/tiyatro/oyunlar", label: "Oyunlar" }} title={play.title} description={play.groupName} actions={<>
        <Link href={`/tiyatro/oyun?s=${play.slug}`} target="_blank" className="btn-outline btn-sm">Sitede Gör</Link>
        <ActionButton action={deletePlay} fields={{ id: play.id }} label="Sil" icon={<Trash2 className="h-3.5 w-3.5" />} confirm="Oyun ve gösterimleri silinsin mi?" className="btn-outline btn-sm text-red-600" />
      </>} />
      <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
        <Panel title="Oyun Bilgileri"><PlayForm key={play.id} play={play} /></Panel>
        <Panel title="Gösterimler">
          <div className="space-y-2">
            {play.shows.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-2 rounded-lg border border-basalt-200 p-2 text-sm">
                <span><strong>{formatDateTime(s.date)}</strong><span className="block text-xs text-basalt-500">{s.venueName}</span></span>
                <StatusBadge map={SHOW_STATUS} value={s.status} />
                <ActionButton action={saveShow} fields={{ playId: play.id, remove: s.id }} label="" icon={<Trash2 className="h-3.5 w-3.5" />} className="btn-ghost btn-sm text-red-500" />
              </div>
            ))}
          </div>
          <AdminForm action={saveShow} compact resetOnSuccess submitLabel="Gösterim Ekle" className="mt-4 border-t border-basalt-100 pt-4">
            <input type="hidden" name="playId" value={play.id} />
            <div className="space-y-2">
              <TextField label="Tarih & Saat" name="date" type="datetime-local" required />
              <SelectField label="Sahne" name="venueId" empty="—" options={venues.map((v) => ({ value: v.id, label: v.name }))} />
              <FormGrid><SelectField label="Durum" name="status" options={Object.fromEntries(Object.entries(SHOW_STATUS).map(([k, v]) => [k, v.label]))} /><TextField label="Bilet" name="ticketInfo" defaultValue="Ücretsiz" /></FormGrid>
            </div>
          </AdminForm>
        </Panel>
      </div>
    </>
  );
}
