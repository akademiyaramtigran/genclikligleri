"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { getAll, getAnnouncements, getPlayers, getTeams } from "@/lib/data";
import { useData, useTitle } from "@/lib/hooks";
import type { MusicContestant, TheatrePlay } from "@/lib/types";
import { Suspended, useParam, withBase } from "@/components/client";
import { sportDef } from "@/lib/constants";
import { Avatar, EmptyState, PageHero, TeamCrest } from "@/components/ui";


export default function SearchPage() {
  return <Suspended><Inner /></Suspended>;
}

function Inner() {
  useTitle("Arama");
  const q = (useParam("q") ?? "").trim();
  const { data } = useData(async () => {
    if (q.length < 2) return null;
    const [teams, players, contestants, plays, news] = await Promise.all([getTeams(), getPlayers(), getAll<MusicContestant>("musicContestants"), getAll<TheatrePlay>("theatrePlays"), getAnnouncements()]);
    return { teams, players, contestants, plays, news };
  }, [q]);
  const needle = q.toLocaleLowerCase("tr-TR");
  const has = (...v: (string | null | undefined)[]) => v.some((x) => (x ?? "").toLocaleLowerCase("tr-TR").includes(needle));
  const tmap = new Map((data?.teams ?? []).map((t) => [t.id, t]));
  const teams = (data?.teams ?? []).filter((t) => has(t.name)).slice(0, 12);
  const players = (data?.players ?? []).filter((p) => has(`${p.firstName} ${p.lastName}`)).slice(0, 24).map((p) => ({ ...p, team: p.teamId ? tmap.get(p.teamId) : undefined }));
  const contestants = (data?.contestants ?? []).filter((c) => has(c.name)).slice(0, 8);
  const plays = (data?.plays ?? []).filter((p) => has(p.title, p.groupName)).slice(0, 8);
  const news = (data?.news ?? []).filter((n) => has(n.title)).slice(0, 8);
  const total = teams.length + players.length + contestants.length + plays.length + news.length;

  return (
    <>
      <PageHero eyebrow="Arama" title={q ? `“${q}”` : "Sitede Ara"}>
        <form className="mt-6 flex max-w-xl gap-2" action={withBase("/ara/")}>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-basalt-400" />
            <input name="q" defaultValue={q} autoFocus placeholder="Takım, oyuncu, yarışmacı, oyun…" className="input pl-9" />
          </div>
          <button className="btn bg-white text-basalt-900">Ara</button>
        </form>
      </PageHero>
      <div className="container-x space-y-10 py-10">
        {q.length >= 2 && data && total === 0 && <EmptyState title="Sonuç bulunamadı" description="Farklı bir kelimeyle tekrar deneyin." />}
        {teams.length > 0 && (
          <section><h2 className="mb-3 font-semibold">Takımlar</h2><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {teams.map((t) => <Link key={t.id} href={`/spor/takim?s=${t.slug}`} className="card flex items-center gap-3 p-3 hover:shadow-lg"><TeamCrest team={t} size={36} /><span><span className="block font-semibold">{t.name}</span><span className="text-xs text-basalt-500">{sportDef(t.sport).label} · {t.gender === "KADIN" ? "Kadın" : "Erkek"}</span></span></Link>)}
          </div></section>
        )}
        {players.length > 0 && (
          <section><h2 className="mb-3 font-semibold">Oyuncular</h2><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {players.map((p) => <Link key={p.id} href={`/spor/oyuncu?s=${p.slug}`} className="card flex items-center gap-3 p-3 hover:shadow-lg"><Avatar name={`${p.firstName} ${p.lastName}`} src={p.photoUrl} size={36} color={p.team?.primaryColor} /><span className="min-w-0"><span className="block truncate font-semibold">{p.firstName} {p.lastName}</span><span className="block truncate text-xs text-basalt-500">{p.team?.name}</span></span></Link>)}
          </div></section>
        )}
        {contestants.length > 0 && (
          <section><h2 className="mb-3 font-semibold">Müzik Yarışmacıları</h2><div className="flex flex-wrap gap-2">
            {contestants.map((c) => <Link key={c.id} href={`/muzik/yarismaci?s=${c.slug}`} className="rounded-full bg-fuchsia-50 px-4 py-2 text-sm font-semibold text-fuchsia-700 ring-1 ring-fuchsia-200 hover:bg-fuchsia-100">🎤 {c.name}</Link>)}
          </div></section>
        )}
        {plays.length > 0 && (
          <section><h2 className="mb-3 font-semibold">Tiyatro Oyunları</h2><div className="flex flex-wrap gap-2">
            {plays.map((p) => <Link key={p.id} href={`/tiyatro/oyun?s=${p.slug}`} className="rounded-full bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 ring-1 ring-amber-200 hover:bg-amber-100">🎭 {p.title} — {p.groupName}</Link>)}
          </div></section>
        )}
        {news.length > 0 && (
          <section><h2 className="mb-3 font-semibold">Duyurular</h2><div className="card divide-y divide-basalt-100">
            {news.map((n) => <Link key={n.id} href={`/duyurular/oku?s=${n.slug}`} className="block p-4 hover:bg-basalt-50"><span className="font-semibold">{n.title}</span><span className="block text-sm text-basalt-500">{n.excerpt}</span></Link>)}
          </div></section>
        )}
      </div>
    </>
  );
}
