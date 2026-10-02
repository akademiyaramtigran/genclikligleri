import Link from "next/link";
import type { Metadata } from "next";
import { Trash2, Trophy, Calculator } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ROUND_STATUS } from "@/lib/constants";
import { toDateTimeLocal, formatDate } from "@/lib/utils";
import { Badge, StatusBadge } from "@/components/ui";
import { AdminHeader, CheckField, FormGrid, Panel, SelectField, TextArea, TextField } from "@/components/admin/fields";
import { AdminForm, ActionButton } from "@/components/admin/AdminForm";
import { addPerformers, applyPublicVotes, deleteRound, finalizeRound, saveCompetition, saveJury, savePerformance, saveRound } from "@/actions/kultur";

export const metadata: Metadata = { title: "Müzik Yarışması" };

export default async function MusicAdmin({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  await requireUser("MUZIK");
  const { c } = await searchParams;
  const comps = await db.musicCompetition.findMany({ orderBy: { createdAt: "desc" } });
  const include = {
    rounds: { orderBy: { order: "asc" as const }, include: { venue: true, performances: { include: { contestant: { include: { _count: { select: { votes: { where: { NOT: { dayKey: { endsWith: "#ip" } } } } } } } } }, orderBy: [{ order: "asc" as const }] } } },
    contestants: { orderBy: { name: "asc" as const } },
    jury: { orderBy: { order: "asc" as const } },
  };
  const comp = (await db.musicCompetition.findFirst({ where: c ? { id: c } : { isCurrent: true }, include }))
    ?? (await db.musicCompetition.findFirst({ orderBy: { createdAt: "desc" }, include }));
  const venues = await db.venue.findMany({ orderBy: { name: "asc" } });

  const compFields = (x?: typeof comp) => (
    <div className="space-y-3">
      {x && <input type="hidden" name="id" value={x.id} />}
      <FormGrid><TextField label="Yarışma Adı" name="name" required defaultValue={x?.name ?? "Genç Sesler"} /><TextField label="Dönem" name="edition" required defaultValue={x?.edition} placeholder="2027" /></FormGrid>
      <TextField label="Slogan" name="tagline" defaultValue={x?.tagline} />
      <TextArea label="Açıklama" name="description" rows={2} defaultValue={x?.description} />
      <TextArea label="Ödüller (her satıra bir ödül)" name="prizes" rows={3} defaultValue={x?.prizes} />
      <SelectField label="Durum" name="status" defaultValue={x?.status} options={{ PLANNED: "Planlandı", ONGOING: "Devam Ediyor", COMPLETED: "Tamamlandı" }} />
      <FormGrid><CheckField label="Sitede güncel yarışma" name="isCurrent" defaultChecked={x?.isCurrent ?? true} /><CheckField label="Halk oylaması açık" name="votingOpen" defaultChecked={x?.votingOpen} /></FormGrid>
    </div>
  );

  return (
    <>
      <AdminHeader title="Müzik Yarışması" description="Turları planlayın, jüri puanlarını girin, turu sonuçlandırın." actions={<>
        {comps.length > 1 && comps.map((x) => <Link key={x.id} href={`/yonetim/muzik?c=${x.id}`} className={x.id === comp?.id ? "btn-primary btn-sm" : "btn-outline btn-sm"}>{x.name} {x.edition}</Link>)}
        <Link href="/yonetim/muzik/yarismacilar" className="btn-outline btn-sm">Yarışmacılar</Link>
      </>} />
      {!comp ? (
        <Panel title="İlk yarışmayı oluşturun"><AdminForm action={saveCompetition}>{compFields()}</AdminForm></Panel>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
          <div className="space-y-6">
            {comp.rounds.map((r) => {
              const inRound = new Set(r.performances.map((p) => p.contestantId));
              const candidates = comp.contestants.filter((x) => !inRound.has(x.id) && x.status !== "ELIMINATED");
              return (
                <Panel key={r.id} title={<span className="flex items-center gap-2">{r.order}. {r.name} <StatusBadge map={ROUND_STATUS} value={r.status} /></span>} description={`${formatDate(r.date, { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })} · ${r.venue?.name ?? "Mekân yok"} · ${r.advanceCount ? `İlk ${r.advanceCount} tur atlar` : "Final turu"}`}
                  actions={<div className="flex flex-wrap gap-2">
                    <ActionButton action={applyPublicVotes} fields={{ roundId: r.id }} label="Halk Oylarını Puanla" icon={<Calculator className="h-3.5 w-3.5" />} confirm="Halk oyları 0-100 puana çevrilip toplam puanlar güncellenecek." />
                    <ActionButton action={finalizeRound} fields={{ roundId: r.id }} label="Turu Sonuçlandır" icon={<Trophy className="h-3.5 w-3.5" />} confirm="Sıralama hesaplanacak, tur atlayanlar ve elenenler belirlenecek. Devam?" className="btn-accent btn-sm" />
                  </div>}>
                  <div className="space-y-3">
                    {r.performances.length === 0 && <p className="text-sm text-basalt-500">Bu tura henüz yarışmacı eklenmedi.</p>}
                    {r.performances.map((p) => (
                      <details key={p.id} className="rounded-xl border border-basalt-200">
                        <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3 px-3 py-2.5">
                          <span className="w-6 text-center font-display font-bold text-basalt-400">{p.rank ?? p.order}</span>
                          <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{p.contestant.name}</span><span className="text-xs text-basalt-500">♪ {p.songTitle} · {p.contestant._count.votes} halk oyu</span></span>
                          <span className="text-xs text-basalt-500">J {p.juryScore ?? "–"} · H {p.publicScore ?? "–"}</span>
                          <span className="rounded bg-basalt-900 px-2 py-0.5 font-display text-sm font-bold text-white">{p.totalScore?.toFixed(1) ?? "–"}</span>
                          {r.status === "COMPLETED" && (p.advanced ? <Badge tone="green">Tur atladı</Badge> : <Badge tone="zinc">Elendi</Badge>)}
                        </summary>
                        <div className="border-t border-basalt-100 p-3">
                          <AdminForm action={savePerformance} compact>
                            <input type="hidden" name="id" value={p.id} />
                            <div className="space-y-3">
                              <FormGrid cols={3}><TextField label="Eser" name="songTitle" defaultValue={p.songTitle} /><TextField label="Eserin Sahibi" name="songArtist" defaultValue={p.songArtist} /><TextField label="Sahne Sırası" name="order" type="number" defaultValue={p.order} /></FormGrid>
                              <FormGrid cols={3}><TextField label="Jüri Puanı (0-100)" name="juryScore" type="number" step="0.1" min={0} max={100} defaultValue={p.juryScore} /><TextField label="Halk Puanı (0-100)" name="publicScore" type="number" step="0.1" min={0} max={100} defaultValue={p.publicScore} /><TextField label="Performans Videosu" name="youtubeUrl" defaultValue={p.youtubeUrl} /></FormGrid>
                              <TextField label="Jüri Yorumu" name="juryComment" defaultValue={p.juryComment} />
                              <p className="hint">Toplam puan = Jüri × %70 + Halk × %30 olarak otomatik hesaplanır.</p>
                            </div>
                          </AdminForm>
                          <div className="mt-2"><ActionButton action={savePerformance} fields={{ id: p.id, remove: "1" }} label="Turdan çıkar" confirm="Yarışmacı bu turdan çıkarılsın mı?" className="btn-ghost btn-sm text-red-600" /></div>
                        </div>
                      </details>
                    ))}
                    {candidates.length > 0 && (
                      <AdminForm action={addPerformers} submitLabel="Tura Ekle" compact className="rounded-xl bg-basalt-50 p-3">
                        <input type="hidden" name="roundId" value={r.id} />
                        <p className="mb-2 text-xs font-semibold text-basalt-600">Yarışmacı ekle</p>
                        <div className="grid gap-1 sm:grid-cols-3">{candidates.map((x) => <label key={x.id} className="flex items-center gap-2 text-sm"><input type="checkbox" name="contestantId" value={x.id} className="accent-fuchsia-600" /> {x.name}</label>)}</div>
                      </AdminForm>
                    )}
                    <details className="rounded-xl border border-dashed border-basalt-200 p-3">
                      <summary className="cursor-pointer text-sm font-medium text-basalt-600">Tur ayarları</summary>
                      <AdminForm action={saveRound} compact className="mt-3">
                        <input type="hidden" name="id" value={r.id} /><input type="hidden" name="competitionId" value={comp.id} />
                        <RoundFields r={r} venues={venues} />
                      </AdminForm>
                      <div className="mt-2"><ActionButton action={deleteRound} fields={{ id: r.id }} label="Turu sil" icon={<Trash2 className="h-3.5 w-3.5" />} confirm="Tur ve tüm performans puanları silinsin mi?" className="btn-ghost btn-sm text-red-600" /></div>
                    </details>
                  </div>
                </Panel>
              );
            })}
            <Panel title="Yeni Tur Ekle">
              <AdminForm action={saveRound} submitLabel="Turu Ekle" resetOnSuccess>
                <input type="hidden" name="competitionId" value={comp.id} />
                <RoundFields venues={venues} order={comp.rounds.length + 1} />
              </AdminForm>
            </Panel>
          </div>
          <aside className="space-y-6">
            <Panel title="Yarışma Ayarları"><AdminForm action={saveCompetition} compact>{compFields(comp)}</AdminForm></Panel>
            <Panel title="Jüri">
              <div className="space-y-2">
                {comp.jury.map((j) => (
                  <div key={j.id} className="flex items-center justify-between gap-2 text-sm">
                    <span><strong>{j.name}</strong><span className="block text-xs text-basalt-500">{j.title}</span></span>
                    <ActionButton action={saveJury} fields={{ id: j.id, remove: "1" }} label="" icon={<Trash2 className="h-3.5 w-3.5" />} className="btn-ghost btn-sm text-red-500" confirm="Jüri üyesi silinsin mi?" />
                  </div>
                ))}
              </div>
              <AdminForm action={saveJury} compact resetOnSuccess submitLabel="Ekle" className="mt-4 border-t border-basalt-100 pt-4">
                <input type="hidden" name="competitionId" value={comp.id} />
                <div className="space-y-2"><TextField label="Ad Soyad" name="name" required /><TextField label="Unvan" name="title" required /><TextField label="Sıra" name="order" type="number" defaultValue={comp.jury.length + 1} /></div>
              </AdminForm>
            </Panel>
            <Panel title="Yeni Yarışma Dönemi"><AdminForm action={saveCompetition} compact submitLabel="Oluştur">{compFields()}</AdminForm></Panel>
          </aside>
        </div>
      )}
    </>
  );
}

function RoundFields({ r, venues, order }: { r?: { name: string; order: number; date: Date; venueId: string | null; status: string; advanceCount: number | null; youtubeUrl: string | null; description: string | null }; venues: { id: string; name: string }[]; order?: number }) {
  return (
    <div className="space-y-3">
      <FormGrid cols={3}><TextField label="Tur Adı" name="name" required defaultValue={r?.name} placeholder="Yarı Final" /><TextField label="Sıra" name="order" type="number" defaultValue={r?.order ?? order} /><TextField label="Tarih" name="date" type="datetime-local" required defaultValue={toDateTimeLocal(r?.date)} /></FormGrid>
      <FormGrid cols={3}>
        <SelectField label="Mekân" name="venueId" defaultValue={r?.venueId} empty="—" options={venues.map((v) => ({ value: v.id, label: v.name }))} />
        <SelectField label="Durum" name="status" defaultValue={r?.status} options={Object.fromEntries(Object.entries(ROUND_STATUS).map(([k, v]) => [k, v.label]))} />
        <TextField label="Tur atlayacak kişi" name="advanceCount" type="number" min={0} defaultValue={r?.advanceCount} hint="Final için boş bırakın." />
      </FormGrid>
      <TextField label="Tur Kaydı (YouTube)" name="youtubeUrl" defaultValue={r?.youtubeUrl} />
      <TextArea label="Açıklama" name="description" rows={2} defaultValue={r?.description} />
    </div>
  );
}
