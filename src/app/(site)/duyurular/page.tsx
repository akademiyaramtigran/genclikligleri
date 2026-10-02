"use client";

import Link from "next/link";
import { getAnnouncements } from "@/lib/data";
import { useData, useTitle } from "@/lib/hooks";
import { ErrorBox, PageLoader, Suspended, useParam } from "@/components/client";
import { ANNOUNCEMENT_CATEGORIES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { Badge, EmptyState, PageHero } from "@/components/ui";
import { FilterChips } from "@/components/FilterBar";


const GRAD: Record<string, string> = { GENEL: "from-basalt-700 to-basalt-950", SPOR: "from-emerald-600 to-teal-900", MUZIK: "from-fuchsia-600 to-purple-950", TIYATRO: "from-amber-600 to-curtain-900", BASVURU: "from-sky-500 to-indigo-900" };

export default function AnnouncementsPage() {
  return <Suspended><Inner /></Suspended>;
}

function Inner() {
  useTitle("Duyurular");
  const sp = { kategori: useParam("kategori") };
  const cat = sp.kategori?.toUpperCase();
  const { data, error } = useData(getAnnouncements, []);
  if (error) return <ErrorBox message={error} />;
  if (!data) return <PageLoader />;
  const list = data.filter((a) => !cat || a.category === cat);
  return (
    <>
      <PageHero eyebrow="Haberler" title="Duyurular" description="Organizasyondan son haberler, başvuru duyuruları ve etkinlik bilgileri." />
      <div className="container-x py-10">
        <div className="mb-8"><FilterChips name="kategori" basePath="/duyurular" params={{ kategori: sp.kategori }} value={sp.kategori} options={Object.entries(ANNOUNCEMENT_CATEGORIES).map(([k, v]) => ({ value: k.toLowerCase(), label: v }))} /></div>
        {list.length === 0 && <EmptyState title="Duyuru bulunmuyor" />}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {list.map((a) => (
            <Link key={a.id} href={`/duyurular/oku?s=${a.slug}`} className="card group overflow-hidden transition hover:-translate-y-0.5 hover:shadow-xl">
              <div className={`relative aspect-[16/8] bg-gradient-to-br ${GRAD[a.category] ?? GRAD.GENEL}`}>
                {a.coverUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.coverUrl} alt="" className="h-full w-full object-cover" />
                )}
                <div className="absolute left-4 top-4 flex gap-2">
                  {a.isPinned && <Badge tone="red">Önemli</Badge>}
                  <Badge tone="dark">{ANNOUNCEMENT_CATEGORIES[a.category]}</Badge>
                </div>
              </div>
              <div className="p-5">
                <p className="text-xs text-basalt-500">{formatDate(a.publishedAt)}</p>
                <h2 className="mt-1 text-lg font-semibold leading-snug group-hover:text-dicle-700">{a.title}</h2>
                <p className="mt-2 line-clamp-3 text-sm text-basalt-500">{a.excerpt}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
