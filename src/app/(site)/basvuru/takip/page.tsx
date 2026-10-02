"use client";

import Link from "next/link";
import { Search, CheckCircle2, Circle, XCircle, AlertTriangle } from "lucide-react";
import { getAppStatus } from "@/lib/data";
import { sha256 } from "@/actions/public";
import { useData, useTitle } from "@/lib/hooks";
import { Suspended, useParam, withBase, PageLoader } from "@/components/client";
import { APPLICATION_STATUS } from "@/lib/constants";
import { cn, formatDateTime } from "@/lib/utils";
import { Badge, PageHero } from "@/components/ui";


import { useT } from "@/lib/i18n";
export default function TrackPage() {
  return <Suspended><Inner /></Suspended>;
}

function Inner() {
  const t = useT();
  useTitle(t("Başvuru Takip"));
  const sp = { kod: useParam("kod"), eposta: useParam("eposta") };
  const code = sp.kod?.trim().toUpperCase();
  const email = sp.eposta?.trim().toLowerCase();
  const searched = !!(code && email);
  const { data: app, loading } = useData(async () => {
    if (!code || !email) return null;
    const st = await getAppStatus(code).catch(() => null);
    if (!st || st.emailHash !== (await sha256(email))) return null;
    return st;
  }, [code, email]);
  const flow = ["PENDING", "IN_REVIEW", "APPROVED"];
  const idx = app ? (app.status === "NEEDS_REVISION" ? 1 : app.status === "REJECTED" ? 2 : flow.indexOf(app.status)) : -1;

  return (
    <>
      <PageHero eyebrow={t("Başvurular")} title={t("Başvuru Takip")} description={t("Başvuru sırasında verilen takip kodu ve e-posta adresiyle başvurunuzun durumunu sorgulayın.")} />
      <div className="container-x max-w-3xl py-10">
        <form className="card grid gap-4 p-6 sm:grid-cols-[1fr_1fr_auto] sm:items-end" action={withBase("/basvuru/takip/")}>
          <div><label className="label" htmlFor="kod">{t("Takip Kodu")}</label><input id="kod" name="kod" defaultValue={sp.kod} required placeholder={"DGOXXXXX"} className="input font-mono uppercase tracking-widest" /></div>
          <div><label className="label" htmlFor="eposta">{t("E-posta")}</label><input id="eposta" name="eposta" type="email" defaultValue={sp.eposta} required className="input" /></div>
          <button className="btn-primary"><Search className="h-4 w-4" /> {t("Sorgula")}</button>
        </form>

        {searched && loading && <PageLoader className="min-h-[20vh]" />}
        {searched && !loading && !app && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl bg-red-50 p-5 text-sm text-red-700 ring-1 ring-red-200">
            <XCircle className="h-5 w-5 shrink-0" /> Bu bilgilerle eşleşen bir başvuru bulunamadı. Kodunuzu ve e-posta adresinizi kontrol edin.
          </div>
        )}

        {app && (
          <div className="card mt-6 overflow-hidden">
            <div className="border-b border-basalt-100 p-6">
              <p className="text-xs text-basalt-500">{app.periodTitle}</p>
              <h2 className="mt-1 text-2xl font-semibold">{app.title}</h2>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge tone={APPLICATION_STATUS[app.status]?.tone}>{t(APPLICATION_STATUS[app.status]?.label ?? "")}</Badge>
                <span className="font-mono text-xs text-basalt-500">{app.id}</span>
                <span className="text-xs text-basalt-500">{t("· Başvuru:")} {formatDateTime(app.createdAt)}</span>
              </div>
            </div>
            <div className="p-6">
              <ol className="relative grid grid-cols-3">
                {["Alındı", "İnceleme", app.status === "REJECTED" ? "Reddedildi" : "Sonuç"].map((label, i) => {
                  const done = i <= idx;
                  const bad = i === 2 && app.status === "REJECTED";
                  const warn = i === 1 && app.status === "NEEDS_REVISION";
                  return (
                    <li key={label} className="relative flex flex-col items-center text-center">
                      {i > 0 && <span className={cn("absolute right-1/2 top-4 h-0.5 w-full", done ? "bg-emerald-500" : "bg-basalt-200")} />}
                      <span className={cn("relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white")}>
                        {bad ? <XCircle className="h-8 w-8 text-red-500" /> : warn ? <AlertTriangle className="h-8 w-8 text-amber-500" /> : done ? <CheckCircle2 className="h-8 w-8 text-emerald-500" /> : <Circle className="h-8 w-8 text-basalt-300" />}
                      </span>
                      <span className="mt-2 text-xs font-semibold">{warn ? "Eksik Evrak" : label}</span>
                    </li>
                  );
                })}
              </ol>
              <p className="mt-6 rounded-xl bg-basalt-50 p-4 text-sm text-basalt-700">{APPLICATION_STATUS[app.status]?.description}</p>
              {app.publicNote && (
                <div className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200">
                  <p className="font-semibold">{t("Organizasyon notu")}</p>
                  <p className="mt-1 whitespace-pre-line">{app.publicNote}</p>
                </div>
              )}
              <div className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
                <div><p className="text-basalt-500">{t("Kayıtlı kişi sayısı")}</p><p className="font-semibold">{app.memberCount}</p></div>
                <div><p className="text-basalt-500">{t("Yüklenen belgeler")}</p><p className="font-semibold">{app.docLabels?.length ? app.docLabels.map((d) => d.split("(")[0]).join(", ") : "—"}</p></div>
              </div>
              {app.reviewedAt && <p className="mt-4 text-xs text-basalt-400">{t("Son güncelleme:")} {formatDateTime(app.reviewedAt)}</p>}
            </div>
          </div>
        )}
        <p className="mt-6 text-center text-sm text-basalt-500">{t("Takip kodunuzu kaybettiyseniz")} <Link href="/iletisim" className="link">{t("iletişim formu")}</Link> {t("ile bize ulaşın.")}</p>
      </div>
    </>
  );
}
