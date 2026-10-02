export const SITE = {
  name: "Diyarbakır Gençlik Organizasyonları",
  shortName: "DGO",
  org: "Diyarbakır Gençlik Organizasyonları",
  slogan: "Şehrin gençliği tek sahada: Spor, Müzik, Tiyatro",
  email: "iletisim@diyarbakirgenclik.org",
  phone: "0 (412) 000 00 00",
  address: "Gençlik Merkezi, Kayapınar / Diyarbakır",
  socials: {
    instagram: "https://instagram.com/",
    youtube: "https://youtube.com/",
    x: "https://x.com/",
  },
};

export const DISTRICTS = [
  "Bağlar", "Kayapınar", "Sur", "Yenişehir", "Bismil", "Çermik", "Çınar", "Çüngüş", "Dicle", "Eğil",
  "Ergani", "Hani", "Hazro", "Kocaköy", "Kulp", "Lice", "Silvan",
] as const;

// ───────────────────────── Spor ─────────────────────────

export type SportKey = "FUTBOL" | "BASKETBOL" | "VOLEYBOL" | "HENTBOL";
export type GenderKey = "ERKEK" | "KADIN";

export type EventTypeDef = {
  key: string;
  label: string;
  short: string;
  /** Skor/istatistik lider tablosunda kullanılacak mı */
  leaderboard?: string;
  /** Değer girilebilir mi (ör. basketbolda sayı) */
  hasValue?: boolean;
  tone?: "goal" | "card-yellow" | "card-red" | "stat" | "neg";
};

export type SportDef = {
  key: SportKey;
  label: string;
  slug: string;
  emoji: string;
  /** Skorer tablosunun başlığı */
  scorerTitle: string;
  scorerUnit: string;
  /** Skor sayımında kullanılan olay tipleri */
  scoringEvents: string[];
  points: { win: number; draw: number; loss: number };
  allowsDraw: boolean;
  scoreLabel: string;
  forLabel: string;
  againstLabel: string;
  positions: string[];
  events: EventTypeDef[];
  minSquad: number;
  maxSquad: number;
  periodHint: string;
  accent: string;
  gradient: string;
};

export const SPORTS: Record<SportKey, SportDef> = {
  FUTBOL: {
    key: "FUTBOL",
    label: "Futbol",
    slug: "futbol",
    emoji: "⚽",
    scorerTitle: "Gol Krallığı",
    scorerUnit: "Gol",
    scoringEvents: ["GOAL", "PENALTY_GOAL"],
    points: { win: 3, draw: 1, loss: 0 },
    allowsDraw: true,
    scoreLabel: "Gol",
    forLabel: "AG",
    againstLabel: "YG",
    positions: ["Kaleci", "Defans", "Orta Saha", "Forvet"],
    events: [
      { key: "GOAL", label: "Gol", short: "⚽", leaderboard: "Gol Krallığı", tone: "goal" },
      { key: "PENALTY_GOAL", label: "Penaltı Golü", short: "⚽ (P)", tone: "goal" },
      { key: "OWN_GOAL", label: "Kendi Kalesine", short: "⚽ (KK)", tone: "neg" },
      { key: "ASSIST", label: "Asist", short: "🅰", leaderboard: "Asist Liderleri", tone: "stat" },
      { key: "YELLOW_CARD", label: "Sarı Kart", short: "🟨", tone: "card-yellow" },
      { key: "RED_CARD", label: "Kırmızı Kart", short: "🟥", tone: "card-red" },
    ],
    minSquad: 14,
    maxSquad: 25,
    periodHint: "Devre skorları (ör. 1-0, 2-1)",
    accent: "emerald",
    gradient: "from-emerald-600 via-emerald-700 to-teal-900",
  },
  BASKETBOL: {
    key: "BASKETBOL",
    label: "Basketbol",
    slug: "basketbol",
    emoji: "🏀",
    scorerTitle: "Sayı Krallığı",
    scorerUnit: "Sayı",
    scoringEvents: ["POINTS"],
    points: { win: 2, draw: 0, loss: 1 },
    allowsDraw: false,
    scoreLabel: "Sayı",
    forLabel: "AS",
    againstLabel: "YS",
    positions: ["Oyun Kurucu", "Şutör Guard", "Kısa Forvet", "Uzun Forvet", "Pivot"],
    events: [
      { key: "POINTS", label: "Sayı", short: "PTS", leaderboard: "Sayı Krallığı", hasValue: true, tone: "goal" },
      { key: "THREE_POINT", label: "Üçlük", short: "3P", leaderboard: "Üçlük Liderleri", hasValue: true, tone: "stat" },
      { key: "REBOUND", label: "Ribaund", short: "RB", leaderboard: "Ribaund Liderleri", hasValue: true, tone: "stat" },
      { key: "ASSIST", label: "Asist", short: "AS", leaderboard: "Asist Liderleri", hasValue: true, tone: "stat" },
      { key: "BLOCK", label: "Blok", short: "BL", hasValue: true, tone: "stat" },
    ],
    minSquad: 10,
    maxSquad: 15,
    periodHint: "Periyot skorları (ör. 18-15, 20-22, 17-14, 21-19)",
    accent: "orange",
    gradient: "from-orange-500 via-orange-600 to-red-800",
  },
  VOLEYBOL: {
    key: "VOLEYBOL",
    label: "Voleybol",
    slug: "voleybol",
    emoji: "🏐",
    scorerTitle: "Sayı Liderleri",
    scorerUnit: "Sayı",
    scoringEvents: ["POINTS"],
    points: { win: 3, draw: 0, loss: 0 },
    allowsDraw: false,
    scoreLabel: "Set",
    forLabel: "AS",
    againstLabel: "VS",
    positions: ["Pasör", "Smaçör", "Orta Oyuncu", "Pasör Çaprazı", "Libero"],
    events: [
      { key: "POINTS", label: "Sayı", short: "PTS", leaderboard: "Sayı Liderleri", hasValue: true, tone: "goal" },
      { key: "ACE", label: "Servis Ası", short: "ACE", leaderboard: "Servis Ası Liderleri", hasValue: true, tone: "stat" },
      { key: "BLOCK", label: "Blok", short: "BL", leaderboard: "Blok Liderleri", hasValue: true, tone: "stat" },
    ],
    minSquad: 10,
    maxSquad: 14,
    periodHint: "Set skorları (ör. 25-21, 22-25, 25-18, 25-20)",
    accent: "sky",
    gradient: "from-sky-500 via-blue-600 to-indigo-900",
  },
  HENTBOL: {
    key: "HENTBOL",
    label: "Hentbol",
    slug: "hentbol",
    emoji: "🤾",
    scorerTitle: "Gol Krallığı",
    scorerUnit: "Gol",
    scoringEvents: ["GOAL"],
    points: { win: 2, draw: 1, loss: 0 },
    allowsDraw: true,
    scoreLabel: "Gol",
    forLabel: "AG",
    againstLabel: "YG",
    positions: ["Kaleci", "Sol Kanat", "Sol Oyun Kurucu", "Orta Oyun Kurucu", "Sağ Oyun Kurucu", "Sağ Kanat", "Pivot"],
    events: [
      { key: "GOAL", label: "Gol", short: "⚽", leaderboard: "Gol Krallığı", hasValue: true, tone: "goal" },
      { key: "ASSIST", label: "Asist", short: "AS", leaderboard: "Asist Liderleri", hasValue: true, tone: "stat" },
      { key: "SAVE", label: "Kurtarış", short: "KUR", leaderboard: "Kurtarış Liderleri", hasValue: true, tone: "stat" },
      { key: "SUSPENSION", label: "2 Dk Uzaklaştırma", short: "2'", tone: "card-yellow" },
      { key: "YELLOW_CARD", label: "Sarı Kart", short: "🟨", tone: "card-yellow" },
      { key: "RED_CARD", label: "Kırmızı Kart", short: "🟥", tone: "card-red" },
    ],
    minSquad: 12,
    maxSquad: 16,
    periodHint: "Devre skorları (ör. 14-12, 13-15)",
    accent: "violet",
    gradient: "from-violet-600 via-purple-700 to-fuchsia-900",
  },
};

export const SPORT_LIST = Object.values(SPORTS);

export function sportBySlug(slug: string) {
  return SPORT_LIST.find((s) => s.slug === slug);
}

export function sportDef(key: string): SportDef {
  return SPORTS[key as SportKey] ?? SPORTS.FUTBOL;
}

export function eventDef(sport: string, type: string): EventTypeDef | undefined {
  return sportDef(sport).events.find((e) => e.key === type);
}

export const GENDERS: Record<GenderKey, { key: GenderKey; label: string; slug: string; league: string; plural: string }> = {
  ERKEK: { key: "ERKEK", label: "Erkek", slug: "erkek", league: "Erkekler", plural: "Erkek Ligleri" },
  KADIN: { key: "KADIN", label: "Kadın", slug: "kadin", league: "Kadınlar", plural: "Kadın Ligleri" },
};

export function genderBySlug(slug: string | undefined): GenderKey {
  return slug === "kadin" ? "KADIN" : "ERKEK";
}

export const LEAGUE_STATUS: Record<string, { label: string; tone: string }> = {
  PLANNED: { label: "Planlandı", tone: "slate" },
  ONGOING: { label: "Devam Ediyor", tone: "green" },
  COMPLETED: { label: "Tamamlandı", tone: "blue" },
};

export const MATCH_STATUS: Record<string, { label: string; tone: string }> = {
  SCHEDULED: { label: "Planlandı", tone: "slate" },
  LIVE: { label: "Canlı", tone: "red" },
  FINISHED: { label: "Bitti", tone: "green" },
  POSTPONED: { label: "Ertelendi", tone: "amber" },
  CANCELLED: { label: "İptal", tone: "zinc" },
};

export const PLAYER_STATUS: Record<string, { label: string; tone: string }> = {
  ACTIVE: { label: "Aktif", tone: "green" },
  INJURED: { label: "Sakat", tone: "amber" },
  SUSPENDED: { label: "Cezalı", tone: "red" },
  PASSIVE: { label: "Pasif", tone: "zinc" },
};

// ───────────────────────── Başvurular ─────────────────────────

export const CATEGORIES = {
  SPOR: { key: "SPOR", label: "Spor", color: "emerald" },
  MUZIK: { key: "MUZIK", label: "Müzik", color: "fuchsia" },
  TIYATRO: { key: "TIYATRO", label: "Tiyatro", color: "amber" },
  YAZARLIK: { key: "YAZARLIK", label: "Yazarlık", color: "rose" },
  GONULLU: { key: "GONULLU", label: "Hakem & Gönüllü", color: "sky" },
} as const;

export type CategoryKey = keyof typeof CATEGORIES;

/** Başvuru kategorisinin bağlı olduğu yönetim birimi (yazarlık yarışmasını tiyatro birimi yönetir) */
// GENEL: yalnızca süper yönetici ve "tüm birimler" yetkili yöneticiler
export const CATEGORY_UNIT: Record<CategoryKey, "SPOR" | "MUZIK" | "TIYATRO" | "GENEL"> = { SPOR: "SPOR", MUZIK: "MUZIK", TIYATRO: "TIYATRO", YAZARLIK: "TIYATRO", GONULLU: "GENEL" };
export const unitCategories = (unit: string) => (Object.keys(CATEGORY_UNIT) as CategoryKey[]).filter((c) => CATEGORY_UNIT[c] === unit);

export const APPLICATION_STATUS: Record<string, { label: string; tone: string; description: string }> = {
  PENDING: { label: "Alındı", tone: "slate", description: "Başvurunuz sisteme kaydedildi, inceleme sırasına alındı." },
  IN_REVIEW: { label: "İnceleniyor", tone: "blue", description: "Başvurunuz organizasyon komitesi tarafından inceleniyor." },
  NEEDS_REVISION: { label: "Eksik Evrak", tone: "amber", description: "Başvurunuzda eksik veya hatalı belge var. Açıklamayı okuyup bizimle iletişime geçin." },
  APPROVED: { label: "Onaylandı", tone: "green", description: "Tebrikler! Başvurunuz onaylandı." },
  REJECTED: { label: "Reddedildi", tone: "red", description: "Başvurunuz bu dönem için uygun bulunmadı." },
};

export type RequiredDoc = { key: string; label: string; required: boolean; hint?: string };

export const DEFAULT_DOCS: Record<CategoryKey, RequiredDoc[]> = {
  SPOR: [
    { key: "kimlik", label: "Oyuncu kimlik fotokopileri (tek PDF)", required: true, hint: "Tüm oyuncuların nüfus cüzdanı ön yüzü" },
    { key: "saglik", label: "Sağlık raporu / “spor yapmasında sakınca yoktur” belgesi", required: true },
    { key: "veli", label: "18 yaş altı için veli muvafakatnamesi", required: true },
    { key: "foto", label: "Oyuncu vesikalık fotoğrafları (ZIP veya PDF)", required: false },
    { key: "logo", label: "Takım logosu", required: false, hint: "PNG/JPG, kare" },
  ],
  MUZIK: [
    { key: "kimlik", label: "Kimlik fotokopisi (grup için tüm üyeler)", required: true },
    { key: "demo", label: "Demo kayıt (MP3) veya performans videosu bağlantısı", required: true, hint: "Dosya ya da YouTube bağlantısı" },
    { key: "veli", label: "18 yaş altı için veli izin belgesi", required: false },
    { key: "foto", label: "Sanatçı / grup fotoğrafı", required: false },
  ],
  TIYATRO: [
    { key: "metin", label: "Oyun metni (PDF)", required: true },
    { key: "izin", label: "Telif / yazar izin belgesi", required: true, hint: "Telifi serbest eserlerde beyan yeterlidir" },
    { key: "kadro", label: "Oyuncu ve teknik ekip listesi", required: true },
    { key: "kayit", label: "Prova / önceki oyun video kaydı bağlantısı", required: false },
    { key: "afis", label: "Oyun afişi", required: false },
  ],
  YAZARLIK: [
    { key: "metin", label: "Oyun metni (PDF veya Word)", required: true, hint: "Metnin üzerinde adınız olmasın; yalnızca eser adı ve rumuz yazın" },
    { key: "ozgunluk", label: "İmzalı özgünlük beyanı", required: true, hint: "Metnin size ait olduğunu ve daha önce yayımlanmadığını beyan edin" },
    { key: "kimlik", label: "Kimlik fotokopisi", required: true },
    { key: "veli", label: "18 yaş altı için veli izin belgesi", required: false },
  ],
  GONULLU: [
    { key: "kimlik", label: "Kimlik fotokopisi", required: true },
    { key: "belge", label: "Hakemlik / ilk yardım belgesi", required: false, hint: "Varsa" },
    { key: "veli", label: "18 yaş altı için veli izin belgesi", required: false },
  ],
};

export const MAX_UPLOAD_MB = 15;
export const ALLOWED_MIME = [
  "application/pdf", "image/jpeg", "image/png", "image/webp", "application/zip", "application/x-zip-compressed",
  "audio/mpeg", "audio/mp3", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

// ───────────────────────── Müzik & Tiyatro ─────────────────────────

export const MUSIC_GENRES = [
  "Pop", "Rock", "Rap / Hip-Hop", "Türk Halk Müziği", "Türk Sanat Müziği", "Kürtçe Müzik", "Dengbêj",
  "Caz", "Akustik / Folk", "Elektronik", "Klasik", "Arabesk",
];

export const CONTESTANT_STATUS: Record<string, { label: string; tone: string }> = {
  ACTIVE: { label: "Yarışıyor", tone: "fuchsia" },
  FINALIST: { label: "Finalist", tone: "amber" },
  WINNER: { label: "Şampiyon", tone: "yellow" },
  ELIMINATED: { label: "Elendi", tone: "zinc" },
};

export const ROUND_STATUS: Record<string, { label: string; tone: string }> = {
  UPCOMING: { label: "Yaklaşıyor", tone: "slate" },
  LIVE: { label: "Canlı", tone: "red" },
  COMPLETED: { label: "Tamamlandı", tone: "green" },
};

export const THEATRE_GENRES = ["Dram", "Komedi", "Trajikomedi", "Trajedi", "Müzikal", "Çocuk Oyunu", "Doğaçlama", "Dans Tiyatrosu", "Kukla", "Tek Kişilik"];

export const SHOW_STATUS: Record<string, { label: string; tone: string }> = {
  SCHEDULED: { label: "Biletler Ücretsiz", tone: "amber" },
  SOLD_OUT: { label: "Kapasite Doldu", tone: "red" },
  DONE: { label: "Sahnelendi", tone: "zinc" },
  CANCELLED: { label: "İptal", tone: "zinc" },
};

// ───────── Genç Kalemler — oyun yazarlığı yarışması ─────────

export const WRITING_LANGUAGES: Record<string, string> = { TR: "Türkçe", KU: "Kurmancî", ZA: "Zazakî" };
export const WRITING_CATEGORIES: Record<string, string> = { UZUN: "Uzun oyun", KISA: "Kısa oyun", COCUK: "Çocuk oyunu" };
export const WRITING_CATEGORY_HINT: Record<string, string> = { UZUN: "40 dakika ve üzeri", KISA: "10–30 dakika", COCUK: "Çocuklar için, her uzunlukta" };

export const WRITING_STATUS: Record<string, { label: string; tone: string }> = {
  PLANNED: { label: "Yakında", tone: "slate" },
  OPEN: { label: "Başvurular Açık", tone: "rose" },
  JURY: { label: "Jüri Değerlendirmesinde", tone: "amber" },
  FINAL: { label: "Finalistler Açıklandı", tone: "fuchsia" },
  COMPLETED: { label: "Sonuçlandı", tone: "zinc" },
};

export const ENTRY_STATUS: Record<string, { label: string; tone: string; public: boolean }> = {
  SUBMITTED: { label: "Değerlendirmede", tone: "slate", public: false },
  SHORTLIST: { label: "Kısa Liste", tone: "blue", public: true },
  FINALIST: { label: "Finalist", tone: "amber", public: true },
  WINNER: { label: "Birinci", tone: "yellow", public: true },
  MENTION: { label: "Mansiyon", tone: "fuchsia", public: true },
  OUT: { label: "Elendi", tone: "zinc", public: false },
};

export const FESTIVAL_STATUS: Record<string, { label: string; tone: string }> = {
  PLANNED: { label: "Yakında", tone: "amber" },
  ONGOING: { label: "Festival Sürüyor", tone: "red" },
  COMPLETED: { label: "Tamamlandı", tone: "zinc" },
};

// ───────── Haftanın öne çıkanları & Gençliğin Sesi ─────────

export const HIGHLIGHT_KINDS: Record<string, { label: string; short: string; tone: string }> = {
  PLAYER: { label: "Haftanın Oyuncusu", short: "Oyuncu", tone: "emerald" },
  ARTIST: { label: "Haftanın Sanatçısı", short: "Sanatçı", tone: "fuchsia" },
  FAIRPLAY: { label: "Haftanın Centilmenlik Hareketi", short: "Centilmenlik", tone: "amber" },
};

export const POST_KINDS: Record<string, { label: string; tone: string }> = {
  ROPORTAJ: { label: "Röportaj", tone: "sky" },
  KOSE: { label: "Köşe Yazısı", tone: "rose" },
  FOTO: { label: "Fotoğraf", tone: "amber" },
  HABER: { label: "Haber", tone: "emerald" },
};

export const POST_SECTIONS: Record<string, string> = { SPOR: "Spor", MUZIK: "Müzik", TIYATRO: "Tiyatro", YAZARLIK: "Genç Kalemler", GENEL: "Genel" };

export const VOLUNTEER_ROLES: Record<string, string> = {
  HAKEM: "Hakem / Yardımcı Hakem", MASA: "Masa Görevlisi / İstatistik", GONULLU: "Saha & Organizasyon Gönüllüsü",
  SAHNE: "Sahne / Kulis Ekibi", MEDYA: "Fotoğraf & Video", ILKYARDIM: "İlk Yardım",
};

export const ANNOUNCEMENT_CATEGORIES: Record<string, string> = {
  GENEL: "Genel",
  SPOR: "Spor",
  MUZIK: "Müzik",
  TIYATRO: "Tiyatro",
  BASVURU: "Başvuru",
};

export const VENUE_TYPES: Record<string, string> = {
  SAHA: "Açık Saha / Stadyum",
  SALON: "Kapalı Spor Salonu",
  SAHNE: "Sahne / Kültür Merkezi",
  ACIK_HAVA: "Açık Hava Alanı",
};

export const ROLES: Record<string, string> = {
  SUPER_ADMIN: "Süper Yönetici",
  ADMIN: "Yönetici",
  EDITOR: "Editör",
};

export const SCOPES: Record<string, string> = {
  ALL: "Tüm Birimler",
  SPOR: "Spor Birimi",
  MUZIK: "Müzik Birimi",
  TIYATRO: "Tiyatro Birimi",
};
