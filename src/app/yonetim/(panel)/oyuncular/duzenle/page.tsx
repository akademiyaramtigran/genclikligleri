"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import { getPlayer, getPlayerMatches, getTeam } from "@/lib/data";
import { playerTotals } from "@/lib/stats";
import { useData } from "@/lib/hooks";
import { RequireUnit } from "../../../AdminContext";
import { ErrorBox, PageLoader, Suspended, useParam } from "@/components/client";
import { sportDef } from "@/lib/constants";
import { AdminHeader, Panel } from "@/components/admin/fields";
import { ActionButton } from "@/components/admin/AdminForm";
import { EmptyState, KeyValue } from "@/components/ui";
import { deletePlayer } from "@/actions/spor";
import { PlayerForm } from "../PlayerForm";

export default function EditPlayer() {
  return <RequireUnit unit="SPOR"><Suspended><Inner /></Suspended></RequireUnit>;
}

function Inner() {
  const id = useParam("id") ?? "";
  const { data, error } = useData(async () => {
    const player = await getPlayer(id);
    if (!player) return null;
    const [team, matches] = await Promise.all([player.teamId ? getTeam(player.teamId) : null, getPlayerMatches(id)]);
    return { player: { ...player, team }, totals: playerTotals(matches, id).totals };
  }, [id]);
  if (error) return <ErrorBox message={error} />;
  if (data === undefined) return <PageLoader />;
  if (!data) return <EmptyState title="Oyuncu bulunamadı" />;
  const { player, totals } = data;
  const def = sportDef(player.team?.sport ?? player.sport ?? "FUTBOL");
  return (
    <>
      <AdminHeader back={{ href: player.team ? `/yonetim/takimlar/duzenle?id=${player.team.id}` : "/yonetim/oyuncular", label: player.team?.name ?? "Oyuncular" }} title={`${player.firstName} ${player.lastName}`}
        actions={<>
          <Link href={`/spor/oyuncu?s=${player.slug}`} target="_blank" className="btn-outline btn-sm">Profili Gör</Link>
          <ActionButton action={deletePlayer} fields={{ id: player.id }} label="Sil" icon={<Trash2 className="h-3.5 w-3.5" />} confirm="Oyuncu ve tüm istatistikleri silinsin mi?" className="btn-outline btn-sm text-red-600" />
        </>} />
      <div className="grid gap-6 xl:grid-cols-[1fr_20rem]">
        <Panel title="Oyuncu Bilgileri"><PlayerForm key={player.id} player={player} /></Panel>
        <Panel title="İstatistik Özeti" description="Maç ekranından girilen olaylardan hesaplanır.">
          <KeyValue items={def.events.map((e) => [e.label, totals[e.key] ?? 0] as [string, number])} />
        </Panel>
      </div>
    </>
  );
}
