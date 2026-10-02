import Link from "next/link";
import type { Metadata } from "next";
import { Trash2 } from "lucide-react";
import type { TheatreFestival } from "@prisma/client";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { FESTIVAL_STATUS, SHOW_STATUS } from "@/lib/constants";
import { formatDateTime, toDateInput } from "@/lib/utils";
import { StatusBadge } from "@/components/ui";
import { AdminHeader, CheckField, FormGrid, Panel, SelectField, TextArea, TextField } from "@/components/admin/fields";
import { AdminForm, ActionButton } from "@/components/admin/AdminForm";
import { saveAward, saveFestival, saveShow, saveWorkshop } from "@/actions/kultur";

export const metadata: Metadata = { title: "Tiyatro Festivali" };

function FestivalFields({ f }: { f?: TheatreFestival | null }) {
  return (
    <div className="space-y-3">
      {f && <input type="hidden" name="id" value={f.id} />}
      <FormGrid><TextField label="Festival Adı" name="name" required defaultValue={f?.name ?? "Diyarbakır Gençlik Tiyatro Festivali"} /><TextField label="Dönem" name="edition" required defaultValue={f?.edition} placeholder="4." /></FormGrid>
      <FormGrid><TextField label="Başlangıç" name="startDate" type="date" required defaultValue={toDateInput(f?.startDate)} /><TextField label="Bitiş" name="endDate" type="date" required defaultValue={toDateInput(f?.endDate)} /></FormGrid>
      <TextField label="Tema" name="theme" defaultValue={f?.theme} />
      <TextField label="Slogan" name="tagline" defaultValue={f?.tagline} />
      <TextArea label="Açıklama" name="description" rows={2} defaultValue={f?.description} />
      <SelectField label="Durum" name="status" defaultValue={f?.status} options={Object.fromEntries(Object.entries(FESTIVAL_STATUS).map(([k, v]) => [k, v.label]))} />
      <CheckField label="Sitede güncel festival" name="isCurrent" defaultChecked={f?.isCurrent ?? true} />
    </div>
  );
}

export default async function TheatreAdmin({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  await requireUser("TIYATRO");
  const { f } = await searchParams;
  const fests = await db.theatreFestival.findMany({ orderBy: { startDate: "desc" } });
  const include = { plays: { include: { group: true, shows: { include: { venue: true } } }, orderBy: { title: "asc" as const } }, awards: { include: { play: true } }, workshops: { orderBy: { date: "asc" as const } } };
  const fest = (await db.theatreFestival.findFirst({ where: f ? { id: f } : { isCurrent: true }, include })) ?? (await db.theatreFestival.findFirst({ orderBy: { startDate: "desc" }, include }));
  const venues = await db.venue.findMany({ orderBy: { name: "asc" } });
  const shows = fest?.plays.flatMap((p) => p.shows.map((s) => ({ ...s, play: p }))).sort((a, b) => a.date.getTime() - b.date.getTime()) ?? [];

  return (
    <>
      <AdminHeader title="Tiyatro Festivali" description="Festival programını, atölyeleri ve ödülleri yönetin." actions={<>
        {fests.length > 1 && fests.map((x) => <Link key={x.id} href={`/yonetim/tiyatro?f=${x.id}`} className={x.id === fest?.id ? "btn-primary btn-sm" : "btn-outline btn-sm"}>{x.edition} ({x.startDate.getFullYear()})</Link>)}
        <Link href="/yonetim/tiyatro/oyunlar" className="btn-outline btn-sm">Topluluklar & Oyunlar</Link>
      </>} />
      {!fest ? <Panel title="İlk festivali oluşturun"><AdminForm action={saveFestival}><FestivalFields /></AdminForm></Panel> : (
        <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
          <div className="space-y-6">
            <Panel title={`Gösterim Programı (${shows.length})`}>
              <div className="divide-y divide-basalt-100">
                {shows.map((s) => (
                  <div key={s.id} className="flex flex-wrap items-center gap-3 py-2 text-sm">
                    <span className="w-36 text-xs font-semibold">{formatDateTime(s.date)}</span>
                    <Link href={`/yonetim/tiyatro/oyunlar/${s.play.id}`} className="min-w-0 flex-1 truncate font-medium hover:text-dicle-700">{s.play.title} <span className="text-basalt-500">— {s.play.group.name}</span></Link>
                    <span className="text-xs text-basalt-500">{s.venue?.name}</span>
                    <StatusBadge map={SHOW_STATUS} value={s.status} />
                    <ActionButton action={saveShow} fields={{ id: s.id, remove: "1" }} label="" icon={<Trash2 className="h-3.5 w-3.5" />} confirm="Gösterim silinsin mi?" className="btn-ghost btn-sm text-red-500" />
                  </div>
                ))}
                {shows.length === 0 && <p className="text-sm text-basalt-500">Henüz gösterim yok.</p>}
              </div>
              {fest.plays.length > 0 && (
                <AdminForm action={saveShow} submitLabel="Gösterim Ekle" compact resetOnSuccess className="mt-4 border-t border-basalt-100 pt-4">
                  <FormGrid cols={4}>
                    <SelectField label="Oyun" name="playId" required options={fest.plays.map((p) => ({ value: p.id, label: p.title }))} />
                    <TextField label="Tarih & Saat" name="date" type="datetime-local" required />
                    <SelectField label="Sahne" name="venueId" empty="—" options={venues.map((v) => ({ value: v.id, label: v.name }))} />
                    <SelectField label="Durum" name="status" options={Object.fromEntries(Object.entries(SHOW_STATUS).map(([k, v]) => [k, v.label]))} />
                  </FormGrid>
                  <TextField label="Bilet Bilgisi" name="ticketInfo" defaultValue="Ücretsiz" className="mt-3" />
                </AdminForm>
              )}
            </Panel>
            <div className="grid gap-6 md:grid-cols-2">
              <Panel title="Atölye & Söyleşiler">
                <ul className="space-y-2 text-sm">
                  {fest.workshops.map((w) => (
                    <li key={w.id} className="flex items-start justify-between gap-2"><span><strong>{w.title}</strong><span className="block text-xs text-basalt-500">{formatDateTime(w.date)} · {w.instructor} · {w.location}</span></span><ActionButton action={saveWorkshop} fields={{ id: w.id, remove: "1" }} label="" icon={<Trash2 className="h-3.5 w-3.5" />} className="btn-ghost btn-sm text-red-500" /></li>
                  ))}
                </ul>
                <AdminForm action={saveWorkshop} compact resetOnSuccess submitLabel="Ekle" className="mt-4 border-t border-basalt-100 pt-4">
                  <input type="hidden" name="festivalId" value={fest.id} />
                  <div className="space-y-2"><TextField label="Başlık" name="title" required /><FormGrid><TextField label="Eğitmen / Konuşmacı" name="instructor" /><TextField label="Tarih" name="date" type="datetime-local" required /></FormGrid><TextField label="Yer" name="location" /></div>
                </AdminForm>
              </Panel>
              <Panel title="Ödüller">
                <ul className="space-y-2 text-sm">
                  {fest.awards.map((a) => (
                    <li key={a.id} className="flex items-start justify-between gap-2"><span><span className="text-xs font-bold uppercase text-amber-600">{a.category}</span><span className="block font-medium">{a.winner}</span></span><ActionButton action={saveAward} fields={{ id: a.id, remove: "1" }} label="" icon={<Trash2 className="h-3.5 w-3.5" />} className="btn-ghost btn-sm text-red-500" /></li>
                  ))}
                </ul>
                <AdminForm action={saveAward} compact resetOnSuccess submitLabel="Ekle" className="mt-4 border-t border-basalt-100 pt-4">
                  <input type="hidden" name="festivalId" value={fest.id} />
                  <div className="space-y-2">
                    <TextField label="Kategori" name="category" required placeholder="En İyi Oyun" />
                    <TextField label="Kazanan" name="winner" required />
                    <SelectField label="İlgili Oyun" name="playId" empty="—" options={fest.plays.map((p) => ({ value: p.id, label: p.title }))} />
                  </div>
                </AdminForm>
              </Panel>
            </div>
          </div>
          <aside className="space-y-6">
            <Panel title="Festival Ayarları"><AdminForm action={saveFestival} compact><FestivalFields f={fest} /></AdminForm></Panel>
            <Panel title="Yeni Festival"><AdminForm action={saveFestival} compact submitLabel="Oluştur"><FestivalFields /></AdminForm></Panel>
          </aside>
        </div>
      )}
    </>
  );
}
