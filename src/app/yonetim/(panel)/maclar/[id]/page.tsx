import Link from "next/link";
import { notFound } from "next/navigation";
import { Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { sportDef, eventDef } from "@/lib/constants";
import { Badge, TeamCrest } from "@/components/ui";
import { AdminHeader, FormGrid, Panel, SelectField, TextField } from "@/components/admin/fields";
import { AdminForm, ActionButton } from "@/components/admin/AdminForm";
import { addEvent, deleteEvent, deleteMatch, saveBoxScore } from "@/actions/spor";
import { MatchForm } from "../MatchForm";

export default async function EditMatch({ params }: { params: Promise<{ id: string }> }) {
  await requireUser("SPOR");
  const { id } = await params;
  const match = await db.match.findUnique({
    where: { id },
    include: {
      league: true, homeTeam: { include: { players: { orderBy: [{ jerseyNumber: "asc" }] } } }, awayTeam: { include: { players: { orderBy: [{ jerseyNumber: "asc" }] } } },
      events: { include: { player: true }, orderBy: [{ minute: "asc" }] },
    },
  });
  if (!match) notFound();
  const def = sportDef(match.league.sport);
  const timed = match.league.sport === "FUTBOL" || match.league.sport === "HENTBOL";
  const boxTypes = def.events.filter((e) => e.hasValue).map((e) => e.key);
  const scoringKeys = new Set(def.scoringEvents);
  const sideScore = (teamId: string) => match.events.filter((e) => e.teamId === teamId && scoringKeys.has(e.type)).reduce((s, e) => s + e.value, 0)
    + (match.league.sport === "FUTBOL" ? match.events.filter((e) => e.teamId !== teamId && e.type === "OWN_GOAL").length : 0);

  return (
    <>
      <AdminHeader back={{ href: `/yonetim/maclar?lig=${match.leagueId}`, label: "Maçlar" }}
        title={<span className="flex flex-wrap items-center gap-3"><TeamCrest team={match.homeTeam} size={32} /> {match.homeTeam.name} <span className="rounded-lg bg-basalt-900 px-3 py-1 font-display text-white">{match.homeScore ?? "–"} : {match.awayScore ?? "–"}</span> {match.awayTeam.name} <TeamCrest team={match.awayTeam} size={32} /></span>}
        description={`${def.emoji} ${match.league.name} · ${match.round}. Hafta`}
        actions={<>
          <Link href={`/spor/mac/${match.id}`} target="_blank" className="btn-outline btn-sm">Sitede Gör</Link>
          <ActionButton action={deleteMatch} fields={{ id: match.id }} label="Sil" icon={<Trash2 className="h-3.5 w-3.5" />} confirm="Maç ve tüm olayları silinsin mi?" className="btn-outline btn-sm text-red-600" />
        </>} />
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Maç Bilgileri, Skor & Video"><MatchForm match={match} /></Panel>
        <div className="space-y-6">
          <Panel title="Maç Olayları" description={`Olaylardan hesaplanan skor: ${sideScore(match.homeTeamId)} - ${sideScore(match.awayTeamId)}${def.scoringEvents.length ? "" : ""}. ${def.key === "VOLEYBOL" ? "(Voleybolda sayılar set skorundan bağımsızdır.)" : ""}`}>
            {match.events.length === 0 ? <p className="text-sm text-basalt-500">Henüz olay girilmedi.</p> : (
              <div className="max-h-96 divide-y divide-basalt-100 overflow-y-auto">
                {match.events.map((e) => {
                  const d = eventDef(match.league.sport, e.type);
                  const home = e.teamId === match.homeTeamId;
                  return (
                    <div key={e.id} className="flex items-center gap-2 py-1.5 text-sm">
                      <span className="w-10 text-xs text-basalt-400">{e.minute != null ? `${e.minute}'` : ""}</span>
                      <Badge tone={home ? "blue" : "rose"}>{home ? match.homeTeam.shortName : match.awayTeam.shortName}</Badge>
                      <span className="flex-1 truncate">{e.player ? `${e.player.firstName} ${e.player.lastName}` : "—"}</span>
                      <Badge tone={d?.tone === "goal" ? "green" : d?.tone?.startsWith("card") ? "amber" : "slate"}>{d?.hasValue ? `${e.value} ` : ""}{d?.label ?? e.type}</Badge>
                      <ActionButton action={deleteEvent} fields={{ id: e.id }} label="" icon={<Trash2 className="h-3.5 w-3.5" />} className="btn-ghost btn-sm text-red-500" />
                    </div>
                  );
                })}
              </div>
            )}
            <AdminForm action={addEvent} submitLabel="Olay Ekle" compact className="mt-4 border-t border-basalt-100 pt-4">
              <input type="hidden" name="matchId" value={match.id} />
              <div className="space-y-3">
                <SelectField label="Oyuncu" name="playerId" required empty="Seçiniz" options={[
                  ...match.homeTeam.players.map((p) => ({ value: p.id, label: `${match.homeTeam.shortName} · ${p.jerseyNumber ?? ""} ${p.firstName} ${p.lastName}` })),
                  ...match.awayTeam.players.map((p) => ({ value: p.id, label: `${match.awayTeam.shortName} · ${p.jerseyNumber ?? ""} ${p.firstName} ${p.lastName}` })),
                ]} />
                <FormGrid cols={3}>
                  <SelectField label="Olay" name="type" required options={def.events.map((e) => ({ value: e.key, label: e.label }))} />
                  <TextField label="Değer" name="value" type="number" min={1} defaultValue={1} />
                  <TextField label="Dakika" name="minute" type="number" min={0} max={150} />
                </FormGrid>
              </div>
            </AdminForm>
          </Panel>

          {!timed && boxTypes.length > 0 && [match.homeTeam, match.awayTeam].map((t) => {
            const val = (pid: string, type: string) => match.events.filter((e) => e.playerId === pid && e.type === type && e.minute == null).reduce((s, e) => s + e.value, 0) || "";
            return (
              <Panel key={t.id} title={<span className="flex items-center gap-2"><TeamCrest team={t} size={22} /> {t.name} — Oyuncu İstatistikleri</span>} description="Toplu giriş: boş bırakılan alanlar 0 sayılır. Kaydetmek mevcut dakikasız kayıtların yerini alır.">
                <AdminForm action={saveBoxScore} submitLabel="İstatistikleri Kaydet" compact>
                  <input type="hidden" name="matchId" value={match.id} />
                  <input type="hidden" name="teamId" value={t.id} />
                  <input type="hidden" name="types" value={boxTypes.join(",")} />
                  <div className="overflow-x-auto">
                    <table className="table-base">
                      <thead><tr><th>Oyuncu</th>{boxTypes.map((k) => <th key={k} className="text-center">{eventDef(match.league.sport, k)?.short}</th>)}</tr></thead>
                      <tbody>
                        {t.players.map((p) => (
                          <tr key={p.id}>
                            <td className="text-xs">{p.jerseyNumber} {p.firstName} {p.lastName}</td>
                            {boxTypes.map((k) => <td key={k} className="px-1"><input name={`${p.id}__${k}`} type="number" min={0} defaultValue={val(p.id, k)} className="input w-16 px-2 py-1 text-center text-xs" aria-label={`${p.firstName} ${k}`} /></td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </AdminForm>
              </Panel>
            );
          })}
        </div>
      </div>
    </>
  );
}
