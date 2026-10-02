"use client";

import Link from "next/link";
import { ArrowLeft, Drama, MapPin, Users, CalendarDays } from "lucide-react";
import { getFestivals, getGroup, getGroupPlays } from "@/lib/data";
import { useData, useTitle } from "@/lib/hooks";
import { ErrorBox, NotFoundBox, PageLoader, Suspended, useParam } from "@/components/client";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui";

export default function GroupPage() {
  return <Suspended><Inner /></Suspended>;
}

function Inner() {
  const slug = useParam("s") ?? "";
  const { data, error } = useData(async () => {
    const g = await getGroup(slug);
    if (!g) return null;
    const [plays, festivals] = await Promise.all([getGroupPlays(g.id), getFestivals()]);
    return { g, plays: plays.map((p) => { const f = festivals.find((x) => x.id === p.festivalId); return { ...p, festival: f, awards: (f?.awards ?? []).filter((a) => a.playId === p.id) }; }) };
  }, [slug]);
  useTitle(data?.g?.name);
  if (error) return <ErrorBox message={error} />;
  if (data === undefined) return <PageLoader className="bg-[#160404]" />;
  if (!data) return <NotFoundBox title="Topluluk bulunamadı" />;
  const { g, plays } = data;

  return (
    <div className="bg-[#160404] pb-16 text-white">
      <section className="bg-curtain">
        <div className="container-x py-14">
          <Link href="/tiyatro" className="inline-flex items-center gap-1 text-sm text-amber-100/70 hover:text-white"><ArrowLeft className="h-4 w-4" /> Tiyatro Festivali</Link>
          <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-center">
            {g.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={g.logoUrl} alt={g.name} className="h-28 w-28 rounded-full object-cover ring-4 ring-amber-300/40" />
            ) : <span className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-red-800 font-serif text-5xl font-bold ring-4 ring-amber-300/40">{g.name[0]}</span>}
            <div>
              <p className="eyebrow text-amber-300">Tiyatro Topluluğu</p>
              <h1 className="mt-2 font-serif text-5xl font-bold">{g.name}</h1>
              <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-white/70">
                <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {g.district}</span>
                {g.foundedYear && <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4" /> {g.foundedYear}&apos;den beri</span>}
                {g.memberCount && <span className="flex items-center gap-1.5"><Users className="h-4 w-4" /> {g.memberCount} üye</span>}
                {g.director && <span>Sanat Yönetmeni: {g.director}</span>}
              </p>
            </div>
          </div>
        </div>
      </section>
      <div className="container-x mt-10 grid gap-8 lg:grid-cols-[1fr_2fr]">
        <div>
          <h2 className="mb-3 font-serif text-2xl font-bold">Hakkında</h2>
          <p className="leading-relaxed text-white/70">{g.description ?? "—"}</p>
          {g.instagram && <a href={g.instagram} target="_blank" rel="noreferrer" className="btn mt-4 border border-white/15 text-white hover:bg-white/10">Instagram</a>}
        </div>
        <div>
          <h2 className="mb-4 font-serif text-2xl font-bold">Festival Oyunları</h2>
          <div className="space-y-3">
            {plays.map((p) => (
              <Link key={p.id} href={`/tiyatro/oyun?s=${p.slug}`} className="flex items-center gap-4 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10 transition hover:bg-white/10">
                <Drama className="h-8 w-8 shrink-0 text-amber-400" />
                <div className="min-w-0 flex-1">
                  <p className="font-serif text-xl font-semibold">{p.title}</p>
                  <p className="text-sm text-white/60">{p.festival?.edition} Festival · {p.genre}{p.shows[0] ? ` · ${formatDate(p.shows[0].date)}` : ""}</p>
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
