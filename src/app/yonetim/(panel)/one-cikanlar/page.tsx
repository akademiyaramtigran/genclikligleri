"use client";

import { Trash2 } from "lucide-react";
import type { Highlight } from "@/lib/types";
import { getAll } from "@/lib/data";
import { useData } from "@/lib/hooks";
import { ErrorBox, PageLoader } from "@/components/client";
import { HIGHLIGHT_KINDS, POST_SECTIONS } from "@/lib/constants";
import { formatDate, toDateInput } from "@/lib/utils";
import { Avatar, Badge } from "@/components/ui";
import { AdminHeader, CheckField, FileField, FormGrid, Panel, SelectField, TextArea, TextField } from "@/components/admin/fields";
import { AdminForm, ActionButton } from "@/components/admin/AdminForm";
import { deleteHighlight, saveHighlight } from "@/actions/icerik";

const kinds = Object.fromEntries(Object.entries(HIGHLIGHT_KINDS).map(([k, v]) => [k, v.label]));

function Fields({ h }: { h?: Highlight }) {
  return (
    <div className="space-y-3">
      {h && <input type="hidden" name="id" value={h.id} />}
      <FormGrid>
        <SelectField label="Tür" name="kind" required defaultValue={h?.kind} options={kinds} />
        <TextField label="Hafta" name="weekOf" type="date" required defaultValue={toDateInput(h?.weekOf ?? new Date())} />
      </FormGrid>
      <TextField label="Ad Soyad (veya kişiler)" name="name" required defaultValue={h?.name} />
      <TextField label="Alt başlık" name="subtitle" defaultValue={h?.subtitle} placeholder="ör. Bağlar Gençlik SK · Kadın Voleybol" />
      <TextArea label="Kısa başarı hikâyesi" name="story" rows={4} required defaultValue={h?.story} hint="2-4 cümle. Kartta tamamı görünür." />
      <FormGrid>
        <SelectField label="Alan" name="section" empty="—" defaultValue={h?.section} options={POST_SECTIONS} />
        <TextField label="Bağlantı (isteğe bağlı)" name="link" defaultValue={h?.link} placeholder="/spor/oyuncu?s=…" />
      </FormGrid>
      <FileField label="Fotoğraf" name="photo" current={h?.photoUrl} accept="image/png,image/jpeg,image/webp" hint="Dikey / yüz odaklı fotoğraf önerilir." />
      <CheckField label="Yayında" name="isPublished" defaultChecked={h?.isPublished ?? true} />
    </div>
  );
}

export default function HighlightsAdmin() {
  const { data, error } = useData(async () => (await getAll<Highlight>("highlights")).sort((a, b) => b.weekOf.getTime() - a.weekOf.getTime()), []);
  if (error) return <ErrorBox message={error} />;
  if (!data) return <PageLoader />;
  return (
    <>
      <AdminHeader title="Haftanın Öne Çıkanları" description="Haftanın oyuncusu, haftanın sanatçısı ve haftanın centilmenlik hareketi. Ana sayfada her türün en yeni kaydı gösterilir." />
      <div className="grid gap-6 xl:grid-cols-[1fr_26rem]">
        <div className="space-y-3">
          {data.length === 0 && <p className="text-sm text-basalt-500">Henüz kayıt yok.</p>}
          {data.map((h) => (
            <details key={h.id} className="card overflow-hidden">
              <summary className="flex cursor-pointer list-none items-center gap-3 p-4">
                <Avatar name={h.name} src={h.photoUrl} size={44} />
                <span className="min-w-0 flex-1"><span className="block truncate font-semibold">{h.name}</span><span className="text-xs text-basalt-500">{formatDate(h.weekOf)} haftası · {h.subtitle}</span></span>
                <Badge tone={HIGHLIGHT_KINDS[h.kind]?.tone === "emerald" ? "green" : HIGHLIGHT_KINDS[h.kind]?.tone}>{HIGHLIGHT_KINDS[h.kind]?.short}</Badge>
                {!h.isPublished && <Badge tone="zinc">Taslak</Badge>}
              </summary>
              <div className="border-t border-basalt-100 p-4">
                <AdminForm key={h.id} action={saveHighlight} compact><Fields h={h} /></AdminForm>
                <div className="mt-2"><ActionButton action={deleteHighlight} fields={{ id: h.id }} label="Sil" icon={<Trash2 className="h-3.5 w-3.5" />} confirm="Kayıt silinsin mi?" className="btn-ghost btn-sm text-red-600" /></div>
              </div>
            </details>
          ))}
        </div>
        <Panel title="Yeni Ekle"><AdminForm action={saveHighlight} submitLabel="Ekle" resetOnSuccess><Fields /></AdminForm></Panel>
      </div>
    </>
  );
}
