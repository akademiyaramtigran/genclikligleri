"use client";

import Link from "next/link";
import { Feather } from "lucide-react";
import { getHighlights, getPosts } from "@/lib/data";
import { useData, useTitle } from "@/lib/hooks";
import { ErrorBox, PageLoader, Suspended, useParam } from "@/components/client";
import { HIGHLIGHT_KINDS, POST_KINDS, POST_SECTIONS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { EmptyState, PageHero } from "@/components/ui";
import { FilterChips } from "@/components/FilterBar";
import { HighlightCard, PostCard } from "@/components/content";
import { useT } from "@/lib/i18n";

export default function VoicePage() {
  return <Suspended><Inner /></Suspended>;
}

function Inner() {
  const t = useT();
  useTitle(t("Gençliğin Sesi"));
  const tur = useParam("tur");
  const alan = useParam("alan");
  const { data, error } = useData(async () => {
    const [posts, highlights] = await Promise.all([getPosts(), getHighlights()]);
    return { posts, highlights };
  }, []);
  if (error) return <ErrorBox message={error} />;
  if (!data) return <PageLoader />;
  const posts = data.posts.filter((p) => (!tur || p.kind === tur) && (!alan || p.section === alan));
  const columns = data.posts.filter((p) => p.kind === "KOSE").slice(0, 6);
  // Her türün en yenisi
  const latest = Object.keys(HIGHLIGHT_KINDS).map((k) => data.highlights.find((h) => h.kind === k)).filter((h): h is NonNullable<typeof h> => !!h);
  const params = { tur, alan };

  return (
    <>
      <PageHero eyebrow={t("Haber Akışı")} title={t("Gençliğin Sesi")} description={t("Oyuncu ve antrenör röportajları, Genç Kalemler'in köşe yazıları, maçlardan ve provalardan anlık fotoğraflar.")} />
      <div className="container-x grid gap-10 py-10 lg:grid-cols-[1fr_22rem]">
        <div className="min-w-0">
          <div className="mb-4 space-y-3">
            <FilterChips name="tur" basePath="/gencligin-sesi" params={params} value={tur} options={Object.entries(POST_KINDS).map(([k, v]) => ({ value: k, label: v.label }))} />
            <FilterChips name="alan" basePath="/gencligin-sesi" params={params} value={alan} allLabel="Tüm Alanlar" options={Object.entries(POST_SECTIONS).map(([k, v]) => ({ value: k, label: v }))} />
          </div>
          <div className="mx-auto max-w-2xl space-y-6">
            {posts.length === 0 && <EmptyState title="Bu filtrede paylaşım yok" />}
            {posts.map((p) => <PostCard key={p.id} p={p} />)}
          </div>
        </div>
        <aside className="space-y-8 lg:sticky lg:top-24 lg:h-fit">
          {columns.length > 0 && (
            <div className="rounded-3xl bg-stage-950 p-6 text-stone-100">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-rose-400"><Feather className="h-4 w-4" /> {t("Dijital Dergi")}</p>
              <h2 className="mt-2 font-stage text-3xl uppercase">{t("Genç Kalemler köşesi")}</h2>
              <ul className="mt-4 divide-y divide-stage-line">
                {columns.map((p) => (
                  <li key={p.id}>
                    <Link href={`/gencligin-sesi/oku?s=${p.slug}`} className="group block py-3">
                      <p className="font-serif text-lg leading-snug group-hover:text-rose-300">{p.title}</p>
                      <p className="text-xs text-stone-400">{p.author} · {formatDate(p.publishedAt, { day: "numeric", month: "long" })}</p>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link href="/gencligin-sesi?tur=KOSE" className="mt-2 inline-block text-sm font-semibold text-rose-300 hover:text-rose-200">{t("Tüm köşe yazıları")} →</Link>
            </div>
          )}
          {latest.length > 0 && (
            <div className="space-y-4">
              <h2 className="font-display text-xl font-semibold uppercase tracking-wide">{t("Haftanın Öne Çıkanları")}</h2>
              {latest.map((h) => <HighlightCard key={h.id} h={h} />)}
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
