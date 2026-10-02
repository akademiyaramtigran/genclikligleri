import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { CONTESTANT_STATUS } from "@/lib/constants";
import { StatusBadge } from "@/components/ui";
import { AdminHeader, Panel } from "@/components/admin/fields";
import { ContestantForm } from "./ContestantForm";

export const metadata: Metadata = { title: "Yarışmacılar" };

export default async function ContestantsAdmin() {
  await requireUser("MUZIK");
  const list = await db.musicContestant.findMany({ include: { competition: true, _count: { select: { performances: true, votes: { where: { NOT: { dayKey: { endsWith: "#ip" } } } } } } }, orderBy: [{ competition: { createdAt: "desc" } }, { name: "asc" }] });
  return (
    <>
      <AdminHeader back={{ href: "/yonetim/muzik", label: "Müzik Yarışması" }} title="Yarışmacılar" description={`${list.length} yarışmacı`} />
      <div className="grid gap-6 xl:grid-cols-[1fr_28rem]">
        <div className="card overflow-x-auto">
          <table className="table-base">
            <thead><tr><th>Yarışmacı</th><th>Tür</th><th>İlçe</th><th>Yarışma</th><th className="text-center">Oy</th><th>Durum</th></tr></thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.id} className="hover:bg-basalt-50">
                  <td><Link href={`/yonetim/muzik/yarismacilar/${c.id}`} className="font-semibold hover:text-dicle-700">{c.name}</Link><p className="text-xs text-basalt-500">{c.type === "GRUP" ? "Grup" : "Solo"}</p></td>
                  <td>{c.genre}</td><td>{c.district}</td><td className="text-xs">{c.competition.name} {c.competition.edition}</td>
                  <td className="text-center tabular-nums">{c._count.votes}</td>
                  <td><StatusBadge map={CONTESTANT_STATUS} value={c.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Panel title="Yeni Yarışmacı"><ContestantForm /></Panel>
      </div>
    </>
  );
}
