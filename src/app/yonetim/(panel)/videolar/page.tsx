import type { Metadata } from "next";
import { Trash2 } from "lucide-react";
import type { Video } from "@prisma/client";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ANNOUNCEMENT_CATEGORIES } from "@/lib/constants";
import { Badge } from "@/components/ui";
import { AdminHeader, CheckField, FormGrid, Panel, SelectField, TextArea, TextField } from "@/components/admin/fields";
import { AdminForm, ActionButton } from "@/components/admin/AdminForm";
import { YouTubeThumb } from "@/components/YouTubeEmbed";
import { deleteVideo, saveVideo } from "@/actions/genel";

export const metadata: Metadata = { title: "Videolar" };
const CATS = { GENEL: "Genel", SPOR: "Spor", MUZIK: "Müzik", TIYATRO: "Tiyatro" };

function VideoFields({ v }: { v?: Video }) {
  return (
    <div className="space-y-3">
      {v && <input type="hidden" name="id" value={v.id} />}
      <TextField label="Başlık" name="title" required defaultValue={v?.title} />
      <TextField label="YouTube Bağlantısı" name="youtubeUrl" required defaultValue={v?.youtubeUrl} placeholder="https://www.youtube.com/watch?v=…" />
      <FormGrid><SelectField label="Kategori" name="category" defaultValue={v?.category} options={CATS} /><CheckField label="Öne çıkan" name="isFeatured" defaultChecked={v?.isFeatured} /></FormGrid>
      <TextArea label="Açıklama" name="description" rows={2} defaultValue={v?.description} />
    </div>
  );
}

export default async function VideosAdmin() {
  await requireUser();
  const videos = await db.video.findMany({ orderBy: { publishedAt: "desc" } });
  return (
    <>
      <AdminHeader title="Videolar" description="Genel videolar (tanıtım, özet, röportaj). Maç, tur ve oyun videoları ilgili kayıtların içinden eklenir ve arşivde otomatik görünür." />
      <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
        <div className="grid gap-4 sm:grid-cols-2">
          {videos.map((v) => (
            <details key={v.id} className="card group overflow-hidden">
              <summary className="cursor-pointer list-none">
                <YouTubeThumb url={v.youtubeUrl} />
                <div className="flex items-center gap-2 p-3"><span className="flex-1 truncate text-sm font-semibold">{v.title}</span><Badge>{ANNOUNCEMENT_CATEGORIES[v.category]}</Badge>{v.isFeatured && <Badge tone="amber">★</Badge>}</div>
              </summary>
              <div className="border-t border-basalt-100 p-3">
                <AdminForm action={saveVideo} compact><VideoFields v={v} /></AdminForm>
                <div className="mt-2"><ActionButton action={deleteVideo} fields={{ id: v.id }} label="Sil" icon={<Trash2 className="h-3.5 w-3.5" />} confirm="Video silinsin mi?" className="btn-ghost btn-sm text-red-600" /></div>
              </div>
            </details>
          ))}
        </div>
        <Panel title="Video Ekle"><AdminForm action={saveVideo} submitLabel="Ekle" resetOnSuccess><VideoFields /></AdminForm></Panel>
      </div>
    </>
  );
}
