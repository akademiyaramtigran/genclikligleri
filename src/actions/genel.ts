"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { requireUser, requireSuperAdmin, logActivity, hashPassword, canAccess, type Unit } from "@/lib/auth";
import { deleteDocument, saveImage, UploadError } from "@/lib/storage";
import { uniqueSlug } from "@/lib/slug";
import { type ActionResult, ok, fail, str, optStr, int, bool, dt, file, prismaMessage } from "@/lib/form";
import { APPLICATION_STATUS, SPORTS, type SportKey } from "@/lib/constants";
import { parseJson, slugify } from "@/lib/utils";

const refresh = () => revalidatePath("/", "layout");

// ═════════════ BAŞVURULAR ═════════════

async function loadApp(id: string) {
  const user = await requireUser();
  const app = await db.application.findUnique({ where: { id }, include: { period: true } });
  if (!app) throw new Error("Başvuru bulunamadı");
  if (!canAccess(user, app.period.category as Unit)) throw new Error("Bu başvuru için yetkiniz yok");
  return { user, app };
}

export async function updateApplication(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  try {
    const { user, app } = await loadApp(str(fd, "id"));
    const status = str(fd, "status");
    if (!(status in APPLICATION_STATUS)) return fail("Geçersiz durum.");
    if (status === "APPROVED" && !app.resultEntityId) return fail("Onaylamak için 'Onayla ve Kayıt Oluştur' butonunu kullanın.");
    await db.application.update({
      where: { id: app.id },
      data: { status, adminNote: optStr(fd, "adminNote", 3000), publicNote: optStr(fd, "publicNote", 2000), reviewedById: user.id, reviewedAt: new Date() },
    });
    await logActivity(user.id, "DURUM", "Başvuru", app.id, `${app.title} → ${APPLICATION_STATUS[status]!.label}`);
  } catch (e) { return fail(prismaMessage(e)); }
  refresh();
  return ok("Başvuru güncellendi.");
}

/** Başvuruyu onaylar ve ilgili kaydı (takım+oyuncular / yarışmacı / topluluk+oyun) otomatik oluşturur */
export async function approveApplication(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  let message = "";
  try {
    const { user, app } = await loadApp(str(fd, "id"));
    if (app.resultEntityId) return fail("Bu başvuru için kayıt zaten oluşturulmuş.");
    const data = parseJson<Record<string, string>>(app.data, {});
    const members = parseJson<Record<string, string>[]>(app.members, []);
    let resultId = "";

    if (app.period.category === "SPOR") {
      const sport = (data.sport || app.period.sport || "FUTBOL") as SportKey;
      const gender = data.gender || app.period.gender || "ERKEK";
      const leagueId = optStr(fd, "leagueId");
      const slug = await uniqueSlug(`${app.title} ${SPORTS[sport]?.label ?? ""}`, async (s) => !!(await db.team.findUnique({ where: { slug: s } })));
      const team = await db.team.create({
        data: {
          slug, name: app.title, shortName: (data.shortName || app.title.slice(0, 3)).toLocaleUpperCase("tr-TR").slice(0, 4), sport, gender, district: app.district,
          primaryColor: data.primaryColor || "#0f766e", secondaryColor: data.secondaryColor || "#ffffff", foundedYear: data.foundedYear ? Number(data.foundedYear) || null : null,
          coachName: data.coachName || null, managerName: app.applicantName, contactPhone: app.applicantPhone, contactEmail: app.applicantEmail, description: data.note || null,
        },
      });
      for (const m of members) {
        const pslug = await uniqueSlug(`${m.firstName} ${m.lastName}`, async (s) => !!(await db.player.findUnique({ where: { slug: s } })));
        await db.player.create({
          data: {
            slug: pslug, firstName: m.firstName ?? "", lastName: m.lastName ?? "", gender, teamId: team.id, district: app.district,
            birthDate: m.birthDate ? new Date(`${m.birthDate}T12:00:00+03:00`) : null, position: m.position || null,
            jerseyNumber: m.jerseyNumber ? Number(m.jerseyNumber) || null : null, identityNo: /^\d{11}$/.test(m.identityNo ?? "") ? m.identityNo : null,
          },
        });
      }
      if (leagueId) {
        const league = await db.league.findUnique({ where: { id: leagueId } });
        if (league && league.sport === sport && league.gender === gender) await db.leagueEntry.create({ data: { leagueId, teamId: team.id } });
      }
      resultId = team.id;
      message = `"${team.name}" takımı ${members.length} oyuncuyla oluşturuldu.`;
    } else if (app.period.category === "MUZIK") {
      const comp = await db.musicCompetition.findFirst({ where: { isCurrent: true } }) ?? await db.musicCompetition.findFirst({ orderBy: { createdAt: "desc" } });
      if (!comp) return fail("Önce bir müzik yarışması oluşturun.");
      const slug = await uniqueSlug(app.title, async (s) => !!(await db.musicContestant.findUnique({ where: { slug: s } })));
      const c = await db.musicContestant.create({
        data: {
          slug, competitionId: comp.id, name: app.title, type: data.type || "SOLO", genre: data.genre || "Pop", district: app.district, bio: data.bio || null,
          instagram: data.instagram ? (data.instagram.startsWith("http") ? data.instagram : `https://instagram.com/${data.instagram.replace(/^@/, "")}`) : null,
          youtubeUrl: data.demoUrl || null,
          members: JSON.stringify(members.map((m) => ({ name: `${m.firstName} ${m.lastName}`.trim(), role: m.role ?? "" }))),
        },
      });
      resultId = c.id;
      message = `"${c.name}" ${comp.name} ${comp.edition} yarışmacısı olarak eklendi.`;
    } else {
      const fest = await db.theatreFestival.findFirst({ where: { isCurrent: true } }) ?? await db.theatreFestival.findFirst({ orderBy: { startDate: "desc" } });
      if (!fest) return fail("Önce bir tiyatro festivali oluşturun.");
      let group = await db.theatreGroup.findFirst({ where: { name: app.title } });
      if (!group) {
        const gslug = await uniqueSlug(app.title, async (s) => !!(await db.theatreGroup.findUnique({ where: { slug: s } })));
        group = await db.theatreGroup.create({ data: { slug: gslug, name: app.title, district: app.district, director: data.director || app.applicantName, memberCount: members.length || null } });
      }
      const title = data.playTitle || app.title;
      const pslug = await uniqueSlug(title, async (s) => !!(await db.theatrePlay.findUnique({ where: { slug: s } })));
      await db.theatrePlay.create({
        data: {
          slug: pslug, festivalId: fest.id, groupId: group.id, title, playwright: data.playwright || "—", director: data.director || app.applicantName,
          genre: data.genre || "Dram", durationMin: data.durationMin ? Number(data.durationMin) || null : null, language: data.language || "Türkçe",
          synopsis: data.synopsis || null, youtubeUrl: data.videoUrl || null,
          cast: JSON.stringify(members.map((m) => ({ name: `${m.firstName} ${m.lastName}`.trim(), role: m.role ?? "" }))),
        },
      });
      resultId = group.id;
      message = `"${group.name}" topluluğu ve "${title}" oyunu ${fest.edition} festivale eklendi.`;
    }

    await db.application.update({
      where: { id: app.id },
      data: { status: "APPROVED", resultEntityId: resultId, reviewedById: user.id, reviewedAt: new Date(), publicNote: optStr(fd, "publicNote", 2000) ?? app.publicNote },
    });
    await logActivity(user.id, "ONAY", "Başvuru", app.id, message);
  } catch (e) { return fail(prismaMessage(e)); }
  refresh();
  return ok(message);
}

export async function deleteApplication(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  try {
    const { user, app } = await loadApp(str(fd, "id"));
    const docs = await db.applicationDocument.findMany({ where: { applicationId: app.id } });
    await db.application.delete({ where: { id: app.id } });
    await Promise.all(docs.map((d) => deleteDocument(d.storedName)));
    await logActivity(user.id, "SIL", "Başvuru", app.id, app.title);
  } catch (e) { return fail(prismaMessage(e)); }
  refresh();
  redirect("/yonetim/basvurular");
}

// ═════════════ BAŞVURU DÖNEMLERİ ═════════════

/** "Etiket | zorunlu | ipucu" satırlarını belge listesine çevirir */
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

export async function savePeriod(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  const category = str(fd, "category");
  if (!["SPOR", "MUZIK", "TIYATRO"].includes(category)) return fail("Kategori seçiniz.");
  const user = await requireUser(category as Unit);
  const id = str(fd, "id");
  const title = str(fd, "title", 200);
  const startDate = dt(fd, "startDate"), endDate = dt(fd, "endDate");
  if (!title || !startDate || !endDate) return fail("Başlık ve tarihler zorunludur.");
  if (endDate <= startDate) return fail("Bitiş tarihi başlangıçtan sonra olmalıdır.");
  const docs = parseDocs(str(fd, "documents", 5000));
  const data = {
    title, category, startDate, endDate, sport: category === "SPOR" ? optStr(fd, "sport") : null, gender: category === "SPOR" ? optStr(fd, "gender") : null,
    leagueId: category === "SPOR" ? optStr(fd, "leagueId") : null, summary: str(fd, "summary", 400) || title, description: optStr(fd, "description", 5000),
    requirements: str(fd, "requirements", 5000), requiredDocuments: JSON.stringify(docs), minMembers: int(fd, "minMembers"), maxMembers: int(fd, "maxMembers"),
    minAge: int(fd, "minAge"), maxAge: int(fd, "maxAge"), quota: int(fd, "quota"), fee: optStr(fd, "fee", 100), contactInfo: optStr(fd, "contactInfo", 300), isPublished: bool(fd, "isPublished"),
  };
  let newId = id;
  try {
    if (id) await db.applicationPeriod.update({ where: { id }, data });
    else {
      const slug = await uniqueSlug(title, async (s) => !!(await db.applicationPeriod.findUnique({ where: { slug: s } })));
      newId = (await db.applicationPeriod.create({ data: { ...data, slug } })).id;
    }
    await logActivity(user.id, id ? "GUNCELLE" : "OLUSTUR", "Başvuru Dönemi", newId, title);
  } catch (e) { return fail(prismaMessage(e)); }
  refresh();
  if (!id) redirect(`/yonetim/donemler/${newId}`);
  return ok("Başvuru dönemi güncellendi.");
}

export async function deletePeriod(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const id = str(fd, "id");
  const count = await db.application.count({ where: { periodId: id } });
  if (count > 0) return fail(`Bu döneme ait ${count} başvuru var. Önce yayından kaldırmayı tercih edin.`);
  await db.applicationPeriod.delete({ where: { id } });
  await logActivity(user.id, "SIL", "Başvuru Dönemi", id);
  refresh();
  redirect("/yonetim/donemler");
}

// ═════════════ DUYURU & VİDEO & MESAJ ═════════════

export async function saveAnnouncement(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const id = str(fd, "id");
  const title = str(fd, "title", 200), content = str(fd, "content", 20000);
  if (!title || !content) return fail("Başlık ve içerik zorunludur.");
  const current = id ? await db.announcement.findUnique({ where: { id } }) : null;
  let coverUrl = current?.coverUrl ?? null;
  try {
    if (bool(fd, "cover_remove")) coverUrl = null;
    const f = file(fd, "cover");
    if (f) coverUrl = await saveImage(f);
  } catch (e) { return fail(e instanceof UploadError ? e.message : "Görsel yüklenemedi."); }
  const data = { title, content, coverUrl, excerpt: str(fd, "excerpt", 400) || content.slice(0, 200), category: str(fd, "category") || "GENEL", isPinned: bool(fd, "isPinned"), isPublished: bool(fd, "isPublished"), publishedAt: dt(fd, "publishedAt") ?? new Date() };
  try {
    if (id) await db.announcement.update({ where: { id }, data });
    else {
      const slug = await uniqueSlug(title, async (s) => !!(await db.announcement.findUnique({ where: { slug: s } })));
      await db.announcement.create({ data: { ...data, slug } });
    }
    await logActivity(user.id, id ? "GUNCELLE" : "OLUSTUR", "Duyuru", id || undefined, title);
  } catch (e) { return fail(prismaMessage(e)); }
  refresh();
  if (!id) redirect("/yonetim/duyurular");
  return ok("Duyuru güncellendi.");
}

export async function deleteAnnouncement(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  await requireUser();
  await db.announcement.delete({ where: { id: str(fd, "id") } }).catch(() => null);
  refresh();
  return ok("Silindi.");
}

export async function saveVideo(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  await requireUser();
  const id = str(fd, "id");
  const title = str(fd, "title", 200), youtubeUrl = str(fd, "youtubeUrl", 300);
  if (!title || !youtubeUrl) return fail("Başlık ve YouTube bağlantısı zorunludur.");
  const data = { title, youtubeUrl, category: str(fd, "category") || "GENEL", description: optStr(fd, "description", 1000), isFeatured: bool(fd, "isFeatured") };
  if (id) await db.video.update({ where: { id }, data }); else await db.video.create({ data });
  refresh();
  return ok(id ? "Video güncellendi." : "Video eklendi.");
}

export async function deleteVideo(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  await requireUser();
  await db.video.delete({ where: { id: str(fd, "id") } }).catch(() => null);
  refresh();
  return ok("Silindi.");
}

export async function messageAction(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  await requireUser();
  const id = str(fd, "id");
  if (str(fd, "op") === "delete") await db.contactMessage.delete({ where: { id } }).catch(() => null);
  else await db.contactMessage.update({ where: { id }, data: { isRead: str(fd, "op") !== "unread" } });
  revalidatePath("/yonetim", "layout");
  return ok();
}

// ═════════════ KULLANICILAR ═════════════

export async function saveUser(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  const me = await requireSuperAdmin();
  const id = str(fd, "id");
  const name = str(fd, "name", 80), email = str(fd, "email", 120).toLowerCase(), password = str(fd, "password", 200);
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("Ad ve geçerli e-posta zorunludur.");
  if (!id && password.length < 8) return fail("Şifre en az 8 karakter olmalıdır.");
  if (password && password.length < 8) return fail("Şifre en az 8 karakter olmalıdır.");
  const role = str(fd, "role") || "EDITOR", scope = str(fd, "scope") || "ALL";
  const active = id === me.id ? true : bool(fd, "active");
  try {
    if (id) await db.user.update({ where: { id }, data: { name, email, role: id === me.id ? "SUPER_ADMIN" : role, scope, active, ...(password ? { passwordHash: await hashPassword(password) } : {}) } });
    else await db.user.create({ data: { name, email, role, scope, active: true, passwordHash: await hashPassword(password) } });
    await logActivity(me.id, id ? "GUNCELLE" : "OLUSTUR", "Kullanıcı", id || undefined, email);
  } catch (e) { return fail(prismaMessage(e)); }
  revalidatePath("/yonetim/kullanicilar");
  return ok(id ? "Kullanıcı güncellendi." : "Kullanıcı oluşturuldu.");
}

export async function deleteUser(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  const me = await requireSuperAdmin();
  const id = str(fd, "id");
  if (id === me.id) return fail("Kendi hesabınızı silemezsiniz.");
  await db.user.delete({ where: { id } }).catch(() => null);
  revalidatePath("/yonetim/kullanicilar");
  return ok("Kullanıcı silindi.");
}

export async function changePassword(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  const me = await requireUser();
  const current = str(fd, "current", 200), next = str(fd, "next", 200), again = str(fd, "again", 200);
  if (!(await bcrypt.compare(current, me.passwordHash))) return fail("Mevcut şifre hatalı.");
  if (next.length < 8) return fail("Yeni şifre en az 8 karakter olmalıdır.");
  if (next !== again) return fail("Yeni şifreler eşleşmiyor.");
  await db.user.update({ where: { id: me.id }, data: { passwordHash: await hashPassword(next) } });
  await logActivity(me.id, "SIFRE", "Kullanıcı", me.id);
  return ok("Şifreniz değiştirildi.");
}

