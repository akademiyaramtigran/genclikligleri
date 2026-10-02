"use client";

import type { Announcement } from "@/lib/types";
import { ANNOUNCEMENT_CATEGORIES } from "@/lib/constants";
import { toDateTimeLocal } from "@/lib/utils";
import { AdminForm } from "@/components/admin/AdminForm";
import { CheckField, FileField, FormGrid, SelectField, TextArea, TextField } from "@/components/admin/fields";
import { saveAnnouncement } from "@/actions/genel";

export function AnnouncementForm({ a }: { a?: Announcement }) {
  return (
    <AdminForm action={saveAnnouncement} submitLabel={a ? "Kaydet" : "Yayımla"}>
      {a && <input type="hidden" name="id" value={a.id} />}
      <div className="space-y-4">
        <TextField label="Başlık" name="title" required defaultValue={a?.title} />
        <FormGrid cols={3}>
          <SelectField label="Kategori" name="category" defaultValue={a?.category} options={ANNOUNCEMENT_CATEGORIES} />
          <TextField label="Yayın Tarihi" name="publishedAt" type="datetime-local" defaultValue={toDateTimeLocal(a?.publishedAt ?? new Date())} />
          <FileField label="Kapak Görseli" name="cover" current={a?.coverUrl} accept="image/png,image/jpeg,image/webp" hint="Manşet için yatay ve büyük fotoğraf önerilir (otomatik 1600 px'e küçültülür)." />
        </FormGrid>
        <TextArea label="Özet" name="excerpt" rows={2} defaultValue={a?.excerpt} />
        <TextArea label="İçerik" name="content" rows={10} required defaultValue={a?.content} hint="Paragrafları boş satırla ayırın." />
        <FormGrid cols={3}>
          <CheckField label="Yayında" name="isPublished" defaultChecked={a?.isPublished ?? true} />
          <CheckField label="Önemli (en üstte sabitle)" name="isPinned" defaultChecked={a?.isPinned} />
          <CheckField label="Ana sayfa manşeti" name="isHeadline" defaultChecked={a?.isHeadline} hint="Haftanın en çarpıcı olayı: ana sayfanın en üstünde büyük fotoğrafla gösterilir" />
        </FormGrid>
        <TextField label="Manşet üst etiketi" name="kicker" defaultValue={a?.kicker} placeholder="ör. Haftanın Olayı · Kulp" />
      </div>
    </AdminForm>
  );
}
