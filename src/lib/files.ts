"use client";

import { collection, doc, getDoc, getDocs, serverTimestamp, writeBatch } from "firebase/firestore";
import { fauth, fdb } from "./firebase";

/**
 * Firebase Storage olmadan dosya saklama:
 *  - Görseller tarayıcıda küçültülüp sıkıştırılarak (data URL) doğrudan belgeye yazılır.
 *  - Başvuru belgeleri ~700 KB'lık parçalara bölünüp Firestore'da saklanır (files/{id}/chunks/{n}).
 */

export const MAX_DOC_MB = 5;
const CHUNK = 700_000; // base64 karakter (Firestore belge sınırı 1 MB)

export class FileError extends Error {}

/** Görseli verilen en büyük kenara küçültüp JPEG/PNG data URL'e çevirir */
export async function compressImage(file: File, maxSide = 512, quality = 0.82): Promise<string> {
  if (!file.type.startsWith("image/")) throw new FileError("Lütfen bir görsel dosyası seçin (PNG, JPG, WEBP).");
  if (file.size > 15 * 1024 * 1024) throw new FileError("Görsel 15 MB'tan büyük olamaz.");
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) throw new FileError("Görsel okunamadı.");
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale), h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, w, h);
  // WebP hem saydamlığı korur hem küçüktür; desteklemeyen tarayıcıda saydam logolar PNG, fotoğraflar JPEG
  const webp = canvas.toDataURL("image/webp", quality);
  if (webp.startsWith("data:image/webp")) return webp;
  const png = file.type === "image/png" || file.type === "image/svg+xml" || file.type === "image/webp";
  return canvas.toDataURL(png ? "image/png" : "image/jpeg", quality);
}

function toBase64(buf: ArrayBuffer) {
  let s = "";
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

export type StoredFile = { id: string; fileName: string; mimeType: string; size: number };

/** Belgeyi parçalayarak Firestore'a yazar. scope: "application" (yalnızca yönetici okur) */
export async function storeFile(file: File, scope: "application" | "media" = "application"): Promise<StoredFile> {
  if (file.size > MAX_DOC_MB * 1024 * 1024) throw new FileError(`"${file.name}" ${MAX_DOC_MB} MB sınırını aşıyor.`);
  const b64 = toBase64(await file.arrayBuffer());
  const parts = Math.max(1, Math.ceil(b64.length / CHUNK));
  const fileRef = doc(collection(fdb(), "files"));
  const meta = { fileName: file.name.slice(0, 200), mimeType: file.type || "application/octet-stream", size: file.size, chunks: parts, scope, ownerUid: fauth().currentUser?.uid ?? null, createdAt: serverTimestamp() };
  // Önce üst kayıt, sonra parçalar (kurallar parçaların üst kaydı olmasını şart koşar)
  const b0 = writeBatch(fdb());
  b0.set(fileRef, meta);
  await b0.commit();
  for (let i = 0; i < parts; i += 1) {
    const b = writeBatch(fdb());
    b.set(doc(fdb(), "files", fileRef.id, "chunks", String(i)), { i, data: b64.slice(i * CHUNK, (i + 1) * CHUNK) });
    await b.commit();
  }
  return { id: fileRef.id, fileName: meta.fileName, mimeType: meta.mimeType, size: file.size };
}

/** Parçaları birleştirip dosyayı açar / indirir (yalnızca yöneticiler) */
export async function openFile(id: string) {
  const meta = await getDoc(doc(fdb(), "files", id));
  if (!meta.exists()) throw new FileError("Dosya bulunamadı.");
  const m = meta.data() as { fileName: string; mimeType: string };
  const snap = await getDocs(collection(fdb(), "files", id, "chunks"));
  const b64 = snap.docs.map((d) => d.data() as { i: number; data: string }).sort((a, b) => a.i - b.i).map((c) => c.data).join("");
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const url = URL.createObjectURL(new Blob([bytes], { type: m.mimeType }));
  const a = document.createElement("a");
  a.href = url;
  if (!(m.mimeType === "application/pdf" || m.mimeType.startsWith("image/"))) a.download = m.fileName;
  a.target = "_blank";
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export async function deleteFile(id: string) {
  const snap = await getDocs(collection(fdb(), "files", id, "chunks"));
  const b = writeBatch(fdb());
  snap.docs.forEach((d) => b.delete(d.ref));
  b.delete(doc(fdb(), "files", id));
  await b.commit();
}
