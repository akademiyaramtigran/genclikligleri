"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getPost, getPosts } from "@/lib/data";
import { useData, useTitle } from "@/lib/hooks";
import { ErrorBox, NotFoundBox, PageLoader, Suspended, useParam } from "@/components/client";
import { POST_KINDS, POST_SECTIONS } from "@/lib/constants";
import { cn, formatDate, initials } from "@/lib/utils";
import { PostCard } from "@/components/content";
import { useT } from "@/lib/i18n";

export default function PostPage() {
  return <Suspended><Inner /></Suspended>;
}

function Inner() {
  const t = useT();
  const slug = useParam("s") ?? "";
  const { data, error } = useData(async () => {
    const [p, all] = await Promise.all([getPost(slug), getPosts()]);
    return { p, more: all.filter((x) => x.slug !== slug).slice(0, 3) };
  }, [slug]);
  useTitle(data?.p?.title);
  if (error) return <ErrorBox message={error} />;
  if (!data) return <PageLoader />;
  const { p, more } = data;
  if (!p || !p.isPublished) return <NotFoundBox title="Paylaşım bulunamadı" />;
  const column = p.kind === "KOSE";

  return (
    <div className={cn(column ? "bg-[#f4eee2]" : "bg-basalt-50")}>
      <article className="container-x max-w-3xl py-10">
        <Link href="/gencligin-sesi" className="inline-flex items-center gap-1 text-sm text-basalt-500 hover:text-basalt-900"><ArrowLeft className="h-4 w-4" /> {t("Gençliğin Sesi")}</Link>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-dicle-700">{t(POST_KINDS[p.kind]?.label ?? p.kind)} · {t(POST_SECTIONS[p.section] ?? p.section)}</p>
        <h1 className={cn("mt-3 text-4xl font-bold leading-tight text-basalt-900 sm:text-5xl", column ? "font-serif" : "font-display uppercase tracking-wide")}>{p.title}</h1>
        <div className="mt-5 flex items-center gap-3">
          {p.authorPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.authorPhoto} alt="" className="h-12 w-12 rounded-full object-cover" />
          ) : <span className="flex h-12 w-12 items-center justify-center rounded-full bg-basalt-800 text-sm font-bold text-white">{initials(p.author)}</span>}
          <div><p className="font-semibold text-basalt-900">{p.author}</p><p className="text-sm text-basalt-500">{p.authorRole ? `${p.authorRole} · ` : ""}{formatDate(p.publishedAt)}</p></div>
        </div>
        {p.photos[0] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.photos[0]} alt="" className="mt-8 w-full rounded-3xl object-cover" />
        )}
        {p.body && (
          <div className={cn("mt-8 space-y-4 text-lg leading-relaxed text-basalt-700", column && "font-serif text-xl first-letter:float-left first-letter:mr-2 first-letter:font-serif first-letter:text-6xl first-letter:font-bold first-letter:leading-none first-letter:text-rose-700")}>
            {p.body.split(/\n\s*\n/).map((para, i) => <p key={i} className="whitespace-pre-line">{para}</p>)}
          </div>
        )}
        {p.qa && p.qa.length > 0 && (
          <div className="mt-8 space-y-6">
            {p.qa.map((x, i) => (
              <div key={i}>
                <p className="font-semibold text-basalt-900">— {x.q}</p>
                <p className="mt-2 border-l-4 border-sky-400 pl-4 text-lg leading-relaxed text-basalt-700">{x.a}</p>
              </div>
            ))}
          </div>
        )}
        {p.photos.length > 1 && (
          <div className="mt-8 grid grid-cols-2 gap-2">
            {p.photos.slice(1).map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={src} alt="" className="aspect-square w-full rounded-2xl object-cover" />
            ))}
          </div>
        )}
      </article>
      {more.length > 0 && (
        <section className="border-t border-basalt-200 bg-white py-10">
          <div className="container-x">
            <h2 className="mb-5 font-display text-2xl font-semibold uppercase tracking-wide">{t("Diğer paylaşımlar")}</h2>
            <div className="grid gap-5 md:grid-cols-3">{more.map((x) => <PostCard key={x.id} p={x} compact />)}</div>
          </div>
        </section>
      )}
    </div>
  );
}
