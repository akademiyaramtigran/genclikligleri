export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

const TR_MAP: Record<string, string> = {
  ç: "c", Ç: "c", ğ: "g", Ğ: "g", ı: "i", I: "i", İ: "i", ö: "o", Ö: "o", ş: "s", Ş: "s", ü: "u", Ü: "u",
  â: "a", Â: "a", î: "i", Î: "i", û: "u", Û: "u", ê: "e", Ê: "e",
};

export function slugify(input: string) {
  return input
    .split("")
    .map((ch) => TR_MAP[ch] ?? ch)
    .join("")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

const TZ = "Europe/Istanbul";

// ───── Ay ve gün adları: Kurmancî / Zazakî (tarayıcılarda bu diller için yerel ayar yok) ─────
const TR_MONTHS = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
const TR_DAYS = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
const NAMES: Record<string, { months: string[]; short: string[]; days: string[] }> = {
  ku: {
    months: ["Kanûna Paşîn", "Sibat", "Adar", "Nîsan", "Gulan", "Hezîran", "Tîrmeh", "Tebax", "Îlon", "Cotmeh", "Mijdar", "Kanûna Pêşîn"],
    short: ["K.Paş", "Sib", "Adr", "Nîs", "Gul", "Hez", "Tîr", "Teb", "Îlo", "Cot", "Mij", "K.Pêş"],
    days: ["Duşem", "Sêşem", "Çarşem", "Pêncşem", "În", "Şemî", "Yekşem"],
  },
  za: {
    months: ["Çele", "Gucige", "Adar", "Nisane", "Gulane", "Heziran", "Temuze", "Tebaxe", "Keşkelun", "Tışrino Verên", "Tışrino Peyên", "Kanun"],
    short: ["Çel", "Guc", "Adr", "Nis", "Gul", "Hez", "Tem", "Teb", "Keş", "T.Ve", "T.Pe", "Kan"],
    days: ["Dışeme", "Sêşeme", "Çarşeme", "Pancşeme", "Êne", "Şeme", "Kırê"],
  },
};
let dateLang = "tr";
/** Dil seçildiğinde LangProvider çağırır */
export function setDateLang(lang: string) { dateLang = lang; }

function localize(text: string) {
  const n = NAMES[dateLang];
  if (!n) return text;
  // Uzun adlar önce (Cumartesi → Cuma'dan önce), sonra kısaltmalar (Eki, Kas…)
  let out = text;
  TR_DAYS.map((d, i) => [d, n.days[i]!] as const).sort((a, b) => b[0].length - a[0].length).forEach(([tr, x]) => { out = out.replaceAll(tr, x); });
  TR_MONTHS.forEach((m, i) => { out = out.replaceAll(m, n.months[i]!); });
  TR_MONTHS.forEach((m, i) => { out = out.replace(new RegExp(`(^|[\\s.])${m.slice(0, 3)}(?=$|[\\s.,])`, "g"), `$1${n.short[i]!}`); });
  return out;
}

export function formatDate(d: Date | string | null | undefined, opts: Intl.DateTimeFormatOptions = {}) {
  if (!d) return "—";
  return localize(new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric", timeZone: TZ, ...opts }).format(new Date(d)));
}

export function formatDateTime(d: Date | string | null | undefined) {
  return formatDate(d, { hour: "2-digit", minute: "2-digit" });
}

export function formatTime(d: Date | string) {
  return new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit", timeZone: TZ }).format(new Date(d));
}

export function formatShortDate(d: Date | string) {
  return localize(new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "short", timeZone: TZ }).format(new Date(d)));
}

export function formatWeekday(d: Date | string) {
  return localize(new Intl.DateTimeFormat("tr-TR", { weekday: "long", timeZone: TZ }).format(new Date(d)));
}

/** İstanbul saatine göre YYYY-MM-DD */
export function dayKey(d: Date | string = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date(d));
}

/** datetime-local input değeri (İstanbul saati) */
export function toDateTimeLocal(d: Date | string | null | undefined) {
  if (!d) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date(d));
  const g = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return `${g("year")}-${g("month")}-${g("day")}T${g("hour")}:${g("minute")}`;
}

/** datetime-local değerini İstanbul saati (UTC+3, yaz saati uygulanmaz) olarak yorumlar */
export function fromDateTimeLocal(v: string) {
  if (!v) return null;
  const withSeconds = v.length === 16 ? `${v}:00` : v;
  const d = new Date(`${withSeconds}+03:00`);
  return isNaN(d.getTime()) ? null : d;
}

export function toDateInput(d: Date | string | null | undefined) {
  if (!d) return "";
  return dayKey(d);
}

export function age(birth: Date | string | null | undefined) {
  if (!birth) return null;
  const b = new Date(birth);
  const now = new Date();
  let a = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) a--;
  return a;
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toLocaleUpperCase("tr-TR"))
    .join("");
}

export function youtubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  const s = url.trim();
  if (/^[\w-]{11}$/.test(s)) return s;
  try {
    const u = new URL(s);
    const host = u.hostname.replace(/^www\.|^m\./, "");
    if (host === "youtu.be") return u.pathname.slice(1, 12) || null;
    if (host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) {
      const v = u.searchParams.get("v");
      if (v) return v.slice(0, 11);
      const m = u.pathname.match(/\/(embed|shorts|live|v)\/([\w-]{11})/);
      if (m) return m[2]!;
    }
  } catch {
    return null;
  }
  return null;
}

export function parseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function lines(text: string | null | undefined) {
  return (text ?? "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
}

export function pct(n: number, d: number) {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

export function fullName(p: { firstName: string; lastName: string }) {
  return `${p.firstName} ${p.lastName}`;
}

export function randomCode(len = 8) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return out;
}
