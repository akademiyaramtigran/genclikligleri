import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { ANNOUNCEMENT_CATEGORIES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui";

type P = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { slug } = await params;
  const a = await db.announcement.findUnique({ where: { slug } });
  return { title: a?.title ?? "Duyuru", description: a?.excerpt };
}

export default async function AnnouncementPage({ params }: P) {
  const { slug } = await params;
  const a = await db.announcement.findUnique({ where: { slug } });
  if (!a || !a.isPublished) notFound();
  const others = await db.announcement.findMany({ where: { isPublished: true, id: { not: a.id } }, orderBy: { publishedAt: "desc" }, take: 4 });
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
              <Link key={o.id} href={`/duyurular/${o.slug}`} className="block rounded-xl p-2 hover:bg-white">
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
