"use client";

import { Info, Mail, Trash2 } from "lucide-react";
import { orderBy, limit } from "firebase/firestore";
import type { MailDoc } from "@/lib/types";
import { getAll } from "@/lib/data";
import { useData } from "@/lib/hooks";
import { ErrorBox, PageLoader } from "@/components/client";
import { formatDateTime } from "@/lib/utils";
import { Badge, EmptyState } from "@/components/ui";
import { AdminHeader, Panel } from "@/components/admin/fields";
import { ActionButton } from "@/components/admin/AdminForm";
import { deleteMail } from "@/actions/icerik";

const STATE: Record<string, { label: string; tone: string }> = {
  SUCCESS: { label: "Gönderildi", tone: "green" }, ERROR: { label: "Hata", tone: "red" }, PROCESSING: { label: "Gönderiliyor", tone: "blue" },
  PENDING: { label: "Sırada", tone: "amber" }, RETRY: { label: "Yeniden denenecek", tone: "amber" },
};

export default function MailAdmin() {
  const { data, error } = useData(() => getAll<MailDoc>("mail", orderBy("createdAt", "desc"), limit(100)), []);
  if (error) return <ErrorBox message={error} />;
  if (!data) return <PageLoader />;
  return (
    <>
      <AdminHeader title="E-posta Kutusu" description="Başvuru durumu değiştiğinde başvuru sahibine gidecek bildirimler burada sıraya girer." />
      <div className="mb-6 flex gap-3 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200">
        <Info className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <p className="font-semibold">Demo modu: e-postalar hazırlanıyor ama henüz gönderilmiyor.</p>
          <p className="mt-1">Yayına geçişte Firebase projesi Blaze (kullandıkça öde) planına alınıp <strong>Trigger Email</strong> eklentisi bu kutuya (<code>mail</code> koleksiyonu) bağlandığında, buradaki e-postalar otomatik gönderilir. SMTP için Brevo, Mailgun gibi ücretsiz kotası olan bir servis yeterlidir. Kodda başka değişiklik gerekmez.</p>
        </div>
      </div>
      <Panel>
        {data.length === 0 ? <EmptyState title="Kutu boş" description="Bir başvurunun durumunu değiştirdiğinizde e-posta burada görünür." /> : (
          <div className="divide-y divide-basalt-100">
            {data.map((m) => {
              const st = STATE[m.delivery?.state ?? "PENDING"] ?? STATE.PENDING!;
              return (
                <details key={m.id} className="group py-3">
                  <summary className="flex cursor-pointer list-none items-center gap-3">
                    <Mail className="h-5 w-5 shrink-0 text-basalt-400" />
                    <span className="min-w-0 flex-1"><span className="block truncate font-medium">{m.message?.subject}</span><span className="text-xs text-basalt-500">{m.to} · {formatDateTime(m.createdAt)}</span></span>
                    <Badge tone={st.tone}>{st.label}</Badge>
                  </summary>
                  <div className="mt-3 rounded-xl bg-basalt-50 p-4 text-sm">
                    <p className="whitespace-pre-line text-basalt-700">{m.message?.text}</p>
                    <div className="mt-3"><ActionButton action={deleteMail} fields={{ id: m.id }} label="Sil" icon={<Trash2 className="h-3.5 w-3.5" />} className="btn-ghost btn-sm text-red-600" /></div>
                  </div>
                </details>
              );
            })}
          </div>
        )}
      </Panel>
    </>
  );
}
