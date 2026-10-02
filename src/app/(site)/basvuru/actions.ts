"use server";

import { db } from "@/lib/db";
import { periodState } from "@/lib/periods";
import { saveDocument, deleteDocument, UploadError } from "@/lib/storage";
import { randomCode, parseJson, age } from "@/lib/utils";
import { DISTRICTS, type RequiredDoc } from "@/lib/constants";

export type ApplyState =
  | { ok: true; trackingCode: string; email: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> }
  | null;

export type Member = Record<string, string>;

const s = (fd: FormData, k: string, max = 300) => String(fd.get(k) ?? "").trim().slice(0, max);

const DATA_FIELDS: Record<string, string[]> = {
  SPOR: ["shortName", "sport", "gender", "coachName", "coachPhone", "primaryColor", "secondaryColor", "homeVenue", "foundedYear", "note"],
  MUZIK: ["type", "genre", "demoUrl", "instagram", "bio", "songs"],
  TIYATRO: ["playTitle", "playwright", "director", "genre", "durationMin", "language", "synopsis", "techNeeds", "videoUrl"],
};

export async function submitApplication(_prev: ApplyState, fd: FormData): Promise<ApplyState> {
  const period = await db.applicationPeriod.findUnique({ where: { id: s(fd, "periodId") } });
  if (!period || !period.isPublished) return { ok: false, error: "Başvuru dönemi bulunamadı." };
  if (periodState(period) !== "OPEN") return { ok: false, error: "Bu başvuru dönemi şu anda açık değil." };

  // Bot tuzağı
  if (s(fd, "website")) return { ok: false, error: "Başvuru alınamadı." };

  const fieldErrors: Record<string, string> = {};
  const title = s(fd, "title", 150);
  const applicantName = s(fd, "applicantName", 100);
  const applicantEmail = s(fd, "applicantEmail", 150).toLowerCase();
  const applicantPhone = s(fd, "applicantPhone", 30);
  const district = s(fd, "district", 50);

  if (title.length < 2) fieldErrors.title = "Bu alan zorunludur.";
  if (applicantName.length < 3) fieldErrors.applicantName = "Ad soyad giriniz.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(applicantEmail)) fieldErrors.applicantEmail = "Geçerli bir e-posta giriniz.";
  if (applicantPhone.replace(/\D/g, "").length < 10) fieldErrors.applicantPhone = "Geçerli bir telefon giriniz.";
  if (!DISTRICTS.includes(district as (typeof DISTRICTS)[number])) fieldErrors.district = "İlçe seçiniz.";
  if (fd.get("kvkk") !== "on") fieldErrors.kvkk = "KVKK aydınlatma metnini onaylamanız gerekir.";
  if (fd.get("rules") !== "on") fieldErrors.rules = "Başvuru şartlarını kabul etmeniz gerekir.";

  // Kategoriye özel alanlar
  const data: Record<string, string> = {};
  for (const k of DATA_FIELDS[period.category] ?? []) {
    const v = s(fd, k, k === "synopsis" || k === "bio" || k === "note" ? 3000 : 300);
    if (v) data[k] = v;
  }
  if (period.category === "SPOR") {
    if (period.sport) data.sport = period.sport;
    if (period.gender) data.gender = period.gender;
    if (!data.gender) fieldErrors.gender = "Kategori seçiniz.";
    if (!data.coachName) fieldErrors.coachName = "Antrenör adı zorunludur.";
  }
  if (period.category === "MUZIK" && !data.genre) fieldErrors.genre = "Müzik türü seçiniz.";
  if (period.category === "TIYATRO") {
    if (!data.playTitle) fieldErrors.playTitle = "Oyun adı zorunludur.";
    if (!data.playwright) fieldErrors.playwright = "Yazar bilgisi zorunludur.";
  }

  // Üyeler
  const members = parseJson<Member[]>(String(fd.get("members") ?? "[]"), [])
    .filter((m) => (m.firstName ?? "").trim() || (m.lastName ?? "").trim())
    .slice(0, 60)
    .map((m) => Object.fromEntries(Object.entries(m).map(([k, v]) => [k, String(v).trim().slice(0, 120)])));
  const memberLabel = period.category === "SPOR" ? "oyuncu" : "üye";
  if (period.minMembers && members.length < period.minMembers) fieldErrors.members = `En az ${period.minMembers} ${memberLabel} eklemelisiniz.`;
  if (period.maxMembers && members.length > period.maxMembers) fieldErrors.members = `En fazla ${period.maxMembers} ${memberLabel} ekleyebilirsiniz.`;
  const badMember = members.findIndex((m) => !m.firstName || !m.lastName);
  if (badMember >= 0) fieldErrors.members = `${badMember + 1}. sıradaki kişinin adı ve soyadı eksik.`;
  if (period.category === "SPOR" || period.minAge || period.maxAge) {
    for (const [i, m] of members.entries()) {
      if (!m.birthDate) {
        if (period.category === "SPOR") { fieldErrors.members = `${i + 1}. sıradaki oyuncunun doğum tarihi eksik.`; break; }
        continue;
      }
      const a = age(m.birthDate);
      if (a == null || isNaN(a)) { fieldErrors.members = `${i + 1}. sıradaki kişinin doğum tarihi geçersiz.`; break; }
      if ((period.minAge && a < period.minAge) || (period.maxAge && a > period.maxAge)) {
        fieldErrors.members = `${m.firstName} ${m.lastName} yaş sınırının (${period.minAge ?? 0}-${period.maxAge ?? "∞"}) dışında (${a} yaş).`;
        break;
      }
    }
  }

  // Belgeler
  const docs = parseJson<RequiredDoc[]>(period.requiredDocuments, []);
  const files: { doc: RequiredDoc; file: File }[] = [];
  for (const doc of docs) {
    const f = fd.get(`doc_${doc.key}`);
    if (f instanceof File && f.size > 0) files.push({ doc, file: f });
    else if (doc.required) fieldErrors[`doc_${doc.key}`] = "Bu belge zorunludur.";
  }

  if (Object.keys(fieldErrors).length) return { ok: false, error: "Lütfen işaretli alanları kontrol edin.", fieldErrors };

  // Aynı dönemde aynı isimle tekrar başvuruyu engelle
  const dup = await db.application.findFirst({ where: { periodId: period.id, title, status: { not: "REJECTED" } } });
  if (dup) return { ok: false, error: `"${title}" adıyla bu döneme zaten başvuru yapılmış. Takip kodunuzla durumu sorgulayabilirsiniz.` };

  if (period.quota) {
    const count = await db.application.count({ where: { periodId: period.id, status: "APPROVED" } });
    if (count >= period.quota) return { ok: false, error: "Bu dönemin kontenjanı dolmuştur." };
  }

  const saved: Awaited<ReturnType<typeof saveDocument>>[] = [];
  try {
    for (const { file } of files) saved.push(await saveDocument(file));
  } catch (e) {
    await Promise.all(saved.map((x) => deleteDocument(x.storedName)));
    return { ok: false, error: e instanceof UploadError ? e.message : "Dosya yüklenemedi." };
  }

  let trackingCode = `DGL${randomCode(5)}`;
  while (await db.application.findUnique({ where: { trackingCode } })) trackingCode = `DGL${randomCode(5)}`;

  await db.application.create({
    data: {
      trackingCode,
      periodId: period.id,
      title,
      applicantName,
      applicantEmail,
      applicantPhone,
      applicantRole: s(fd, "applicantRole", 80) || null,
      district,
      data: JSON.stringify(data),
      members: JSON.stringify(members),
      kvkkConsent: true,
      documents: {
        create: files.map(({ doc }, i) => ({ docKey: doc.key, label: doc.label, ...saved[i]! })),
      },
    },
  });

  return { ok: true, trackingCode, email: applicantEmail };
}
