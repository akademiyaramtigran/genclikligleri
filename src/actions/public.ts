"use client";

import { doc, getDoc, serverTimestamp, setDoc, writeBatch } from "firebase/firestore";
import { signInAnonymously } from "firebase/auth";
import { fauth, fdb } from "@/lib/firebase";
import { getOne } from "@/lib/data";
import { periodState } from "@/lib/periods";
import { storeFile, FileError, compressImage } from "@/lib/files";
import { errMessage } from "@/lib/form";
import { age, dayKey, randomCode } from "@/lib/utils";
import { DISTRICTS } from "@/lib/constants";
import type { MusicCompetition, MusicContestant, Period } from "@/lib/types";

/** Ziyaretçi işlemleri için anonim oturum (kötüye kullanımı sınırlamak için) */
export async function ensureAuth() {
  const a = fauth();
  if (a.currentUser) return a.currentUser;
  return (await signInAnonymously(a)).user;
}

export async function sha256(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ───────────── Başvuru ─────────────

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
  try {
    const period = await getOne<Period>("periods", s(fd, "periodId"));
    if (!period || !period.isPublished) return { ok: false, error: "Başvuru dönemi bulunamadı." };
    if (periodState(period) !== "OPEN") return { ok: false, error: "Bu başvuru dönemi şu anda açık değil." };
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

    const data: Record<string, string> = {};
    for (const k of DATA_FIELDS[period.category] ?? []) {
      const v = s(fd, k, ["synopsis", "bio", "note"].includes(k) ? 3000 : 300);
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

    let members: Member[] = [];
    try { members = JSON.parse(String(fd.get("members") ?? "[]")); } catch { members = []; }
    members = members
      .filter((m) => (m.firstName ?? "").trim() || (m.lastName ?? "").trim())
      .slice(0, 60)
      .map((m) => Object.fromEntries(Object.entries(m).map(([k, v]) => [k, String(v).trim().slice(0, 120)])));
    const word = period.category === "SPOR" ? "oyuncu" : "üye";
    if (period.minMembers && members.length < period.minMembers) fieldErrors.members = `En az ${period.minMembers} ${word} eklemelisiniz.`;
    if (period.maxMembers && members.length > period.maxMembers) fieldErrors.members = `En fazla ${period.maxMembers} ${word} ekleyebilirsiniz.`;
    const bad = members.findIndex((m) => !m.firstName || !m.lastName);
    if (bad >= 0) fieldErrors.members = `${bad + 1}. sıradaki kişinin adı ve soyadı eksik.`;
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

    const files: { key: string; label: string; file: File }[] = [];
    for (const d of period.requiredDocuments) {
      const f = fd.get(`doc_${d.key}`);
      if (f instanceof File && f.size > 0) files.push({ key: d.key, label: d.label, file: f });
      else if (d.required) fieldErrors[`doc_${d.key}`] = "Bu belge zorunludur.";
    }
    if (Object.keys(fieldErrors).length) return { ok: false, error: "Lütfen işaretli alanları kontrol edin.", fieldErrors };

    await ensureAuth();
    // Takım logosu yüklendiyse küçük görsel olarak sakla
    const logo = files.find((f) => f.key === "logo" && f.file.type.startsWith("image/"));
    if (logo) data.logoUrl = await compressImage(logo.file, 128).catch(() => "");

    const documents = [];
    for (const f of files) {
      const stored = await storeFile(f.file, "application");
      documents.push({ key: f.key, label: f.label, fileName: stored.fileName, path: stored.id, mimeType: stored.mimeType, size: stored.size });
    }

    let trackingCode = `DGL${randomCode(5)}`;
    for (let i = 0; i < 5 && (await getDoc(doc(fdb(), "applicationStatus", trackingCode)).catch(() => null))?.exists(); i++) trackingCode = `DGL${randomCode(5)}`;

    const b = writeBatch(fdb());
    b.set(doc(fdb(), "applications", trackingCode), {
      trackingCode, periodId: period.id, periodTitle: period.title, category: period.category, status: "PENDING",
      title, applicantName, applicantEmail, applicantPhone, applicantRole: s(fd, "applicantRole", 80) || null, district,
      data, members, kvkkConsent: true, documents, resultEntityId: null, ownerUid: fauth().currentUser?.uid ?? null, createdAt: serverTimestamp(),
    });
    b.set(doc(fdb(), "applicationStatus", trackingCode), {
      status: "PENDING", title, periodTitle: period.title, publicNote: null, emailHash: await sha256(applicantEmail),
      memberCount: members.length, docLabels: documents.map((d) => d.label), createdAt: serverTimestamp(),
    });
    await b.commit();
    return { ok: true, trackingCode, email: applicantEmail };
  } catch (e) {
    return { ok: false, error: e instanceof FileError ? e.message : errMessage(e) };
  }
}

// ───────────── Halk oylaması ─────────────

export type VoteState = { ok: boolean; message: string } | null;

export async function voteAction(_prev: VoteState, fd: FormData): Promise<VoteState> {
  try {
    const contestantId = String(fd.get("contestantId") ?? "");
    const c = await getOne<MusicContestant>("musicContestants", contestantId);
    if (!c) return { ok: false, message: "Yarışmacı bulunamadı." };
    const comp = await getOne<MusicCompetition>("musicCompetitions", c.competitionId);
    if (!comp?.votingOpen) return { ok: false, message: "Oylama şu anda kapalı." };
    if (c.status === "ELIMINATED") return { ok: false, message: "Bu yarışmacı yarışmadan elendi." };
    const user = await ensureAuth();
    const day = dayKey();
    const vref = doc(fdb(), "votes", `${user.uid}_${day}`);
    const existing = await getDoc(vref).catch(() => null);
    if (existing?.exists()) return { ok: false, message: "Bugün oyunu kullandın. Yarın tekrar oy verebilirsin! 💜" };
    await setDoc(vref, { contestantId, uid: user.uid, day, createdAt: serverTimestamp() });
    return { ok: true, message: `Oyun ${c.name} için kaydedildi. Teşekkürler!` };
  } catch (e) {
    return { ok: false, message: (e as { code?: string })?.code?.includes("permission") ? "Bugün oyunu kullandın. Yarın tekrar oy verebilirsin! 💜" : errMessage(e) };
  }
}

// ───────────── İletişim ─────────────

export type ContactState = { ok: boolean; message: string } | null;

export async function sendMessage(_prev: ContactState, fd: FormData): Promise<ContactState> {
  const g = (k: string, max = 200) => String(fd.get(k) ?? "").trim().slice(0, max);
  if (g("website")) return { ok: true, message: "Mesajınız alındı." };
  const name = g("name"), email = g("email"), subject = g("subject"), message = g("message", 5000), phone = g("phone", 30);
  if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || subject.length < 2 || message.length < 10) {
    return { ok: false, message: "Lütfen tüm zorunlu alanları doldurun (mesaj en az 10 karakter)." };
  }
  try {
    await ensureAuth();
    await setDoc(doc(fdb(), "messages", crypto.randomUUID()), { name, email, phone: phone || null, subject, message, isRead: false, createdAt: serverTimestamp() });
    return { ok: true, message: "Mesajınız bize ulaştı. En kısa sürede dönüş yapacağız. Teşekkürler!" };
  } catch (e) {
    return { ok: false, message: errMessage(e) };
  }
}
