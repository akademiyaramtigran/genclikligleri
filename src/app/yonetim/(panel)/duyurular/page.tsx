"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import { getAll } from "@/lib/data";
import { useData } from "@/lib/hooks";
import type { Announcement } from "@/lib/types";
import { ErrorBox, PageLoader } from "@/components/client";
import { ANNOUNCEMENT_CATEGORIES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui";
import { AdminHeader, Panel } from "@/components/admin/fields";
import { ActionButton } from "@/components/admin/AdminForm";
import { deleteAnnouncement } from "@/actions/genel";
import { AnnouncementForm } from "./AnnouncementForm";


export default function AnnouncementsAdmin() {
  const { data, error } = useData(() => getAll<Announcement>("announcements"), []);
  if (error) return <ErrorBox message={error} />;
  if (!data) return <PageLoader />;
  const list = [...data].sort((a, b) => Number(b.isPinned) - Number(a.isPinned) || b.publishedAt.getTime() - a.publishedAt.getTime());
  return (
    <>
      <AdminHeader title="Duyurular" description={`${list.length} duyuru`} />
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="card divide-y divide-basalt-100">
          {list.map((a) => (
            <div key={a.id} className="flex items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-xs"><Badge>{ANNOUNCEMENT_CATEGORIES[a.category]}</Badge>{a.isPinned && <Badge tone="red">Önemli</Badge>}{!a.isPublished && <Badge tone="zinc">Taslak</Badge>}<span className="text-basalt-500">{formatDate(a.publishedAt)}</span></div>
                <Link href={`/yonetim/duyurular/duzenle?id=${a.id}`} className="mt-1 block truncate font-semibold hover:text-dicle-700">{a.title}</Link>
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
