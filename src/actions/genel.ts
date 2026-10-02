"use client";

import { deleteDoc, setDoc, updateDoc, where } from "firebase/firestore";
import { createUserWithEmailAndPassword, EmailAuthProvider, reauthenticateWithCredential, signOut, updatePassword } from "firebase/auth";
import { fauth, secondaryAuth } from "@/lib/firebase";
import { getAll, getOne } from "@/lib/data";
import { requireAdmin, requireSuper, canAccess, logActivity, uniqueId, ref, newRef, changed, batchWrite, rebuildLeague } from "@/lib/admin";
import { deleteFile } from "@/lib/files";
import { type ActionResult, ok, fail, str, optStr, int, bool, dt, errMessage } from "@/lib/form";
import { APPLICATION_STATUS, CATEGORY_UNIT, SPORTS, type CategoryKey, type SportKey } from "@/lib/constants";
import { slugify } from "@/lib/utils";
import { imageField } from "./spor";
import type { Application, League, MusicCompetition, Period, TheatreFestival, TheatreGroup, WritingContest } from "@/lib/types";

const wrap = (fn: () => Promise<ActionResult>) => fn().catch((e) => fail(errMessage(e)));

// ═════════════ BAŞVURULAR ═════════════

async function loadApp(id: string) {
  const admin = await requireAdmin();
  const app = await getOne<Application>("applications", id);
  if (!app) throw new Error("Başvuru bulunamadı");
  if (!canAccess(admin, CATEGORY_UNIT[app.category as CategoryKey])) throw new Error("Bu başvuru için yetkiniz yok");
  return { admin, app };
}

async function syncStatus(app: Application, patch: Partial<Application>) {
  const merged = { ...app, ...patch };
  await setDoc(ref("applicationStatus", app.id), { status: merged.status, publicNote: merged.publicNote ?? null, reviewedAt: new Date() }, { merge: true });
}

export const updateApplication = (_p: ActionResult, fd: FormData) => wrap(async () => {
  const { admin, app } = await loadApp(str(fd, "id"));
  const status = str(fd, "status");
  if (!(status in APPLICATION_STATUS)) return fail("Geçersiz durum.");
  if (status === "APPROVED" && !app.resultEntityId) return fail("Onaylamak için 'Onayla ve Kayıt Oluştur' butonunu kullanın.");
  const patch = { status, adminNote: optStr(fd, "adminNote", 3000), publicNote: optStr(fd, "publicNote", 2000), reviewedBy: admin.name, reviewedAt: new Date() };
  await updateDoc(ref("applications", app.id), patch);
  await syncStatus(app, patch);
  await logActivity(admin, "DURUM", "Başvuru", app.id, `${app.title} → ${APPLICATION_STATUS[status]!.label}`);
  changed();
  return ok("Başvuru güncellendi.");
});

/** Başvuruyu onaylar ve ilgili kaydı otomatik oluşturur */
export const approveApplication = (_p: ActionResult, fd: FormData) => wrap(async () => {
  const { admin, app } = await loadApp(str(fd, "id"));
  if (app.resultEntityId) return fail("Bu başvuru için kayıt zaten oluşturulmuş.");
  const data = app.data;
  const members = app.members;
  let resultId = "";
  let message = "";
  const period = await getOne<Period>("periods", app.periodId);

  if (app.category === "SPOR") {
    const sport = (data.sport || period?.sport || "FUTBOL") as SportKey;
    const gender = data.gender || period?.gender || "ERKEK";
    const leagueId = optStr(fd, "leagueId");
    const league = leagueId ? await getOne<League>("leagues", leagueId) : null;
    const useLeague = league && league.sport === sport && league.gender === gender ? league : null;
    const tid = await uniqueId("teams", `${app.title} ${SPORTS[sport]?.label ?? ""}`);
    const team = {
      slug: tid, name: app.title, shortName: (data.shortName || app.title.slice(0, 3)).toLocaleUpperCase("tr-TR").slice(0, 4), sport, gender, district: app.district,
      primaryColor: data.primaryColor || "#0f766e", secondaryColor: data.secondaryColor || "#ffffff", logoUrl: data.logoUrl || null,
      foundedYear: data.foundedYear ? Number(data.foundedYear) || null : null, coachName: data.coachName || null, managerName: app.applicantName,
      description: data.note || null, status: "ACTIVE", leagueIds: useLeague ? [useLeague.id] : [], venueId: null, venueName: null,
    };
    await setDoc(ref("teams", tid), team);
    const used = new Set<string>();
    const ops = [];
    for (const m of members) {
      let pid = slugify(`${m.firstName} ${m.lastName}`) || "oyuncu";
      if (used.has(pid) || (await getOne("players", pid))) { let i = 2; while (used.has(`${pid}-${i}`) || (await getOne("players", `${pid}-${i}`))) i++; pid = `${pid}-${i}`; }
      used.add(pid);
      ops.push({ ref: ref("players", pid), data: { slug: pid, firstName: m.firstName ?? "", lastName: m.lastName ?? "", photoUrl: m.photo || null, gender, sport, teamId: tid, district: app.district, birthDate: m.birthDate || null, position: m.position || null, jerseyNumber: m.jerseyNumber ? Number(m.jerseyNumber) || null : null, isCaptain: false, status: "ACTIVE", createdAt: new Date() } });
      if (/^\d{11}$/.test(m.identityNo ?? "")) ops.push({ ref: ref("playerPrivate", pid), data: { identityNo: m.identityNo } });
    }
    await batchWrite(ops);
    if (useLeague) {
      await updateDoc(ref("leagues", useLeague.id), { entries: [...useLeague.entries, { teamId: tid, penaltyPoints: 0 }] });
      await rebuildLeague(useLeague.id);
    }
    resultId = tid;
    message = `"${app.title}" takımı ${members.length} oyuncuyla oluşturuldu.`;
  } else if (app.category === "MUZIK") {
    const comps = await getAll<MusicCompetition>("musicCompetitions");
    const comp = comps.find((c) => c.isCurrent) ?? comps[0];
    if (!comp) return fail("Önce bir müzik yarışması oluşturun.");
    const cid = await uniqueId("musicContestants", app.title);
    await setDoc(ref("musicContestants", cid), {
      slug: cid, competitionId: comp.id, name: app.title, type: data.type || "SOLO", genre: data.genre || "Pop", district: app.district, bio: data.bio || null,
      instagram: data.instagram ? (data.instagram.startsWith("http") ? data.instagram : `https://instagram.com/${data.instagram.replace(/^@/, "")}`) : null,
      youtubeUrl: data.demoUrl || null, status: "ACTIVE", photoUrl: data.logoUrl || null,
      members: members.map((m) => ({ name: `${m.firstName} ${m.lastName}`.trim(), role: m.role ?? "" })), createdAt: new Date(),
    });
    resultId = cid;
    message = `"${app.title}" ${comp.name} ${comp.edition} yarışmacısı olarak eklendi.`;
  } else if (app.category === "YAZARLIK") {
    const contests = await getAll<WritingContest>("writingContests");
    const contest = contests.find((c) => c.isCurrent) ?? contests[0];
    if (!contest) return fail("Önce bir Genç Kalemler yarışması oluşturun.");
    const author = members.map((m) => `${m.firstName ?? ""} ${m.lastName ?? ""}`.trim()).filter(Boolean).join(", ") || app.applicantName;
    const entry = {
      id: crypto.randomUUID().slice(0, 8), title: app.title, author, penName: data.penName || null, language: data.language || "TR", category: data.workCategory || "KISA",
      status: "SUBMITTED", district: app.district, synopsis: data.synopsis || null, juryNote: null, applicationId: app.id,
    };
    await updateDoc(ref("writingContests", contest.id), { entries: [...contest.entries, entry] });
    resultId = contest.id;
    message = `"${app.title}" ${contest.name} ${contest.edition} yarışmasına eser olarak eklendi.`;
  } else {
    const fests = await getAll<TheatreFestival>("theatreFestivals");
    const fest = fests.find((f) => f.isCurrent) ?? fests[0];
    if (!fest) return fail("Önce bir tiyatro festivali oluşturun.");
    const groups = await getAll<TheatreGroup>("theatreGroups", where("name", "==", app.title));
    let gid = groups[0]?.id;
    if (!gid) {
      gid = await uniqueId("theatreGroups", app.title);
      await setDoc(ref("theatreGroups", gid), { slug: gid, name: app.title, district: app.district, director: data.director || app.applicantName, memberCount: members.length || null, logoUrl: data.logoUrl || null });
    }
    const title = data.playTitle || app.title;
    const pid = await uniqueId("theatrePlays", title);
    await setDoc(ref("theatrePlays", pid), {
      slug: pid, festivalId: fest.id, groupId: gid, groupName: app.title, groupSlug: gid, title, playwright: data.playwright || "—", director: data.director || app.applicantName,
      genre: data.genre || "Dram", durationMin: data.durationMin ? Number(data.durationMin) || null : null, language: data.language || "Türkçe",
      synopsis: data.synopsis || null, youtubeUrl: data.videoUrl || null, inCompetition: true, shows: [], posterUrl: null,
      cast: members.map((m) => ({ name: `${m.firstName} ${m.lastName}`.trim(), role: m.role ?? "" })), createdAt: new Date(),
    });
    resultId = gid;
    message = `"${app.title}" topluluğu ve "${title}" oyunu ${fest.edition} festivale eklendi.`;
  }
  const patch = { status: "APPROVED", resultEntityId: resultId, reviewedBy: admin.name, reviewedAt: new Date(), publicNote: optStr(fd, "publicNote", 2000) ?? app.publicNote ?? null };
  await updateDoc(ref("applications", app.id), patch);
  await syncStatus(app, patch);
  await logActivity(admin, "ONAY", "Başvuru", app.id, message);
  changed();
  return ok(message);
});

export const deleteApplication = (_p: ActionResult, fd: FormData) => wrap(async () => {
  const { admin, app } = await loadApp(str(fd, "id"));
  for (const d of app.documents) await deleteFile(d.path).catch(() => {});
  await deleteDoc(ref("applications", app.id));
  await deleteDoc(ref("applicationStatus", app.id)).catch(() => {});
  await logActivity(admin, "SIL", "Başvuru", app.id, app.title);
  changed();
  return ok("Başvuru silindi.", "/yonetim/basvurular");
});

// ═════════════ BAŞVURU DÖNEMLERİ ═════════════

function parseDocs(text: string) {
  const used = new Set<string>();
  return text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).map((l) => {
    const [label = "", req = "", hint = ""] = l.split("|").map((x) => x.trim());
    let key = slugify(label).slice(0, 20) || "belge";
    while (used.has(key)) key += "x";
    used.add(key);
    return { key, label, required: /^(zorunlu|evet|1|true|z)$/i.test(req), ...(hint ? { hint } : {}) };
  });
}

export const savePeriod = (_p: ActionResult, fd: FormData) => wrap(async () => {
  const category = str(fd, "category");
  if (!(category in CATEGORY_UNIT)) return fail("Kategori seçiniz.");
  const admin = await requireAdmin(CATEGORY_UNIT[category as CategoryKey]);
  const id = str(fd, "id");
  const title = str(fd, "title", 200);
  const startDate = dt(fd, "startDate"), endDate = dt(fd, "endDate");
  if (!title || !startDate || !endDate) return fail("Başlık ve tarihler zorunludur.");
  if (endDate <= startDate) return fail("Bitiş tarihi başlangıçtan sonra olmalıdır.");
  const leagueId = category === "SPOR" ? optStr(fd, "leagueId") : null;
  const league = leagueId ? await getOne<League>("leagues", leagueId) : null;
  const data = {
    title, category, startDate, endDate, sport: category === "SPOR" ? optStr(fd, "sport") : null, gender: category === "SPOR" ? optStr(fd, "gender") : null,
    leagueId, leagueName: league?.name ?? null, summary: str(fd, "summary", 400) || title, description: optStr(fd, "description", 5000),
    requirements: str(fd, "requirements", 5000), requiredDocuments: parseDocs(str(fd, "documents", 5000)), minMembers: int(fd, "minMembers"), maxMembers: int(fd, "maxMembers"),
    minAge: int(fd, "minAge"), maxAge: int(fd, "maxAge"), quota: int(fd, "quota"), fee: optStr(fd, "fee", 100), contactInfo: optStr(fd, "contactInfo", 300), isPublished: bool(fd, "isPublished"),
  };
  let pid = id;
  if (id) await updateDoc(ref("periods", id), data);
  else {
    pid = await uniqueId("periods", title);
    await setDoc(ref("periods", pid), { ...data, slug: pid, applicationCount: 0, createdAt: new Date() });
  }
  await logActivity(admin, id ? "GUNCELLE" : "OLUSTUR", "Başvuru Dönemi", pid, title);
  changed();
  return ok(id ? "Başvuru dönemi güncellendi." : "Başvuru dönemi oluşturuldu.", id ? undefined : `/yonetim/donemler/duzenle?id=${pid}`);
});

export const deletePeriod = (_p: ActionResult, fd: FormData) => wrap(async () => {
  const admin = await requireAdmin();
  const id = str(fd, "id");
  const apps = await getAll<Application>("applications", where("periodId", "==", id));
  if (apps.length) return fail(`Bu döneme ait ${apps.length} başvuru var. Silmek yerine yayından kaldırın.`);
  await deleteDoc(ref("periods", id));
  await logActivity(admin, "SIL", "Başvuru Dönemi", id);
  changed();
  return ok("Dönem silindi.", "/yonetim/donemler");
});

// ═════════════ DUYURU & VİDEO & MESAJ ═════════════

export const saveAnnouncement = (_p: ActionResult, fd: FormData) => wrap(async () => {
  const admin = await requireAdmin();
  const id = str(fd, "id");
  const title = str(fd, "title", 200), content = str(fd, "content", 20000);
  if (!title || !content) return fail("Başlık ve içerik zorunludur.");
  const current = id ? await getOne<{ coverUrl?: string | null }>("announcements", id) : null;
  const data = { title, content, coverUrl: await imageField(fd, "cover", current?.coverUrl, 1000), excerpt: str(fd, "excerpt", 400) || content.slice(0, 200), category: str(fd, "category") || "GENEL", isPinned: bool(fd, "isPinned"), isPublished: bool(fd, "isPublished"), publishedAt: dt(fd, "publishedAt") ?? new Date() };
  if (id) await updateDoc(ref("announcements", id), data);
  else {
    const aid = await uniqueId("announcements", title);
    await setDoc(ref("announcements", aid), { ...data, slug: aid });
  }
  await logActivity(admin, id ? "GUNCELLE" : "OLUSTUR", "Duyuru", id || undefined, title);
  changed();
  return ok(id ? "Duyuru güncellendi." : "Duyuru yayımlandı.", id ? undefined : "/yonetim/duyurular");
});

export const deleteAnnouncement = (_p: ActionResult, fd: FormData) => wrap(async () => {
  await requireAdmin();
  await deleteDoc(ref("announcements", str(fd, "id")));
  changed();
  return ok("Silindi.");
});

export const saveVideo = (_p: ActionResult, fd: FormData) => wrap(async () => {
  await requireAdmin();
  const id = str(fd, "id");
  const title = str(fd, "title", 200), youtubeUrl = str(fd, "youtubeUrl", 300);
  if (!title || !youtubeUrl) return fail("Başlık ve YouTube bağlantısı zorunludur.");
  const data = { title, youtubeUrl, category: str(fd, "category") || "GENEL", description: optStr(fd, "description", 1000), isFeatured: bool(fd, "isFeatured") };
  if (id) await updateDoc(ref("videos", id), data);
  else await setDoc(newRef("videos"), { ...data, publishedAt: new Date() });
  changed();
  return ok(id ? "Video güncellendi." : "Video eklendi.");
});

export const deleteVideo = (_p: ActionResult, fd: FormData) => wrap(async () => {
  await requireAdmin();
  await deleteDoc(ref("videos", str(fd, "id")));
  changed();
  return ok("Silindi.");
});

export const messageAction = (_p: ActionResult, fd: FormData) => wrap(async () => {
  await requireAdmin();
  const id = str(fd, "id");
  if (str(fd, "op") === "delete") await deleteDoc(ref("messages", id));
  else await updateDoc(ref("messages", id), { isRead: str(fd, "op") !== "unread" });
  changed();
  return ok();
});

// ═════════════ KULLANICILAR ═════════════

export const saveUser = (_p: ActionResult, fd: FormData) => wrap(async () => {
  const me = await requireSuper();
  const id = str(fd, "id");
  const name = str(fd, "name", 80), email = str(fd, "email", 120).toLowerCase(), password = str(fd, "password", 200);
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("Ad ve geçerli e-posta zorunludur.");
  const role = str(fd, "role") || "EDITOR", scope = str(fd, "scope") || "ALL";
  if (id) {
    await updateDoc(ref("admins", id), { name, role: id === me.id ? "SUPER_ADMIN" : role, scope, active: id === me.id ? true : bool(fd, "active") });
  } else {
    if (password.length < 8) return fail("Şifre en az 8 karakter olmalıdır.");
    const sec = secondaryAuth();
    const cred = await createUserWithEmailAndPassword(sec, email, password);
    await setDoc(ref("admins", cred.user.uid), { name, email, role, scope, active: true, createdAt: new Date() });
    await signOut(sec);
  }
  await logActivity(me, id ? "GUNCELLE" : "OLUSTUR", "Kullanıcı", id || undefined, email);
  changed();
  return ok(id ? "Kullanıcı güncellendi." : "Kullanıcı oluşturuldu. Bu e-posta ve şifreyle giriş yapabilir.");
});

export const deleteUser = (_p: ActionResult, fd: FormData) => wrap(async () => {
  const me = await requireSuper();
  const id = str(fd, "id");
  if (id === me.id) return fail("Kendi hesabınızı silemezsiniz.");
  await deleteDoc(ref("admins", id));
  changed();
  return ok("Yönetici yetkisi kaldırıldı.");
});

export const changePassword = (_p: ActionResult, fd: FormData) => wrap(async () => {
  await requireAdmin();
  const u = fauth().currentUser;
  if (!u?.email) return fail("Oturum bulunamadı.");
  const current = str(fd, "current", 200), next = str(fd, "next", 200), again = str(fd, "again", 200);
  if (next.length < 8) return fail("Yeni şifre en az 8 karakter olmalıdır.");
  if (next !== again) return fail("Yeni şifreler eşleşmiyor.");
  await reauthenticateWithCredential(u, EmailAuthProvider.credential(u.email, current));
  await updatePassword(u, next);
  return ok("Şifreniz değiştirildi.");
});
