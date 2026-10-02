"use client";

import Link from "next/link";
import { getAnnouncement, getAnnouncements } from "@/lib/data";
import { useData, useTitle } from "@/lib/hooks";
import { ErrorBox, NotFoundBox, PageLoader, Suspended, useParam } from "@/components/client";
import { ANNOUNCEMENT_CATEGORIES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui";

export default function AnnouncementPage() {
  return <Suspended><Inner /></Suspended>;
}

function Inner() {
  const slug = useParam("s") ?? "";
  const { data, error } = useData(async () => {
    const [a, all] = await Promise.all([getAnnouncement(slug), getAnnouncements()]);
    return a ? { a, others: all.filter((x) => x.id !== a.id).slice(0, 4) } : null;
  }, [slug]);
  useTitle(data?.a?.title);
  if (error) return <ErrorBox message={error} />;
  if (data === undefined) return <PageLoader />;
  if (!data || !data.a.isPublished) return <NotFoundBox title="Duyuru bulunamadı" />;
  const { a, others } = data;
  return (
    <article>
      <header className="bg-basalt-wall text-white">
        <div className="container-x max-w-3xl py-14">
          <Link href="/duyurular" className="text-sm text-white/60 hover:text-white">← Duyurular</Link>
          <div className="mt-4 flex gap-2"><Badge tone="dark">{ANNOUNCEMENT_CATEGORIES[a.category]}</Badge><span className="text-sm text-white/60">{formatDate(a.publishedAt)}</span></div>
          <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">{a.title}</h1>
          <p className="mt-4 text-lg text-white/70">{a.excerpt}</p>
        </div>
      </header>
      <div className="container-x grid max-w-5xl gap-10 py-10 lg:grid-cols-[1fr_16rem]">
        <div className="prose-lite text-basalt-700">
          {a.coverUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={a.coverUrl} alt="" className="mb-6 w-full rounded-2xl" />
          )}
          {a.content.split(/\n{2,}/).map((p, i) => <p key={i} className="whitespace-pre-line">{p}</p>)}
        </div>
        <aside>
          <p className="eyebrow mb-3 text-basalt-500">Diğer duyurular</p>
          <div className="space-y-3">
            {others.map((o) => (
              <Link key={o.id} href={`/duyurular/oku?s=${o.slug}`} className="block rounded-xl p-2 hover:bg-white">
                <p className="text-xs text-basalt-400">{formatDate(o.publishedAt)}</p>
                <p className="text-sm font-semibold leading-snug">{o.title}</p>
              </Link>
            ))}
          </div>
        </aside>
      </div>
    </article>
  );
}
