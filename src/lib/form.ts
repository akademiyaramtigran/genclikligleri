import { fromDateTimeLocal } from "./utils";

export type ActionResult = { ok: boolean; message: string; redirect?: string } | null;

export const ok = (message = "Kaydedildi.", redirect?: string): ActionResult => ({ ok: true, message, redirect });
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
/** Firebase hatalarını anlaşılır mesaja çevirir */
export function errMessage(e: unknown) {
  const code = (e as { code?: string })?.code ?? "";
  if (code.includes("permission-denied")) return "Bu işlem için yetkiniz yok (güvenlik kuralları).";
  if (code.includes("not-found")) return "Kayıt bulunamadı.";
  if (code.includes("unavailable")) return "Bağlantı sorunu. İnternetinizi kontrol edip tekrar deneyin.";
  if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") return "E-posta veya şifre hatalı.";
  if (code === "auth/email-already-in-use") return "Bu e-posta ile zaten bir hesap var.";
  if (code === "auth/weak-password") return "Şifre en az 6 karakter olmalıdır.";
  if (code === "auth/too-many-requests") return "Çok fazla deneme yapıldı. Biraz sonra tekrar deneyin.";
  return e instanceof Error ? e.message : "Beklenmeyen bir hata oluştu.";
}

/** Bağlantı alanı: boşsa null, http(s) değilse hata */
export function url(fd: FormData, k: string) {
  const v = str(fd, k, 600);
  if (!v) return null;
  if (!/^https?:\/\//i.test(v)) throw new Error("Bağlantılar http:// veya https:// ile başlamalıdır.");
  return v;
}
