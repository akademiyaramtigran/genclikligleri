"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser, logActivity } from "@/lib/auth";
import { saveImage, UploadError } from "@/lib/storage";
import { uniqueSlug } from "@/lib/slug";
import { type ActionResult, ok, fail, str, optStr, int, num, bool, dt, dateOnly, file, prismaMessage } from "@/lib/form";

const refresh = () => revalidatePath("/", "layout");

async function imageField(fd: FormData, name: string, current: string | null | undefined) {
  if (bool(fd, `${name}_remove`)) return null;
  const f = file(fd, name);
  if (!f) return current ?? null;
  return saveImage(f);
}

/** "Ad | Rol" satırlarını JSON'a çevirir */
function parsePeople(text: string) {
  return text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).map((l) => {
    const [name, role] = l.split("|").map((x) => x.trim());
    return { name: name ?? "", role: role ?? "" };
  });
}

// ═════════════ MÜZİK ═════════════

export async function saveCompetition(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  const user = await requireUser("MUZIK");
  const id = str(fd, "id");
  const name = str(fd, "name", 100);
  const edition = str(fd, "edition", 20);
  if (!name || !edition) return fail("Ad ve dönem zorunludur.");
  const isCurrent = bool(fd, "isCurrent");
  const data = { name, edition, isCurrent, tagline: optStr(fd, "tagline", 200), description: optStr(fd, "description", 3000), prizes: optStr(fd, "prizes", 2000), status: str(fd, "status") || "PLANNED", votingOpen: bool(fd, "votingOpen") };
  let newId = id;
  try {
    if (isCurrent) await db.musicCompetition.updateMany({ where: id ? { id: { not: id } } : {}, data: { isCurrent: false } });
    if (id) await db.musicCompetition.update({ where: { id }, data });
    else {
      const slug = await uniqueSlug(`${name} ${edition}`, async (s) => !!(await db.musicCompetition.findUnique({ where: { slug: s } })));
      newId = (await db.musicCompetition.create({ data: { ...data, slug } })).id;
    }
    await logActivity(user.id, id ? "GUNCELLE" : "OLUSTUR", "Müzik Yarışması", newId, `${name} ${edition}`);
  } catch (e) { return fail(prismaMessage(e)); }
  refresh();
  if (!id) redirect(`/yonetim/muzik?c=${newId}`);
  return ok("Yarışma güncellendi.");
}

export async function saveContestant(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  const user = await requireUser("MUZIK");
  const id = str(fd, "id");
  const name = str(fd, "name", 100);
  const competitionId = str(fd, "competitionId");
  if (!name || !competitionId || !str(fd, "genre") || !str(fd, "district")) return fail("Ad, yarışma, tür ve ilçe zorunludur.");
  const current = id ? await db.musicContestant.findUnique({ where: { id } }) : null;
  let photoUrl: string | null;
  try { photoUrl = await imageField(fd, "photo", current?.photoUrl); } catch (e) { return fail(e instanceof UploadError ? e.message : "Fotoğraf yüklenemedi."); }
  const data = {
    name, competitionId, photoUrl, type: str(fd, "type") || "SOLO", genre: str(fd, "genre", 50), district: str(fd, "district", 50),
    members: JSON.stringify(parsePeople(str(fd, "members", 3000))), bio: optStr(fd, "bio", 3000), instagram: optStr(fd, "instagram", 200),
    youtubeUrl: optStr(fd, "youtubeUrl", 300), status: str(fd, "status") || "ACTIVE", finalRank: int(fd, "finalRank"),
  };
  let newId = id;
  try {
    if (id) await db.musicContestant.update({ where: { id }, data });
    else {
      const slug = await uniqueSlug(name, async (s) => !!(await db.musicContestant.findUnique({ where: { slug: s } })));
      newId = (await db.musicContestant.create({ data: { ...data, slug } })).id;
    }
    await logActivity(user.id, id ? "GUNCELLE" : "OLUSTUR", "Yarışmacı", newId, name);
  } catch (e) { return fail(prismaMessage(e)); }
  refresh();
  if (!id) redirect(`/yonetim/muzik/yarismacilar/${newId}`);
  return ok("Yarışmacı güncellendi.");
}

export async function deleteContestant(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  await requireUser("MUZIK");
  await db.musicContestant.delete({ where: { id: str(fd, "id") } });
  refresh();
  redirect("/yonetim/muzik/yarismacilar");
}

export async function saveRound(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  await requireUser("MUZIK");
  const id = str(fd, "id");
  const name = str(fd, "name", 80);
  const date = dt(fd, "date");
  const competitionId = str(fd, "competitionId");
  if (!name || !date || !competitionId) return fail("Tur adı ve tarihi zorunludur.");
  const data = { name, date, competitionId, order: int(fd, "order") ?? 1, venueId: optStr(fd, "venueId"), status: str(fd, "status") || "UPCOMING", advanceCount: int(fd, "advanceCount"), youtubeUrl: optStr(fd, "youtubeUrl", 300), description: optStr(fd, "description", 2000) };
  try {
    if (id) await db.musicRound.update({ where: { id }, data });
    else await db.musicRound.create({ data });
  } catch (e) { return fail(prismaMessage(e)); }
  refresh();
  return ok(id ? "Tur güncellendi." : "Tur eklendi.");
}

export async function deleteRound(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  await requireUser("MUZIK");
  await db.musicRound.delete({ where: { id: str(fd, "id") } });
  refresh();
  return ok("Tur silindi.");
}

export async function addPerformers(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  await requireUser("MUZIK");
  const roundId = str(fd, "roundId");
  const ids = fd.getAll("contestantId").map(String).filter(Boolean);
  if (!ids.length) return fail("Yarışmacı seçiniz.");
  const count = await db.musicPerformance.count({ where: { roundId } });
  let i = count;
  for (const contestantId of ids) {
    await db.musicPerformance.upsert({ where: { roundId_contestantId: { roundId, contestantId } }, create: { roundId, contestantId, songTitle: "Belirlenecek", order: ++i }, update: {} });
  }
  refresh();
  return ok(`${ids.length} yarışmacı tura eklendi.`);
}

export async function savePerformance(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  await requireUser("MUZIK");
  const id = str(fd, "id");
  if (str(fd, "remove") === "1") {
    await db.musicPerformance.delete({ where: { id } });
    refresh();
    return ok("Kaldırıldı.");
  }
  const jury = num(fd, "juryScore"), pub = num(fd, "publicScore");
  for (const v of [jury, pub]) if (v != null && (v < 0 || v > 100)) return fail("Puanlar 0-100 arasında olmalıdır.");
  await db.musicPerformance.update({
    where: { id },
    data: {
      songTitle: str(fd, "songTitle", 120) || "Belirlenecek", songArtist: optStr(fd, "songArtist", 120), order: int(fd, "order") ?? 0,
      juryScore: jury, publicScore: pub, youtubeUrl: optStr(fd, "youtubeUrl", 300), juryComment: optStr(fd, "juryComment", 500),
      totalScore: jury != null ? Math.round((jury * 0.7 + (pub ?? 0) * 0.3) * 10) / 10 : null,
    },
  });
  refresh();
  return ok("Kaydedildi.");
}

/** Halk oylarını 0-100 puana dönüştürür (en çok oy alan 100) */
export async function applyPublicVotes(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  await requireUser("MUZIK");
  const roundId = str(fd, "roundId");
  const perfs = await db.musicPerformance.findMany({ where: { roundId }, include: { contestant: { include: { _count: { select: { votes: { where: { NOT: { dayKey: { endsWith: "#ip" } } } } } } } } } });
  const max = Math.max(1, ...perfs.map((p) => p.contestant._count.votes));
  for (const p of perfs) {
    const pub = Math.round((p.contestant._count.votes / max) * 1000) / 10;
    await db.musicPerformance.update({ where: { id: p.id }, data: { publicScore: pub, totalScore: p.juryScore != null ? Math.round((p.juryScore * 0.7 + pub * 0.3) * 10) / 10 : null } });
  }
  refresh();
  return ok("Halk oyları puana dönüştürüldü.");
}

/** Turu sonuçlandırır: sıralama, tur atlayanlar ve elenenler */
export async function finalizeRound(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  const user = await requireUser("MUZIK");
  const roundId = str(fd, "roundId");
  const round = await db.musicRound.findUnique({ where: { id: roundId }, include: { performances: true } });
  if (!round) return fail("Tur bulunamadı.");
  if (round.performances.some((p) => p.totalScore == null)) return fail("Tüm performanslar için jüri puanı girilmelidir.");
  const sorted = [...round.performances].sort((a, b) => (b.totalScore ?? 0) - (a.totalScore ?? 0));
  const adv = round.advanceCount ?? 0;
  const isFinal = !adv;
  for (const [i, p] of sorted.entries()) {
    const advanced = adv ? i < adv : i === 0;
    await db.musicPerformance.update({ where: { id: p.id }, data: { rank: i + 1, advanced } });
    await db.musicContestant.update({
      where: { id: p.contestantId },
      data: isFinal ? { status: i === 0 ? "WINNER" : "FINALIST", finalRank: i + 1 } : { status: advanced ? "ACTIVE" : "ELIMINATED" },
    });
  }
  await db.musicRound.update({ where: { id: roundId }, data: { status: "COMPLETED" } });
  await logActivity(user.id, "SONUCLANDIR", "Müzik Turu", roundId, round.name);
  refresh();
  return ok(isFinal ? "Final sonuçlandı, şampiyon belirlendi! 🏆" : `Tur sonuçlandı: ${adv} yarışmacı tur atladı.`);
}

export async function saveJury(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  await requireUser("MUZIK");
  const id = str(fd, "id");
  if (str(fd, "remove") === "1") { await db.musicJury.delete({ where: { id } }); refresh(); return ok("Silindi."); }
  const name = str(fd, "name", 80), title = str(fd, "title", 120);
  if (!name || !title) return fail("Ad ve unvan zorunludur.");
  const data = { name, title, bio: optStr(fd, "bio", 1000), order: int(fd, "order") ?? 0, competitionId: str(fd, "competitionId") };
  if (id) await db.musicJury.update({ where: { id }, data }); else await db.musicJury.create({ data });
  refresh();
  return ok("Jüri üyesi kaydedildi.");
}

// ═════════════ TİYATRO ═════════════

export async function saveFestival(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  const user = await requireUser("TIYATRO");
  const id = str(fd, "id");
  const name = str(fd, "name", 120), edition = str(fd, "edition", 20);
  const startDate = dateOnly(fd, "startDate"), endDate = dateOnly(fd, "endDate");
  if (!name || !edition || !startDate || !endDate) return fail("Ad, dönem ve tarihler zorunludur.");
  const isCurrent = bool(fd, "isCurrent");
  const data = { name, edition, startDate, endDate, isCurrent, theme: optStr(fd, "theme", 120), tagline: optStr(fd, "tagline", 200), description: optStr(fd, "description", 3000), status: str(fd, "status") || "PLANNED" };
  let newId = id;
  try {
    if (isCurrent) await db.theatreFestival.updateMany({ where: id ? { id: { not: id } } : {}, data: { isCurrent: false } });
    if (id) await db.theatreFestival.update({ where: { id }, data });
    else {
      const slug = await uniqueSlug(`${name} ${startDate.getFullYear()}`, async (s) => !!(await db.theatreFestival.findUnique({ where: { slug: s } })));
      newId = (await db.theatreFestival.create({ data: { ...data, slug } })).id;
    }
    await logActivity(user.id, id ? "GUNCELLE" : "OLUSTUR", "Festival", newId, name);
  } catch (e) { return fail(prismaMessage(e)); }
  refresh();
  if (!id) redirect(`/yonetim/tiyatro?f=${newId}`);
  return ok("Festival güncellendi.");
}

export async function saveGroup(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  await requireUser("TIYATRO");
  const id = str(fd, "id");
  const name = str(fd, "name", 120), district = str(fd, "district", 50);
  if (!name || !district) return fail("Ad ve ilçe zorunludur.");
  const current = id ? await db.theatreGroup.findUnique({ where: { id } }) : null;
  let logoUrl: string | null;
  try { logoUrl = await imageField(fd, "logo", current?.logoUrl); } catch (e) { return fail(e instanceof UploadError ? e.message : "Logo yüklenemedi."); }
  const data = { name, district, logoUrl, foundedYear: int(fd, "foundedYear"), director: optStr(fd, "director", 80), memberCount: int(fd, "memberCount"), instagram: optStr(fd, "instagram", 200), description: optStr(fd, "description", 3000) };
  try {
    if (id) await db.theatreGroup.update({ where: { id }, data });
    else {
      const slug = await uniqueSlug(name, async (s) => !!(await db.theatreGroup.findUnique({ where: { slug: s } })));
      await db.theatreGroup.create({ data: { ...data, slug } });
    }
  } catch (e) { return fail(prismaMessage(e)); }
  refresh();
  return ok(id ? "Topluluk güncellendi." : "Topluluk eklendi.");
}

export async function deleteGroup(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  await requireUser("TIYATRO");
  await db.theatreGroup.delete({ where: { id: str(fd, "id") } });
  refresh();
  return ok("Topluluk silindi.");
}

export async function savePlay(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  const user = await requireUser("TIYATRO");
  const id = str(fd, "id");
  const title = str(fd, "title", 150), festivalId = str(fd, "festivalId"), groupId = str(fd, "groupId");
  if (!title || !festivalId || !groupId || !str(fd, "playwright") || !str(fd, "director")) return fail("Oyun adı, festival, topluluk, yazar ve yönetmen zorunludur.");
  const current = id ? await db.theatrePlay.findUnique({ where: { id } }) : null;
  let posterUrl: string | null;
  try { posterUrl = await imageField(fd, "poster", current?.posterUrl); } catch (e) { return fail(e instanceof UploadError ? e.message : "Afiş yüklenemedi."); }
  const data = {
    title, festivalId, groupId, posterUrl, playwright: str(fd, "playwright", 120), director: str(fd, "director", 120), genre: str(fd, "genre", 40) || "Dram",
    durationMin: int(fd, "durationMin"), ageLimit: optStr(fd, "ageLimit", 30), language: str(fd, "language", 40) || "Türkçe", synopsis: optStr(fd, "synopsis", 5000),
    cast: JSON.stringify(parsePeople(str(fd, "cast", 5000))), youtubeUrl: optStr(fd, "youtubeUrl", 300), inCompetition: bool(fd, "inCompetition"),
  };
  let newId = id;
  try {
    if (id) await db.theatrePlay.update({ where: { id }, data });
    else {
      const slug = await uniqueSlug(title, async (s) => !!(await db.theatrePlay.findUnique({ where: { slug: s } })));
      newId = (await db.theatrePlay.create({ data: { ...data, slug } })).id;
    }
    await logActivity(user.id, id ? "GUNCELLE" : "OLUSTUR", "Oyun", newId, title);
  } catch (e) { return fail(prismaMessage(e)); }
  refresh();
  if (!id) redirect(`/yonetim/tiyatro/oyunlar/${newId}`);
  return ok("Oyun güncellendi.");
}

export async function deletePlay(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  await requireUser("TIYATRO");
  await db.theatrePlay.delete({ where: { id: str(fd, "id") } });
  refresh();
  redirect("/yonetim/tiyatro/oyunlar");
}

export async function saveShow(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  await requireUser("TIYATRO");
  const id = str(fd, "id");
  if (str(fd, "remove") === "1") { await db.theatreShow.delete({ where: { id } }); refresh(); return ok("Silindi."); }
  const date = dt(fd, "date");
  if (!date) return fail("Tarih giriniz.");
  const data = { playId: str(fd, "playId"), date, venueId: optStr(fd, "venueId"), ticketInfo: str(fd, "ticketInfo", 100) || "Ücretsiz", status: str(fd, "status") || "SCHEDULED" };
  if (id) await db.theatreShow.update({ where: { id }, data }); else await db.theatreShow.create({ data });
  refresh();
  return ok("Gösterim kaydedildi.");
}

export async function saveAward(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  await requireUser("TIYATRO");
  const id = str(fd, "id");
  if (str(fd, "remove") === "1") { await db.theatreAward.delete({ where: { id } }); refresh(); return ok("Silindi."); }
  const category = str(fd, "category", 80), winner = str(fd, "winner", 150);
  if (!category || !winner) return fail("Kategori ve kazanan zorunludur.");
  await db.theatreAward.create({ data: { festivalId: str(fd, "festivalId"), category, winner, playId: optStr(fd, "playId") } });
  refresh();
  return ok("Ödül eklendi.");
}

export async function saveWorkshop(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  await requireUser("TIYATRO");
  const id = str(fd, "id");
  if (str(fd, "remove") === "1") { await db.theatreWorkshop.delete({ where: { id } }); refresh(); return ok("Silindi."); }
  const title = str(fd, "title", 120), date = dt(fd, "date");
  if (!title || !date) return fail("Başlık ve tarih zorunludur.");
  await db.theatreWorkshop.create({ data: { festivalId: str(fd, "festivalId"), title, date, instructor: str(fd, "instructor", 100) || "—", location: str(fd, "location", 150) || "—", description: optStr(fd, "description", 1000) } });
  refresh();
  return ok("Etkinlik eklendi.");
}
