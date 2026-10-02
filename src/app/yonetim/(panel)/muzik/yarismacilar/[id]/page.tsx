import Link from "next/link";
import { notFound } from "next/navigation";
import { Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { AdminHeader, Panel } from "@/components/admin/fields";
import { ActionButton } from "@/components/admin/AdminForm";
import { deleteContestant } from "@/actions/kultur";
import { ContestantForm } from "../ContestantForm";

export default async function EditContestant({ params }: { params: Promise<{ id: string }> }) {
  await requireUser("MUZIK");
  const { id } = await params;
  const c = await db.musicContestant.findUnique({ where: { id } });
  if (!c) notFound();
  return (
    <>
      <AdminHeader back={{ href: "/yonetim/muzik/yarismacilar", label: "Yarışmacılar" }} title={c.name} actions={<>
        <Link href={`/muzik/yarismaci/${c.slug}`} target="_blank" className="btn-outline btn-sm">Sitede Gör</Link>
        <ActionButton action={deleteContestant} fields={{ id: c.id }} label="Sil" icon={<Trash2 className="h-3.5 w-3.5" />} confirm="Yarışmacı, performansları ve oylarıyla silinsin mi?" className="btn-outline btn-sm text-red-600" />
      </>} />
      <Panel><ContestantForm c={c} /></Panel>
    </>
  );
}
