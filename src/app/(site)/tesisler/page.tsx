"use client";

import { MapPin, Users, ExternalLink } from "lucide-react";
import { getVenues } from "@/lib/data";
import { useData, useTitle } from "@/lib/hooks";
import { ErrorBox, PageLoader } from "@/components/client";
import { VENUE_TYPES } from "@/lib/constants";
import { Badge, PageHero } from "@/components/ui";


import { useT } from "@/lib/i18n";
export default function VenuesPage() {
  const t = useT();
  useTitle(t("Tesisler & Sahneler"));
  const { data: venues, error } = useData(getVenues, []);
  if (error) return <ErrorBox message={error} />;
  if (!venues) return <PageLoader />;
  const types = Object.keys(VENUE_TYPES).filter((t) => venues.some((v) => v.type === t));
  return (
    <>
      <PageHero eyebrow={t("Mekânlar")} title={t("Tesisler & Sahneler")} description={t("Şehrin dört bir yanındaki sahalar, salonlar ve kültür merkezleri.")} />
      <div className="container-x space-y-12 py-10">
        {types.map((vt) => (
          <section key={vt}>
            <h2 className="mb-4 font-display text-2xl font-semibold uppercase tracking-wide">{t(VENUE_TYPES[vt] ?? vt)}</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {venues.filter((v) => v.type === vt).map((v) => (
                <div key={v.id} id={v.slug} className="card scroll-mt-28 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold">{v.name}</h3>
                    <Badge>{v.district}</Badge>
                  </div>
                  {v.address && <p className="mt-2 flex items-center gap-1.5 text-sm text-basalt-500"><MapPin className="h-4 w-4" /> {v.address}</p>}
                  {v.capacity && <p className="mt-1 flex items-center gap-1.5 text-sm text-basalt-500"><Users className="h-4 w-4" /> {v.capacity.toLocaleString("tr-TR")} {t("kişilik")}</p>}
                  {v.description && <p className="mt-3 text-sm text-basalt-600">{v.description}</p>}
                  <a href={v.mapUrl || `https://www.google.com/maps/search/${encodeURIComponent(`${v.name} ${v.district} Diyarbakır`)}`} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-dicle-700">{t("Haritada aç")} <ExternalLink className="h-3.5 w-3.5" /></a>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
