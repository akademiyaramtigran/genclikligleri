"use client";

import { useRouter } from "next/navigation";
import type { Match, Player } from "@/lib/types";
import { getLeague, getLeagues, getTeamPlayers, getTeams, getVenues } from "@/lib/data";
import { useData } from "@/lib/hooks";
import { MATCH_STATUS, sportDef } from "@/lib/constants";
import { toDateTimeLocal } from "@/lib/utils";
import { AdminForm } from "@/components/admin/AdminForm";
import { FormGrid, SelectField, TextArea, TextField } from "@/components/admin/fields";
import { saveMatch } from "@/actions/spor";

export function MatchForm({ match, leagueId }: { match?: Match; leagueId?: string }) {
  const router = useRouter();
  const lid = match?.leagueId ?? leagueId;
  const { data } = useData(async () => {
    const [leagues, venues, league, allTeams] = await Promise.all([getLeagues(), getVenues(), lid ? getLeague(lid) : null, getTeams()]);
    const leagueTeams = league ? allTeams.filter((t) => league.entries.some((e) => e.teamId === t.id)) : [];
    const squads: { teamShort: string; players: Player[] }[] = match
      ? await Promise.all([match.homeTeamId, match.awayTeamId].map(async (tid) => ({ teamShort: allTeams.find((t) => t.id === tid)?.shortName ?? "", players: await getTeamPlayers(tid) })))
      : [];
    return { leagues, venues, league, leagueTeams, squads };
  }, [lid, match?.id]);
  if (!data) return null;
  const { leagues, venues, league } = data;
  if (!league) {
    return (
      <form className="flex flex-wrap items-end gap-3" onSubmit={(e) => { e.preventDefault(); const v = new FormData(e.currentTarget).get("lig"); if (v) router.push(`/yonetim/maclar/yeni?lig=${v}`); }}>
        <SelectField label="Önce lig seçin" name="lig" options={leagues.map((l) => ({ value: l.id, label: `${l.name} (${l.seasonName})` }))} className="min-w-[18rem]" />
        <button className="btn-primary">Devam</button>
      </form>
    );
  }
  const def = sportDef(league.sport);
  const teams = data.leagueTeams;
  const players = data.squads.flatMap((sq) => sq.players.map((p) => ({ value: p.id, label: `${p.firstName} ${p.lastName} (${sq.teamShort})` })));
  return (
    <AdminForm action={saveMatch} submitLabel={match ? "Maçı Kaydet" : "Maçı Oluştur"}>
      {match && <input type="hidden" name="id" value={match.id} />}
      <input type="hidden" name="leagueId" value={league.id} />
      <div className="space-y-4">
        <p className="text-sm text-basalt-600">{def.emoji} <strong>{league.name}</strong></p>
        <FormGrid>
          <SelectField label="Ev Sahibi" name="homeTeamId" required defaultValue={match?.homeTeamId} empty="Seçiniz" options={teams.map((t) => ({ value: t.id, label: t.name }))} />
          <SelectField label="Deplasman" name="awayTeamId" required defaultValue={match?.awayTeamId} empty="Seçiniz" options={teams.map((t) => ({ value: t.id, label: t.name }))} />
        </FormGrid>
        <FormGrid cols={3}>
          <TextField label="Tarih & Saat" name="date" type="datetime-local" required defaultValue={toDateTimeLocal(match?.date)} />
          <TextField label="Hafta" name="round" type="number" min={1} defaultValue={match?.round ?? 1} />
          <SelectField label="Tesis" name="venueId" defaultValue={match?.venueId} empty="—" options={venues.map((v) => ({ value: v.id, label: v.name }))} />
        </FormGrid>
        <div className="rounded-2xl bg-basalt-50 p-4">
          <FormGrid cols={4}>
            <SelectField label="Durum" name="status" defaultValue={match?.status} options={Object.fromEntries(Object.entries(MATCH_STATUS).map(([k, v]) => [k, v.label]))} />
            <TextField label={`Ev Sahibi ${def.scoreLabel}`} name="homeScore" type="number" min={0} defaultValue={match?.homeScore} />
            <TextField label={`Deplasman ${def.scoreLabel}`} name="awayScore" type="number" min={0} defaultValue={match?.awayScore} />
            <TextField label="Periyot / Set Skorları" name="periodScores" defaultValue={match?.periodScores} placeholder={def.periodHint.split("(")[1]?.replace(")", "")} />
          </FormGrid>
          {league.sport === "VOLEYBOL" && <p className="hint">Voleybolda skor olarak kazanılan set sayısını girin (ör. 3-1).</p>}
        </div>
        <TextField label="YouTube Maç Videosu" name="youtubeUrl" type="url" defaultValue={match?.youtubeUrl} placeholder="https://www.youtube.com/watch?v=…" hint="Maç kaydı YouTube'a yüklendikten sonra bağlantıyı yapıştırın; sitede otomatik gömülür." />
        <FormGrid cols={3}>
          <TextField label="Hakem" name="referee" defaultValue={match?.referee} />
          <TextField label="Seyirci" name="attendance" type="number" min={0} defaultValue={match?.attendance} />
          {match && <SelectField label="Maçın Oyuncusu" name="mvpPlayerId" defaultValue={match.mvpPlayerId} empty="—" options={players} />}
        </FormGrid>
        <TextArea label="Maç Özeti" name="summary" rows={3} defaultValue={match?.summary} />
      </div>
    </AdminForm>
  );
}
