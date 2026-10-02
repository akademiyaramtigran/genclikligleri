"use client";

import { Trash2 } from "lucide-react";
import type { Venue } from "@/lib/types";
import { getVenues } from "@/lib/data";
import { useData } from "@/lib/hooks";
import { ErrorBox, PageLoader } from "@/components/client";
import { DISTRICTS, VENUE_TYPES } from "@/lib/constants";
import { Badge } from "@/components/ui";
import { AdminHeader, FormGrid, Panel, SelectField, TextArea, TextField } from "@/components/admin/fields";
import { AdminForm, ActionButton } from "@/components/admin/AdminForm";
import { deleteVenue, saveVenue } from "@/actions/spor";


function VenueFields({ v }: { v?: Venue }) {
  return (
    <div className="space-y-3">
      {v && <input type="hidden" name="id" value={v.id} />}
      <TextField label="Ad" name="name" required defaultValue={v?.name} />
      <FormGrid cols={3}>
        <SelectField label="Tür" name="type" defaultValue={v?.type} options={VENUE_TYPES} />
        <SelectField label="İlçe" name="district" required defaultValue={v?.district} empty="Seçiniz" options={DISTRICTS.map((d) => ({ value: d, label: d }))} />
        <TextField label="Kapasite" name="capacity" type="number" defaultValue={v?.capacity} />
      </FormGrid>
      <TextField label="Adres" name="address" defaultValue={v?.address} />
      <TextField label="Harita Bağlantısı" name="mapUrl" type="url" defaultValue={v?.mapUrl} />
      <TextArea label="Açıklama" name="description" rows={2} defaultValue={v?.description} />
    </div>
  );
}

export default function VenuesAdmin() {
  const { data: venues, error } = useData(getVenues, []);
  if (error) return <ErrorBox message={error} />;
  if (!venues) return <PageLoader />;
  return (
    <>
      <AdminHeader title="Tesisler & Sahneler" description="Maç, konser ve gösterimlerin yapıldığı mekânlar." />
      <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
        <div className="space-y-3">
          {venues.map((v) => (
            <details key={v.id} className="card group">
              <summary className="flex cursor-pointer list-none items-center gap-3 p-4">
                <span className="flex-1"><span className="block font-semibold">{v.name}</span><span className="text-xs text-basalt-500">{VENUE_TYPES[v.type]} · {v.district}{v.capacity ? ` · ${v.capacity} kişi` : ""}</span></span>
                <Badge>{v.district}</Badge>
              </summary>
              <div className="border-t border-basalt-100 p-4">
                <AdminForm key={v.id} action={saveVenue} compact><VenueFields v={v} /></AdminForm>
                <div className="mt-3"><ActionButton action={deleteVenue} fields={{ id: v.id }} label="Tesisi Sil" icon={<Trash2 className="h-3.5 w-3.5" />} confirm="Tesis silinsin mi? Bağlı maçlarda tesis bilgisi boşalır." className="btn-ghost btn-sm text-red-600" /></div>
              </div>
            </details>
          ))}
        </div>
        <Panel title="Yeni Tesis"><AdminForm action={saveVenue} submitLabel="Ekle" resetOnSuccess><VenueFields /></AdminForm></Panel>
      </div>
    </>
  );
}
