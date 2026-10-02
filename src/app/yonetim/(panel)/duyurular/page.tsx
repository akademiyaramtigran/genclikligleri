import Link from "next/link";
import type { Metadata } from "next";
import { Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ANNOUNCEMENT_CATEGORIES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui";
import { AdminHeader, Panel } from "@/components/admin/fields";
import { ActionButton } from "@/components/admin/AdminForm";
import { deleteAnnouncement } from "@/actions/genel";
import { AnnouncementForm } from "./AnnouncementForm";

export const metadata: Metadata = { title: "Duyurular" };

export default async function AnnouncementsAdmin() {
  await requireUser();
  const list = await db.announcement.findMany({ orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }] });
  return (
    <>
      <AdminHeader title="Duyurular" description={`${list.length} duyuru`} />
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="card divide-y divide-basalt-100">
          {list.map((a) => (
            <div key={a.id} className="flex items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-xs"><Badge>{ANNOUNCEMENT_CATEGORIES[a.category]}</Badge>{a.isPinned && <Badge tone="red">Önemli</Badge>}{!a.isPublished && <Badge tone="zinc">Taslak</Badge>}<span className="text-basalt-500">{formatDate(a.publishedAt)}</span></div>
                <Link href={`/yonetim/duyurular/${a.id}`} className="mt-1 block truncate font-semibold hover:text-dicle-700">{a.title}</Link>
              </div>
              <ActionButton action={deleteAnnouncement} fields={{ id: a.id }} label="" icon={<Trash2 className="h-3.5 w-3.5" />} confirm="Duyuru silinsin mi?" className="btn-ghost btn-sm text-red-500" />
            </div>
          ))}
        </div>
        <Panel title="Yeni Duyuru"><AnnouncementForm /></Panel>
      </div>
    </>
  );
}
