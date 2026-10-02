"use client";

import { Trash2, MailOpen, Mail } from "lucide-react";
import { getMessages } from "@/lib/admin-data";
import { useData } from "@/lib/hooks";
import { ErrorBox, PageLoader } from "@/components/client";
import { formatDateTime, cn } from "@/lib/utils";
import { Badge, EmptyState } from "@/components/ui";
import { AdminHeader } from "@/components/admin/fields";
import { ActionButton } from "@/components/admin/AdminForm";
import { messageAction } from "@/actions/genel";


export default function MessagesAdmin() {
  const { data: list, error } = useData(getMessages, []);
  if (error) return <ErrorBox message={error} />;
  if (!list) return <PageLoader />;
  return (
    <>
      <AdminHeader title="İletişim Mesajları" description={`${list.filter((m) => !m.isRead).length} okunmamış`} />
      {list.length === 0 ? <EmptyState title="Mesaj yok" /> : (
        <div className="space-y-3">
          {list.map((m) => (
            <div key={m.id} className={cn("card p-5", !m.isRead && "border-l-4 border-l-dicle-500")}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{m.subject} {!m.isRead && <Badge tone="green">Yeni</Badge>}</p>
                  <p className="text-xs text-basalt-500">{m.name} · <a href={`mailto:${m.email}`} className="link">{m.email}</a>{m.phone ? ` · ${m.phone}` : ""} · {formatDateTime(m.createdAt)}</p>
                </div>
                <div className="flex gap-1">
                  <ActionButton action={messageAction} fields={{ id: m.id, op: m.isRead ? "unread" : "read" }} label={m.isRead ? "Okunmadı yap" : "Okundu"} icon={m.isRead ? <Mail className="h-3.5 w-3.5" /> : <MailOpen className="h-3.5 w-3.5" />} />
                  <ActionButton action={messageAction} fields={{ id: m.id, op: "delete" }} label="" icon={<Trash2 className="h-3.5 w-3.5" />} confirm="Mesaj silinsin mi?" className="btn-ghost btn-sm text-red-500" />
                </div>
              </div>
              <p className="mt-3 whitespace-pre-line text-sm text-basalt-700">{m.message}</p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
