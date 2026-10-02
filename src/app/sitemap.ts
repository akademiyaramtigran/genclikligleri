import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const [leagues, teams, periods, plays, contestants, news] = await Promise.all([
    db.league.findMany({ select: { slug: true } }), db.team.findMany({ select: { slug: true } }), db.applicationPeriod.findMany({ where: { isPublished: true }, select: { slug: true } }),
    db.theatrePlay.findMany({ select: { slug: true } }), db.musicContestant.findMany({ select: { slug: true } }), db.announcement.findMany({ where: { isPublished: true }, select: { slug: true } }),
  ]);
  const stat = ["", "/spor", "/spor/fikstur", "/spor/krallik", "/spor/takimlar", "/spor/oyuncular", "/muzik", "/tiyatro", "/basvuru", "/videolar", "/duyurular", "/tesisler", "/hakkimizda", "/iletisim"];
  return [
    ...stat.map((p) => ({ url: `${base}${p}` })),
    ...leagues.map((x) => ({ url: `${base}/spor/lig/${x.slug}` })), ...teams.map((x) => ({ url: `${base}/spor/takim/${x.slug}` })),
    ...periods.map((x) => ({ url: `${base}/basvuru/${x.slug}` })), ...plays.map((x) => ({ url: `${base}/tiyatro/oyun/${x.slug}` })),
    ...contestants.map((x) => ({ url: `${base}/muzik/yarismaci/${x.slug}` })), ...news.map((x) => ({ url: `${base}/duyurular/${x.slug}` })),
  ];
}
