import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { AdminHeader, Panel } from "@/components/admin/fields";
import { AnnouncementForm } from "../AnnouncementForm";

export default async function EditAnnouncement({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const a = await db.announcement.findUnique({ where: { id } });
  if (!a) notFound();
  return (
    <>
      <AdminHeader back={{ href: "/yonetim/duyurular", label: "Duyurular" }} title={a.title} actions={<Link href={`/duyurular/${a.slug}`} target="_blank" className="btn-outline btn-sm">Sitede Gör</Link>} />
      <Panel><AnnouncementForm a={a} /></Panel>
    </>
  );
}
