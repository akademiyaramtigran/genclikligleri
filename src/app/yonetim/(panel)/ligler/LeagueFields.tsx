"use client";

import type { League, Season } from "@/lib/types";
import { LEAGUE_STATUS, SPORTS } from "@/lib/constants";
import { FormGrid, SelectField, TextArea, TextField } from "@/components/admin/fields";

export function LeagueFields({ league, seasons }: { league?: League; seasons: Season[] }) {
  return (
    <div className="space-y-4">
      {league && <input type="hidden" name="id" value={league.id} />}
      <TextField label="Lig Adı" name="name" required defaultValue={league?.name} placeholder="ör. Futbol Erkekler Gençlik Ligi" />
      <FormGrid cols={3}>
        <SelectField label="Branş" name="sport" required defaultValue={league?.sport} options={Object.fromEntries(Object.values(SPORTS).map((s) => [s.key, `${s.emoji} ${s.label}`]))} />
        <SelectField label="Kategori" name="gender" required defaultValue={league?.gender} options={{ ERKEK: "Erkekler", KADIN: "Kadınlar" }} />
        <TextField label="Yaş Grubu" name="ageGroup" defaultValue={league?.ageGroup ?? "U-21"} />
      </FormGrid>
      <FormGrid>
        <SelectField label="Sezon" name="seasonId" required defaultValue={league?.seasonId ?? seasons.find((s) => s.isActive)?.id} options={seasons.map((s) => ({ value: s.id, label: s.name }))} />
        <SelectField label="Durum" name="status" defaultValue={league?.status} options={Object.fromEntries(Object.entries(LEAGUE_STATUS).map(([k, v]) => [k, v.label]))} />
      </FormGrid>
      <TextArea label="Açıklama" name="description" rows={2} defaultValue={league?.description} />
      <TextArea label="Lig Kuralları" name="rules" rows={4} defaultValue={league?.rules} hint="Her satıra bir kural." />
    </div>
  );
}
