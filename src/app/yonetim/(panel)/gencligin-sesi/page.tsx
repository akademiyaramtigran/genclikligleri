"use client";

import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import type { Post } from "@/lib/types";
import { getAll, getOne } from "@/lib/data";
import { useData } from "@/lib/hooks";
import { ErrorBox, PageLoader, Suspended, useParam } from "@/components/client";
import { POST_KINDS, POST_SECTIONS } from "@/lib/constants";
import { formatDate, toDateTimeLocal } from "@/lib/utils";
import { Badge } from "@/components/ui";
import { AdminHeader, CheckField, FileField, FormGrid, Panel, SelectField, TextArea, TextField } from "@/components/admin/fields";
import { AdminForm, ActionButton } from "@/components/admin/AdminForm";
import { deletePost, savePost } from "@/actions/icerik";

const kinds = Object.fromEntries(Object.entries(POST_KINDS).map(([k, v]) => [k, v.label]));

function PostForm({ p }: { p?: Post | null }) {
  return (
    <AdminForm key={p?.id ?? "new"} action={savePost} submitLabel={p ? "Kaydet" : "Yayımla"}>
      {p && <input type="hidden" name="id" value={p.id} />}
      <div className="space-y-4">
        <FormGrid cols={3}>
          <SelectField label="Tür" name="kind" required defaultValue={p?.kind ?? "HABER"} options={kinds} />
          <SelectField label="Alan" name="section" defaultValue={p?.section ?? "GENEL"} options={POST_SECTIONS} />
          <TextField label="Yayın tarihi" name="publishedAt" type="datetime-local" defaultValue={toDateTimeLocal(p?.publishedAt ?? new Date())} />
        </FormGrid>
        <TextField label="Başlık" name="title" required defaultValue={p?.title} />
        <FormGrid cols={3}>
          <TextField label="Yazar / Konuşan" name="author" required defaultValue={p?.author} />
          <TextField label="Unvan" name="authorRole" defaultValue={p?.authorRole} placeholder="ör. Kaptan, Sur Gençlik SK" />
          <FileField label="Yazar fotoğrafı" name="authorPhoto" current={p?.authorPhoto} accept="image/png,image/jpeg,image/webp" />
        </FormGrid>
        <TextArea label="Metin" name="body" rows={8} defaultValue={p?.body} hint="Köşe yazısı / haber metni ya da röportaj girişi. Paragrafları boş satırla ayırın." />
        <TextArea label="Röportaj soru-cevapları" name="qa" rows={5} defaultValue={p?.qa?.map((x) => `${x.q} | ${x.a}`).join("\n")} hint="Her satır: Soru | Cevap (yalnızca röportajlarda)" />
        <div>
          <label className="label">Fotoğraflar (en fazla 4)</label>
          {p && p.photos.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-3">
              {p.photos.map((src, i) => (
                <label key={i} className="flex flex-col items-center gap-1 text-xs text-basalt-500">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-20 w-28 rounded-lg object-cover ring-1 ring-basalt-200" />
                  <span><input type="checkbox" name={`photo_remove_${i}`} /> Kaldır</span>
                </label>
              ))}
            </div>
          )}
          <input type="file" name="photos" multiple accept="image/png,image/jpeg,image/webp" className="block w-full text-sm text-basalt-600 file:mr-3 file:rounded-lg file:border-0 file:bg-basalt-100 file:px-3 file:py-2 file:text-sm file:font-semibold" />
          <p className="hint">Maç, prova ve sahne fotoğrafları otomatik küçültülür.</p>
        </div>
        <CheckField label="Yayında" name="isPublished" defaultChecked={p?.isPublished ?? true} />
      </div>
    </AdminForm>
  );
}

export default function PostsAdmin() {
  return <Suspended><Inner /></Suspended>;
}

function Inner() {
  const id = useParam("id");
  const isNew = useParam("yeni") != null;
  const { data, error } = useData(async () => {
    const list = (await getAll<Post>("posts")).sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
    return { list, current: id ? await getOne<Post>("posts", id) : null };
  }, [id]);
  if (error) return <ErrorBox message={error} />;
  if (!data) return <PageLoader />;
  const { list, current } = data;

  if (id || isNew) {
    return (
      <>
        <AdminHeader back={{ href: "/yonetim/gencligin-sesi", label: "Gençliğin Sesi" }} title={current ? current.title : "Yeni Paylaşım"}
          actions={current && <ActionButton action={deletePost} fields={{ id: current.id }} label="Sil" icon={<Trash2 className="h-3.5 w-3.5" />} confirm="Paylaşım silinsin mi?" className="btn-outline btn-sm text-red-600" />} />
        <Panel><PostForm p={current} /></Panel>
      </>
    );
  }
  return (
    <>
      <AdminHeader title="Gençliğin Sesi" description="Röportajlar, Genç Kalemler köşe yazıları (Dijital Dergi), maç ve prova fotoğrafları, haberler." actions={<Link href="/yonetim/gencligin-sesi?yeni" className="btn-primary btn-sm"><Plus className="h-4 w-4" /> Yeni Paylaşım</Link>} />
      <Panel>
        <div className="divide-y divide-basalt-100">
          {list.length === 0 && <p className="text-sm text-basalt-500">Henüz paylaşım yok.</p>}
          {list.map((p) => (
            <Link key={p.id} href={`/yonetim/gencligin-sesi?id=${p.id}`} className="flex items-center gap-3 py-3 hover:bg-basalt-50">
              {p.photos[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.photos[0]} alt="" className="h-12 w-16 rounded-lg object-cover" />
              ) : <span className="h-12 w-16 rounded-lg bg-basalt-100" />}
              <span className="min-w-0 flex-1"><span className="block truncate font-semibold">{p.title}</span><span className="text-xs text-basalt-500">{p.author} · {formatDate(p.publishedAt)}</span></span>
              <Badge tone={POST_KINDS[p.kind]?.tone === "emerald" ? "green" : POST_KINDS[p.kind]?.tone === "sky" ? "blue" : POST_KINDS[p.kind]?.tone}>{POST_KINDS[p.kind]?.label}</Badge>
              <Badge>{POST_SECTIONS[p.section]}</Badge>
              {!p.isPublished && <Badge tone="zinc">Taslak</Badge>}
            </Link>
          ))}
        </div>
      </Panel>
    </>
  );
}
