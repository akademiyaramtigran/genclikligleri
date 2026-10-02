import "server-only";
import { mkdir, writeFile, readFile, unlink } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { ALLOWED_MIME, MAX_UPLOAD_MB } from "./constants";

const ROOT = path.resolve(process.env.STORAGE_DIR || "./storage");
const IMAGE_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];

function extOf(name: string) {
  const e = path.extname(name).toLowerCase().replace(/[^.a-z0-9]/g, "");
  return e.length <= 6 ? e : "";
}

export class UploadError extends Error {}

/** Başvuru belgelerini özel klasöre kaydeder (yalnızca yöneticiler indirebilir) */
export async function saveDocument(file: File) {
  if (file.size > MAX_UPLOAD_MB * 1024 * 1024) throw new UploadError(`"${file.name}" ${MAX_UPLOAD_MB} MB sınırını aşıyor.`);
  if (file.type && !ALLOWED_MIME.includes(file.type)) throw new UploadError(`"${file.name}" desteklenmeyen dosya türü.`);
  const dir = path.join(ROOT, "documents");
  await mkdir(dir, { recursive: true });
  const storedName = `${randomUUID()}${extOf(file.name)}`;
  await writeFile(path.join(dir, storedName), Buffer.from(await file.arrayBuffer()));
  return { storedName, fileName: file.name.slice(0, 200), mimeType: file.type || "application/octet-stream", size: file.size };
}

export async function readDocument(storedName: string) {
  const safe = path.basename(storedName);
  return readFile(path.join(ROOT, "documents", safe));
}

export async function deleteDocument(storedName: string) {
  await unlink(path.join(ROOT, "documents", path.basename(storedName))).catch(() => {});
}

/** Herkese açık görseller (logo, oyuncu fotoğrafı, afiş). /medya/<ad> adresinden sunulur. */
export async function saveImage(file: File | null | undefined) {
  if (!file || file.size === 0) return null;
  if (file.size > 5 * 1024 * 1024) throw new UploadError("Görsel en fazla 5 MB olabilir.");
  if (!IMAGE_MIME.includes(file.type)) throw new UploadError("Görsel PNG, JPG, WEBP, GIF veya SVG olmalıdır.");
  const dir = path.join(ROOT, "media");
  await mkdir(dir, { recursive: true });
  const name = `${randomUUID()}${extOf(file.name) || ".png"}`;
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  return `/medya/${name}`;
}

export async function readImage(name: string) {
  return readFile(path.join(ROOT, "media", path.basename(name)));
}
