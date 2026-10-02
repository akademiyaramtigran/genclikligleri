import type { Metadata } from "next";
import { MapPin, Users, ExternalLink } from "lucide-react";
import { db } from "@/lib/db";
import { VENUE_TYPES } from "@/lib/constants";
import { Badge, PageHero } from "@/components/ui";

export const metadata: Metadata = { title: "Tesisler & Sahneler", description: "Organizasyon maçlarının, konserlerin ve oyunların yapıldığı tesisler." };

export default async function VenuesPage() {
  const venues = await db.venue.findMany({ orderBy: [{ type: "asc" }, { name: "asc" }], include: { _count: { select: { matches: true, theatreShows: true, musicRounds: true, teams: true } } } });
  const types = Object.keys(VENUE_TYPES).filter((t) => venues.some((v) => v.type === t));
  return (
    <>
      <PageHero eyebrow="Mekânlar" title="Tesisler & Sahneler" description="Şehrin dört bir yanındaki sahalar, salonlar ve kültür merkezleri." />
      <div className="container-x space-y-12 py-10">
        {types.map((t) => (
          <section key={t}>
            <h2 className="mb-4 font-display text-2xl font-semibold uppercase tracking-wide">{VENUE_TYPES[t]}</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {venues.filter((v) => v.type === t).map((v) => (
                <div key={v.id} id={v.slug} className="card scroll-mt-28 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold">{v.name}</h3>
                    <Badge>{v.district}</Badge>
                  </div>
                  {v.address && <p className="mt-2 flex items-center gap-1.5 text-sm text-basalt-500"><MapPin className="h-4 w-4" /> {v.address}</p>}
                  {v.capacity && <p className="mt-1 flex items-center gap-1.5 text-sm text-basalt-500"><Users className="h-4 w-4" /> {v.capacity.toLocaleString("tr-TR")} kişilik</p>}
                  {v.description && <p className="mt-3 text-sm text-basalt-600">{v.description}</p>}
                  <div className="mt-4 flex flex-wrap gap-2 text-xs">
                    {v._count.matches > 0 && <Badge tone="green">{v._count.matches} maç</Badge>}
                    {v._count.teams > 0 && <Badge tone="blue">{v._count.teams} takımın iç sahası</Badge>}
                    {v._count.musicRounds > 0 && <Badge tone="fuchsia">{v._count.musicRounds} konser</Badge>}
                    {v._count.theatreShows > 0 && <Badge tone="amber">{v._count.theatreShows} gösterim</Badge>}
                  </div>
                  <a href={v.mapUrl || `https://www.google.com/maps/search/${encodeURIComponent(`${v.name} ${v.district} Diyarbakır`)}`} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-dicle-700">Haritada aç <ExternalLink className="h-3.5 w-3.5" /></a>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
