"use client";

import Link from "next/link";
import { CheckCircle2, ExternalLink, Trash2 } from "lucide-react";
import { getActiveLeagues, getOne } from "@/lib/data";
import { canAccess } from "@/lib/admin";
import { useData } from "@/lib/hooks";
import type { Application, Period } from "@/lib/types";
import { useAdmin } from "../../../AdminContext";
import { ErrorBox, PageLoader, Suspended, useParam } from "@/components/client";
import { DocLink } from "./DocLink";
import { APPLICATION_STATUS, CATEGORIES, SPORTS, WRITING_CATEGORIES, WRITING_LANGUAGES, type SportKey } from "@/lib/constants";
import { age, formatDateTime } from "@/lib/utils";
import { Badge, EmptyState, KeyValue } from "@/components/ui";
import { AdminHeader, Panel, SelectField, TextArea } from "@/components/admin/fields";
import { AdminForm, ActionButton } from "@/components/admin/AdminForm";
import { approveApplication, deleteApplication, updateApplication } from "@/actions/genel";


const LABELS: Record<string, string> = {
  shortName: "Kısa Ad", sport: "Branş", gender: "Kategori", coachName: "Antrenör", coachPhone: "Antrenör Tel.", primaryColor: "Ana Renk", secondaryColor: "İkinci Renk",
  homeVenue: "İç Saha Tercihi", foundedYear: "Kuruluş", note: "Tanıtım", type: "Katılım", genre: "Tür", demoUrl: "Demo", instagram: "Instagram", bio: "Biyografi", songs: "Eserler",
  playTitle: "Oyun", playwright: "Yazar", director: "Yönetmen", durationMin: "Süre (dk)", language: "Dil", synopsis: "Özet", techNeeds: "Teknik İhtiyaçlar", videoUrl: "Video",
  penName: "Rumuz", workCategory: "Kategori", pageCount: "Sayfa", school: "Okul / Meslek",
};

export default function ApplicationDetail() {
  return <Suspended><Inner /></Suspended>;
}

function Inner() {
  const user = useAdmin();
  const id = useParam("id") ?? "";
  const { data, error } = useData(async () => {
    const app = await getOne<Application>("applications", id);
    if (!app) return null;
    const [period, leagues] = await Promise.all([getOne<Period>("periods", app.periodId), getActiveLeagues()]);
    return { app, period, leagues };
  }, [id]);
  if (error) return <ErrorBox message={error} />;
  if (data === undefined) return <PageLoader />;
  if (!data) return <EmptyState title="Başvuru bulunamadı" />;
  const { app } = data;
  if (!canAccess(user, app.category as "SPOR")) return <EmptyState title="Bu başvuru için yetkiniz yok" />;
  const period = data.period ?? ({ minAge: null, maxAge: null, minMembers: null, maxMembers: null, requiredDocuments: [], leagueId: null, leagueName: null, sport: null, gender: null, title: app.periodTitle, id: app.periodId } as unknown as Period);
  const appData = app.data ?? {};
  const members = app.members ?? [];
  const isSport = app.category === "SPOR";
  const sport = (appData.sport || period.sport) as SportKey | undefined;
  const gender = appData.gender || period.gender;
  const leagues = isSport ? data.leagues.filter((l) => (!sport || l.sport === sport) && (!gender || l.gender === gender)) : [];
  const resultLink = app.resultEntityId
    ? isSport ? `/yonetim/takimlar/duzenle?id=${app.resultEntityId}` : app.category === "MUZIK" ? `/yonetim/muzik/yarismacilar/duzenle?id=${app.resultEntityId}` : app.category === "YAZARLIK" ? `/yonetim/tiyatro/yazarlik?c=${app.resultEntityId}` : `/yonetim/tiyatro/oyunlar`
    : null;
  const outOfAge = (m: Record<string, string>) => {
    const a = age(m.birthDate);
    return a != null && ((period.minAge && a < period.minAge) || (period.maxAge && a > period.maxAge));
  };

  return (
    <>
      <AdminHeader
        back={{ href: "/yonetim/basvurular", label: "Başvurular" }}
        title={app.title}
        description={<span className="flex flex-wrap items-center gap-2"><Badge tone={APPLICATION_STATUS[app.status]?.tone}>{APPLICATION_STATUS[app.status]?.label}</Badge><span className="font-mono">{app.trackingCode}</span> · {app.periodTitle} · {formatDateTime(app.createdAt)}</span>}
        actions={<ActionButton action={deleteApplication} fields={{ id: app.id }} label="Sil" icon={<Trash2 className="h-3.5 w-3.5" />} confirm="Başvuru ve yüklenen tüm belgeler kalıcı olarak silinecek. Emin misiniz?" className="btn-outline btn-sm text-red-600" />}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Panel title="Başvuru Sahibi">
              <KeyValue items={[["Ad Soyad", app.applicantName], ["Görevi", app.applicantRole], ["E-posta", <a key="e" href={`mailto:${app.applicantEmail}`} className="link">{app.applicantEmail}</a>], ["Telefon", <a key="t" href={`tel:${app.applicantPhone}`} className="link">{app.applicantPhone}</a>], ["İlçe", app.district], ["KVKK Onayı", app.kvkkConsent ? "✔ Verildi" : "✘"]]} />
            </Panel>
            <Panel title={CATEGORIES[app.category as keyof typeof CATEGORIES]?.label + " Bilgileri"}>
              <KeyValue items={Object.entries(appData).filter(([k]) => !["bio", "note", "synopsis", "techNeeds", "logoUrl"].includes(k)).map(([k, v]) => [
                LABELS[k] ?? k,
                k === "sport" ? SPORTS[v as SportKey]?.label ?? v : k === "gender" ? (v === "KADIN" ? "Kadınlar" : "Erkekler") : app.category === "YAZARLIK" && k === "language" ? WRITING_LANGUAGES[v] ?? v : k === "workCategory" ? WRITING_CATEGORIES[v] ?? v : k.endsWith("Color") ? <span key={k} className="inline-flex items-center gap-2"><span className="h-4 w-4 rounded-full ring-1 ring-basalt-200" style={{ background: v }} />{v}</span> : /^https?:/.test(v) ? <a key={k} href={v} target="_blank" rel="noreferrer" className="link inline-flex items-center gap-1">Aç <ExternalLink className="h-3 w-3" /></a> : v,
              ] as [string, React.ReactNode])} />
              {appData.logoUrl && /^data:image\//.test(appData.logoUrl) && (
                <div className="mt-3 flex items-center gap-3 rounded-lg bg-basalt-50 p-3 text-sm"><span className="flex h-14 w-14 items-center justify-center rounded-full bg-white p-1 ring-1 ring-basalt-200">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={appData.logoUrl} alt="" className="h-full w-full object-contain" /></span><span className="text-xs font-semibold text-basalt-500">{app.category === "MUZIK" ? "Fotoğraf" : "Logo"} — onaylanınca kayda aktarılır</span></div>
              )}
              {["bio", "note", "synopsis", "techNeeds"].filter((k) => appData[k]).map((k) => (
                <div key={k} className="mt-3 rounded-lg bg-basalt-50 p-3 text-sm"><p className="text-xs font-semibold text-basalt-500">{LABELS[k]}</p><p className="whitespace-pre-line">{appData[k]}</p></div>
              ))}
            </Panel>
          </div>

          <Panel title={`${isSport ? "Oyuncu Listesi" : app.category === "YAZARLIK" ? "Yazarlar" : "Üyeler"} (${members.length})`} description={period.minAge || period.maxAge ? `Yaş aralığı: ${period.minAge ?? "—"}-${period.maxAge ?? "—"}. Kırmızı satırlar aralık dışındadır.` : undefined}>
            <div className="overflow-x-auto">
              <table className="table-base">
                <thead><tr><th>#</th><th>Ad Soyad</th><th>Doğum / Yaş</th>{isSport ? <><th>Mevki</th><th>Forma</th><th>T.C. Kimlik</th></> : <th>Rol</th>}</tr></thead>
                <tbody>
                  {members.map((m, i) => (
                    <tr key={i} className={outOfAge(m) ? "bg-red-50" : ""}>
                      <td className="text-basalt-400">{i + 1}</td>
                      <td className="font-medium"><span className="flex items-center gap-2">{m.photo && /^data:image\//.test(m.photo) && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={m.photo} alt="" className="h-8 w-8 rounded-full object-cover" />
                      )}{m.firstName} {m.lastName}</span></td>
                      <td>{m.birthDate ? `${m.birthDate} (${age(m.birthDate)})` : "—"}</td>
                      {isSport ? <><td>{m.position || "—"}</td><td>{m.jerseyNumber || "—"}</td><td className="font-mono text-xs">{m.identityNo || "—"}</td></> : <td>{m.role || "—"}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel title={`Belgeler (${app.documents.length})`}>
            {app.documents.length === 0 ? <p className="text-sm text-basalt-500">Belge yüklenmemiş.</p> : (
              <div className="grid gap-3 sm:grid-cols-2">
                {app.documents.map((d) => <DocLink key={d.path} doc={d} />)}
              </div>
            )}
            {(() => {
              const req = period.requiredDocuments ?? [];
              const missing = req.filter((r) => r.required && !app.documents.some((d) => d.key === r.key));
              return missing.length ? <p className="mt-3 text-sm text-red-600">Eksik zorunlu belgeler: {missing.map((m) => m.label).join(", ")}</p> : null;
            })()}
          </Panel>
        </div>

        <aside className="space-y-6">
          {app.resultEntityId ? (
            <div className="card border-emerald-200 bg-emerald-50 p-5">
              <p className="flex items-center gap-2 font-semibold text-emerald-800"><CheckCircle2 className="h-5 w-5" /> Onaylandı ve kayıt oluşturuldu</p>
              {resultLink && <Link href={resultLink} className="btn-outline btn-sm mt-3">Oluşturulan kaydı aç →</Link>}
            </div>
          ) : (
            <Panel title="Onayla ve Kayıt Oluştur" description={isSport ? "Takım ve tüm oyuncular otomatik oluşturulur." : app.category === "MUZIK" ? "Güncel yarışmaya yarışmacı olarak eklenir." : app.category === "YAZARLIK" ? "Eser güncel Genç Kalemler yarışmasına eklenir." : "Topluluk ve oyun güncel festivale eklenir."}>
              <AdminForm action={approveApplication} submitLabel="Onayla ve Oluştur" confirm="Başvuru onaylanacak ve kayıtlar oluşturulacak. Devam edilsin mi?">
                <input type="hidden" name="id" value={app.id} />
                {isSport && (
                  <SelectField label="Eklenecek Lig" name="leagueId" defaultValue={period.leagueId} empty="— Şimdilik lige ekleme —" options={leagues.map((l) => ({ value: l.id, label: l.name }))} />
                )}
                <TextArea className="mt-3" label="Başvuru sahibine not" name="publicNote" rows={2} defaultValue={app.publicNote ?? (isSport ? "Tebrikler! Başvurunuz onaylandı. Kura ve fikstür bilgileri ayrıca paylaşılacaktır." : app.category === "YAZARLIK" ? "Tebrikler! Metniniz yarışmaya kabul edildi. Kısa liste ve finalistler yarışma sayfasında açıklanacaktır." : "Tebrikler! Başvurunuz onaylandı. Program bilgileri ayrıca paylaşılacaktır.")} />
              </AdminForm>
            </Panel>
          )}
          <Panel title="Durum & Notlar">
            <AdminForm key={`${app.status}-${app.reviewedAt?.getTime?.() ?? 0}`} action={updateApplication}>
              <input type="hidden" name="id" value={app.id} />
              <div className="space-y-4">
                <SelectField label="Durum" name="status" defaultValue={app.status} options={Object.fromEntries(Object.entries(APPLICATION_STATUS).map(([k, v]) => [k, v.label]))} />
                <TextArea label="Başvuru sahibine görünen not" name="publicNote" rows={3} defaultValue={app.publicNote} hint="Takip ekranında gösterilir (ör. eksik evrak açıklaması)." />
                <TextArea label="İç not (yalnızca yöneticiler)" name="adminNote" rows={3} defaultValue={app.adminNote} />
              </div>
            </AdminForm>
            {app.reviewedBy && <p className="mt-4 text-xs text-basalt-400">Son inceleme: {app.reviewedBy} · {formatDateTime(app.reviewedAt)}</p>}
          </Panel>
          <Panel title="Dönem">
            <KeyValue items={[["Dönem", <Link key="d" href={`/yonetim/donemler/duzenle?id=${app.periodId}`} className="link">{app.periodTitle}</Link>], ["Kişi sınırı", `${period.minMembers ?? "—"} - ${period.maxMembers ?? "—"}`], ["Lig", period.leagueName]]} />
          </Panel>
        </aside>
      </div>
    </>
  );
}
