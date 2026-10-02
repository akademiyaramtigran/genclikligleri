"use client";

import Link from "next/link";
import { getOne } from "@/lib/data";
import { useData } from "@/lib/hooks";
import type { Announcement } from "@/lib/types";
import { EmptyState } from "@/components/ui";
import { ErrorBox, PageLoader, Suspended, useParam } from "@/components/client";
import { AdminHeader, Panel } from "@/components/admin/fields";
import { AnnouncementForm } from "../AnnouncementForm";

export default function EditAnnouncement() {
  return <Suspended><Inner /></Suspended>;
}

function Inner() {
  const id = useParam("id") ?? "";
  const { data: a, error } = useData(() => getOne<Announcement>("announcements", id), [id]);
  if (error) return <ErrorBox message={error} />;
  if (a === undefined) return <PageLoader />;
  if (!a) return <EmptyState title="Duyuru bulunamadı" />;
  return (
    <>
      <AdminHeader back={{ href: "/yonetim/duyurular", label: "Duyurular" }} title={a.title} actions={<Link href={`/duyurular/oku?s=${a.slug}`} target="_blank" className="btn-outline btn-sm">Sitede Gör</Link>} />
      <Panel><AnnouncementForm key={a.id} a={a} /></Panel>
    </>
  );
}
