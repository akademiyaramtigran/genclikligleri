"use client";

import Link from "next/link";
import { Trash2, Wand2 } from "lucide-react";
import { where } from "firebase/firestore";
import { getAll, getOne, getSeasons, getTeams } from "@/lib/data";
import { useData } from "@/lib/hooks";
import type { League, Match, Team } from "@/lib/types";
import { EmptyState } from "@/components/ui";
import { RequireUnit } from "../../../AdminContext";
import { ErrorBox, PageLoader, Suspended, useParam } from "@/components/client";
import { sportDef } from "@/lib/constants";
import { TeamCrest } from "@/components/ui";
import { AdminHeader, CheckField, FormGrid, Panel, TextField } from "@/components/admin/fields";
import { AdminForm, ActionButton } from "@/components/admin/AdminForm";
import { addEntry, deleteLeague, generateFixtures, saveLeague, updateEntry } from "@/actions/spor";
import { LeagueFields } from "../LeagueFields";

export default function LeagueAdmin() {
  return <RequireUnit unit="SPOR"><Suspended><Inner /></Suspended></RequireUnit>;
}

function Inner() {
  const id = useParam("id") ?? "";
  const { data, error } = useData(async () => {
    const league = await getOne<League>("leagues", id);
    if (!league) return null;
    const [seasons, teams, matches] = await Promise.all([getSeasons(), getTeams(), getAll<Match>("matches", where("leagueId", "==", id))]);
    return { league, seasons, teams, matchCount: matches.length };
  }, [id]);
  if (error) return <ErrorBox message={error} />;
  if (data === undefined) return <PageLoader />;
  if (!data) return <EmptyState title="Lig bulunamadı" />;
  const { league, seasons, teams, matchCount } = data;
  const teamMap = new Map(teams.map((t) => [t.id, t]));
  const entries = league.entries.map((e) => ({ ...e, id: e.teamId, team: teamMap.get(e.teamId) })).filter((e): e is typeof e & { team: Team } => !!e.team).sort((a, b) => a.team.name.localeCompare(b.team.name, "tr"));
  const candidates = teams.filter((t) => t.sport === league.sport && t.gender === league.gender && t.status === "ACTIVE" && !league.entries.some((e) => e.teamId === t.id));
  const standings = league.summary?.standings ?? [];
  const def = sportDef(league.sport);

  return (
    <>
      <AdminHeader back={{ href: "/yonetim/ligler", label: "Ligler" }} title={`${def.emoji} ${league.name}`} description={`${league.entries.length} takım · ${matchCount} maç`}
        actions={<>
          <Link href={`/spor/lig?s=${league.slug}`} target="_blank" className="btn-outline btn-sm">Sitede Gör</Link>
          <Link href={`/yonetim/maclar?lig=${league.id}`} className="btn-outline btn-sm">Maçlar</Link>
          <ActionButton action={deleteLeague} fields={{ id: league.id }} label="Ligi Sil" icon={<Trash2 className="h-3.5 w-3.5" />} confirm="Lig, tüm maçları ve istatistikleriyle silinecek. Emin misiniz?" className="btn-outline btn-sm text-red-600" />
        </>} />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Panel title={`Takımlar (${entries.length})`} description="Puan silme cezası puan durumundan düşülür.">
            {entries.length === 0 && <p className="text-sm text-basalt-500">Ligde henüz takım yok.</p>}
            <div className="divide-y divide-basalt-100">
              {entries.map((e) => {
                const row = standings.find((r) => r.teamId === e.teamId);
                return (
                  <div key={e.id} className="flex flex-wrap items-center gap-3 py-2.5">
                    <span className="w-6 text-center font-display font-bold text-basalt-400">{row?.position}</span>
                    <TeamCrest team={e.team} size={28} />
                    <Link href={`/yonetim/takimlar/duzenle?id=${e.teamId}`} className="min-w-0 flex-1 truncate text-sm font-medium hover:text-dicle-700">{e.team.name}</Link>
                    <span className="text-xs text-basalt-500">{row?.points ?? 0} P</span>
                    <AdminForm action={updateEntry} compact submitLabel="✓" className="flex items-center gap-1 [&>div]:mt-0">
                      <input type="hidden" name="leagueId" value={league.id} />
                      <input type="hidden" name="teamId" value={e.teamId} />
                      <input name="penaltyPoints" type="number" min={0} defaultValue={e.penaltyPoints} className="input w-16 py-1 text-center text-xs" title="Ceza puanı" aria-label="Ceza puanı" />
                    </AdminForm>
                    <ActionButton action={updateEntry} fields={{ leagueId: league.id, teamId: e.teamId, remove: "1" }} label="" icon={<Trash2 className="h-3.5 w-3.5" />} confirm={`${e.team.name} ligden çıkarılsın mı?`} className="btn-ghost btn-sm text-red-600" />
                  </div>
                );
              })}
            </div>
            {candidates.length > 0 && (
              <AdminForm action={addEntry} submitLabel="Seçili Takımları Ekle" compact className="mt-4 border-t border-basalt-100 pt-4">
                <input type="hidden" name="leagueId" value={league.id} />
                <p className="mb-2 text-sm font-semibold">Lige takım ekle</p>
                <div className="grid max-h-56 gap-1 overflow-y-auto sm:grid-cols-2">
                  {candidates.map((t) => (
                    <label key={t.id} className="flex items-center gap-2 rounded-lg p-1.5 text-sm hover:bg-basalt-50"><input type="checkbox" name="teamId" value={t.id} className="accent-dicle-600" /> <TeamCrest team={t} size={20} /> {t.name}</label>
                  ))}
                </div>
              </AdminForm>
            )}
            <Link href={`/yonetim/takimlar/yeni?lig=${league.id}`} className="mt-3 inline-block text-sm text-dicle-700">+ Yeni takım oluştur</Link>
          </Panel>

          <Panel title={<span className="flex items-center gap-2"><Wand2 className="h-4 w-4 text-fuchsia-500" /> Otomatik Fikstür Oluştur</span>} description="Çember (round-robin) yöntemiyle her takımın her takımla eşleştiği fikstür üretilir. İç saha olarak takımın tesisi atanır.">
            <AdminForm action={generateFixtures} submitLabel="Fikstürü Oluştur" confirm="Fikstür oluşturulacak. Devam edilsin mi?">
              <input type="hidden" name="leagueId" value={league.id} />
              <div className="space-y-4">
                <FormGrid>
                  <TextField label="İlk maç tarihi & saati" name="start" type="datetime-local" required />
                  <TextField label="Haftalar arası gün" name="interval" type="number" min={1} defaultValue={7} />
                </FormGrid>
                <TextField label="Aynı gün maçlar arası (dakika)" name="gap" type="number" min={0} defaultValue={120} />
                <CheckField label="Çift devreli (rövanşlı)" name="double" defaultChecked />
                {matchCount > 0 && <CheckField label="Mevcut planlanmış maçları sil" name="replace" hint="Oynanmış maçlar korunur." />}
              </div>
            </AdminForm>
          </Panel>
        </div>
        <Panel title="Lig Bilgileri">
          <AdminForm key={league.id} action={saveLeague}><LeagueFields league={league} seasons={seasons} /></AdminForm>
        </Panel>
      </div>
    </>
  );
}
