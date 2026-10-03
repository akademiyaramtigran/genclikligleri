"use client";

import type { Team } from "@/lib/types";
import { getLeague, getVenues } from "@/lib/data";
import { useData } from "@/lib/hooks";
import { DISTRICTS, SPORTS } from "@/lib/constants";
import { AdminForm } from "@/components/admin/AdminForm";
import { FileField, FormGrid, SelectField, TextArea, TextField } from "@/components/admin/fields";
import { saveTeam } from "@/actions/spor";

export function TeamForm({ team, leagueId }: { team?: Team; leagueId?: string }) {
  const { data } = useData(async () => ({ venues: await getVenues(), league: leagueId ? await getLeague(leagueId) : null }), [leagueId]);
  if (!data) return null;
  const { venues, league } = data;
  return (
    <AdminForm action={saveTeam} submitLabel={team ? "Kaydet" : "Takımı Oluştur"}>
      {team && <input type="hidden" name="id" value={team.id} />}
      {league && <input type="hidden" name="leagueId" value={league.id} />}
      <div className="space-y-4">
        <FormGrid>
          <TextField label="Takım Adı" name="name" required defaultValue={team?.name} />
          <TextField label="Kısa Ad (3-4 harf)" name="shortName" maxLength={4} defaultValue={team?.shortName} />
        </FormGrid>
        <FormGrid cols={3}>
          <SelectField label="Branş" name="sport" required defaultValue={team?.sport ?? league?.sport} options={Object.fromEntries(Object.values(SPORTS).map((s) => [s.key, `${s.emoji} ${s.label}`]))} />
          <SelectField label="Kategori" name="gender" required defaultValue={team?.gender ?? league?.gender} options={{ ERKEK: "Erkek", KADIN: "Kadın" }} />
          <SelectField label="Durum" name="status" defaultValue={team?.status} options={{ ACTIVE: "Aktif", PASSIVE: "Pasif" }} />
        </FormGrid>
        <FormGrid cols={3}>
          <SelectField label="İlçe" name="district" required defaultValue={team?.district} empty="Seçiniz" options={DISTRICTS.map((d) => ({ value: d, label: d }))} />
          <TextField label="Mahalle" name="neighborhood" defaultValue={team?.neighborhood} />
          <TextField label="Kuruluş Yılı" name="foundedYear" type="number" defaultValue={team?.foundedYear} />
        </FormGrid>
        <FormGrid cols={4}>
          <TextField label="Ana Renk" name="primaryColor" type="color" defaultValue={team?.primaryColor ?? "#0f766e"} />
          <TextField label="İkinci Renk" name="secondaryColor" type="color" defaultValue={team?.secondaryColor ?? "#ffffff"} />
          <FileField label="Takım Logosu" name="logo" current={team?.logoUrl} accept="image/png,image/jpeg,image/webp" hint="Kare, mümkünse saydam arka planlı PNG önerilir. Otomatik küçültülür; logo kırpılmadan yuvarlak zemine sığdırılır." className="sm:col-span-2" />
        </FormGrid>
        <FormGrid>
          <TextField label="Antrenör" name="coachName" defaultValue={team?.coachName} />
          <TextField label="Takım Sorumlusu" name="managerName" defaultValue={team?.managerName} />
        </FormGrid>
        <FormGrid>
          <SelectField label="İç Saha / Salon" name="venueId" defaultValue={team?.venueId} empty="—" options={venues.map((v) => ({ value: v.id, label: `${v.name} (${v.district})` }))} />
          <TextField label="Instagram" name="instagram" defaultValue={team?.instagram} />
        </FormGrid>
        <TextArea label="Tanıtım" name="description" rows={3} defaultValue={team?.description} />
      </div>
    </AdminForm>
  );
}
