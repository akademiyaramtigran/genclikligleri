"use client";

import type { MusicCompetition, MusicContestant } from "@/lib/types";
import { getAll } from "@/lib/data";
import { useData } from "@/lib/hooks";
import { CONTESTANT_STATUS, DISTRICTS, MUSIC_GENRES } from "@/lib/constants";
import { AdminForm } from "@/components/admin/AdminForm";
import { FileField, FormGrid, SelectField, TextArea, TextField } from "@/components/admin/fields";
import { saveContestant } from "@/actions/kultur";

export function ContestantForm({ c }: { c?: MusicContestant }) {
  const comps = useData(() => getAll<MusicCompetition>("musicCompetitions"), []).data;
  if (!comps) return null;
  const members = (c?.members ?? []).map((m) => `${m.name} | ${m.role}`).join("\n");
  return (
    <AdminForm action={saveContestant} submitLabel={c ? "Kaydet" : "Yarışmacıyı Ekle"}>
      {c && <input type="hidden" name="id" value={c.id} />}
      <div className="space-y-4">
        <FormGrid><TextField label="Sahne / Grup Adı" name="name" required defaultValue={c?.name} /><SelectField label="Yarışma" name="competitionId" required defaultValue={c?.competitionId ?? comps.find((x) => x.isCurrent)?.id} options={comps.map((x) => ({ value: x.id, label: `${x.name} ${x.edition}` }))} /></FormGrid>
        <FormGrid cols={4}>
          <SelectField label="Katılım" name="type" defaultValue={c?.type} options={{ SOLO: "Solo", GRUP: "Grup" }} />
          <SelectField label="Tür" name="genre" required defaultValue={c?.genre} options={MUSIC_GENRES.map((g) => ({ value: g, label: g }))} />
          <SelectField label="İlçe" name="district" required defaultValue={c?.district} empty="Seçiniz" options={DISTRICTS.map((d) => ({ value: d, label: d }))} />
          <SelectField label="Durum" name="status" defaultValue={c?.status} options={Object.fromEntries(Object.entries(CONTESTANT_STATUS).map(([k, v]) => [k, v.label]))} />
        </FormGrid>
        <FormGrid cols={3}><TextField label="Instagram" name="instagram" defaultValue={c?.instagram} /><TextField label="Tanıtım Videosu" name="youtubeUrl" defaultValue={c?.youtubeUrl} /><TextField label="Final Sırası" name="finalRank" type="number" defaultValue={c?.finalRank} /></FormGrid>
        <FileField label="Fotoğraf" name="photo" current={c?.photoUrl} />
        <TextArea label="Biyografi" name="bio" rows={3} defaultValue={c?.bio} />
        <TextArea label="Grup Üyeleri (her satır: Ad Soyad | Rol)" name="members" rows={4} defaultValue={members} />
      </div>
    </AdminForm>
  );
}
