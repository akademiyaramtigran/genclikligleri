"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import { getContestant } from "@/lib/data";
import { useData } from "@/lib/hooks";
import { EmptyState } from "@/components/ui";
import { RequireUnit } from "../../../../AdminContext";
import { ErrorBox, PageLoader, Suspended, useParam } from "@/components/client";
import { AdminHeader, Panel } from "@/components/admin/fields";
import { ActionButton } from "@/components/admin/AdminForm";
import { deleteContestant } from "@/actions/kultur";
import { ContestantForm } from "../ContestantForm";

export default function EditContestant() {
  return <RequireUnit unit="MUZIK"><Suspended><Inner /></Suspended></RequireUnit>;
}

function Inner() {
  const id = useParam("id") ?? "";
  const { data: c, error } = useData(() => getContestant(id), [id]);
  if (error) return <ErrorBox message={error} />;
  if (c === undefined) return <PageLoader />;
  if (!c) return <EmptyState title="Yarışmacı bulunamadı" />;
  return (
    <>
      <AdminHeader back={{ href: "/yonetim/muzik/yarismacilar", label: "Yarışmacılar" }} title={c.name} actions={<>
        <Link href={`/muzik/yarismaci?s=${c.slug}`} target="_blank" className="btn-outline btn-sm">Sitede Gör</Link>
        <ActionButton action={deleteContestant} fields={{ id: c.id }} label="Sil" icon={<Trash2 className="h-3.5 w-3.5" />} confirm="Yarışmacı, performansları ve oylarıyla silinsin mi?" className="btn-outline btn-sm text-red-600" />
      </>} />
      <Panel><ContestantForm key={c.id} c={c} /></Panel>
    </>
  );
}
