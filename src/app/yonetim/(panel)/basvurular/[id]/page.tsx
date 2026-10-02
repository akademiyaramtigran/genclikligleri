import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { CheckCircle2, Download, ExternalLink, FileText, Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser, canAccess, type Unit } from "@/lib/auth";
import { APPLICATION_STATUS, CATEGORIES, SPORTS, type SportKey } from "@/lib/constants";
import { age, formatDateTime, parseJson } from "@/lib/utils";
import { Badge, KeyValue } from "@/components/ui";
import { AdminHeader, Panel, SelectField, TextArea } from "@/components/admin/fields";
import { AdminForm, ActionButton } from "@/components/admin/AdminForm";
import { approveApplication, deleteApplication, updateApplication } from "@/actions/genel";

export const metadata: Metadata = { title: "Başvuru Detayı" };

const LABELS: Record<string, string> = {
  shortName: "Kısa Ad", sport: "Branş", gender: "Kategori", coachName: "Antrenör", coachPhone: "Antrenör Tel.", primaryColor: "Ana Renk", secondaryColor: "İkinci Renk",
  homeVenue: "İç Saha Tercihi", foundedYear: "Kuruluş", note: "Tanıtım", type: "Katılım", genre: "Tür", demoUrl: "Demo", instagram: "Instagram", bio: "Biyografi", songs: "Eserler",
  playTitle: "Oyun", playwright: "Yazar", director: "Yönetmen", durationMin: "Süre (dk)", language: "Dil", synopsis: "Özet", techNeeds: "Teknik İhtiyaçlar", videoUrl: "Video",
};

export default async function ApplicationDetail({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const app = await db.application.findUnique({ where: { id }, include: { period: { include: { league: true } }, documents: true, reviewedBy: true } });
  if (!app) notFound();
  if (!canAccess(user, app.period.category as Unit)) redirect("/yonetim?yetki=yok");
  const data = parseJson<Record<string, string>>(app.data, {});
  const members = parseJson<Record<string, string>[]>(app.members, []);
  const isSport = app.period.category === "SPOR";
  const sport = (data.sport || app.period.sport) as SportKey | undefined;
  const gender = data.gender || app.period.gender;
  const leagues = isSport ? await db.league.findMany({ where: { ...(sport ? { sport } : {}), ...(gender ? { gender } : {}), season: { isActive: true } } }) : [];
  const resultLink = app.resultEntityId
    ? isSport ? `/yonetim/takimlar/${app.resultEntityId}` : app.period.category === "MUZIK" ? `/yonetim/muzik/yarismacilar/${app.resultEntityId}` : `/yonetim/tiyatro/oyunlar`
    : null;
  const outOfAge = (m: Record<string, string>) => {
    const a = age(m.birthDate);
    return a != null && ((app.period.minAge && a < app.period.minAge) || (app.period.maxAge && a > app.period.maxAge));
  };

  return (
    <>
      <AdminHeader
        back={{ href: "/yonetim/basvurular", label: "Başvurular" }}
        title={app.title}
        description={<span className="flex flex-wrap items-center gap-2"><Badge tone={APPLICATION_STATUS[app.status]?.tone}>{APPLICATION_STATUS[app.status]?.label}</Badge><span className="font-mono">{app.trackingCode}</span> · {app.period.title} · {formatDateTime(app.createdAt)}</span>}
        actions={<ActionButton action={deleteApplication} fields={{ id: app.id }} label="Sil" icon={<Trash2 className="h-3.5 w-3.5" />} confirm="Başvuru ve yüklenen tüm belgeler kalıcı olarak silinecek. Emin misiniz?" className="btn-outline btn-sm text-red-600" />}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Panel title="Başvuru Sahibi">
              <KeyValue items={[["Ad Soyad", app.applicantName], ["Görevi", app.applicantRole], ["E-posta", <a key="e" href={`mailto:${app.applicantEmail}`} className="link">{app.applicantEmail}</a>], ["Telefon", <a key="t" href={`tel:${app.applicantPhone}`} className="link">{app.applicantPhone}</a>], ["İlçe", app.district], ["KVKK Onayı", app.kvkkConsent ? "✔ Verildi" : "✘"]]} />
            </Panel>
            <Panel title={CATEGORIES[app.period.category as keyof typeof CATEGORIES]?.label + " Bilgileri"}>
              <KeyValue items={Object.entries(data).filter(([k]) => !["bio", "note", "synopsis", "techNeeds"].includes(k)).map(([k, v]) => [
                LABELS[k] ?? k,
                k === "sport" ? SPORTS[v as SportKey]?.label ?? v : k === "gender" ? (v === "KADIN" ? "Kadınlar" : "Erkekler") : k.endsWith("Color") ? <span key={k} className="inline-flex items-center gap-2"><span className="h-4 w-4 rounded-full ring-1 ring-basalt-200" style={{ background: v }} />{v}</span> : /^https?:/.test(v) ? <a key={k} href={v} target="_blank" rel="noreferrer" className="link inline-flex items-center gap-1">Aç <ExternalLink className="h-3 w-3" /></a> : v,
              ] as [string, React.ReactNode])} />
              {["bio", "note", "synopsis", "techNeeds"].filter((k) => data[k]).map((k) => (
                <div key={k} className="mt-3 rounded-lg bg-basalt-50 p-3 text-sm"><p className="text-xs font-semibold text-basalt-500">{LABELS[k]}</p><p className="whitespace-pre-line">{data[k]}</p></div>
              ))}
            </Panel>
          </div>

          <Panel title={`${isSport ? "Oyuncu Listesi" : "Üyeler"} (${members.length})`} description={app.period.minAge || app.period.maxAge ? `Yaş aralığı: ${app.period.minAge ?? "—"}-${app.period.maxAge ?? "—"}. Kırmızı satırlar aralık dışındadır.` : undefined}>
            <div className="overflow-x-auto">
              <table className="table-base">
                <thead><tr><th>#</th><th>Ad Soyad</th><th>Doğum / Yaş</th>{isSport ? <><th>Mevki</th><th>Forma</th><th>T.C. Kimlik</th></> : <th>Rol</th>}</tr></thead>
                <tbody>
                  {members.map((m, i) => (
                    <tr key={i} className={outOfAge(m) ? "bg-red-50" : ""}>
                      <td className="text-basalt-400">{i + 1}</td>
                      <td className="font-medium">{m.firstName} {m.lastName}</td>
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
                {app.documents.map((d) => (
                  <a key={d.id} href={`/api/belge/${d.id}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl border border-basalt-200 p-3 transition hover:border-dicle-400 hover:bg-dicle-500/5">
                    <FileText className="h-8 w-8 shrink-0 text-dicle-600" />
                    <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{d.label}</span><span className="block truncate text-xs text-basalt-500">{d.fileName} · {(d.size / 1024 / 1024).toFixed(2)} MB</span></span>
                    <Download className="h-4 w-4 text-basalt-400" />
                  </a>
                ))}
              </div>
            )}
            {(() => {
              const req = parseJson<{ key: string; label: string; required: boolean }[]>(app.period.requiredDocuments, []);
              const missing = req.filter((r) => r.required && !app.documents.some((d) => d.docKey === r.key));
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
            <Panel title="Onayla ve Kayıt Oluştur" description={isSport ? "Takım ve tüm oyuncular otomatik oluşturulur." : app.period.category === "MUZIK" ? "Güncel yarışmaya yarışmacı olarak eklenir." : "Topluluk ve oyun güncel festivale eklenir."}>
              <AdminForm action={approveApplication} submitLabel="Onayla ve Oluştur" confirm="Başvuru onaylanacak ve kayıtlar oluşturulacak. Devam edilsin mi?">
                <input type="hidden" name="id" value={app.id} />
                {isSport && (
                  <SelectField label="Eklenecek Lig" name="leagueId" defaultValue={app.period.leagueId} empty="— Şimdilik lige ekleme —" options={leagues.map((l) => ({ value: l.id, label: l.name }))} />
                )}
                <TextArea className="mt-3" label="Başvuru sahibine not" name="publicNote" rows={2} defaultValue={app.publicNote ?? "Tebrikler! Başvurunuz onaylandı. Kura ve fikstür bilgileri ayrıca paylaşılacaktır."} />
              </AdminForm>
            </Panel>
          )}
          <Panel title="Durum & Notlar">
            <AdminForm key={`${app.status}-${app.updatedAt.getTime()}`} action={updateApplication}>
              <input type="hidden" name="id" value={app.id} />
              <div className="space-y-4">
                <SelectField label="Durum" name="status" defaultValue={app.status} options={Object.fromEntries(Object.entries(APPLICATION_STATUS).map(([k, v]) => [k, v.label]))} />
                <TextArea label="Başvuru sahibine görünen not" name="publicNote" rows={3} defaultValue={app.publicNote} hint="Takip ekranında gösterilir (ör. eksik evrak açıklaması)." />
                <TextArea label="İç not (yalnızca yöneticiler)" name="adminNote" rows={3} defaultValue={app.adminNote} />
              </div>
            </AdminForm>
            {app.reviewedBy && <p className="mt-4 text-xs text-basalt-400">Son inceleme: {app.reviewedBy.name} · {formatDateTime(app.reviewedAt)}</p>}
          </Panel>
          <Panel title="Dönem">
            <KeyValue items={[["Dönem", <Link key="d" href={`/yonetim/donemler/${app.period.id}`} className="link">{app.period.title}</Link>], ["Kişi sınırı", `${app.period.minMembers ?? "—"} - ${app.period.maxMembers ?? "—"}`], ["Lig", app.period.league?.name]]} />
          </Panel>
        </aside>
      </div>
    </>
  );
}
