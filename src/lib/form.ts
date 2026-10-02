import { fromDateTimeLocal } from "./utils";

export type ActionResult = { ok: boolean; message: string } | null;

export const ok = (message = "Kaydedildi."): ActionResult => ({ ok: true, message });
export const fail = (message: string): ActionResult => ({ ok: false, message });

export const str = (fd: FormData, k: string, max = 500) => String(fd.get(k) ?? "").trim().slice(0, max);
export const optStr = (fd: FormData, k: string, max = 500) => str(fd, k, max) || null;
export const int = (fd: FormData, k: string) => {
  const v = str(fd, k);
  if (v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : null;
};
export const num = (fd: FormData, k: string) => {
  const v = str(fd, k).replace(",", ".");
  if (v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
export const bool = (fd: FormData, k: string) => fd.get(k) === "on" || fd.get(k) === "true";
export const dt = (fd: FormData, k: string) => fromDateTimeLocal(str(fd, k));
export const dateOnly = (fd: FormData, k: string) => {
  const v = str(fd, k);
  return v ? new Date(`${v}T12:00:00+03:00`) : null;
};
export const file = (fd: FormData, k: string) => {
  const f = fd.get(k);
  return f instanceof File && f.size > 0 ? f : null;
};

/** Prisma benzersizlik hatasını anlaşılır mesaja çevirir */
export function prismaMessage(e: unknown) {
  const code = (e as { code?: string })?.code;
  if (code === "P2002") return "Bu kayıt zaten mevcut (benzersiz alan çakışması).";
  if (code === "P2003") return "Bu kayıt başka kayıtlarla ilişkili olduğu için işlem yapılamadı.";
  if (code === "P2025") return "Kayıt bulunamadı.";
  return e instanceof Error ? e.message : "Beklenmeyen bir hata oluştu.";
}
