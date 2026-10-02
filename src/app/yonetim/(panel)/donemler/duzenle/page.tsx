"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import { getOne } from "@/lib/data";
import { useData } from "@/lib/hooks";
import type { Period } from "@/lib/types";
import { EmptyState } from "@/components/ui";
import { AdminHeader } from "@/components/admin/fields";
import { ActionButton } from "@/components/admin/AdminForm";
import { ErrorBox, PageLoader, Suspended, useParam } from "@/components/client";
import { deletePeriod } from "@/actions/genel";
import { PeriodForm } from "../PeriodForm";

export default function EditPeriod() {
  return <Suspended><Inner /></Suspended>;
}

function Inner() {
  const id = useParam("id") ?? "";
  const { data: period, error } = useData(() => getOne<Period>("periods", id), [id]);
  if (error) return <ErrorBox message={error} />;
  if (period === undefined) return <PageLoader />;
  if (!period) return <EmptyState title="Dönem bulunamadı" />;
  return (
    <>
      <AdminHeader back={{ href: "/yonetim/donemler", label: "Dönemler" }} title={period.title}
        actions={<>
          <Link href={`/basvuru/detay?s=${period.slug}`} target="_blank" className="btn-outline btn-sm">Sitede Gör</Link>
          <Link href={`/yonetim/basvurular?donem=${period.id}`} className="btn-outline btn-sm">Başvurular</Link>
          <ActionButton action={deletePeriod} fields={{ id: period.id }} label="Sil" icon={<Trash2 className="h-3.5 w-3.5" />} confirm="Dönem silinsin mi?" className="btn-outline btn-sm text-red-600" />
        </>} />
      <PeriodForm key={period.id} period={period} />
    </>
  );
}
