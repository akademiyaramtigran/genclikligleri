import Link from "next/link";
import { notFound } from "next/navigation";
import { Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { AdminHeader } from "@/components/admin/fields";
import { ActionButton } from "@/components/admin/AdminForm";
import { deletePeriod } from "@/actions/genel";
import { PeriodForm } from "../PeriodForm";

export default async function EditPeriod({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const period = await db.applicationPeriod.findUnique({ where: { id } });
  if (!period) notFound();
  return (
    <>
      <AdminHeader back={{ href: "/yonetim/donemler", label: "Dönemler" }} title={period.title}
        actions={<>
          <Link href={`/basvuru/${period.slug}`} target="_blank" className="btn-outline btn-sm">Sitede Gör</Link>
          <Link href={`/yonetim/basvurular?donem=${period.id}`} className="btn-outline btn-sm">Başvurular</Link>
          <ActionButton action={deletePeriod} fields={{ id: period.id }} label="Sil" icon={<Trash2 className="h-3.5 w-3.5" />} confirm="Dönem silinsin mi?" className="btn-outline btn-sm text-red-600" />
        </>} />
      <PeriodForm period={period} />
    </>
  );
}
