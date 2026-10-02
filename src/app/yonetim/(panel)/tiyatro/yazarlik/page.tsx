"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import type { WritingContest } from "@/lib/types";
import { getWritingContests } from "@/lib/data";
import { useData } from "@/lib/hooks";
import { RequireUnit } from "../../../AdminContext";
import { ErrorBox, PageLoader, Suspended, useParam } from "@/components/client";
import { DISTRICTS, ENTRY_STATUS, WRITING_CATEGORIES, WRITING_LANGUAGES, WRITING_STATUS } from "@/lib/constants";
import { formatDate, toDateInput, toDateTimeLocal } from "@/lib/utils";
import { Badge, StatusBadge } from "@/components/ui";
import { AdminHeader, CheckField, FormGrid, Panel, SelectField, TextArea, TextField } from "@/components/admin/fields";
import { AdminForm, ActionButton } from "@/components/admin/AdminForm";
import { saveWritingContest, saveWritingEntry, saveWritingJury } from "@/actions/kultur";

const statusOptions = (m: Record<string, { label: string }>) => Object.fromEntries(Object.entries(m).map(([k, v]) => [k, v.label]));

const DEFAULT_TIMELINE = [
  "Başvurular | | Son başvuru tarihine kadar metinler kabul edilir",
  "Ön değerlendirme | | Kısa liste açıklanır",
  "Okuma tiyatrosu | | Finalist metinler sahnede okunur",
  "Ödül töreni | | Festival kapanış gecesi",
].join("\n");

function ContestFields({ c }: { c?: WritingContest | null }) {
  const timeline = c ? c.timeline.map((t) => [t.title, t.date ? toDateInput(t.date) : "", t.text ?? ""].join(" | ")).join("\n") : DEFAULT_TIMELINE;
  return (
    <div className="space-y-3">
      {c && <input type="hidden" name="id" value={c.id} />}
      <FormGrid><TextField label="Yarışma Adı" name="name" required defaultValue={c?.name ?? "Genç Kalemler"} /><TextField label="Dönem" name="edition" required defaultValue={c?.edition} placeholder="1." /></FormGrid>
      <FormGrid>
        <TextField label="Son Başvuru" name="deadline" type="datetime-local" required defaultValue={c ? toDateTimeLocal(c.deadline) : ""} />
        <SelectField label="Durum" name="status" defaultValue={c?.status} options={statusOptions(WRITING_STATUS)} />
      </FormGrid>
      <FormGrid><TextField label="En küçük yaş" name="minAge" type="number" defaultValue={c?.minAge ?? 15} /><TextField label="En büyük yaş" name="maxAge" type="number" defaultValue={c?.maxAge ?? 26} /></FormGrid>
      <TextField label="Kısa tanıtım" name="tagline" defaultValue={c?.tagline ?? "15-26 yaş arası gençler Türkçe, Kurmancî veya Zazakî yazdıkları özgün tiyatro metinleriyle katılabilir."} />
      <TextArea label="Açıklama" name="description" rows={3} defaultValue={c?.description} />
      <TextArea label="Şartname (her satır bir madde)" name="rules" rows={5} defaultValue={c?.rules} />
      <TextArea label="Ödüller (her satır bir ödül)" name="prizes" rows={3} defaultValue={c?.prizes.join("\n") ?? "Festivalde sahnelenme\nBasılı kitapta yayın"} />
      <TextArea label="Takvim" name="timeline" rows={4} defaultValue={timeline} hint="Her satır: Başlık | YYYY-AA-GG | açıklama (tarih boş bırakılabilir)" />
      <TextField label="Tören / okuma videosu (YouTube)" name="youtubeUrl" type="url" defaultValue={c?.youtubeUrl} />
      <CheckField label="Sitede güncel yarışma" name="isCurrent" defaultChecked={c?.isCurrent ?? true} />
    </div>
  );
}

export default function WritingAdmin() {
  return <RequireUnit unit="TIYATRO"><Suspended><Inner /></Suspended></RequireUnit>;
}

function Inner() {
  const cParam = useParam("c");
  const lang = useParam("dil");
  const { data, error } = useData(async () => {
    const contests = await getWritingContests();
    const contest = contests.find((x) => x.id === cParam) ?? contests.find((x) => x.isCurrent) ?? contests[0] ?? null;
    return { contests, contest };
  }, [cParam]);
  if (error) return <ErrorBox message={error} />;
  if (!data) return <PageLoader />;
  const { contests, contest } = data;
  const entries = contest ? contest.entries.filter((e) => !lang || e.language === lang) : [];

  return (
    <>
      <AdminHeader title="Genç Kalemler" description="Oyun yazarlığı yarışması: şartname, jüri, eserler ve sonuçlar. Onaylanan yazarlık başvuruları buraya eser olarak düşer." actions={<>
        {contests.length > 1 && contests.map((x) => <Link key={x.id} href={`/yonetim/tiyatro/yazarlik?c=${x.id}`} className={x.id === contest?.id ? "btn-primary btn-sm" : "btn-outline btn-sm"}>{x.edition} ({x.deadline.getFullYear()})</Link>)}
        <Link href="/tiyatro/yazarlik" target="_blank" className="btn-outline btn-sm">Sitede gör</Link>
      </>} />
      {!contest ? <Panel title="İlk yarışmayı oluşturun"><AdminForm action={saveWritingContest}><ContestFields /></AdminForm></Panel> : (
        <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
          <div className="space-y-6">
            <Panel title={`Eserler (${contest.entries.length})`} description="Kısa liste, finalist, birinci ve mansiyon durumundaki eserler sitede görünür." actions={
              <div className="flex flex-wrap gap-1">
                <Link href={`/yonetim/tiyatro/yazarlik?c=${contest.id}`} className={!lang ? "btn-primary btn-sm" : "btn-ghost btn-sm"}>Tümü</Link>
                {Object.entries(WRITING_LANGUAGES).map(([k, v]) => <Link key={k} href={`/yonetim/tiyatro/yazarlik?c=${contest.id}&dil=${k}`} className={lang === k ? "btn-primary btn-sm" : "btn-ghost btn-sm"}>{v} ({contest.entries.filter((e) => e.language === k).length})</Link>)}
              </div>
            }>
              <div className="divide-y divide-basalt-100">
                {entries.map((e) => (
                  <div key={e.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{e.title} {e.penName && <span className="font-normal text-basalt-500">· rumuz: {e.penName}</span>}</p>
                      <p className="text-xs text-basalt-500">{e.author} · {WRITING_LANGUAGES[e.language] ?? e.language} · {WRITING_CATEGORIES[e.category] ?? e.category}{e.district ? ` · ${e.district}` : ""}</p>
                      {e.applicationId && <Link href={`/yonetim/basvurular/duzenle?id=${e.applicationId}`} className="link text-xs">Başvuru ve metin →</Link>}
                    </div>
                    <AdminForm key={`${e.id}-${e.status}`} action={saveWritingEntry} compact submitLabel="Kaydet" className="flex items-end gap-2">
                      <input type="hidden" name="contestId" value={contest.id} />
                      <input type="hidden" name="entryId" value={e.id} />
                      <select name="status" defaultValue={e.status} className="input py-1.5 text-xs" aria-label="Durum">
                        {Object.entries(ENTRY_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                    </AdminForm>
                    <StatusBadge map={ENTRY_STATUS} value={e.status} />
                    <ActionButton action={saveWritingEntry} fields={{ contestId: contest.id, remove: e.id }} label="" icon={<Trash2 className="h-3.5 w-3.5" />} confirm="Eser listeden silinsin mi?" className="btn-ghost btn-sm text-red-500" />
                  </div>
                ))}
                {entries.length === 0 && <p className="py-3 text-sm text-basalt-500">Henüz eser yok. Yazarlık başvurularını onayladığınızda veya aşağıdan elle eklediğinizde burada görünür.</p>}
              </div>
              <AdminForm action={saveWritingEntry} submitLabel="Eser Ekle" compact resetOnSuccess className="mt-4 border-t border-basalt-100 pt-4">
                <input type="hidden" name="contestId" value={contest.id} />
                <FormGrid cols={3}>
                  <TextField label="Eser adı" name="title" required />
                  <TextField label="Yazar" name="author" required />
                  <TextField label="Rumuz" name="penName" />
                  <SelectField label="Dil" name="language" options={WRITING_LANGUAGES} />
                  <SelectField label="Kategori" name="category" options={WRITING_CATEGORIES} />
                  <SelectField label="Durum" name="status" options={statusOptions(ENTRY_STATUS)} />
                  <SelectField label="İlçe" name="district" empty="—" options={DISTRICTS.map((d) => ({ value: d, label: d }))} />
                </FormGrid>
                <TextArea label="Kısa özet (finalist kartında görünür)" name="synopsis" rows={2} className="mt-3" />
              </AdminForm>
            </Panel>

            <Panel title="Jüri" description="Her dil kendi jürisiyle değerlendirilir.">
              <div className="grid gap-4 md:grid-cols-3">
                {Object.entries(WRITING_LANGUAGES).map(([k, v]) => (
                  <div key={k}>
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-basalt-500">{v}</p>
                    <ul className="space-y-1.5 text-sm">
                      {contest.jury.map((j, i) => ({ j, i })).filter(({ j }) => j.language === k).map(({ j, i }) => (
                        <li key={i} className="flex items-start justify-between gap-2"><span><strong>{j.name}</strong><span className="block text-xs text-basalt-500">{j.title}</span></span><ActionButton action={saveWritingJury} fields={{ contestId: contest.id, remove: String(i) }} label="" icon={<Trash2 className="h-3.5 w-3.5" />} className="btn-ghost btn-sm text-red-500" /></li>
                      ))}
                      {!contest.jury.some((j) => j.language === k) && <li className="text-xs text-basalt-400">Henüz jüri yok</li>}
                    </ul>
                  </div>
                ))}
              </div>
              <AdminForm action={saveWritingJury} compact resetOnSuccess submitLabel="Jüri Ekle" className="mt-4 border-t border-basalt-100 pt-4">
                <input type="hidden" name="contestId" value={contest.id} />
                <FormGrid cols={3}><TextField label="Ad Soyad" name="name" required /><TextField label="Unvan" name="title" placeholder="Oyun yazarı" /><SelectField label="Dil" name="language" options={WRITING_LANGUAGES} /></FormGrid>
              </AdminForm>
            </Panel>
          </div>
          <aside className="space-y-6">
            <Panel title="Yarışma Ayarları" description={<span className="flex items-center gap-2"><Badge tone={WRITING_STATUS[contest.status]?.tone}>{WRITING_STATUS[contest.status]?.label}</Badge> Son başvuru: {formatDate(contest.deadline)}</span>}>
              <AdminForm key={contest.id} action={saveWritingContest} compact><ContestFields c={contest} /></AdminForm>
            </Panel>
            <Panel title="Yeni Yarışma Dönemi"><AdminForm action={saveWritingContest} compact submitLabel="Oluştur"><ContestFields /></AdminForm></Panel>
            <p className="text-xs text-basalt-500">Başvuru almak için <Link href="/yonetim/donemler/yeni?kategori=YAZARLIK" className="link">Yazarlık kategorisinde bir başvuru dönemi</Link> açın.</p>
          </aside>
        </div>
      )}
    </>
  );
}
