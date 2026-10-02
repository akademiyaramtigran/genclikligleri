import type { Player } from "@prisma/client";
import { db } from "@/lib/db";
import { DISTRICTS, PLAYER_STATUS, SPORT_LIST } from "@/lib/constants";
import { toDateInput } from "@/lib/utils";
import { AdminForm } from "@/components/admin/AdminForm";
import { CheckField, FileField, FormGrid, SelectField, TextArea, TextField } from "@/components/admin/fields";
import { savePlayer } from "@/actions/spor";

export async function PlayerForm({ player, teamId }: { player?: Player; teamId?: string }) {
  const teams = await db.team.findMany({ where: { status: "ACTIVE" }, orderBy: [{ sport: "asc" }, { name: "asc" }] });
  const positions = [...new Set(SPORT_LIST.flatMap((s) => s.positions))];
  return (
    <AdminForm action={savePlayer} submitLabel={player ? "Kaydet" : "Oyuncuyu Oluştur"}>
      {player && <input type="hidden" name="id" value={player.id} />}
      <div className="space-y-4">
        <FormGrid>
          <TextField label="Ad" name="firstName" required defaultValue={player?.firstName} />
          <TextField label="Soyad" name="lastName" required defaultValue={player?.lastName} />
        </FormGrid>
        <FormGrid cols={3}>
          <SelectField label="Takım" name="teamId" defaultValue={player?.teamId ?? teamId} empty="Takımsız" options={teams.map((t) => ({ value: t.id, label: `${t.name} (${SPORT_LIST.find((s) => s.key === t.sport)?.label}, ${t.gender === "KADIN" ? "K" : "E"})` }))} className="sm:col-span-2" />
          <SelectField label="Cinsiyet (takımsızsa)" name="gender" defaultValue={player?.gender} options={{ ERKEK: "Erkek", KADIN: "Kadın" }} />
        </FormGrid>
        <FormGrid cols={4}>
          <TextField label="Doğum Tarihi" name="birthDate" type="date" defaultValue={toDateInput(player?.birthDate)} />
          <SelectField label="Mevki" name="position" defaultValue={player?.position} empty="—" options={positions.map((p) => ({ value: p, label: p }))} />
          <TextField label="Forma No" name="jerseyNumber" type="number" min={0} max={99} defaultValue={player?.jerseyNumber} />
          <SelectField label="Durum" name="status" defaultValue={player?.status} options={Object.fromEntries(Object.entries(PLAYER_STATUS).map(([k, v]) => [k, v.label]))} />
        </FormGrid>
        <FormGrid cols={3}>
          <TextField label="Boy (cm)" name="heightCm" type="number" defaultValue={player?.heightCm} />
          <TextField label="Kilo (kg)" name="weightKg" type="number" defaultValue={player?.weightKg} />
          <SelectField label="Kullandığı Ayak/El" name="strongSide" defaultValue={player?.strongSide} empty="—" options={{ "Sağ": "Sağ", "Sol": "Sol", "Her ikisi": "Her ikisi" }} />
        </FormGrid>
        <FormGrid cols={3}>
          <SelectField label="İlçe" name="district" defaultValue={player?.district} empty="—" options={DISTRICTS.map((d) => ({ value: d, label: d }))} />
          <TextField label="Okul" name="school" defaultValue={player?.school} className="sm:col-span-2" />
        </FormGrid>
        <FormGrid>
          <TextField label="Lisans No" name="licenseNo" defaultValue={player?.licenseNo} />
          <TextField label="T.C. Kimlik No" name="identityNo" maxLength={11} pattern="\d{11}" defaultValue={player?.identityNo} hint="Gizli — sitede gösterilmez." />
        </FormGrid>
        <FileField label="Fotoğraf" name="photo" current={player?.photoUrl} />
        <TextArea label="Biyografi" name="bio" rows={3} defaultValue={player?.bio} />
        <CheckField label="Takım kaptanı" name="isCaptain" defaultChecked={player?.isCaptain} />
      </div>
    </AdminForm>
  );
}
