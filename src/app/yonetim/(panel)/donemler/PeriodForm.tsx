"use client";

import type { Period } from "@/lib/types";
import { getLeagues } from "@/lib/data";
import { useData } from "@/lib/hooks";
import { CATEGORIES, DEFAULT_DOCS, SPORTS } from "@/lib/constants";
import { toDateTimeLocal } from "@/lib/utils";
import { AdminForm } from "@/components/admin/AdminForm";
import { CheckField, FormGrid, Panel, SelectField, TextArea, TextField } from "@/components/admin/fields";
import { savePeriod } from "@/actions/genel";

export function PeriodForm({ period, category }: { period?: Period; category?: string }) {
  const leagues = useData(getLeagues, []).data ?? [];
  const cat = (period?.category ?? category ?? "SPOR") as keyof typeof DEFAULT_DOCS;
  const docs = period ? period.requiredDocuments ?? [] : DEFAULT_DOCS[cat];
  const docsText = docs.map((d) => [d.label, d.required ? "zorunlu" : "isteğe bağlı", d.hint].filter(Boolean).join(" | ")).join("\n");
  return (
    <AdminForm action={savePeriod} submitLabel={period ? "Değişiklikleri Kaydet" : "Dönemi Oluştur"}>
      {period && <input type="hidden" name="id" value={period.id} />}
      <div className="space-y-6">
        <Panel title="Genel Bilgiler">
          <div className="space-y-4">
            <TextField label="Başlık" name="title" required defaultValue={period?.title} placeholder="ör. 2027 Bahar Futbol Ligi Takım Başvurusu" />
            <FormGrid cols={3}>
              <SelectField label="Kategori" name="category" required defaultValue={cat} options={Object.fromEntries(Object.values(CATEGORIES).map((c) => [c.key, c.label]))} />
              <SelectField label="Branş (spor)" name="sport" defaultValue={period?.sport} empty="Tüm branşlar / seçilecek" options={Object.fromEntries(Object.values(SPORTS).map((s) => [s.key, `${s.emoji} ${s.label}`]))} />
              <SelectField label="Kategori (spor)" name="gender" defaultValue={period?.gender} empty="Erkek & Kadın" options={{ ERKEK: "Erkekler", KADIN: "Kadınlar" }} />
            </FormGrid>
            <SelectField key={leagues.length} label="Bağlı Lig (isteğe bağlı)" name="leagueId" defaultValue={period?.leagueId} empty="—" options={leagues.map((l) => ({ value: l.id, label: `${l.name} (${l.seasonName})` }))} hint="Onaylanan takımlar varsayılan olarak bu lige eklenir." />
            <FormGrid>
              <TextField label="Başlangıç" name="startDate" type="datetime-local" required defaultValue={toDateTimeLocal(period?.startDate)} />
              <TextField label="Bitiş" name="endDate" type="datetime-local" required defaultValue={toDateTimeLocal(period?.endDate)} />
            </FormGrid>
            <TextArea label="Kısa Özet" name="summary" rows={2} required defaultValue={period?.summary} hint="Listelerde ve ana sayfada görünür." />
            <TextArea label="Bilgilendirme Metni" name="description" rows={4} defaultValue={period?.description} />
            <CheckField label="Yayında" name="isPublished" defaultChecked={period?.isPublished ?? true} hint="Kapalıysa sitede görünmez." />
          </div>
        </Panel>
        <Panel title="Şartlar & Sınırlar">
          <div className="space-y-4">
            <TextArea label="Başvuru Şartları" name="requirements" rows={6} required defaultValue={period?.requirements} hint="Her satıra bir şart yazın." />
            <FormGrid cols={4}>
              <TextField label="Min. Kişi" name="minMembers" type="number" min={0} defaultValue={period?.minMembers} />
              <TextField label="Maks. Kişi" name="maxMembers" type="number" min={0} defaultValue={period?.maxMembers} />
              <TextField label="Min. Yaş" name="minAge" type="number" min={0} defaultValue={period?.minAge} />
              <TextField label="Maks. Yaş" name="maxAge" type="number" min={0} defaultValue={period?.maxAge} />
            </FormGrid>
            <FormGrid cols={3}>
              <TextField label="Kontenjan" name="quota" type="number" min={0} defaultValue={period?.quota} />
              <TextField label="Katılım Ücreti" name="fee" defaultValue={period?.fee ?? "Ücretsiz"} />
              <TextField label="İletişim" name="contactInfo" defaultValue={period?.contactInfo} />
            </FormGrid>
          </div>
        </Panel>
        <Panel title="İstenen Belgeler" description="Her satır bir belge: Etiket | zorunlu / isteğe bağlı | ipucu">
          <TextArea label="Belgeler" name="documents" rows={6} defaultValue={docsText} />
        </Panel>
      </div>
    </AdminForm>
  );
}
