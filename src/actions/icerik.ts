"use client";

import { deleteDoc, setDoc, updateDoc } from "firebase/firestore";
import { getOne } from "@/lib/data";
import { requireAdmin, logActivity, uniqueId, ref, newRef, changed } from "@/lib/admin";
import { type ActionResult, ok, fail, str, optStr, bool, dt, dateOnly, errMessage } from "@/lib/form";
import { imageField } from "./spor";
import { compressImage } from "@/lib/files";
import { HIGHLIGHT_KINDS, POST_KINDS, POST_SECTIONS } from "@/lib/constants";
import type { Highlight, Post } from "@/lib/types";

const wrap = (fn: () => Promise<ActionResult>) => fn().catch((e) => fail(errMessage(e)));

// ═════════════ HAFTANIN ÖNE ÇIKANLARI ═════════════

export const saveHighlight = (_p: ActionResult, fd: FormData) => wrap(async () => {
  const admin = await requireAdmin();
  const id = str(fd, "id");
  const kind = str(fd, "kind"), name = str(fd, "name", 120), story = str(fd, "story", 1500);
  if (!(kind in HIGHLIGHT_KINDS) || !name || !story) return fail("Tür, ad ve hikâye zorunludur.");
  const current = id ? await getOne<Highlight>("highlights", id) : null;
  const data = {
    kind, name, story, subtitle: optStr(fd, "subtitle", 160), link: optStr(fd, "link", 300), section: optStr(fd, "section", 20),
    weekOf: dateOnly(fd, "weekOf") ?? new Date(), isPublished: bool(fd, "isPublished"),
    photoUrl: await imageField(fd, "photo", current?.photoUrl, 600),
  };
  if (id) await updateDoc(ref("highlights", id), data);
  else await setDoc(newRef("highlights"), { ...data, createdAt: new Date() });
  await logActivity(admin, id ? "GUNCELLE" : "OLUSTUR", "Öne Çıkan", id || undefined, `${HIGHLIGHT_KINDS[kind]!.label}: ${name}`);
  changed();
  return ok(id ? "Güncellendi." : "Eklendi.", id ? undefined : "/yonetim/one-cikanlar");
});

export const deleteHighlight = (_p: ActionResult, fd: FormData) => wrap(async () => {
  const admin = await requireAdmin();
  await deleteDoc(ref("highlights", str(fd, "id")));
  await logActivity(admin, "SIL", "Öne Çıkan", str(fd, "id"));
  changed();
  return ok("Silindi.", "/yonetim/one-cikanlar");
});

// ═════════════ GENÇLİĞİN SESİ ═════════════

/** "Soru | Cevap" satırlarını röportaj bölümlerine çevirir; boş satırla ayrılmış "S: … / C: …" de kabul edilir */
function parseQa(text: string) {
  return text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).map((l) => {
    const [q = "", ...rest] = l.split("|");
    return { q: q.trim(), a: rest.join("|").trim() };
  }).filter((x) => x.q && x.a);
}

export const savePost = (_p: ActionResult, fd: FormData) => wrap(async () => {
  const admin = await requireAdmin();
  const id = str(fd, "id");
  const kind = str(fd, "kind"), title = str(fd, "title", 200), author = str(fd, "author", 100);
  const body = str(fd, "body", 20000);
  if (!(kind in POST_KINDS) || !title || !author) return fail("Tür, başlık ve yazar zorunludur.");
  const current = id ? await getOne<Post>("posts", id) : null;
  // Fotoğraflar: en fazla 4, her biri ~900 px (belge boyutu sınırı için)
  let photos = (current?.photos ?? []).filter((_, i) => !bool(fd, `photo_remove_${i}`));
  const files = fd.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  for (const f of files) photos.push(await compressImage(f, 900, 0.78));
  photos = photos.slice(0, 4);
  if (kind === "FOTO" && photos.length === 0) return fail("Fotoğraf paylaşımı için en az bir fotoğraf yükleyin.");
  if (kind !== "FOTO" && !body && kind !== "ROPORTAJ") return fail("Metin zorunludur.");
  const section = str(fd, "section");
  const data = {
    kind, title, author, body, section: section in POST_SECTIONS ? section : "GENEL", authorRole: optStr(fd, "authorRole", 100),
    authorPhoto: await imageField(fd, "authorPhoto", current?.authorPhoto, 200), photos, qa: parseQa(str(fd, "qa", 15000)),
    publishedAt: dt(fd, "publishedAt") ?? new Date(), isPublished: bool(fd, "isPublished"),
  };
  if (id) await updateDoc(ref("posts", id), data);
  else {
    const pid = await uniqueId("posts", title);
    await setDoc(ref("posts", pid), { ...data, slug: pid, createdAt: new Date() });
  }
  await logActivity(admin, id ? "GUNCELLE" : "OLUSTUR", "Gençliğin Sesi", id || undefined, title);
  changed();
  return ok(id ? "Paylaşım güncellendi." : "Paylaşım yayımlandı.", id ? undefined : "/yonetim/gencligin-sesi");
});

export const deletePost = (_p: ActionResult, fd: FormData) => wrap(async () => {
  const admin = await requireAdmin();
  await deleteDoc(ref("posts", str(fd, "id")));
  await logActivity(admin, "SIL", "Gençliğin Sesi", str(fd, "id"));
  changed();
  return ok("Silindi.", "/yonetim/gencligin-sesi");
});

// ═════════════ HAKEM & GÖNÜLLÜ / E-POSTA ═════════════

export const toggleVolunteer = (_p: ActionResult, fd: FormData) => wrap(async () => {
  await requireAdmin();
  const id = str(fd, "id");
  if (bool(fd, "remove")) { await deleteDoc(ref("volunteers", id)); changed(); return ok("Silindi."); }
  await updateDoc(ref("volunteers", id), { active: str(fd, "active") === "1" });
  changed();
  return ok("Güncellendi.");
});

export const deleteMail = (_p: ActionResult, fd: FormData) => wrap(async () => {
  await requireAdmin();
  await deleteDoc(ref("mail", str(fd, "id")));
  changed();
  return ok("Silindi.");
});
