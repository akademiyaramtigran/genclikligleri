"use client";

import { deleteDoc, setDoc, updateDoc, where } from "firebase/firestore";
import { getAll, getOne, countOf } from "@/lib/data";
import { requireAdmin, logActivity, uniqueId, ref, newRef, changed, batchWrite, batchDelete } from "@/lib/admin";
import { type ActionResult, ok, fail, str, optStr, int, num, bool, dt, dateOnly, errMessage } from "@/lib/form";
import { imageField } from "./spor";
import type { MusicCompetition, MusicContestant, MusicRound, Performance, TheatreFestival, TheatreGroup, TheatrePlay, Venue, WritingContest, WritingEntry } from "@/lib/types";

const wrap = (fn: () => Promise<ActionResult>) => fn().catch((e) => fail(errMessage(e)));
const uid = () => crypto.randomUUID().slice(0, 8);

/** "Ad | Rol" satırlarını listeye çevirir */
function parsePeople(text: string) {
  return text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).map((l) => {
    const [name, role] = l.split("|").map((x) => x.trim());
    return { name: name ?? "", role: role ?? "" };
  });
}

async function venueName(id: string | null) {
  return id ? (await getOne<Venue>("venues", id))?.name ?? null : null;
}

// ═════════════ MÜZİK ═════════════

export const saveCompetition = (_p: ActionResult, fd: FormData) => wrap(async () => {
  const admin = await requireAdmin("MUZIK");
  const id = str(fd, "id");
  const name = str(fd, "name", 100), edition = str(fd, "edition", 20);
  if (!name || !edition) return fail("Ad ve dönem zorunludur.");
  const isCurrent = bool(fd, "isCurrent");
  const data = { name, edition, isCurrent, tagline: optStr(fd, "tagline", 200), description: optStr(fd, "description", 3000), prizes: optStr(fd, "prizes", 2000), status: str(fd, "status") || "PLANNED", votingOpen: bool(fd, "votingOpen") };
  let cid = id;
  if (!id) cid = await uniqueId("musicCompetitions", `${name} ${edition}`);
  if (isCurrent) {
    const all = await getAll<MusicCompetition>("musicCompetitions");
    await batchWrite(all.filter((c) => c.id !== cid && c.isCurrent).map((c) => ({ ref: ref("musicCompetitions", c.id), data: { isCurrent: false }, merge: true })));
  }
  if (id) await updateDoc(ref("musicCompetitions", id), data);
  else await setDoc(ref("musicCompetitions", cid), { ...data, slug: cid, jury: [], createdAt: new Date() });
  await logActivity(admin, id ? "GUNCELLE" : "OLUSTUR", "Müzik Yarışması", cid, `${name} ${edition}`);
  changed();
  return ok(id ? "Yarışma güncellendi." : "Yarışma oluşturuldu.", id ? undefined : `/yonetim/muzik?c=${cid}`);
});

export const saveContestant = (_p: ActionResult, fd: FormData) => wrap(async () => {
  const admin = await requireAdmin("MUZIK");
  const id = str(fd, "id");
  const name = str(fd, "name", 100), competitionId = str(fd, "competitionId");
  if (!name || !competitionId || !str(fd, "genre") || !str(fd, "district")) return fail("Ad, yarışma, tür ve ilçe zorunludur.");
  const current = id ? await getOne<MusicContestant>("musicContestants", id) : null;
  const data = {
    name, competitionId, photoUrl: await imageField(fd, "photo", current?.photoUrl, 500), type: str(fd, "type") || "SOLO", genre: str(fd, "genre", 50),
    district: str(fd, "district", 50), members: parsePeople(str(fd, "members", 3000)), bio: optStr(fd, "bio", 3000), instagram: optStr(fd, "instagram", 200),
    youtubeUrl: optStr(fd, "youtubeUrl", 300), status: str(fd, "status") || "ACTIVE", finalRank: int(fd, "finalRank"),
  };
  let cid = id;
  if (id) {
    await updateDoc(ref("musicContestants", id), data);
    // Turlardaki adı güncelle
    const rounds = await getAll<MusicRound>("musicRounds", where("competitionId", "==", competitionId));
    await batchWrite(rounds.filter((r) => r.performances.some((p) => p.contestantId === id)).map((r) => ({ ref: ref("musicRounds", r.id), data: { performances: r.performances.map((p) => (p.contestantId === id ? { ...p, contestantName: name } : p)) }, merge: true })));
  } else {
    cid = await uniqueId("musicContestants", name);
    await setDoc(ref("musicContestants", cid), { ...data, slug: cid, createdAt: new Date() });
  }
  await logActivity(admin, id ? "GUNCELLE" : "OLUSTUR", "Yarışmacı", cid, name);
  changed();
  return ok(id ? "Yarışmacı güncellendi." : "Yarışmacı eklendi.", id ? undefined : `/yonetim/muzik/yarismacilar/duzenle?id=${cid}`);
});

export const deleteContestant = (_p: ActionResult, fd: FormData) => wrap(async () => {
  await requireAdmin("MUZIK");
  const id = str(fd, "id");
  const c = await getOne<MusicContestant>("musicContestants", id);
  if (c) {
    const rounds = await getAll<MusicRound>("musicRounds", where("competitionId", "==", c.competitionId));
    await batchWrite(rounds.map((r) => ({ ref: ref("musicRounds", r.id), data: { performances: r.performances.filter((p) => p.contestantId !== id) }, merge: true })));
  }
  const votes = await getAll<{ id: string }>("votes", where("contestantId", "==", id));
  await batchDelete(votes.map((v) => ref("votes", v.id)));
  await deleteDoc(ref("musicContestants", id));
  changed();
  return ok("Yarışmacı silindi.", "/yonetim/muzik/yarismacilar");
});

export const saveRound = (_p: ActionResult, fd: FormData) => wrap(async () => {
  await requireAdmin("MUZIK");
  const id = str(fd, "id");
  const name = str(fd, "name", 80), date = dt(fd, "date"), competitionId = str(fd, "competitionId");
  if (!name || !date || !competitionId) return fail("Tur adı ve tarihi zorunludur.");
  const venueId = optStr(fd, "venueId");
  const data = { name, date, competitionId, order: int(fd, "order") ?? 1, venueId, venueName: await venueName(venueId), status: str(fd, "status") || "UPCOMING", advanceCount: int(fd, "advanceCount"), youtubeUrl: optStr(fd, "youtubeUrl", 300), description: optStr(fd, "description", 2000) };
  if (id) await updateDoc(ref("musicRounds", id), data);
  else await setDoc(newRef("musicRounds"), { ...data, performances: [] });
  changed();
  return ok(id ? "Tur güncellendi." : "Tur eklendi.");
});

export const deleteRound = (_p: ActionResult, fd: FormData) => wrap(async () => {
  await requireAdmin("MUZIK");
  await deleteDoc(ref("musicRounds", str(fd, "id")));
  changed();
  return ok("Tur silindi.");
});

async function updatePerfs(roundId: string, fn: (list: Performance[]) => Performance[]) {
  const r = await getOne<MusicRound>("musicRounds", roundId);
  if (!r) throw new Error("Tur bulunamadı.");
  const performances = fn(r.performances);
  await updateDoc(ref("musicRounds", roundId), { performances });
  return { round: r, performances };
}

export const addPerformers = (_p: ActionResult, fd: FormData) => wrap(async () => {
  await requireAdmin("MUZIK");
  const roundId = str(fd, "roundId");
  const ids = fd.getAll("contestantId").map(String).filter(Boolean);
  if (!ids.length) return fail("Yarışmacı seçiniz.");
  const cs = (await Promise.all(ids.map((i) => getOne<MusicContestant>("musicContestants", i)))).filter((c): c is MusicContestant => !!c);
  await updatePerfs(roundId, (list) => {
    let order = list.length;
    const add = cs.filter((c) => !list.some((p) => p.contestantId === c.id)).map((c) => ({ contestantId: c.id, contestantName: c.name, contestantSlug: c.slug, songTitle: "Belirlenecek", order: ++order, advanced: false }));
    return [...list, ...add];
  });
  changed();
  return ok(`${cs.length} yarışmacı tura eklendi.`);
});

export const savePerformance = (_p: ActionResult, fd: FormData) => wrap(async () => {
  await requireAdmin("MUZIK");
  const roundId = str(fd, "roundId"), contestantId = str(fd, "contestantId");
  if (str(fd, "remove") === "1") {
    await updatePerfs(roundId, (list) => list.filter((p) => p.contestantId !== contestantId));
    changed();
    return ok("Kaldırıldı.");
  }
  const jury = num(fd, "juryScore"), pub = num(fd, "publicScore");
  for (const v of [jury, pub]) if (v != null && (v < 0 || v > 100)) return fail("Puanlar 0-100 arasında olmalıdır.");
  await updatePerfs(roundId, (list) => list.map((p) => p.contestantId !== contestantId ? p : {
    ...p, songTitle: str(fd, "songTitle", 120) || "Belirlenecek", songArtist: optStr(fd, "songArtist", 120), order: int(fd, "order") ?? 0,
    juryScore: jury, publicScore: pub, youtubeUrl: optStr(fd, "youtubeUrl", 300), juryComment: optStr(fd, "juryComment", 500),
    totalScore: jury != null ? Math.round((jury * 0.7 + (pub ?? 0) * 0.3) * 10) / 10 : null,
  }));
  changed();
  return ok("Kaydedildi.");
});

/** Halk oylarını 0-100 puana dönüştürür (en çok oy alan 100) */
export const applyPublicVotes = (_p: ActionResult, fd: FormData) => wrap(async () => {
  await requireAdmin("MUZIK");
  const roundId = str(fd, "roundId");
  const r = await getOne<MusicRound>("musicRounds", roundId);
  if (!r) return fail("Tur bulunamadı.");
  const counts = await Promise.all(r.performances.map((p) => countOf("votes", where("contestantId", "==", p.contestantId))));
  const max = Math.max(1, ...counts);
  await updatePerfs(roundId, (list) => list.map((p, i) => {
    const pub = Math.round((counts[i]! / max) * 1000) / 10;
    return { ...p, publicScore: pub, totalScore: p.juryScore != null ? Math.round((p.juryScore * 0.7 + pub * 0.3) * 10) / 10 : null };
  }));
  changed();
  return ok("Halk oyları puana dönüştürüldü.");
});

/** Turu sonuçlandırır: sıralama, tur atlayanlar ve elenenler */
export const finalizeRound = (_p: ActionResult, fd: FormData) => wrap(async () => {
  const admin = await requireAdmin("MUZIK");
  const roundId = str(fd, "roundId");
  const r = await getOne<MusicRound>("musicRounds", roundId);
  if (!r) return fail("Tur bulunamadı.");
  if (!r.performances.length) return fail("Turda yarışmacı yok.");
  if (r.performances.some((p) => p.totalScore == null)) return fail("Tüm performanslar için jüri puanı girilmelidir.");
  const sorted = [...r.performances].sort((a, b) => (b.totalScore ?? 0) - (a.totalScore ?? 0));
  const adv = r.advanceCount ?? 0;
  const isFinal = !adv;
  const performances = r.performances.map((p) => {
    const i = sorted.findIndex((s) => s.contestantId === p.contestantId);
    return { ...p, rank: i + 1, advanced: adv ? i < adv : i === 0 };
  });
  await updateDoc(ref("musicRounds", roundId), { performances, status: "COMPLETED" });
  await batchWrite(sorted.map((p, i) => ({
    ref: ref("musicContestants", p.contestantId),
    data: isFinal ? { status: i === 0 ? "WINNER" : "FINALIST", finalRank: i + 1 } : { status: i < adv ? "ACTIVE" : "ELIMINATED" },
    merge: true,
  })));
  await logActivity(admin, "SONUCLANDIR", "Müzik Turu", roundId, r.name);
  changed();
  return ok(isFinal ? "Final sonuçlandı, şampiyon belirlendi! 🏆" : `Tur sonuçlandı: ${adv} yarışmacı tur atladı.`);
});

export const saveJury = (_p: ActionResult, fd: FormData) => wrap(async () => {
  await requireAdmin("MUZIK");
  const competitionId = str(fd, "competitionId");
  const c = await getOne<MusicCompetition>("musicCompetitions", competitionId);
  if (!c) return fail("Yarışma bulunamadı.");
  if (str(fd, "remove") !== "") {
    const idx = Number(str(fd, "remove"));
    await updateDoc(ref("musicCompetitions", competitionId), { jury: c.jury.filter((_, i) => i !== idx) });
    changed();
    return ok("Silindi.");
  }
  const name = str(fd, "name", 80), title = str(fd, "title", 120);
  if (!name || !title) return fail("Ad ve unvan zorunludur.");
  await updateDoc(ref("musicCompetitions", competitionId), { jury: [...c.jury, { name, title, bio: optStr(fd, "bio", 1000) }] });
  changed();
  return ok("Jüri üyesi eklendi.");
});

// ═════════════ TİYATRO ═════════════

export const saveFestival = (_p: ActionResult, fd: FormData) => wrap(async () => {
  const admin = await requireAdmin("TIYATRO");
  const id = str(fd, "id");
  const name = str(fd, "name", 120), edition = str(fd, "edition", 20);
  const startDate = dateOnly(fd, "startDate"), endDate = dateOnly(fd, "endDate");
  if (!name || !edition || !startDate || !endDate) return fail("Ad, dönem ve tarihler zorunludur.");
  const isCurrent = bool(fd, "isCurrent");
  const data = { name, edition, startDate, endDate, isCurrent, theme: optStr(fd, "theme", 120), tagline: optStr(fd, "tagline", 200), description: optStr(fd, "description", 3000), status: str(fd, "status") || "PLANNED" };
  let fid = id;
  if (!id) fid = await uniqueId("theatreFestivals", `${name} ${startDate.getFullYear()}`);
  if (isCurrent) {
    const all = await getAll<TheatreFestival>("theatreFestivals");
    await batchWrite(all.filter((f) => f.id !== fid && f.isCurrent).map((f) => ({ ref: ref("theatreFestivals", f.id), data: { isCurrent: false }, merge: true })));
  }
  if (id) await updateDoc(ref("theatreFestivals", id), data);
  else await setDoc(ref("theatreFestivals", fid), { ...data, slug: fid, awards: [], workshops: [] });
  await logActivity(admin, id ? "GUNCELLE" : "OLUSTUR", "Festival", fid, name);
  changed();
  return ok(id ? "Festival güncellendi." : "Festival oluşturuldu.", id ? undefined : `/yonetim/tiyatro?f=${fid}`);
});

export const saveGroup = (_p: ActionResult, fd: FormData) => wrap(async () => {
  await requireAdmin("TIYATRO");
  const id = str(fd, "id");
  const name = str(fd, "name", 120), district = str(fd, "district", 50);
  if (!name || !district) return fail("Ad ve ilçe zorunludur.");
  const current = id ? await getOne<TheatreGroup>("theatreGroups", id) : null;
  const data = { name, district, logoUrl: await imageField(fd, "logo", current?.logoUrl, 256), foundedYear: int(fd, "foundedYear"), director: optStr(fd, "director", 80), memberCount: int(fd, "memberCount"), instagram: optStr(fd, "instagram", 200), description: optStr(fd, "description", 3000) };
  if (id) {
    await updateDoc(ref("theatreGroups", id), data);
    const plays = await getAll<TheatrePlay>("theatrePlays", where("groupId", "==", id));
    await batchWrite(plays.map((p) => ({ ref: ref("theatrePlays", p.id), data: { groupName: name }, merge: true })));
  } else {
    const gid = await uniqueId("theatreGroups", name);
    await setDoc(ref("theatreGroups", gid), { ...data, slug: gid });
  }
  changed();
  return ok(id ? "Topluluk güncellendi." : "Topluluk eklendi.");
});

export const deleteGroup = (_p: ActionResult, fd: FormData) => wrap(async () => {
  await requireAdmin("TIYATRO");
  const id = str(fd, "id");
  const plays = await getAll<TheatrePlay>("theatrePlays", where("groupId", "==", id));
  await batchDelete(plays.map((p) => ref("theatrePlays", p.id)));
  await deleteDoc(ref("theatreGroups", id));
  changed();
  return ok("Topluluk silindi.");
});

export const savePlay = (_p: ActionResult, fd: FormData) => wrap(async () => {
  const admin = await requireAdmin("TIYATRO");
  const id = str(fd, "id");
  const title = str(fd, "title", 150), festivalId = str(fd, "festivalId"), groupId = str(fd, "groupId");
  if (!title || !festivalId || !groupId || !str(fd, "playwright") || !str(fd, "director")) return fail("Oyun adı, festival, topluluk, yazar ve yönetmen zorunludur.");
  const [current, group] = await Promise.all([id ? getOne<TheatrePlay>("theatrePlays", id) : null, getOne<TheatreGroup>("theatreGroups", groupId)]);
  const data = {
    title, festivalId, groupId, groupName: group?.name ?? "", groupSlug: group?.slug ?? groupId, posterUrl: await imageField(fd, "poster", current?.posterUrl, 720),
    playwright: str(fd, "playwright", 120), director: str(fd, "director", 120), genre: str(fd, "genre", 40) || "Dram",
    durationMin: int(fd, "durationMin"), ageLimit: optStr(fd, "ageLimit", 30), language: str(fd, "language", 40) || "Türkçe", synopsis: optStr(fd, "synopsis", 5000),
    cast: parsePeople(str(fd, "cast", 5000)), youtubeUrl: optStr(fd, "youtubeUrl", 300), inCompetition: bool(fd, "inCompetition"),
  };
  let pid = id;
  if (id) await updateDoc(ref("theatrePlays", id), data);
  else {
    pid = await uniqueId("theatrePlays", title);
    await setDoc(ref("theatrePlays", pid), { ...data, slug: pid, shows: [], createdAt: new Date() });
  }
  await logActivity(admin, id ? "GUNCELLE" : "OLUSTUR", "Oyun", pid, title);
  changed();
  return ok(id ? "Oyun güncellendi." : "Oyun eklendi.", id ? undefined : `/yonetim/tiyatro/oyunlar/duzenle?id=${pid}`);
});

export const deletePlay = (_p: ActionResult, fd: FormData) => wrap(async () => {
  await requireAdmin("TIYATRO");
  await deleteDoc(ref("theatrePlays", str(fd, "id")));
  changed();
  return ok("Oyun silindi.", "/yonetim/tiyatro/oyunlar");
});

export const saveShow = (_p: ActionResult, fd: FormData) => wrap(async () => {
  await requireAdmin("TIYATRO");
  const playId = str(fd, "playId");
  const play = await getOne<TheatrePlay>("theatrePlays", playId);
  if (!play) return fail("Oyun bulunamadı.");
  if (str(fd, "remove")) {
    await updateDoc(ref("theatrePlays", playId), { shows: play.shows.filter((s) => s.id !== str(fd, "remove")) });
    changed();
    return ok("Silindi.");
  }
  const date = dt(fd, "date");
  if (!date) return fail("Tarih giriniz.");
  const venueId = optStr(fd, "venueId");
  const show = { id: uid(), date, venueId, venueName: await venueName(venueId), ticketInfo: str(fd, "ticketInfo", 100) || "Ücretsiz", status: str(fd, "status") || "SCHEDULED" };
  await updateDoc(ref("theatrePlays", playId), { shows: [...play.shows, show].sort((a, b) => +new Date(a.date) - +new Date(b.date)) });
  changed();
  return ok("Gösterim eklendi.");
});

export const saveAward = (_p: ActionResult, fd: FormData) => wrap(async () => {
  await requireAdmin("TIYATRO");
  const festivalId = str(fd, "festivalId");
  const f = await getOne<TheatreFestival>("theatreFestivals", festivalId);
  if (!f) return fail("Festival bulunamadı.");
  if (str(fd, "remove")) {
    await updateDoc(ref("theatreFestivals", festivalId), { awards: f.awards.filter((a) => a.id !== str(fd, "remove")) });
    changed();
    return ok("Silindi.");
  }
  const category = str(fd, "category", 80), winner = str(fd, "winner", 150);
  if (!category || !winner) return fail("Kategori ve kazanan zorunludur.");
  await updateDoc(ref("theatreFestivals", festivalId), { awards: [...f.awards, { id: uid(), category, winner, playId: optStr(fd, "playId") }] });
  changed();
  return ok("Ödül eklendi.");
});

export const saveWorkshop = (_p: ActionResult, fd: FormData) => wrap(async () => {
  await requireAdmin("TIYATRO");
  const festivalId = str(fd, "festivalId");
  const f = await getOne<TheatreFestival>("theatreFestivals", festivalId);
  if (!f) return fail("Festival bulunamadı.");
  if (str(fd, "remove")) {
    await updateDoc(ref("theatreFestivals", festivalId), { workshops: f.workshops.filter((w) => w.id !== str(fd, "remove")) });
    changed();
    return ok("Silindi.");
  }
  const title = str(fd, "title", 120), date = dt(fd, "date");
  if (!title || !date) return fail("Başlık ve tarih zorunludur.");
  const ws = { id: uid(), title, date, instructor: str(fd, "instructor", 100) || "—", location: str(fd, "location", 150) || "—", description: optStr(fd, "description", 1000) };
  await updateDoc(ref("theatreFestivals", festivalId), { workshops: [...f.workshops, ws].sort((a, b) => +new Date(a.date) - +new Date(b.date)) });
  changed();
  return ok("Etkinlik eklendi.");
});

// ═════════════ GENÇ KALEMLER — YAZARLIK YARIŞMASI ═════════════

/** "Başlık | YYYY-AA-GG | açıklama" satırlarını takvime çevirir */
function parseTimeline(text: string) {
  return text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).map((l) => {
    const [title = "", date = "", ...rest] = l.split("|").map((x) => x.trim());
    const d = /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(`${date}T12:00:00+03:00`) : null;
    return { title, date: d, text: (d ? rest.join(" | ") : [date, ...rest].filter(Boolean).join(" | ")) || null };
  });
}

export const saveWritingContest = (_p: ActionResult, fd: FormData) => wrap(async () => {
  const admin = await requireAdmin("TIYATRO");
  const id = str(fd, "id");
  const name = str(fd, "name", 120), edition = str(fd, "edition", 20);
  const deadline = dt(fd, "deadline");
  if (!name || !edition || !deadline) return fail("Ad, dönem ve son başvuru tarihi zorunludur.");
  const isCurrent = bool(fd, "isCurrent");
  const data = {
    name, edition, deadline, isCurrent, status: str(fd, "status") || "PLANNED",
    tagline: optStr(fd, "tagline", 300), description: optStr(fd, "description", 5000), rules: optStr(fd, "rules", 10000),
    minAge: int(fd, "minAge"), maxAge: int(fd, "maxAge"), youtubeUrl: optStr(fd, "youtubeUrl", 300),
    prizes: str(fd, "prizes", 3000).split(/\r?\n/).map((l) => l.trim()).filter(Boolean),
    timeline: parseTimeline(str(fd, "timeline", 5000)),
  };
  let cid = id;
  if (!id) cid = await uniqueId("writingContests", `${name} ${deadline.getFullYear()}`);
  if (isCurrent) {
    const all = await getAll<WritingContest>("writingContests");
    await batchWrite(all.filter((c) => c.id !== cid && c.isCurrent).map((c) => ({ ref: ref("writingContests", c.id), data: { isCurrent: false }, merge: true })));
  }
  if (id) await updateDoc(ref("writingContests", id), data);
  else await setDoc(ref("writingContests", cid), { ...data, slug: cid, jury: [], entries: [], createdAt: new Date() });
  await logActivity(admin, id ? "GUNCELLE" : "OLUSTUR", "Yazarlık Yarışması", cid, name);
  changed();
  return ok(id ? "Yarışma güncellendi." : "Yarışma oluşturuldu.", id ? undefined : `/yonetim/tiyatro/yazarlik?c=${cid}`);
});

export const saveWritingJury = (_p: ActionResult, fd: FormData) => wrap(async () => {
  await requireAdmin("TIYATRO");
  const contestId = str(fd, "contestId");
  const c = await getOne<WritingContest>("writingContests", contestId);
  if (!c) return fail("Yarışma bulunamadı.");
  if (str(fd, "remove") !== "") {
    const idx = Number(str(fd, "remove"));
    await updateDoc(ref("writingContests", contestId), { jury: c.jury.filter((_, i) => i !== idx) });
    changed();
    return ok("Silindi.");
  }
  const name = str(fd, "name", 80), title = str(fd, "title", 120), language = str(fd, "language") || "TR";
  if (!name) return fail("Ad zorunludur.");
  await updateDoc(ref("writingContests", contestId), { jury: [...c.jury, { name, title, language }] });
  changed();
  return ok("Jüri üyesi eklendi.");
});

export const saveWritingEntry = (_p: ActionResult, fd: FormData) => wrap(async () => {
  const admin = await requireAdmin("TIYATRO");
  const contestId = str(fd, "contestId");
  const c = await getOne<WritingContest>("writingContests", contestId);
  if (!c) return fail("Yarışma bulunamadı.");
  const entryId = str(fd, "entryId");
  if (str(fd, "remove")) {
    await updateDoc(ref("writingContests", contestId), { entries: c.entries.filter((e) => e.id !== str(fd, "remove")) });
    changed();
    return ok("Eser silindi.");
  }
  const current = entryId ? c.entries.find((e) => e.id === entryId) : undefined;
  // Yalnızca durum / jüri notu güncellemesi (liste satırından)
  if (current && !fd.has("title")) {
    const patch: Partial<WritingEntry> = { status: str(fd, "status") || current.status };
    if (fd.has("juryNote")) patch.juryNote = optStr(fd, "juryNote", 1000);
    await updateDoc(ref("writingContests", contestId), { entries: c.entries.map((e) => (e.id === entryId ? { ...e, ...patch } : e)) });
    await logActivity(admin, "GUNCELLE", "Yazarlık Eseri", contestId, `${current.title}: ${patch.status}`);
    changed();
    return ok("Eser güncellendi.");
  }
  const title = str(fd, "title", 150), author = str(fd, "author", 150);
  if (!title || !author) return fail("Eser adı ve yazar zorunludur.");
  const entry: WritingEntry = {
    id: current?.id ?? uid(), title, author, penName: optStr(fd, "penName", 80), language: str(fd, "language") || "TR", category: str(fd, "category") || "KISA",
    status: str(fd, "status") || "SUBMITTED", district: optStr(fd, "district", 50), synopsis: optStr(fd, "synopsis", 2000), juryNote: optStr(fd, "juryNote", 1000),
    applicationId: current?.applicationId ?? null,
  };
  const entries = current ? c.entries.map((e) => (e.id === entry.id ? entry : e)) : [...c.entries, entry];
  await updateDoc(ref("writingContests", contestId), { entries });
  changed();
  return ok(current ? "Eser güncellendi." : "Eser eklendi.");
});
