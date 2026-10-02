"use client";

import { deleteDoc, getDocs, query, collection, where, updateDoc, setDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { fdb } from "@/lib/firebase";
import { getAll, getOne } from "@/lib/data";
import { requireAdmin, logActivity, uniqueId, ref, newRef, changed, rebuildLeague, batchWrite, batchDelete, teamRef } from "@/lib/admin";
import { compressImage } from "@/lib/files";
import { type ActionResult, ok, fail, str, optStr, int, bool, dt, dateOnly, errMessage } from "@/lib/form";
import { SPORTS, type SportKey } from "@/lib/constants";
import { slugify } from "@/lib/utils";
import type { League, Match, MatchEvent, Player, Season, Team, Venue } from "@/lib/types";

const UNIT = "SPOR" as const;

export async function imageField(fd: FormData, name: string, current: string | null | undefined, maxSide: number) {
  if (bool(fd, `${name}_remove`)) return null;
  const f = fd.get(name);
  if (f instanceof File && f.size > 0) return compressImage(f, maxSide);
  return current ?? null;
}

const wrap = (fn: () => Promise<ActionResult>) => fn().catch((e) => fail(errMessage(e)));

// ───────────── Sezon ─────────────

export const saveSeason = (_p: ActionResult, fd: FormData) => wrap(async () => {
  const admin = await requireAdmin(UNIT);
  const id = str(fd, "id");
  const name = str(fd, "name", 30);
  const startDate = dateOnly(fd, "startDate"), endDate = dateOnly(fd, "endDate");
  if (!name || !startDate || !endDate) return fail("Sezon adı ve tarihleri zorunludur.");
  const isActive = bool(fd, "isActive");
  const sid = id || slugify(name);
  if (isActive) {
    const seasons = await getAll<Season>("seasons");
    await batchWrite(seasons.filter((s) => s.id !== sid).map((s) => ({ ref: ref("seasons", s.id), data: { isActive: false }, merge: true })));
    const leagues = await getAll<League>("leagues");
    await batchWrite(leagues.map((l) => ({ ref: ref("leagues", l.id), data: { seasonActive: l.seasonId === sid }, merge: true })));
  }
  await setDoc(ref("seasons", sid), { name, startDate, endDate, isActive }, { merge: true });
  if (id) {
    const leagues = await getAll<League>("leagues", where("seasonId", "==", sid));
    await batchWrite(leagues.map((l) => ({ ref: ref("leagues", l.id), data: { seasonName: name, seasonActive: isActive }, merge: true })));
  }
  await logActivity(admin, id ? "GUNCELLE" : "OLUSTUR", "Sezon", sid, name);
  changed();
  return ok(id ? "Sezon güncellendi." : "Sezon oluşturuldu.");
});

// ───────────── Lig ─────────────

export const saveLeague = (_p: ActionResult, fd: FormData) => wrap(async () => {
  const admin = await requireAdmin(UNIT);
  const id = str(fd, "id");
  const name = str(fd, "name", 120), sport = str(fd, "sport"), gender = str(fd, "gender"), seasonId = str(fd, "seasonId");
  if (!name || !(sport in SPORTS) || !["ERKEK", "KADIN"].includes(gender) || !seasonId) return fail("Ad, branş, kategori ve sezon zorunludur.");
  const season = await getOne<Season>("seasons", seasonId);
  const data = {
    name, sport, gender, seasonId, seasonName: season?.name ?? "", seasonActive: !!season?.isActive,
    ageGroup: str(fd, "ageGroup", 20) || "U-21", status: str(fd, "status") || "PLANNED",
    description: optStr(fd, "description", 2000), rules: optStr(fd, "rules", 5000),
  };
  let lid = id;
  if (id) await updateDoc(ref("leagues", id), data);
  else {
    lid = await uniqueId("leagues", `${name} ${season?.name ?? ""}`);
    await setDoc(ref("leagues", lid), { ...data, slug: lid, entries: [], summary: null, createdAt: new Date() });
  }
  await logActivity(admin, id ? "GUNCELLE" : "OLUSTUR", "Lig", lid, name);
  changed();
  return ok(id ? "Lig güncellendi." : "Lig oluşturuldu.", id ? undefined : `/yonetim/ligler/duzenle?id=${lid}`);
});

export const deleteLeague = (_p: ActionResult, fd: FormData) => wrap(async () => {
  const admin = await requireAdmin(UNIT);
  const id = str(fd, "id");
  const matches = await getDocs(query(collection(fdb(), "matches"), where("leagueId", "==", id)));
  await batchDelete(matches.docs.map((d) => d.ref));
  const league = await getOne<League>("leagues", id);
  for (const e of league?.entries ?? []) await updateDoc(ref("teams", e.teamId), { leagueIds: arrayRemove(id) }).catch(() => {});
  await deleteDoc(ref("leagues", id));
  await logActivity(admin, "SIL", "Lig", id);
  changed();
  return ok("Lig silindi.", "/yonetim/ligler");
});

export const addEntry = (_p: ActionResult, fd: FormData) => wrap(async () => {
  await requireAdmin(UNIT);
  const leagueId = str(fd, "leagueId");
  const teamIds = fd.getAll("teamId").map(String).filter(Boolean);
  if (!teamIds.length) return fail("Takım seçiniz.");
  const league = await getOne<League>("leagues", leagueId);
  if (!league) return fail("Lig bulunamadı.");
  const teams = (await Promise.all(teamIds.map((t) => getOne<Team>("teams", t)))).filter((t): t is Team => !!t);
  const wrong = teams.find((t) => t.sport !== league.sport || t.gender !== league.gender);
  if (wrong) return fail(`${wrong.name} bu ligin branşı/kategorisiyle uyuşmuyor.`);
  const entries = [...league.entries];
  for (const t of teams) if (!entries.some((e) => e.teamId === t.id)) entries.push({ teamId: t.id, penaltyPoints: 0, group: optStr(fd, "group", 10) });
  await updateDoc(ref("leagues", leagueId), { entries });
  for (const t of teams) await updateDoc(ref("teams", t.id), { leagueIds: arrayUnion(leagueId) });
  await rebuildLeague(leagueId);
  changed();
  return ok(`${teams.length} takım lige eklendi.`);
});

export const updateEntry = (_p: ActionResult, fd: FormData) => wrap(async () => {
  await requireAdmin(UNIT);
  const leagueId = str(fd, "leagueId"), teamId = str(fd, "teamId");
  const league = await getOne<League>("leagues", leagueId);
  if (!league) return fail("Lig bulunamadı.");
  let entries = league.entries;
  if (str(fd, "remove") === "1") {
    entries = entries.filter((e) => e.teamId !== teamId);
    await updateDoc(ref("teams", teamId), { leagueIds: arrayRemove(leagueId) }).catch(() => {});
  } else {
    entries = entries.map((e) => (e.teamId === teamId ? { ...e, penaltyPoints: int(fd, "penaltyPoints") ?? 0 } : e));
  }
  await updateDoc(ref("leagues", leagueId), { entries });
  await rebuildLeague(leagueId);
  changed();
  return ok();
});

/** Çember (round-robin) yöntemiyle fikstür oluşturur */
export const generateFixtures = (_p: ActionResult, fd: FormData) => wrap(async () => {
  const admin = await requireAdmin(UNIT);
  const leagueId = str(fd, "leagueId");
  const start = dt(fd, "start");
  const interval = int(fd, "interval") ?? 7, gap = int(fd, "gap") ?? 120;
  const doubleRound = bool(fd, "double"), replace = bool(fd, "replace");
  if (!start) return fail("Başlangıç tarihi giriniz.");
  const league = await getOne<League>("leagues", leagueId);
  if (!league) return fail("Lig bulunamadı.");
  if (league.entries.length < 2) return fail("Fikstür için en az 2 takım gerekir.");
  const existing = await getAll<Match>("matches", where("leagueId", "==", leagueId));
  if (existing.length && !replace) return fail("Ligde zaten maç var. Değiştirmek için 'Mevcut planlanmış maçları sil' seçeneğini işaretleyin.");
  if (replace) await batchDelete(existing.filter((m) => m.status !== "FINISHED").map((m) => ref("matches", m.id)));
  const startRound = replace ? Math.max(0, ...existing.filter((m) => m.status === "FINISHED").map((m) => m.round)) : 0;

  const teams = new Map((await getAll<Team>("teams")).map((t) => [t.id, t]));
  const venues = new Map((await getAll<Venue>("venues")).map((v) => [v.id, v]));
  const ids: (string | null)[] = league.entries.map((e) => e.teamId);
  if (ids.length % 2) ids.push(null);
  const rounds: [string, string][][] = [];
  const arr = [...ids];
  for (let r = 0; r < arr.length - 1; r++) {
    const pairs: [string, string][] = [];
    for (let i = 0; i < arr.length / 2; i++) {
      const a = arr[i], b = arr[arr.length - 1 - i];
      if (a && b) pairs.push(r % 2 === 0 ? [a, b] : [b, a]);
    }
    rounds.push(pairs);
    arr.splice(1, 0, arr.pop()!);
  }
  const all = doubleRound ? [...rounds, ...rounds.map((p) => p.map(([a, b]) => [b, a] as [string, string]))] : rounds;
  const ops = all.flatMap((pairs, r) =>
    pairs.map(([h, a], i) => {
      const home = teams.get(h)!, away = teams.get(a)!;
      const venue = home.venueId ? venues.get(home.venueId) : undefined;
      return {
        ref: newRef("matches"),
        data: {
          leagueId, leagueName: league.name, leagueSlug: league.slug, sport: league.sport, gender: league.gender, round: startRound + r + 1,
          homeTeamId: h, awayTeamId: a, teamIds: [h, a], home: teamRef(home), away: teamRef(away),
          date: new Date(start.getTime() + r * interval * 86_400_000 + i * gap * 60_000),
          venueId: venue?.id ?? null, venueName: venue?.name ?? null, status: "SCHEDULED", homeScore: null, awayScore: null,
          events: [], playerIds: [],
        },
      };
    }),
  );
  await batchWrite(ops);
  if (league.status === "PLANNED") await updateDoc(ref("leagues", leagueId), { status: "ONGOING" });
  await rebuildLeague(leagueId);
  await logActivity(admin, "FIKSTUR", "Lig", leagueId, `${ops.length} maç`);
  changed();
  return ok(`${all.length} haftalık fikstür oluşturuldu (${ops.length} maç).`);
});

// ───────────── Takım ─────────────

export const saveTeam = (_p: ActionResult, fd: FormData) => wrap(async () => {
  const admin = await requireAdmin(UNIT);
  const id = str(fd, "id");
  const name = str(fd, "name", 120), sport = str(fd, "sport"), gender = str(fd, "gender"), district = str(fd, "district", 50);
  if (!name || !(sport in SPORTS) || !["ERKEK", "KADIN"].includes(gender) || !district) return fail("Ad, branş, kategori ve ilçe zorunludur.");
  const current = id ? await getOne<Team>("teams", id) : null;
  const logoUrl = await imageField(fd, "logo", current?.logoUrl, 192);
  const venueId = optStr(fd, "venueId");
  const venue = venueId ? await getOne<Venue>("venues", venueId) : null;
  const data = {
    name, sport, gender, district, logoUrl, venueId, venueName: venue?.name ?? null,
    shortName: (str(fd, "shortName", 4) || name.slice(0, 3)).toLocaleUpperCase("tr-TR"),
    neighborhood: optStr(fd, "neighborhood", 80), primaryColor: str(fd, "primaryColor", 9) || "#0f766e", secondaryColor: str(fd, "secondaryColor", 9) || "#ffffff",
    foundedYear: int(fd, "foundedYear"), coachName: optStr(fd, "coachName", 80), managerName: optStr(fd, "managerName", 80),
    instagram: optStr(fd, "instagram", 200), description: optStr(fd, "description", 3000), status: str(fd, "status") || "ACTIVE",
  };
  let tid = id;
  if (id) {
    await updateDoc(ref("teams", id), data);
    // Maçlardaki takım bilgisini güncelle
    const ms = await getAll<Match>("matches", where("teamIds", "array-contains", id));
    const tr = teamRef({ ...data, slug: id });
    await batchWrite(ms.map((m) => ({ ref: ref("matches", m.id), data: m.homeTeamId === id ? { home: tr } : { away: tr }, merge: true })));
    for (const lid of current?.leagueIds ?? []) await rebuildLeague(lid);
  } else {
    tid = await uniqueId("teams", `${name} ${SPORTS[sport as SportKey].label}`);
    const leagueId = optStr(fd, "leagueId");
    await setDoc(ref("teams", tid), { ...data, slug: tid, leagueIds: leagueId ? [leagueId] : [] });
    if (leagueId) {
      const league = await getOne<League>("leagues", leagueId);
      if (league) {
        await updateDoc(ref("leagues", leagueId), { entries: [...league.entries, { teamId: tid, penaltyPoints: 0 }] });
        await rebuildLeague(leagueId);
      }
    }
  }
  await logActivity(admin, id ? "GUNCELLE" : "OLUSTUR", "Takım", tid, name);
  changed();
  return ok(id ? "Takım güncellendi." : "Takım oluşturuldu.", id ? undefined : `/yonetim/takimlar/duzenle?id=${tid}`);
});

export const deleteTeam = (_p: ActionResult, fd: FormData) => wrap(async () => {
  const admin = await requireAdmin(UNIT);
  const id = str(fd, "id");
  const ms = await getAll<Match>("matches", where("teamIds", "array-contains", id));
  const played = ms.filter((m) => m.status === "FINISHED").length;
  if (played > 0) return fail(`Takımın ${played} oynanmış maçı var. Silmek yerine durumunu 'Pasif' yapın.`);
  await batchDelete(ms.map((m) => ref("matches", m.id)));
  const team = await getOne<Team>("teams", id);
  for (const lid of team?.leagueIds ?? []) {
    const l = await getOne<League>("leagues", lid);
    if (l) { await updateDoc(ref("leagues", lid), { entries: l.entries.filter((e) => e.teamId !== id) }); await rebuildLeague(lid); }
  }
  const players = await getAll<Player>("players", where("teamId", "==", id));
  await batchWrite(players.map((p) => ({ ref: ref("players", p.id), data: { teamId: null }, merge: true })));
  await deleteDoc(ref("teams", id));
  await logActivity(admin, "SIL", "Takım", id);
  changed();
  return ok("Takım silindi.", "/yonetim/takimlar");
});

// ───────────── Oyuncu ─────────────

export const savePlayer = (_p: ActionResult, fd: FormData) => wrap(async () => {
  const admin = await requireAdmin(UNIT);
  const id = str(fd, "id");
  const firstName = str(fd, "firstName", 60), lastName = str(fd, "lastName", 60);
  const teamId = optStr(fd, "teamId");
  if (!firstName || !lastName) return fail("Ad ve soyad zorunludur.");
  const team = teamId ? await getOne<Team>("teams", teamId) : null;
  const current = id ? await getOne<Player>("players", id) : null;
  const photoUrl = await imageField(fd, "photo", current?.photoUrl, 400);
  const identityNo = str(fd, "identityNo", 11);
  if (identityNo && !/^\d{11}$/.test(identityNo)) return fail("T.C. kimlik numarası 11 haneli olmalıdır.");
  const data = {
    firstName, lastName, teamId, photoUrl, gender: team?.gender ?? (str(fd, "gender") || "ERKEK"), sport: team?.sport ?? null,
    birthDate: str(fd, "birthDate") || null, position: optStr(fd, "position", 40), jerseyNumber: int(fd, "jerseyNumber"),
    heightCm: int(fd, "heightCm"), weightKg: int(fd, "weightKg"), strongSide: optStr(fd, "strongSide", 20), district: optStr(fd, "district", 50),
    school: optStr(fd, "school", 120), bio: optStr(fd, "bio", 2000), licenseNo: optStr(fd, "licenseNo", 30),
    isCaptain: bool(fd, "isCaptain"), status: str(fd, "status") || "ACTIVE",
  };
  let pid = id;
  if (id) await updateDoc(ref("players", id), data);
  else {
    pid = await uniqueId("players", `${firstName} ${lastName}`);
    await setDoc(ref("players", pid), { ...data, slug: pid, createdAt: new Date() });
  }
  await setDoc(ref("playerPrivate", pid), { identityNo: identityNo || null });
  await logActivity(admin, id ? "GUNCELLE" : "OLUSTUR", "Oyuncu", pid, `${firstName} ${lastName}`);
  changed();
  return ok(id ? "Oyuncu güncellendi." : "Oyuncu oluşturuldu.", id ? undefined : `/yonetim/oyuncular/duzenle?id=${pid}`);
});

export const deletePlayer = (_p: ActionResult, fd: FormData) => wrap(async () => {
  const admin = await requireAdmin(UNIT);
  const id = str(fd, "id");
  await deleteDoc(ref("players", id));
  await deleteDoc(ref("playerPrivate", id)).catch(() => {});
  await logActivity(admin, "SIL", "Oyuncu", id);
  changed();
  return ok("Oyuncu silindi.", "/yonetim/oyuncular");
});

// ───────────── Maç ─────────────

export const saveMatch = (_p: ActionResult, fd: FormData) => wrap(async () => {
  const admin = await requireAdmin(UNIT);
  const id = str(fd, "id");
  const leagueId = str(fd, "leagueId"), homeTeamId = str(fd, "homeTeamId"), awayTeamId = str(fd, "awayTeamId");
  const date = dt(fd, "date");
  if (!leagueId || !homeTeamId || !awayTeamId || !date) return fail("Lig, takımlar ve tarih zorunludur.");
  if (homeTeamId === awayTeamId) return fail("Ev sahibi ve deplasman takımı aynı olamaz.");
  const status = str(fd, "status") || "SCHEDULED";
  const homeScore = int(fd, "homeScore"), awayScore = int(fd, "awayScore");
  if (status === "FINISHED" && (homeScore == null || awayScore == null)) return fail("Biten maç için skor giriniz.");
  const league = await getOne<League>("leagues", leagueId);
  if (!league) return fail("Lig bulunamadı.");
  const def = SPORTS[league.sport as SportKey];
  if (league.sport === "VOLEYBOL" && status === "FINISHED" && Math.max(homeScore ?? 0, awayScore ?? 0) !== 3) return fail("Voleybolda kazanan takım 3 set almalıdır.");
  if (!def.allowsDraw && status === "FINISHED" && homeScore === awayScore) return fail(`${def.label} maçları berabere bitemez.`);
  const [home, away] = await Promise.all([getOne<Team>("teams", homeTeamId), getOne<Team>("teams", awayTeamId)]);
  if (!home || !away) return fail("Takım bulunamadı.");
  const venueId = optStr(fd, "venueId");
  const venue = venueId ? await getOne<Venue>("venues", venueId) : null;
  const mvpPlayerId = optStr(fd, "mvpPlayerId");
  const mvp = mvpPlayerId ? await getOne<Player>("players", mvpPlayerId) : null;
  const data = {
    leagueId, leagueName: league.name, leagueSlug: league.slug, sport: league.sport, gender: league.gender,
    homeTeamId, awayTeamId, teamIds: [homeTeamId, awayTeamId], home: teamRef(home), away: teamRef(away),
    date, status, round: int(fd, "round") ?? 1, venueId, venueName: venue?.name ?? null, homeScore, awayScore,
    periodScores: optStr(fd, "periodScores", 200), referee: optStr(fd, "referee", 80), attendance: int(fd, "attendance"),
    youtubeUrl: optStr(fd, "youtubeUrl", 300), summary: optStr(fd, "summary", 5000),
    mvpPlayerId, mvpName: mvp ? `${mvp.firstName} ${mvp.lastName}` : null,
  };
  let mid = id;
  if (id) await updateDoc(ref("matches", id), data);
  else {
    const r = newRef("matches");
    mid = r.id;
    await setDoc(r, { ...data, events: [], playerIds: [] });
  }
  await rebuildLeague(leagueId);
  await logActivity(admin, id ? "GUNCELLE" : "OLUSTUR", "Maç", mid, status === "FINISHED" ? `Skor ${homeScore}-${awayScore}` : undefined);
  changed();
  return ok("Maç kaydedildi.", id ? undefined : `/yonetim/maclar/duzenle?id=${mid}`);
});

export const deleteMatch = (_p: ActionResult, fd: FormData) => wrap(async () => {
  const admin = await requireAdmin(UNIT);
  const id = str(fd, "id");
  const m = await getOne<Match>("matches", id);
  await deleteDoc(ref("matches", id));
  if (m) await rebuildLeague(m.leagueId);
  await logActivity(admin, "SIL", "Maç", id);
  changed();
  return ok("Maç silindi.", "/yonetim/maclar");
});

async function writeEvents(matchId: string, events: MatchEvent[]) {
  const playerIds = [...new Set(events.map((e) => e.playerId).filter((x): x is string => !!x))];
  await updateDoc(ref("matches", matchId), { events, playerIds });
  const m = await getOne<Match>("matches", matchId);
  if (m) await rebuildLeague(m.leagueId);
}

export const addEvent = (_p: ActionResult, fd: FormData) => wrap(async () => {
  await requireAdmin(UNIT);
  const matchId = str(fd, "matchId"), playerId = str(fd, "playerId"), type = str(fd, "type");
  if (!playerId || !type) return fail("Oyuncu ve olay tipi seçiniz.");
  const [m, player] = await Promise.all([getOne<Match>("matches", matchId), getOne<Player>("players", playerId)]);
  if (!m || !player?.teamId) return fail("Maç veya oyuncu bulunamadı.");
  const ev: MatchEvent = { id: crypto.randomUUID().slice(0, 8), teamId: player.teamId, playerId, playerName: `${player.firstName} ${player.lastName}`, type, value: Math.max(1, int(fd, "value") ?? 1), minute: int(fd, "minute") };
  await writeEvents(matchId, [...m.events, ev].sort((a, b) => (a.minute ?? 999) - (b.minute ?? 999)));
  changed();
  return ok("Olay eklendi.");
});

export const deleteEvent = (_p: ActionResult, fd: FormData) => wrap(async () => {
  await requireAdmin(UNIT);
  const matchId = str(fd, "matchId"), eventId = str(fd, "id");
  const m = await getOne<Match>("matches", matchId);
  if (!m) return fail("Maç bulunamadı.");
  await writeEvents(matchId, m.events.filter((e) => e.id !== eventId));
  changed();
  return ok("Silindi.");
});

/** Basketbol/voleybol/hentbol için toplu oyuncu istatistiği */
export const saveBoxScore = (_p: ActionResult, fd: FormData) => wrap(async () => {
  await requireAdmin(UNIT);
  const matchId = str(fd, "matchId"), teamId = str(fd, "teamId");
  const types = str(fd, "types").split(",").filter(Boolean);
  const [m, players] = await Promise.all([getOne<Match>("matches", matchId), getAll<Player>("players", where("teamId", "==", teamId))]);
  if (!m) return fail("Maç bulunamadı.");
  const kept = m.events.filter((e) => !(e.teamId === teamId && types.includes(e.type) && e.minute == null));
  const added: MatchEvent[] = players.flatMap((p) => types.map((t) => ({ p, t, v: int(fd, `${p.id}__${t}`) ?? 0 })))
    .filter((r) => r.v > 0)
    .map((r) => ({ id: crypto.randomUUID().slice(0, 8), teamId, playerId: r.p.id, playerName: `${r.p.firstName} ${r.p.lastName}`, type: r.t, value: r.v, minute: null }));
  await writeEvents(matchId, [...kept, ...added]);
  changed();
  return ok(`${added.length} istatistik kaydedildi.`);
});

export const quickScore = (_p: ActionResult, fd: FormData) => wrap(async () => {
  const admin = await requireAdmin(UNIT);
  const id = str(fd, "id");
  const hs = int(fd, "homeScore"), as = int(fd, "awayScore");
  if (hs == null || as == null) return fail("Skor giriniz.");
  const m = await getOne<Match>("matches", id);
  if (!m) return fail("Maç bulunamadı.");
  await updateDoc(ref("matches", id), { homeScore: hs, awayScore: as, status: "FINISHED" });
  await rebuildLeague(m.leagueId);
  await logActivity(admin, "SKOR", "Maç", id, `${hs}-${as}`);
  changed();
  return ok(`Skor kaydedildi: ${hs}-${as}`);
});

// ───────────── Tesis ─────────────

export const saveVenue = (_p: ActionResult, fd: FormData) => wrap(async () => {
  const admin = await requireAdmin();
  const id = str(fd, "id");
  const name = str(fd, "name", 120), district = str(fd, "district", 50);
  if (!name || !district) return fail("Ad ve ilçe zorunludur.");
  const data = { name, district, type: str(fd, "type") || "SAHA", address: optStr(fd, "address", 300), capacity: int(fd, "capacity"), mapUrl: optStr(fd, "mapUrl", 500), description: optStr(fd, "description", 2000) };
  if (id) await updateDoc(ref("venues", id), data);
  else {
    const vid = await uniqueId("venues", name);
    await setDoc(ref("venues", vid), { ...data, slug: vid });
  }
  await logActivity(admin, id ? "GUNCELLE" : "OLUSTUR", "Tesis", id || undefined, name);
  changed();
  return ok(id ? "Tesis güncellendi." : "Tesis eklendi.");
});

export const deleteVenue = (_p: ActionResult, fd: FormData) => wrap(async () => {
  await requireAdmin();
  await deleteDoc(ref("venues", str(fd, "id")));
  changed();
  return ok("Silindi.");
});

// ───────────── Canlı maç girişi ─────────────

/**
 * Maç sırasında tek dokunuşla işlem:
 * start · end · score (teamId, delta, playerId?) · stat (teamId, type, playerId) · undo
 */
export const liveAction = (_p: ActionResult, fd: FormData) => wrap(async () => {
  const admin = await requireAdmin(UNIT);
  const id = str(fd, "matchId"), op = str(fd, "op");
  const m = await getOne<Match>("matches", id);
  if (!m) return fail("Maç bulunamadı.");
  const def = SPORTS[m.sport as SportKey];
  const log = m.liveLog ?? [];
  const minute = m.liveStartedAt ? Math.max(1, Math.ceil((Date.now() - new Date(m.liveStartedAt).getTime()) / 60000)) : null;

  if (op === "start") {
    await updateDoc(ref("matches", id), { status: "LIVE", liveStartedAt: m.liveStartedAt ?? new Date(), homeScore: m.homeScore ?? 0, awayScore: m.awayScore ?? 0, liveLog: log });
    await logActivity(admin, "CANLI", "Maç", id, "Maç başladı");
    changed();
    return ok("Maç canlı yayında.");
  }
  if (op === "end") {
    const hs = m.homeScore ?? 0, as = m.awayScore ?? 0;
    if (m.sport === "VOLEYBOL" && Math.max(hs, as) !== 3) return fail("Voleybolda kazanan takım 3 set almalıdır.");
    if (!def.allowsDraw && hs === as) return fail(`${def.label} maçları berabere bitemez.`);
    await updateDoc(ref("matches", id), { status: "FINISHED", homeScore: hs, awayScore: as });
    await rebuildLeague(m.leagueId);
    await logActivity(admin, "SKOR", "Maç", id, `Canlı giriş bitti: ${hs}-${as}`);
    changed();
    return ok(`Maç bitti: ${hs}-${as}`);
  }
  if (m.status !== "LIVE") return fail("Önce maçı başlatın.");

  const teamId = str(fd, "teamId");
  const side = teamId === m.homeTeamId ? "home" : teamId === m.awayTeamId ? "away" : null;
  const playerId = optStr(fd, "playerId");
  const player = playerId ? await getOne<Player>("players", playerId) : null;
  const newEvent = (type: string, value: number): MatchEvent => ({ id: crypto.randomUUID().slice(0, 8), teamId, playerId: player?.id ?? null, playerName: player ? `${player.firstName} ${player.lastName}` : "", type, value, minute });

  if (op === "score") {
    if (!side) return fail("Takım seçiniz.");
    const delta = Math.min(3, Math.max(1, int(fd, "delta") ?? 1));
    // Voleybolda skor set sayısıdır (oyuncu olayı yazılmaz); diğer branşlarda oyuncu seçildiyse gol/sayı olayı da yazılır
    const ev = m.sport !== "VOLEYBOL" && player ? newEvent(def.scoringEvents[0]!, m.sport === "FUTBOL" ? 1 : delta) : null;
    const patch: Record<string, unknown> = {
      [side === "home" ? "homeScore" : "awayScore"]: ((side === "home" ? m.homeScore : m.awayScore) ?? 0) + delta,
      liveLog: [...log, { id: crypto.randomUUID().slice(0, 8), teamId, delta, eventId: ev?.id ?? null }],
    };
    if (ev) { patch.events = [...m.events, ev]; patch.playerIds = [...new Set([...m.playerIds, ev.playerId!])]; }
    await updateDoc(ref("matches", id), patch);
    changed();
    return ok(`+${delta} ${side === "home" ? m.home.shortName : m.away.shortName}${player ? ` · ${player.firstName} ${player.lastName}` : ""}`);
  }
  if (op === "stat") {
    const type = str(fd, "type");
    if (!side || !player || !def.events.some((e) => e.key === type)) return fail("Oyuncu ve olay seçiniz.");
    const ev = newEvent(type, 1);
    await updateDoc(ref("matches", id), {
      events: [...m.events, ev], playerIds: [...new Set([...m.playerIds, player.id])],
      liveLog: [...log, { id: crypto.randomUUID().slice(0, 8), teamId, delta: 0, eventId: ev.id }],
    });
    changed();
    return ok(`${def.events.find((e) => e.key === type)?.label}: ${player.firstName} ${player.lastName}`);
  }
  if (op === "undo") {
    const last = log[log.length - 1];
    if (!last) return fail("Geri alınacak işlem yok.");
    const lastSide = last.teamId === m.homeTeamId ? "homeScore" : "awayScore";
    const events = last.eventId ? m.events.filter((e) => e.id !== last.eventId) : m.events;
    await updateDoc(ref("matches", id), {
      [lastSide]: Math.max(0, ((lastSide === "homeScore" ? m.homeScore : m.awayScore) ?? 0) - last.delta),
      events, playerIds: [...new Set(events.map((e) => e.playerId).filter((x): x is string => !!x))], liveLog: log.slice(0, -1),
    });
    changed();
    return ok("Son işlem geri alındı.");
  }
  return fail("Bilinmeyen işlem.");
});
