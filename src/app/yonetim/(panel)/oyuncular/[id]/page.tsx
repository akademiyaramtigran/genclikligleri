import Link from "next/link";
import { notFound } from "next/navigation";
import { Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getPlayerTotals } from "@/lib/stats";
import { sportDef } from "@/lib/constants";
import { AdminHeader, Panel } from "@/components/admin/fields";
import { ActionButton } from "@/components/admin/AdminForm";
import { KeyValue } from "@/components/ui";
import { deletePlayer } from "@/actions/spor";
import { PlayerForm } from "../PlayerForm";

export default async function EditPlayer({ params }: { params: Promise<{ id: string }> }) {
  await requireUser("SPOR");
  const { id } = await params;
  const player = await db.player.findUnique({ where: { id }, include: { team: true } });
  if (!player) notFound();
  const { totals } = await getPlayerTotals(player.id);
  const def = sportDef(player.team?.sport ?? "FUTBOL");
  return (
    <>
      <AdminHeader back={{ href: player.team ? `/yonetim/takimlar/${player.team.id}` : "/yonetim/oyuncular", label: player.team?.name ?? "Oyuncular" }} title={`${player.firstName} ${player.lastName}`}
        actions={<>
          <Link href={`/spor/oyuncu/${player.slug}`} target="_blank" className="btn-outline btn-sm">Profili Gör</Link>
          <ActionButton action={deletePlayer} fields={{ id: player.id }} label="Sil" icon={<Trash2 className="h-3.5 w-3.5" />} confirm="Oyuncu ve tüm istatistikleri silinsin mi?" className="btn-outline btn-sm text-red-600" />
        </>} />
      <div className="grid gap-6 xl:grid-cols-[1fr_20rem]">
        <Panel title="Oyuncu Bilgileri"><PlayerForm player={player} /></Panel>
        <Panel title="İstatistik Özeti" description="Maç ekranından girilen olaylardan hesaplanır.">
          <KeyValue items={def.events.map((e) => [e.label, totals[e.key] ?? 0] as [string, number])} />
        </Panel>
      </div>
    </>
  );
}
