"use client";

import Link from "next/link";
import { AlertTriangle, CalendarDays, Inbox, Mail, Mic2, Shield, Theater, Trophy, Users } from "lucide-react";
import { where } from "firebase/firestore";
import { countOf, getCurrentCompetition, getCurrentFestival } from "@/lib/data";
import { getAllMatches, getAllPeriods, getApplications, getLogs, getMessages } from "@/lib/admin-data";
import { canAccess } from "@/lib/admin";
import { useData } from "@/lib/hooks";
import { useAdmin } from "../AdminContext";
import { ErrorBox, PageLoader } from "@/components/client";
import { APPLICATION_STATUS, CATEGORIES, sportDef } from "@/lib/constants";
import { periodState } from "@/lib/periods";
import { formatDateTime, formatShortDate, formatTime } from "@/lib/utils";
import { Badge, StatTile, TeamCrest } from "@/components/ui";
import { AdminHeader, Panel } from "@/components/admin/fields";
import { AdminForm } from "@/components/admin/AdminForm";
import { quickScore } from "@/actions/spor";
import { DemoExtras } from "./DemoExtras";

export default function Dashboard() {
  const user = useAdmin();
  const showSport = canAccess(user, "SPOR");
  const { data, error } = useData(async () => {
    const now = new Date();
    const [teams, players, apps, matches, periods, messages, logs, comp, fest] = await Promise.all([
      countOf("teams", where("status", "==", "ACTIVE")).catch(() => 0),
      countOf("players").catch(() => 0),
      getApplications(user),
      showSport ? getAllMatches() : Promise.resolve([]),
      getAllPeriods(user),
      getMessages().catch(() => []),
      getLogs(8).catch(() => []),
      getCurrentCompetition(),
      getCurrentFestival(),
    ]);
    const [contestants, plays] = await Promise.all([
      comp ? countOf("musicContestants", where("competitionId", "==", comp.id)) : 0,
      fest ? countOf("theatrePlays", where("festivalId", "==", fest.id)) : 0,
    ]);
    return {
      teams, players, contestants, plays, logs,
      finished: matches.filter((m) => m.status === "FINISHED").length,
      scheduled: matches.filter((m) => m.status === "SCHEDULED" && m.date >= now).length,
      awaiting: matches.filter((m) => m.status === "SCHEDULED" && m.date < now).slice(0, 8),
      pendingApps: apps.filter((a) => a.status === "PENDING" || a.status === "IN_REVIEW").length,
      recentApps: apps.slice(0, 6),
      periods: periods.filter((p) => p.endDate >= now).sort((x, y) => x.endDate.getTime() - y.endDate.getTime()).map((p) => ({ ...p, count: apps.filter((a) => a.periodId === p.id).length })),
      messages: messages.filter((m) => !m.isRead).slice(0, 4),
    };
  }, []);
  if (error) return <ErrorBox message={error} />;
  if (!data) return <PageLoader />;
  const { teams, players, finished, scheduled, pendingApps, recentApps, awaiting, periods, messages, logs, contestants, plays } = data;
  const yetki = undefined as string | undefined;

  return (
    <>
      <AdminHeader title={`Hoş geldin, ${user.name.split(" ")[0]} 👋`} description="Organizasyonun genel durumu ve bekleyen işler." actions={<Link href="/yonetim/maclar/yeni" className="btn-primary">+ Maç Ekle</Link>} />
      {user.role === "SUPER_ADMIN" && <div className="mb-6"><DemoExtras /></div>}
      {yetki === "yok" && <div className="mb-6 flex items-center gap-2 rounded-xl bg-amber-50 p-4 text-sm text-amber-800 ring-1 ring-amber-200"><AlertTriangle className="h-4 w-4" /> Bu bölüm için yetkiniz bulunmuyor.</div>}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Bekleyen Başvuru" value={pendingApps} icon={<Inbox className="h-4 w-4" />} sub={<Link href="/yonetim/basvurular" className="link">İncele →</Link>} />
        <StatTile label="Aktif Takım" value={teams} icon={<Shield className="h-4 w-4" />} sub={`${players} sporcu`} />
        <StatTile label="Oynanan / Kalan Maç" value={`${finished} / ${scheduled}`} icon={<Trophy className="h-4 w-4" />} />
        <StatTile label="Yarışmacı / Oyun" value={`${contestants} / ${plays}`} icon={<Mic2 className="h-4 w-4" />} sub="Güncel yarışma & festival" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {showSport && (
          <Panel title={<span className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-500" /> Sonuç Bekleyen Maçlar</span>} description="Tarihi geçmiş ama skoru girilmemiş maçlar — hızlı skor girişi yapabilirsiniz.">
            {awaiting.length === 0 ? <p className="text-sm text-basalt-500">Tüm maç sonuçları güncel. 🎉</p> : (
              <div className="divide-y divide-basalt-100">
                {awaiting.map((m) => (
                  <div key={m.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-basalt-500">{sportDef(m.sport).emoji} {m.leagueName} · {formatShortDate(m.date)} {formatTime(m.date)}</p>
                      <p className="flex items-center gap-2 text-sm font-medium"><TeamCrest team={m.home} size={20} /> {m.home.name} <span className="text-basalt-400">vs</span> {m.away.name} <TeamCrest team={m.away} size={20} /></p>
                    </div>
                    <AdminForm action={quickScore} submitLabel="Kaydet" compact className="flex items-center gap-2 [&>div]:mt-0">
                      <input type="hidden" name="id" value={m.id} />
                      <input name="homeScore" type="number" min={0} required className="input w-16 py-1.5 text-center" aria-label="Ev sahibi skor" />
                      <span>-</span>
                      <input name="awayScore" type="number" min={0} required className="input w-16 py-1.5 text-center" aria-label="Deplasman skor" />
                    </AdminForm>
                    <Link href={`/yonetim/maclar/duzenle?id=${m.id}`} className="text-xs text-dicle-700">Detay</Link>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        )}
        <Panel title="Açık / Yaklaşan Başvuru Dönemleri" actions={<Link href="/yonetim/donemler/yeni" className="btn-outline btn-sm">+ Yeni</Link>}>
          {periods.length === 0 ? <p className="text-sm text-basalt-500">Aktif dönem yok.</p> : (
            <ul className="space-y-3">
              {periods.map((p) => {
                const st = periodState(p);
                return (
                  <li key={p.id}>
                    <Link href={`/yonetim/donemler/duzenle?id=${p.id}`} className="flex items-center justify-between gap-2 rounded-lg p-2 hover:bg-basalt-50">
                      <span className="min-w-0"><span className="block truncate text-sm font-medium">{p.title}</span><span className="text-xs text-basalt-500">{CATEGORIES[p.category as keyof typeof CATEGORIES]?.label} · {p.count} başvuru</span></span>
                      <Badge tone={st === "OPEN" ? "green" : "amber"}>{st === "OPEN" ? "Açık" : "Yakında"}</Badge>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Panel title="Son Başvurular" className="lg:col-span-2" actions={<Link href="/yonetim/basvurular" className="text-sm text-dicle-700">Tümü →</Link>}>
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead><tr><th>Başvuru</th><th>Dönem</th><th>Tarih</th><th>Durum</th></tr></thead>
              <tbody>
                {recentApps.map((a) => (
                  <tr key={a.id}>
                    <td><Link href={`/yonetim/basvurular/duzenle?id=${a.id}`} className="font-medium hover:text-dicle-700">{a.title}</Link><p className="text-xs text-basalt-500">{a.applicantName} · {a.district}</p></td>
                    <td className="max-w-[14rem] truncate text-basalt-600">{a.periodTitle}</td>
                    <td className="text-basalt-500">{formatShortDate(a.createdAt)}</td>
                    <td><Badge tone={APPLICATION_STATUS[a.status]?.tone}>{APPLICATION_STATUS[a.status]?.label}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <div className="space-y-6">
          <Panel title={<span className="flex items-center gap-2"><Mail className="h-4 w-4" /> Okunmamış Mesajlar</span>} actions={<Link href="/yonetim/mesajlar" className="text-sm text-dicle-700">Tümü →</Link>}>
            {messages.length === 0 ? <p className="text-sm text-basalt-500">Yeni mesaj yok.</p> : messages.map((m) => (
              <div key={m.id} className="border-b border-basalt-100 py-2 last:border-0"><p className="text-sm font-medium">{m.subject}</p><p className="text-xs text-basalt-500">{m.name} · {formatShortDate(m.createdAt)}</p></div>
            ))}
          </Panel>
          <Panel title="Son İşlemler">
            <ul className="space-y-2 text-xs">
              {logs.map((l) => (
                <li key={l.id} className="flex gap-2"><span className="text-basalt-400">{l.createdAt ? formatDateTime(l.createdAt).split(" ").slice(-1) : ""}</span><span><strong>{l.userName ?? "Sistem"}</strong> · {l.action} {l.entity}{l.details ? ` — ${l.details}` : ""}</span></li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[["/yonetim/ligler", "Ligler & Fikstür", Trophy], ["/yonetim/oyuncular/yeni", "Oyuncu Ekle", Users], ["/yonetim/muzik", "Müzik Puanlama", Mic2], ["/yonetim/tiyatro", "Festival Programı", Theater], ["/yonetim/maclar", "Maç Listesi", CalendarDays]].map(([h, l, I]) => {
          const Icon = I as typeof Trophy;
          return <Link key={h as string} href={h as string} className="card flex items-center gap-3 p-4 text-sm font-semibold hover:shadow-lg"><Icon className="h-5 w-5 text-dicle-600" /> {l as string}</Link>;
        })}
      </div>
    </>
  );
}
