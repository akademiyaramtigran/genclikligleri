"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser, logActivity } from "@/lib/auth";
import { saveImage, UploadError } from "@/lib/storage";
import { uniqueSlug } from "@/lib/slug";
import { type ActionResult, ok, fail, str, optStr, int, bool, dt, dateOnly, file, prismaMessage } from "@/lib/form";
import { SPORTS, type SportKey } from "@/lib/constants";

const UNIT = "SPOR" as const;
const refresh = () => revalidatePath("/", "layout");

async function imageField(fd: FormData, name: string, current: string | null | undefined) {
  if (bool(fd, `${name}_remove`)) return null;
  const f = file(fd, name);
  if (!f) return current ?? null;
  return saveImage(f);
}

// ───────────── Sezon ─────────────

export async function saveSeason(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  const user = await requireUser(UNIT);
  const id = str(fd, "id");
  const name = str(fd, "name", 30);
  const startDate = dateOnly(fd, "startDate");
  const endDate = dateOnly(fd, "endDate");
  if (!name || !startDate || !endDate) return fail("Sezon adı ve tarihleri zorunludur.");
  const isActive = bool(fd, "isActive");
  try {
    if (isActive) await db.season.updateMany({ data: { isActive: false } });
    const s = id ? await db.season.update({ where: { id }, data: { name, startDate, endDate, isActive } }) : await db.season.create({ data: { name, startDate, endDate, isActive } });
    await logActivity(user.id, id ? "GUNCELLE" : "OLUSTUR", "Sezon", s.id, name);
  } catch (e) { return fail(prismaMessage(e)); }
  refresh();
  return ok(id ? "Sezon güncellendi." : "Sezon oluşturuldu.");
}

// ───────────── Lig ─────────────

export async function saveLeague(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  const user = await requireUser(UNIT);
  const id = str(fd, "id");
  const name = str(fd, "name", 120);
  const sport = str(fd, "sport");
  const gender = str(fd, "gender");
  const seasonId = str(fd, "seasonId");
  if (!name || !(sport in SPORTS) || !["ERKEK", "KADIN"].includes(gender) || !seasonId) return fail("Ad, branş, kategori ve sezon zorunludur.");
  const data = { name, sport, gender, seasonId, ageGroup: str(fd, "ageGroup", 20) || "U-21", status: str(fd, "status") || "PLANNED", description: optStr(fd, "description", 2000), rules: optStr(fd, "rules", 5000) };
  let newId = id;
  try {
    if (id) {
      await db.league.update({ where: { id }, data });
    } else {
      const season = await db.season.findUnique({ where: { id: seasonId } });
      const slug = await uniqueSlug(`${name} ${season?.name ?? ""}`, async (s) => !!(await db.league.findUnique({ where: { slug: s } })));
      newId = (await db.league.create({ data: { ...data, slug } })).id;
    }
    await logActivity(user.id, id ? "GUNCELLE" : "OLUSTUR", "Lig", newId, name);
  } catch (e) { return fail(prismaMessage(e)); }
  refresh();
  if (!id) redirect(`/yonetim/ligler/${newId}`);
  return ok("Lig güncellendi.");
}

export async function deleteLeague(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  const user = await requireUser(UNIT);
  const id = str(fd, "id");
  await db.league.delete({ where: { id } }).catch(() => null);
  await logActivity(user.id, "SIL", "Lig", id);
  refresh();
  redirect("/yonetim/ligler");
}

export async function addEntry(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  await requireUser(UNIT);
  const leagueId = str(fd, "leagueId");
  const teamIds = fd.getAll("teamId").map(String).filter(Boolean);
  if (!teamIds.length) return fail("Takım seçiniz.");
  const league = await db.league.findUnique({ where: { id: leagueId } });
  if (!league) return fail("Lig bulunamadı.");
  const teams = await db.team.findMany({ where: { id: { in: teamIds } } });
  const wrong = teams.find((t) => t.sport !== league.sport || t.gender !== league.gender);
  if (wrong) return fail(`${wrong.name} bu ligin branşı/kategorisiyle uyuşmuyor.`);
  for (const t of teams) await db.leagueEntry.upsert({ where: { leagueId_teamId: { leagueId, teamId: t.id } }, create: { leagueId, teamId: t.id, group: optStr(fd, "group", 10) }, update: {} });
  refresh();
  return ok(`${teams.length} takım lige eklendi.`);
}

export async function updateEntry(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  await requireUser(UNIT);
  const id = str(fd, "id");
  if (str(fd, "remove") === "1") {
    await db.leagueEntry.delete({ where: { id } });
  } else {
    await db.leagueEntry.update({ where: { id }, data: { penaltyPoints: int(fd, "penaltyPoints") ?? 0, group: optStr(fd, "group", 10) } });
  }
  refresh();
  return ok();
}

/** Çember (round-robin) yöntemiyle fikstür oluşturur */
export async function generateFixtures(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  const user = await requireUser(UNIT);
  const leagueId = str(fd, "leagueId");
  const start = dt(fd, "start");
  const interval = int(fd, "interval") ?? 7;
  const gap = int(fd, "gap") ?? 120;
  const doubleRound = bool(fd, "double");
  const replace = bool(fd, "replace");
  if (!start) return fail("Başlangıç tarihi giriniz.");
  const league = await db.league.findUnique({ where: { id: leagueId }, include: { entries: { include: { team: true } }, _count: { select: { matches: true } } } });
  if (!league) return fail("Lig bulunamadı.");
  if (league.entries.length < 2) return fail("Fikstür için en az 2 takım gerekir.");
  if (league._count.matches > 0 && !replace) return fail("Ligde zaten maç var. Değiştirmek için 'Mevcut planlanmış maçları sil' seçeneğini işaretleyin.");
  if (replace) await db.match.deleteMany({ where: { leagueId, status: { not: "FINISHED" } } });

  const ids: (string | null)[] = league.entries.map((e) => e.teamId);
  if (ids.length % 2) ids.push(null); // bay
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
  const existingRounds = replace ? (await db.match.aggregate({ where: { leagueId }, _max: { round: true } }))._max.round ?? 0 : 0;
  const venueOf = new Map(league.entries.map((e) => [e.teamId, e.team.venueId]));
  const data = all.flatMap((pairs, r) =>
    pairs.map(([home, away], i) => ({
      leagueId, round: existingRounds + r + 1, homeTeamId: home, awayTeamId: away,
      date: new Date(start.getTime() + r * interval * 86_400_000 + i * gap * 60_000),
      venueId: venueOf.get(home) ?? null,
    })),
  );
  await db.match.createMany({ data });
  await db.league.update({ where: { id: leagueId }, data: { status: league.status === "PLANNED" ? "ONGOING" : league.status } });
  await logActivity(user.id, "FIKSTUR", "Lig", leagueId, `${data.length} maç oluşturuldu`);
  refresh();
  return ok(`${all.length} haftalık fikstür oluşturuldu (${data.length} maç).`);
}

// ───────────── Takım ─────────────

export async function saveTeam(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  const user = await requireUser(UNIT);
  const id = str(fd, "id");
  const name = str(fd, "name", 120);
  const sport = str(fd, "sport");
  const gender = str(fd, "gender");
  const district = str(fd, "district", 50);
  if (!name || !(sport in SPORTS) || !["ERKEK", "KADIN"].includes(gender) || !district) return fail("Ad, branş, kategori ve ilçe zorunludur.");
  const current = id ? await db.team.findUnique({ where: { id } }) : null;
  let logoUrl: string | null;
  try { logoUrl = await imageField(fd, "logo", current?.logoUrl); } catch (e) { return fail(e instanceof UploadError ? e.message : "Logo yüklenemedi."); }
  const data = {
    name, sport, gender, district, logoUrl,
    shortName: (str(fd, "shortName", 4) || name.slice(0, 3)).toLocaleUpperCase("tr-TR"),
    neighborhood: optStr(fd, "neighborhood", 80), primaryColor: str(fd, "primaryColor", 9) || "#0f766e", secondaryColor: str(fd, "secondaryColor", 9) || "#ffffff",
    foundedYear: int(fd, "foundedYear"), coachName: optStr(fd, "coachName", 80), managerName: optStr(fd, "managerName", 80),
    contactPhone: optStr(fd, "contactPhone", 30), contactEmail: optStr(fd, "contactEmail", 120), instagram: optStr(fd, "instagram", 200),
    description: optStr(fd, "description", 3000), status: str(fd, "status") || "ACTIVE", venueId: optStr(fd, "venueId"),
  };
  let newId = id;
  try {
    if (id) await db.team.update({ where: { id }, data });
    else {
      const slug = await uniqueSlug(`${name} ${SPORTS[sport as SportKey].label}`, async (s) => !!(await db.team.findUnique({ where: { slug: s } })));
      newId = (await db.team.create({ data: { ...data, slug } })).id;
      const leagueId = optStr(fd, "leagueId");
      if (leagueId) await db.leagueEntry.create({ data: { leagueId, teamId: newId } }).catch(() => null);
    }
    await logActivity(user.id, id ? "GUNCELLE" : "OLUSTUR", "Takım", newId, name);
  } catch (e) { return fail(prismaMessage(e)); }
  refresh();
  if (!id) redirect(`/yonetim/takimlar/${newId}`);
  return ok("Takım güncellendi.");
}

export async function deleteTeam(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  const user = await requireUser(UNIT);
  const id = str(fd, "id");
  const played = await db.match.count({ where: { status: "FINISHED", OR: [{ homeTeamId: id }, { awayTeamId: id }] } });
  if (played > 0) return fail(`Takımın ${played} oynanmış maçı var. Silmek yerine durumunu 'Pasif' yapın.`);
  await db.team.delete({ where: { id } });
  await logActivity(user.id, "SIL", "Takım", id);
  refresh();
  redirect("/yonetim/takimlar");
}

// ───────────── Oyuncu ─────────────

export async function savePlayer(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  const user = await requireUser(UNIT);
  const id = str(fd, "id");
  const firstName = str(fd, "firstName", 60);
  const lastName = str(fd, "lastName", 60);
  const teamId = optStr(fd, "teamId");
  if (!firstName || !lastName) return fail("Ad ve soyad zorunludur.");
  const team = teamId ? await db.team.findUnique({ where: { id: teamId } }) : null;
  const gender = team?.gender ?? (str(fd, "gender") || "ERKEK");
  const current = id ? await db.player.findUnique({ where: { id } }) : null;
  let photoUrl: string | null;
  try { photoUrl = await imageField(fd, "photo", current?.photoUrl); } catch (e) { return fail(e instanceof UploadError ? e.message : "Fotoğraf yüklenemedi."); }
  const identityNo = str(fd, "identityNo", 11);
  if (identityNo && !/^\d{11}$/.test(identityNo)) return fail("T.C. kimlik numarası 11 haneli olmalıdır.");
  const data = {
    firstName, lastName, gender, teamId, photoUrl,
    birthDate: dateOnly(fd, "birthDate"), position: optStr(fd, "position", 40), jerseyNumber: int(fd, "jerseyNumber"),
    heightCm: int(fd, "heightCm"), weightKg: int(fd, "weightKg"), strongSide: optStr(fd, "strongSide", 20), district: optStr(fd, "district", 50),
    school: optStr(fd, "school", 120), bio: optStr(fd, "bio", 2000), licenseNo: optStr(fd, "licenseNo", 30), identityNo: identityNo || null,
    isCaptain: bool(fd, "isCaptain"), status: str(fd, "status") || "ACTIVE",
  };
  let newId = id;
  try {
    if (id) await db.player.update({ where: { id }, data });
    else {
      const slug = await uniqueSlug(`${firstName} ${lastName}`, async (s) => !!(await db.player.findUnique({ where: { slug: s } })));
      newId = (await db.player.create({ data: { ...data, slug } })).id;
    }
    await logActivity(user.id, id ? "GUNCELLE" : "OLUSTUR", "Oyuncu", newId, `${firstName} ${lastName}`);
  } catch (e) { return fail(prismaMessage(e)); }
  refresh();
  if (!id) redirect(`/yonetim/oyuncular/${newId}`);
  return ok("Oyuncu güncellendi.");
}

export async function deletePlayer(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  const user = await requireUser(UNIT);
  const id = str(fd, "id");
  await db.player.delete({ where: { id } });
  await logActivity(user.id, "SIL", "Oyuncu", id);
  refresh();
  redirect("/yonetim/oyuncular");
}

// ───────────── Maç ─────────────

export async function saveMatch(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  const user = await requireUser(UNIT);
  const id = str(fd, "id");
  const leagueId = str(fd, "leagueId");
  const homeTeamId = str(fd, "homeTeamId");
  const awayTeamId = str(fd, "awayTeamId");
  const date = dt(fd, "date");
  if (!leagueId || !homeTeamId || !awayTeamId || !date) return fail("Lig, takımlar ve tarih zorunludur.");
  if (homeTeamId === awayTeamId) return fail("Ev sahibi ve deplasman takımı aynı olamaz.");
  const status = str(fd, "status") || "SCHEDULED";
  const homeScore = int(fd, "homeScore");
  const awayScore = int(fd, "awayScore");
  if (status === "FINISHED" && (homeScore == null || awayScore == null)) return fail("Biten maç için skor giriniz.");
  const league = await db.league.findUnique({ where: { id: leagueId } });
  if (league?.sport === "VOLEYBOL" && status === "FINISHED" && Math.max(homeScore ?? 0, awayScore ?? 0) !== 3) return fail("Voleybolda kazanan takım 3 set almalıdır.");
  if (league && !SPORTS[league.sport as SportKey].allowsDraw && status === "FINISHED" && homeScore === awayScore) return fail(`${SPORTS[league.sport as SportKey].label} maçları berabere bitemez.`);
  const data = {
    leagueId, homeTeamId, awayTeamId, date, status,
    round: int(fd, "round") ?? 1, venueId: optStr(fd, "venueId"),
    homeScore, awayScore,
    periodScores: optStr(fd, "periodScores", 200), referee: optStr(fd, "referee", 80), attendance: int(fd, "attendance"),
    youtubeUrl: optStr(fd, "youtubeUrl", 300), summary: optStr(fd, "summary", 5000), mvpPlayerId: optStr(fd, "mvpPlayerId"),
  };
  let newId = id;
  try {
    if (id) await db.match.update({ where: { id }, data });
    else newId = (await db.match.create({ data })).id;
    await logActivity(user.id, id ? "GUNCELLE" : "OLUSTUR", "Maç", newId, status === "FINISHED" ? `Skor ${homeScore}-${awayScore}` : undefined);
  } catch (e) { return fail(prismaMessage(e)); }
  refresh();
  if (!id) redirect(`/yonetim/maclar/${newId}`);
  return ok("Maç kaydedildi.");
}

export async function deleteMatch(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  const user = await requireUser(UNIT);
  const id = str(fd, "id");
  await db.match.delete({ where: { id } });
  await logActivity(user.id, "SIL", "Maç", id);
  refresh();
  redirect("/yonetim/maclar");
}

export async function addEvent(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  await requireUser(UNIT);
  const matchId = str(fd, "matchId");
  const playerId = str(fd, "playerId");
  const type = str(fd, "type");
  if (!playerId || !type) return fail("Oyuncu ve olay tipi seçiniz.");
  const player = await db.player.findUnique({ where: { id: playerId } });
  if (!player?.teamId) return fail("Oyuncunun takımı yok.");
  await db.matchEvent.create({ data: { matchId, playerId, teamId: player.teamId, type, value: Math.max(1, int(fd, "value") ?? 1), minute: int(fd, "minute"), note: optStr(fd, "note", 100) } });
  refresh();
  return ok("Olay eklendi.");
}

/** Basketbol/voleybol gibi branşlarda toplu oyuncu istatistiği girişi */
export async function saveBoxScore(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  await requireUser(UNIT);
  const matchId = str(fd, "matchId");
  const teamId = str(fd, "teamId");
  const types = str(fd, "types").split(",").filter(Boolean);
  const players = await db.player.findMany({ where: { teamId } });
  await db.matchEvent.deleteMany({ where: { matchId, teamId, type: { in: types }, minute: null } });
  const rows = players.flatMap((p) => types.map((t) => ({ p, t, v: int(fd, `${p.id}__${t}`) ?? 0 }))).filter((r) => r.v > 0);
  if (rows.length) await db.matchEvent.createMany({ data: rows.map((r) => ({ matchId, teamId, playerId: r.p.id, type: r.t, value: r.v })) });
  refresh();
  return ok(`${rows.length} istatistik kaydedildi.`);
}

export async function deleteEvent(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  await requireUser(UNIT);
  await db.matchEvent.delete({ where: { id: str(fd, "id") } }).catch(() => null);
  refresh();
  return ok("Silindi.");
}

/** Hızlı skor girişi (maç listesinden) */
export async function quickScore(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  const user = await requireUser(UNIT);
  const id = str(fd, "id");
  const hs = int(fd, "homeScore"), as = int(fd, "awayScore");
  if (hs == null || as == null) return fail("Skor giriniz.");
  await db.match.update({ where: { id }, data: { homeScore: hs, awayScore: as, status: "FINISHED" } });
  await logActivity(user.id, "SKOR", "Maç", id, `${hs}-${as}`);
  refresh();
  return ok(`Skor kaydedildi: ${hs}-${as}`);
}

// ───────────── Tesis ─────────────

export async function saveVenue(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const id = str(fd, "id");
  const name = str(fd, "name", 120);
  const district = str(fd, "district", 50);
  if (!name || !district) return fail("Ad ve ilçe zorunludur.");
  const data = { name, district, type: str(fd, "type") || "SAHA", address: optStr(fd, "address", 300), capacity: int(fd, "capacity"), mapUrl: optStr(fd, "mapUrl", 500), description: optStr(fd, "description", 2000) };
  try {
    if (id) await db.venue.update({ where: { id }, data });
    else {
      const slug = await uniqueSlug(name, async (s) => !!(await db.venue.findUnique({ where: { slug: s } })));
      await db.venue.create({ data: { ...data, slug } });
    }
    await logActivity(user.id, id ? "GUNCELLE" : "OLUSTUR", "Tesis", id || undefined, name);
  } catch (e) { return fail(prismaMessage(e)); }
  refresh();
  return ok(id ? "Tesis güncellendi." : "Tesis eklendi.");
}

export async function deleteVenue(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  await requireUser();
  await db.venue.delete({ where: { id: str(fd, "id") } }).catch(() => null);
  refresh();
  return ok("Silindi.");
}
