"use client";

import Link from "next/link";
import { ArrowLeft, Drama, MapPin, Users, CalendarDays } from "lucide-react";
import { getFestivals, getGroup, getGroupPlays } from "@/lib/data";
import { useData, useTitle } from "@/lib/hooks";
import { ErrorBox, NotFoundBox, PageLoader, Suspended, useParam } from "@/components/client";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui";
import { useT } from "@/lib/i18n";

export default function GroupPage() {
  return <Suspended><Inner /></Suspended>;
}

function Inner() {
  const t = useT();
  const slug = useParam("s") ?? "";
  const { data, error } = useData(async () => {
    const g = await getGroup(slug);
    if (!g) return null;
    const [plays, festivals] = await Promise.all([getGroupPlays(g.id), getFestivals()]);
    return { g, plays: plays.map((p) => { const f = festivals.find((x) => x.id === p.festivalId); return { ...p, festival: f, awards: (f?.awards ?? []).filter((a) => a.playId === p.id) }; }) };
  }, [slug]);
  useTitle(data?.g?.name);
  if (error) return <ErrorBox message={error} />;
  if (data === undefined) return <PageLoader className="bg-stage-950" />;
  if (!data) return <NotFoundBox title={t("Topluluk bulunamadı")} />;
  const { g, plays } = data;

  return (
    <div className="bg-stage-950 pb-16 font-grotesk text-stone-100">
      <section className="border-b border-stage-line">
        <div className="container-x py-14">
          <Link href="/tiyatro" className="inline-flex items-center gap-1 text-sm text-stone-400 hover:text-white"><ArrowLeft className="h-4 w-4" /> {t("Tiyatro Festivali")}</Link>
          <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-center">
            {g.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={g.logoUrl} alt={g.name} className="h-28 w-28 object-cover" />
            ) : <span className="flex h-28 w-28 items-center justify-center bg-rose-500 font-stage text-6xl text-stage-950">{g.name[0]}</span>}
            <div>
              <p className="eyebrow text-rose-500">{t("Tiyatro Topluluğu")}</p>
              <h1 className="mt-2 font-stage text-6xl uppercase leading-[0.95] sm:text-7xl">{g.name}</h1>
              <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-stone-400">
                <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {g.district}</span>
                {g.foundedYear && <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4" /> {t("{y} yılından beri", { y: g.foundedYear })}</span>}
                {g.memberCount && <span className="flex items-center gap-1.5"><Users className="h-4 w-4" /> {g.memberCount} {t("üye")}</span>}
                {g.director && <span>{t("Sanat Yönetmeni")}: {g.director}</span>}
              </p>
            </div>
          </div>
        </div>
      </section>
      <div className="container-x mt-10 grid gap-8 lg:grid-cols-[1fr_2fr]">
        <div>
          <h2 className="mb-3 font-stage text-4xl uppercase">{t("Hakkında")}</h2>
          <p className="leading-relaxed text-stone-300">{g.description ?? "—"}</p>
          {g.instagram && <a href={g.instagram} target="_blank" rel="noreferrer" className="mt-4 inline-flex h-11 items-center border border-stone-200/70 px-5 font-bold uppercase tracking-wider hover:bg-white hover:text-stage-950">Instagram</a>}
        </div>
        <div>
          <h2 className="mb-4 font-stage text-4xl uppercase">{t("Festival Oyunları")}</h2>
          <div className="space-y-px bg-stage-line">
            {plays.map((p) => (
              <Link key={p.id} href={`/tiyatro/oyun?s=${p.slug}`} className="group flex items-center gap-4 bg-stage-900 p-4 transition hover:bg-[#232327]">
                <Drama className="h-8 w-8 shrink-0 text-rose-500" />
                <div className="min-w-0 flex-1">
                  <p className="font-stage text-2xl uppercase group-hover:text-rose-400">{p.title}</p>
                  <p className="text-sm text-stone-400">{p.festival?.edition} {t("Festival")} · {t(p.genre)}{p.shows[0] ? ` · ${formatDate(p.shows[0].date)}` : ""}</p>
                </div>
                {p.awards.map((a) => <Badge key={a.id} tone="yellow">🏆 {a.category}</Badge>)}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
