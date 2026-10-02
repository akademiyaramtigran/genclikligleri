import Link from "next/link";
import { notFound } from "next/navigation";
import { Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { PLAYER_STATUS, sportDef } from "@/lib/constants";
import { age } from "@/lib/utils";
import { Avatar, StatusBadge } from "@/components/ui";
import { AdminHeader, Panel } from "@/components/admin/fields";
import { ActionButton } from "@/components/admin/AdminForm";
import { deleteTeam } from "@/actions/spor";
import { TeamForm } from "../TeamForm";

export default async function EditTeam({ params }: { params: Promise<{ id: string }> }) {
  await requireUser("SPOR");
  const { id } = await params;
  const team = await db.team.findUnique({ where: { id }, include: { players: { orderBy: [{ jerseyNumber: "asc" }] }, entries: { include: { league: true } } } });
  if (!team) notFound();
  const def = sportDef(team.sport);
  return (
    <>
      <AdminHeader back={{ href: "/yonetim/takimlar", label: "Takımlar" }} title={team.name} description={`${def.emoji} ${def.label} · ${team.gender === "KADIN" ? "Kadın" : "Erkek"} · ${team.entries.map((e) => e.league.name).join(", ") || "Ligi yok"}`}
        actions={<>
          <Link href={`/spor/takim/${team.slug}`} target="_blank" className="btn-outline btn-sm">Sitede Gör</Link>
          <ActionButton action={deleteTeam} fields={{ id: team.id }} label="Sil" icon={<Trash2 className="h-3.5 w-3.5" />} confirm="Takım silinsin mi?" className="btn-outline btn-sm text-red-600" />
        </>} />
      <div className="grid gap-6 xl:grid-cols-[1fr_26rem]">
        <Panel title="Takım Bilgileri"><TeamForm team={team} /></Panel>
        <Panel title={`Kadro (${team.players.length})`} description={`Önerilen kadro: ${def.minSquad}-${def.maxSquad} oyuncu`} actions={<Link href={`/yonetim/oyuncular/yeni?takim=${team.id}`} className="btn-outline btn-sm">+ Oyuncu</Link>}>
          <div className="divide-y divide-basalt-100">
            {team.players.map((p) => (
              <Link key={p.id} href={`/yonetim/oyuncular/${p.id}`} className="flex items-center gap-3 py-2 hover:bg-basalt-50">
                <span className="w-7 text-center font-display font-bold text-basalt-400">{p.jerseyNumber ?? "–"}</span>
                <Avatar name={`${p.firstName} ${p.lastName}`} src={p.photoUrl} size={32} color={team.primaryColor} />
                <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{p.firstName} {p.lastName}{p.isCaptain && " (K)"}</span><span className="text-xs text-basalt-500">{p.position} {age(p.birthDate) ? `· ${age(p.birthDate)} yaş` : ""}</span></span>
                {p.status !== "ACTIVE" && <StatusBadge map={PLAYER_STATUS} value={p.status} />}
              </Link>
            ))}
            {team.players.length === 0 && <p className="text-sm text-basalt-500">Henüz oyuncu yok.</p>}
          </div>
        </Panel>
      </div>
    </>
  );
}
