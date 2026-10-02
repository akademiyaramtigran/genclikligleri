"use client";

import Link from "next/link";
import { startTransition, useActionState, useEffect, useState } from "react";
import { CheckCircle2, Loader2, Play, Radio, Square, Undo2, X } from "lucide-react";
import type { Match, Player } from "@/lib/types";
import { getMatch, getTeamPlayers } from "@/lib/data";
import { useData } from "@/lib/hooks";
import { ErrorBox, NotFoundBox, PageLoader, Suspended, useParam } from "@/components/client";
import { MATCH_STATUS, SPORTS, type SportKey } from "@/lib/constants";
import { cn, formatDateTime } from "@/lib/utils";
import { StatusBadge, TeamCrest } from "@/components/ui";
import { liveAction } from "@/actions/spor";
import type { ActionResult } from "@/lib/form";

export default function LiveEntry() {
  return <Suspended><Inner /></Suspended>;
}

/** Saha kenarından, telefondan tek dokunuşla skor ve olay girişi */
function Inner() {
  const id = useParam("id") ?? "";
  const { data, error } = useData(async () => {
    const m = await getMatch(id);
    if (!m) return null;
    const [home, away] = await Promise.all([getTeamPlayers(m.homeTeamId), getTeamPlayers(m.awayTeamId)]);
    return { m, home, away };
  }, [id]);
  const [state, dispatch, pending] = useActionState<ActionResult, FormData>(liveAction, null);
  const [sel, setSel] = useState<Record<string, string | null>>({});
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 15000); return () => clearInterval(t); }, []);

  if (error) return <ErrorBox message={error} />;
  if (data === undefined) return <PageLoader />;
  if (!data) return <NotFoundBox title="Maç bulunamadı" />;
  const { m, home, away } = data;
  const def = SPORTS[m.sport as SportKey];
  const live = m.status === "LIVE";
  const minute = live && m.liveStartedAt ? Math.max(1, Math.ceil((now - new Date(m.liveStartedAt).getTime()) / 60000)) : null;

  const send = (fields: Record<string, string | number | null | undefined>, confirmText?: string) => {
    if (confirmText && !confirm(confirmText)) return;
    const fd = new FormData();
    fd.set("matchId", m.id);
    for (const [k, v] of Object.entries(fields)) if (v != null) fd.set(k, String(v));
    startTransition(() => dispatch(fd));
  };

  const scoreButtons = m.sport === "BASKETBOL" ? [1, 2, 3] : [1];
  const scoreLabel = (d: number) => (m.sport === "VOLEYBOL" ? "+1 Set" : m.sport === "BASKETBOL" ? `+${d}` : "+1 Gol");
  const statTypes = m.sport === "FUTBOL" ? ["ASSIST", "YELLOW_CARD", "RED_CARD"] : m.sport === "HENTBOL" ? ["ASSIST", "SAVE", "SUSPENSION"] : m.sport === "VOLEYBOL" ? ["POINTS", "ACE", "BLOCK"] : ["REBOUND", "ASSIST", "BLOCK"];
  const recent = [...(m.liveLog ?? [])].reverse().slice(0, 8);

  const TeamPanel = ({ teamId, team, players }: { teamId: string; team: Match["home"]; players: Player[] }) => {
    const chosen = sel[teamId] ?? null;
    return (
      <div className="flex flex-col gap-3 rounded-2xl bg-white p-3 ring-1 ring-basalt-200">
        <div className="flex items-center gap-2"><TeamCrest team={team} size={28} /><span className="truncate font-semibold">{team.name}</span></div>
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${scoreButtons.length}, minmax(0, 1fr))` }}>
          {scoreButtons.map((d) => (
            <button key={d} type="button" disabled={!live || pending} onClick={() => send({ op: "score", teamId, delta: d, playerId: chosen })}
              className="h-16 rounded-xl bg-emerald-600 font-display text-2xl font-bold text-white shadow active:scale-95 disabled:opacity-40">{scoreLabel(d)}</button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {statTypes.map((ty) => {
            const e = def.events.find((x) => x.key === ty);
            return (
              <button key={ty} type="button" disabled={!live || pending || !chosen} onClick={() => send({ op: "stat", teamId, type: ty, playerId: chosen })}
                className={cn("h-11 rounded-lg text-xs font-bold ring-1 active:scale-95 disabled:opacity-40", ty === "RED_CARD" ? "bg-red-50 text-red-700 ring-red-200" : ty === "YELLOW_CARD" || ty === "SUSPENSION" ? "bg-yellow-50 text-yellow-800 ring-yellow-200" : "bg-basalt-50 text-basalt-700 ring-basalt-200")}>
                {e?.short} {e?.label}
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-basalt-500">{chosen ? "Seçili oyuncu skora ve olaya yazılır. Tekrar dokunarak bırakın." : "Oyuncu seçmeden skor eklenebilir; olaylar için oyuncu seçin."}</p>
        <div className="flex max-h-72 flex-wrap gap-1.5 overflow-y-auto">
          {players.map((p) => (
            <button key={p.id} type="button" onClick={() => setSel((s) => ({ ...s, [teamId]: s[teamId] === p.id ? null : p.id }))}
              className={cn("rounded-full px-3 py-2 text-xs font-semibold ring-1 transition", chosen === p.id ? "bg-basalt-900 text-white ring-basalt-900" : "bg-white text-basalt-700 ring-basalt-200")}>
              {p.jerseyNumber != null && <span className="mr-1 opacity-60">{p.jerseyNumber}</span>}{p.firstName} {p.lastName[0]}.
            </button>
          ))}
          {players.length === 0 && <span className="text-xs text-basalt-400">Kadro girilmemiş</span>}
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-3 flex items-center justify-between text-sm">
        <Link href={`/yonetim/maclar/duzenle?id=${m.id}`} className="text-basalt-500 hover:text-basalt-900">← Maç detayı</Link>
        <Link href={`/spor/mac?id=${m.id}`} target="_blank" className="text-basalt-500 hover:text-basalt-900">Sitede gör ↗</Link>
      </div>

      {/* Skorbord */}
      <div className="rounded-3xl bg-basalt-950 p-5 text-white shadow-xl">
        <div className="flex items-center justify-between text-xs text-white/60">
          <span>{def.emoji} {m.leagueName} · {m.round}. Hafta</span>
          {live ? <span className="flex items-center gap-1.5 font-bold text-red-400"><Radio className="h-3.5 w-3.5 animate-pulse" /> CANLI · {minute}&apos;</span> : <StatusBadge map={MATCH_STATUS} value={m.status} />}
        </div>
        <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="flex flex-col items-center gap-2 text-center"><TeamCrest team={m.home} size={56} /><span className="text-sm font-semibold">{m.home.name}</span></div>
          <div className="font-display text-6xl font-bold tabular-nums sm:text-7xl">{m.homeScore ?? 0}<span className="mx-2 text-white/30">:</span>{m.awayScore ?? 0}</div>
          <div className="flex flex-col items-center gap-2 text-center"><TeamCrest team={m.away} size={56} /><span className="text-sm font-semibold">{m.away.name}</span></div>
        </div>
        <p className="mt-3 text-center text-xs text-white/50">{formatDateTime(m.date)}{m.venueName ? ` · ${m.venueName}` : ""}</p>
      </div>

      {/* Durum mesajı */}
      <div className="my-3 min-h-[2.5rem]">
        {pending ? <p className="flex items-center gap-2 text-sm text-basalt-500"><Loader2 className="h-4 w-4 animate-spin" /> Kaydediliyor…</p>
          : state ? <p className={cn("flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium", state.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700")}>{state.ok ? <CheckCircle2 className="h-4 w-4" /> : <X className="h-4 w-4" />} {state.message}</p> : null}
      </div>

      {m.status === "FINISHED" ? (
        <div className="rounded-2xl bg-emerald-50 p-5 text-center text-emerald-900 ring-1 ring-emerald-200">
          <p className="font-semibold">Maç tamamlandı. Puan durumu ve istatistikler güncellendi.</p>
          <Link href={`/yonetim/maclar/duzenle?id=${m.id}`} className="btn-outline btn-sm mt-3">Ayrıntıları düzenle</Link>
        </div>
      ) : !live ? (
        <button type="button" disabled={pending} onClick={() => send({ op: "start" })} className="flex h-20 w-full items-center justify-center gap-3 rounded-2xl bg-red-600 text-xl font-bold text-white shadow-lg active:scale-[.98]">
          <Play className="h-7 w-7" /> Maçı Başlat (Canlı)
        </button>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <TeamPanel teamId={m.homeTeamId} team={m.home} players={home} />
            <TeamPanel teamId={m.awayTeamId} team={m.away} players={away} />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <button type="button" disabled={pending || !(m.liveLog ?? []).length} onClick={() => send({ op: "undo" })} className="flex h-14 items-center justify-center gap-2 rounded-xl bg-white font-semibold ring-1 ring-basalt-200 disabled:opacity-40"><Undo2 className="h-5 w-5" /> Geri Al</button>
            <button type="button" disabled={pending} onClick={() => send({ op: "end" }, `Maç ${m.homeScore ?? 0}-${m.awayScore ?? 0} bitirilsin mi? Puan durumu güncellenecek.`)} className="flex h-14 items-center justify-center gap-2 rounded-xl bg-basalt-900 font-semibold text-white"><Square className="h-5 w-5" /> Maçı Bitir</button>
          </div>
          {recent.length > 0 && (
            <div className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-basalt-200">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-basalt-500">Son işlemler</p>
              <ul className="space-y-1 text-sm">
                {recent.map((l) => {
                  const ev = l.eventId ? m.events.find((e) => e.id === l.eventId) : null;
                  const team = l.teamId === m.homeTeamId ? m.home : m.away;
                  return <li key={l.id} className="flex justify-between"><span>{ev?.minute ? `${ev.minute}' ` : ""}{team.shortName} {l.delta ? `+${l.delta}` : def.events.find((e) => e.key === ev?.type)?.label}</span><span className="text-basalt-500">{ev?.playerName}</span></li>;
                })}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
