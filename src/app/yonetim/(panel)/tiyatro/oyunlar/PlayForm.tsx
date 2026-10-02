import type { TheatrePlay } from "@prisma/client";
import { db } from "@/lib/db";
import { THEATRE_GENRES } from "@/lib/constants";
import { parseJson } from "@/lib/utils";
import { AdminForm } from "@/components/admin/AdminForm";
import { CheckField, FileField, FormGrid, SelectField, TextArea, TextField } from "@/components/admin/fields";
import { savePlay } from "@/actions/kultur";

export async function PlayForm({ play }: { play?: TheatrePlay }) {
  const [fests, groups] = await Promise.all([db.theatreFestival.findMany({ orderBy: { startDate: "desc" } }), db.theatreGroup.findMany({ orderBy: { name: "asc" } })]);
  const cast = parseJson<{ name: string; role: string }[]>(play?.cast, []).map((c) => `${c.name} | ${c.role}`).join("\n");
  return (
    <AdminForm action={savePlay} submitLabel={play ? "Kaydet" : "Oyunu Ekle"}>
      {play && <input type="hidden" name="id" value={play.id} />}
      <div className="space-y-4">
        <TextField label="Oyun Adı" name="title" required defaultValue={play?.title} />
        <FormGrid>
          <SelectField label="Festival" name="festivalId" required defaultValue={play?.festivalId ?? fests.find((f) => f.isCurrent)?.id} options={fests.map((f) => ({ value: f.id, label: `${f.edition} ${f.name} (${f.startDate.getFullYear()})` }))} />
          <SelectField label="Topluluk" name="groupId" required defaultValue={play?.groupId} empty="Seçiniz" options={groups.map((g) => ({ value: g.id, label: g.name }))} />
        </FormGrid>
        <FormGrid cols={3}><TextField label="Yazar" name="playwright" required defaultValue={play?.playwright} /><TextField label="Yönetmen" name="director" required defaultValue={play?.director} /><SelectField label="Tür" name="genre" defaultValue={play?.genre} options={THEATRE_GENRES.map((g) => ({ value: g, label: g }))} /></FormGrid>
        <FormGrid cols={3}><TextField label="Süre (dk)" name="durationMin" type="number" defaultValue={play?.durationMin} /><TextField label="Yaş Sınırı" name="ageLimit" defaultValue={play?.ageLimit} placeholder="+12" /><TextField label="Dil" name="language" defaultValue={play?.language ?? "Türkçe"} /></FormGrid>
        <TextField label="YouTube Kaydı" name="youtubeUrl" defaultValue={play?.youtubeUrl} />
        <FileField label="Afiş" name="poster" current={play?.posterUrl} />
        <TextArea label="Özet" name="synopsis" rows={4} defaultValue={play?.synopsis} />
        <TextArea label="Oyuncular (her satır: Ad Soyad | Rol)" name="cast" rows={5} defaultValue={cast} />
        <CheckField label="Yarışmalı bölümde" name="inCompetition" defaultChecked={play?.inCompetition ?? true} />
      </div>
    </AdminForm>
  );
}
