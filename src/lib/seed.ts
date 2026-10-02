"use client";

/* Demo verisi: yönetim panelinden "Demo verisi yükle" ile Firestore'a yazılır.
   Tarihler yükleme gününe göre ayarlanır (geçmiş maçlar oynanmış, gelecekteki planlanmış görünür). */

import { batchWrite, ref, newRef } from "./admin";
import { buildLeagueSummary } from "./stats";
import { seedExtras } from "./seed-extras";
import { dayKey, slugify } from "./utils";
import type { League, Match, MatchEvent, Team } from "./types";

let seed = 20261002;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const ri = (a: number, b: number) => Math.floor(rnd() * (b - a + 1)) + a;
const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rnd() * arr.length)]!;
const shuffle = <T,>(arr: T[]) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
};

const used = new Set<string>();
const uniq = (base: string) => {
  let s = slugify(base);
  let i = 2;
  while (used.has(s)) s = `${slugify(base)}-${i++}`;
  used.add(s);
  return s;
};

/** Bugüne göre gün kaydırmalı tarih (İstanbul saati) */
const today = dayKey();
const at = (offsetDays: number, time = "12:00") => {
  const base = new Date(`${today}T${time}:00+03:00`);
  return new Date(base.getTime() + offsetDays * 86_400_000);
};
const isoDay = (d: Date) => dayKey(d);

const MALE = ["Ahmet", "Mehmet", "Mustafa", "Yusuf", "Emre", "Baran", "Berat", "Rojhat", "Serhat", "Delil", "Azad", "Furkan", "Eren", "Kerem", "Mert", "Ömer", "Hüseyin", "Ali", "Hasan", "İbrahim", "Burak", "Enes", "Şervan", "Agit", "Mazlum", "Welat", "Ramazan", "Siyar", "Ferhat", "Botan", "Umut", "Doğan", "Cihan", "Barış", "Eyüp", "Halil"];
const FEMALE = ["Zeynep", "Elif", "Ayşe", "Fatma", "Berfin", "Rojda", "Dilan", "Zelal", "Hêvî", "Şilan", "Merve", "Esra", "Büşra", "Sevda", "Nupelda", "Ronahi", "Helin", "Delal", "Beritan", "Medine", "Gülistan", "Selin", "Ecrin", "Nisa", "Hilal", "Rabia", "Melek", "Sinem", "Berivan", "Jiyan", "Asya", "Defne", "Evin", "Leyla"];
const LAST = ["Yılmaz", "Kaya", "Demir", "Aslan", "Çelik", "Akbaş", "Tekin", "Polat", "Özdemir", "Ekinci", "Bulut", "Yıldız", "Kılıç", "Oral", "Duman", "Erdem", "Turan", "Güneş", "Doğru", "Baran", "Ayhan", "Sevim", "Kurt", "Karakaya", "Bozkurt", "Keskin", "Şahin", "Altun", "Ateş", "Koç", "Tunç", "Varol", "Acar", "Akın", "Bingöl", "Dicle", "Fırat", "Zengin"];
const SCHOOLS = ["Ziya Gökalp Anadolu Lisesi", "Diyarbakır Fen Lisesi", "Dicle Üniversitesi", "Cahit Sıtkı Tarancı Lisesi", "Kayapınar Spor Lisesi", "Bağlar Mesleki ve Teknik Anadolu Lisesi", "Sur Anadolu Lisesi", "Ergani Anadolu Lisesi", "Silvan Anadolu Lisesi", "Bismil Anadolu Lisesi"];

const TEAM_POOL: { name: string; short: string; district: string; colors: [string, string] }[] = [
  { name: "Bağlar Gençlik SK", short: "BGL", district: "Bağlar", colors: ["#b91c1c", "#ffffff"] },
  { name: "Kayapınar Yıldızları", short: "KYP", district: "Kayapınar", colors: ["#1d4ed8", "#facc15"] },
  { name: "Sur Kalesi Gençlik", short: "SUR", district: "Sur", colors: ["#111827", "#f59e0b"] },
  { name: "Yenişehir Gençlerbirliği", short: "YGB", district: "Yenişehir", colors: ["#15803d", "#ffffff"] },
  { name: "Hevsel Bahçeleri SK", short: "HEV", district: "Sur", colors: ["#166534", "#bbf7d0"] },
  { name: "Ergani Bakırspor", short: "ERG", district: "Ergani", colors: ["#9a3412", "#fde68a"] },
  { name: "Silvan Malabadi Gençlik", short: "SLV", district: "Silvan", colors: ["#0e7490", "#ffffff"] },
  { name: "Bismil Dicle Spor", short: "BSM", district: "Bismil", colors: ["#1e40af", "#ffffff"] },
  { name: "On Gözlü Köprü SK", short: "OGK", district: "Sur", colors: ["#7c2d12", "#fef3c7"] },
  { name: "Mardinkapı Gençlik", short: "MKP", district: "Sur", colors: ["#6d28d9", "#ffffff"] },
  { name: "Çermik Kaplıca Spor", short: "ÇRM", district: "Çermik", colors: ["#be123c", "#fecdd3"] },
  { name: "Lice Gençlik SK", short: "LCE", district: "Lice", colors: ["#047857", "#fde047"] },
  { name: "Zerzevan Gençlik", short: "ZRZ", district: "Çınar", colors: ["#a16207", "#1c1917"] },
  { name: "Amida Gençlik Kulübü", short: "AMD", district: "Kayapınar", colors: ["#dc2626", "#16a34a"] },
  { name: "Kulp Dağ Kartalları", short: "KLP", district: "Kulp", colors: ["#334155", "#e2e8f0"] },
  { name: "Hazro Gençlik SK", short: "HZR", district: "Hazro", colors: ["#0369a1", "#f0f9ff"] },
];

const SPORTS = [
  { key: "FUTBOL", label: "Futbol", squad: 14, positions: ["Kaleci", "Defans", "Defans", "Defans", "Defans", "Orta Saha", "Orta Saha", "Orta Saha", "Forvet", "Forvet"] },
  { key: "BASKETBOL", label: "Basketbol", squad: 11, positions: ["Oyun Kurucu", "Şutör Guard", "Kısa Forvet", "Uzun Forvet", "Pivot"] },
  { key: "VOLEYBOL", label: "Voleybol", squad: 11, positions: ["Pasör", "Smaçör", "Smaçör", "Orta Oyuncu", "Orta Oyuncu", "Pasör Çaprazı", "Libero"] },
  { key: "HENTBOL", label: "Hentbol", squad: 12, positions: ["Kaleci", "Sol Kanat", "Sol Oyun Kurucu", "Orta Oyun Kurucu", "Sağ Oyun Kurucu", "Sağ Kanat", "Pivot"] },
] as const;

const DEMO_VIDEOS = ["https://www.youtube.com/watch?v=aqz-KE-bpKQ", "https://www.youtube.com/watch?v=eRsGyueVLvQ", "https://www.youtube.com/watch?v=R6MlUcmOul8"];

type Op = { ref: ReturnType<typeof ref>; data: Record<string, unknown> };

export async function seedDemo(onProgress?: (msg: string) => void) {
  seed = 20261002;
  used.clear();
  const ops: Op[] = [];
  const put = (col: string, id: string, data: Record<string, unknown>) => ops.push({ ref: ref(col, id), data });
  const now = new Date();
  onProgress?.("Veriler hazırlanıyor…");

  // Tesisler
  const venueData = [
    ["Diyarbakır Stadyumu Yan Saha", "SAHA", "Bağlar", 3000], ["Seyrantepe Sentetik Çim Sahası", "SAHA", "Yenişehir", 800],
    ["Kayapınar Gençlik Spor Tesisleri", "SAHA", "Kayapınar", 1200], ["Ergani İlçe Stadı", "SAHA", "Ergani", 2500],
    ["Diyarbakır Spor Salonu", "SALON", "Yenişehir", 2500], ["Bağlar Kapalı Spor Salonu", "SALON", "Bağlar", 1000],
    ["Kayapınar Kapalı Spor Salonu", "SALON", "Kayapınar", 1500], ["Cegerxwîn Kültür Merkezi", "SAHNE", "Bağlar", 450],
    ["Sezai Karakoç Kültür Merkezi", "SAHNE", "Yenişehir", 650], ["Sur Dengbêj Evi Avlusu", "ACIK_HAVA", "Sur", 300], ["İçkale Açık Hava Sahnesi", "ACIK_HAVA", "Sur", 1500],
  ] as const;
  const venues = venueData.map(([name, type, district, capacity]) => {
    const id = uniq(name);
    const v = { id, slug: id, name, type, district, capacity, address: `${district} / Diyarbakır`, description: `${district} ilçesinde bulunan, organizasyon etkinliklerine ev sahipliği yapan tesis.` };
    put("venues", id, { ...v, id: undefined });
    return v;
  });
  const fields = venues.filter((v) => v.type === "SAHA");
  const halls = venues.filter((v) => v.type === "SALON");
  const stages = venues.filter((v) => v.type === "SAHNE" || v.type === "ACIK_HAVA");

  // Sezon
  const y = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
  const seasonName = `${y}-${y + 1}`;
  const seasonId = seasonName;
  put("seasons", seasonId, { name: seasonName, startDate: new Date(`${y}-09-01T12:00:00+03:00`), endDate: new Date(`${y + 1}-06-30T12:00:00+03:00`), isActive: true });

  const leagueStart = at(-27, "10:00");
  let playerSeq = 1;
  const allTeams: Team[] = [];

  for (const sport of SPORTS) {
    for (const gender of ["ERKEK", "KADIN"] as const) {
      const gLabel = gender === "ERKEK" ? "Erkekler" : "Kadınlar";
      const leagueId = uniq(`${sport.label} ${gLabel} Ligi ${seasonName}`);
      const league: League = {
        id: leagueId, slug: leagueId, name: `${sport.label} ${gLabel} Gençlik Ligi`, sport: sport.key, gender, ageGroup: sport.key === "FUTBOL" ? "U-21" : "U-19",
        status: "ONGOING", seasonId, seasonName, seasonActive: true, entries: [],
        description: `Diyarbakır genelindeki ${gender === "ERKEK" ? "erkek" : "kadın"} gençlik ${sport.label.toLowerCase()} takımlarının mücadele ettiği ${seasonName} sezonu ligi.`,
        rules: "Maçlar federasyon kurallarına göre oynanır.\nHer takım maç saatinden 30 dakika önce lisans kontrolü için hazır bulunur.\nÜst üste iki maça çıkmayan takım ligden ihraç edilir.\nSportmenlik dışı davranışlar disiplin kuruluna sevk edilir.",
      };
      const teams: Team[] = [];
      const squads = new Map<string, { id: string; name: string; position: string }[]>();
      for (const t of shuffle(TEAM_POOL).slice(0, 6)) {
        const suffix = gender === "KADIN" ? " Kadın" : "";
        const tid = uniq(`${t.name} ${sport.label}${suffix}`);
        const venue = sport.key === "FUTBOL" ? pick(fields) : pick(halls);
        const team: Team = {
          id: tid, slug: tid, name: `${t.name}${suffix}`, shortName: t.short, sport: sport.key, gender, district: t.district, logoUrl: null,
          primaryColor: t.colors[0], secondaryColor: t.colors[1], foundedYear: ri(2008, 2024),
          coachName: `${pick(gender === "ERKEK" ? MALE : FEMALE)} ${pick(LAST)}`, managerName: `${pick(MALE)} ${pick(LAST)}`,
          description: `${t.district} ilçesinin gençlerinden oluşan ${t.name}, ${sport.label.toLowerCase()} branşında şehrin iddialı ekiplerinden biri.`,
          status: "ACTIVE", venueId: venue.id, venueName: venue.name, leagueIds: [leagueId],
        };
        teams.push(team);
        allTeams.push(team);
        league.entries.push({ teamId: tid, penaltyPoints: 0 });
        put("teams", tid, { ...team, id: undefined });
        const sq: { id: string; name: string; position: string }[] = [];
        for (let n = 0; n < sport.squad; n++) {
          const first = pick(gender === "ERKEK" ? MALE : FEMALE), last = pick(LAST);
          const pos = n === 0 && (sport.key === "FUTBOL" || sport.key === "HENTBOL") ? "Kaleci" : pick(sport.positions);
          const pid = uniq(`${first} ${last}`);
          sq.push({ id: pid, name: `${first} ${last}`, position: pos });
          put("players", pid, {
            slug: pid, firstName: first, lastName: last, gender, sport: sport.key, teamId: tid, position: pos,
            birthDate: `${y - ri(16, 22)}-${String(ri(1, 12)).padStart(2, "0")}-${String(ri(1, 28)).padStart(2, "0")}`,
            jerseyNumber: n === 0 ? 1 : ri(2, 99),
            heightCm: gender === "ERKEK" ? ri(168, sport.key === "BASKETBOL" || sport.key === "VOLEYBOL" ? 205 : 192) : ri(158, sport.key === "BASKETBOL" || sport.key === "VOLEYBOL" ? 190 : 178),
            weightKg: gender === "ERKEK" ? ri(60, 92) : ri(50, 75), strongSide: pick(["Sağ", "Sağ", "Sağ", "Sol", "Her ikisi"]),
            district: t.district, school: pick(SCHOOLS), licenseNo: `DGO-${String(playerSeq++).padStart(5, "0")}`, isCaptain: n === 1,
            status: rnd() < 0.05 ? "INJURED" : "ACTIVE", photoUrl: null,
            bio: `${t.district} doğumlu, takımının ${pos.toLowerCase()} pozisyonundaki önemli isimlerinden.`, createdAt: now,
          });
        }
        squads.set(tid, sq);
      }

      // Fikstür (çift devre)
      const ids = teams.map((t) => t.id);
      const rounds: [string, string][][] = [];
      const arr = [...ids];
      for (let r = 0; r < arr.length - 1; r++) {
        const pairs: [string, string][] = [];
        for (let i = 0; i < arr.length / 2; i++) pairs.push(r % 2 === 0 ? [arr[i]!, arr[arr.length - 1 - i]!] : [arr[arr.length - 1 - i]!, arr[i]!]);
        rounds.push(pairs);
        arr.splice(1, 0, arr.pop()!);
      }
      const all = [...rounds, ...rounds.map((p) => p.map(([a, b]) => [b, a] as [string, string]))];
      const matches: Match[] = [];
      const tmap = new Map(teams.map((t) => [t.id, t]));
      const tref = (t: Team) => ({ slug: t.slug, name: t.name, shortName: t.shortName, logoUrl: null, primaryColor: t.primaryColor, secondaryColor: t.secondaryColor });

      for (let r = 0; r < all.length; r++) {
        const roundDate = new Date(leagueStart.getTime() + (r * 7 + (gender === "KADIN" ? 1 : 0)) * 86_400_000);
        for (let i = 0; i < all[r]!.length; i++) {
          const [home, away] = all[r]![i]!;
          const date = new Date(roundDate.getTime() + i * 2 * 3_600_000);
          const finished = date < now;
          const homeTeam = tmap.get(home)!, awayTeam = tmap.get(away)!;
          let hs: number | null = null, as: number | null = null, periodScores: string | null = null;
          if (finished) {
            if (sport.key === "FUTBOL") { hs = ri(0, 4); as = ri(0, 3); periodScores = `${ri(0, hs)}-${ri(0, as)}`; }
            if (sport.key === "BASKETBOL") { hs = ri(52, 88); as = ri(50, 86); if (hs === as) hs += 3; }
            if (sport.key === "HENTBOL") { hs = ri(18, 34); as = ri(17, 33); }
            if (sport.key === "VOLEYBOL") {
              const winnerHome = rnd() < 0.55, loserSets = ri(0, 2);
              hs = winnerHome ? 3 : loserSets; as = winnerHome ? loserSets : 3;
              const sets: string[] = [];
              let h = 0, a = 0;
              while (h < hs || a < as) {
                const homeWinsSet = (h < hs && a >= as) || (h < hs && rnd() < 0.5);
                const last = h + a === 4;
                const win = last ? 15 : 25, lose = ri(last ? 8 : 15, (last ? 15 : 25) - 2);
                sets.push(homeWinsSet ? `${win}-${lose}` : `${lose}-${win}`);
                if (homeWinsSet) h++; else a++;
              }
              periodScores = sets.join(", ");
            }
          }
          const events: MatchEvent[] = [];
          if (finished) {
            const sq = (tid: string) => squads.get(tid)!;
            const ev = (tid: string, p: { id: string; name: string }, type: string, value = 1, minute: number | null = null) =>
              events.push({ id: `${events.length}`, teamId: tid, playerId: p.id, playerName: p.name, type, value, minute });
            const add = (tid: string, type: string, minute: number | null = null) => {
              const list = sq(tid).filter((p) => p.position !== "Kaleci");
              ev(tid, pick(list.length ? list : sq(tid)), type, 1, minute);
            };
            for (const [tid, score] of [[home, hs!], [away, as!]] as const) {
              if (sport.key === "FUTBOL") {
                for (let g = 0; g < score; g++) { add(tid, rnd() < 0.12 ? "PENALTY_GOAL" : "GOAL", ri(1, 90)); if (rnd() < 0.7) add(tid, "ASSIST"); }
                for (let k = 0; k < ri(0, 3); k++) add(tid, "YELLOW_CARD", ri(10, 90));
                if (rnd() < 0.08) add(tid, "RED_CARD", ri(40, 90));
              }
              if (sport.key === "BASKETBOL") {
                const scorers = shuffle(sq(tid)).slice(0, ri(5, 8));
                let left = score;
                scorers.forEach((p, idx) => {
                  const pts = idx === scorers.length - 1 ? left : Math.min(left, ri(2, Math.max(2, Math.round(score / 3))));
                  left -= pts;
                  if (pts > 0) ev(tid, p, "POINTS", pts);
                  if (pts > 6 && rnd() < 0.6) ev(tid, p, "THREE_POINT", ri(1, 4));
                  ev(tid, p, "REBOUND", ri(1, 11));
                  if (rnd() < 0.6) ev(tid, p, "ASSIST", ri(1, 7));
                });
              }
              if (sport.key === "VOLEYBOL") {
                shuffle(sq(tid).filter((p) => p.position !== "Libero")).slice(0, 6).forEach((p) => {
                  ev(tid, p, "POINTS", ri(2, 9) + score * 2);
                  if (rnd() < 0.5) ev(tid, p, "ACE", ri(1, 3));
                  if (rnd() < 0.5) ev(tid, p, "BLOCK", ri(1, 4));
                });
              }
              if (sport.key === "HENTBOL") {
                const scorers = shuffle(sq(tid).filter((p) => p.position !== "Kaleci")).slice(0, ri(5, 7));
                let left = score;
                scorers.forEach((p, idx) => {
                  const g = idx === scorers.length - 1 ? left : Math.min(left, ri(1, Math.max(1, Math.round(score / 3))));
                  left -= g;
                  if (g > 0) ev(tid, p, "GOAL", g);
                  if (rnd() < 0.5) ev(tid, p, "ASSIST", ri(1, 5));
                });
                const gk = sq(tid).find((p) => p.position === "Kaleci");
                if (gk) ev(tid, gk, "SAVE", ri(6, 16));
                for (let k = 0; k < ri(0, 3); k++) add(tid, "SUSPENSION", ri(5, 60));
              }
            }
          }
          const top = events.filter((e) => ["GOAL", "PENALTY_GOAL", "POINTS"].includes(e.type)).sort((a, b) => b.value - a.value)[0];
          const venue = venues.find((v) => v.id === homeTeam.venueId);
          const mref = newRef("matches");
          const match: Match = {
            id: mref.id, leagueId, leagueName: league.name, leagueSlug: leagueId, sport: sport.key, gender, round: r + 1,
            homeTeamId: home, awayTeamId: away, teamIds: [home, away], home: tref(homeTeam), away: tref(awayTeam), date,
            venueId: venue?.id ?? null, venueName: venue?.name ?? null, status: finished ? "FINISHED" : "SCHEDULED", homeScore: hs, awayScore: as, periodScores,
            referee: `${pick(MALE)} ${pick(LAST)}`, attendance: finished ? ri(80, 900) : null, youtubeUrl: finished && rnd() < 0.45 ? pick(DEMO_VIDEOS) : null,
            summary: finished ? "Tribünlerin dolduğu karşılaşmada iki takım da centilmence bir mücadele ortaya koydu." : null,
            mvpPlayerId: top?.playerId ?? null, mvpName: top?.playerName ?? null, events, playerIds: [...new Set(events.map((e) => e.playerId!))],
          };
          matches.push(match);
          ops.push({ ref: mref, data: { ...match, id: undefined } });
        }
      }
      const summary = buildLeagueSummary(league, teams, matches);
      put("leagues", leagueId, { ...league, id: undefined, summary: JSON.parse(JSON.stringify({ ...summary, updatedAt: null })), createdAt: now });

    }
  }

  // Başvuru dönemleri
  const docsSpor = [
    { key: "kimlik", label: "Oyuncu kimlik fotokopileri (tek PDF)", required: true, hint: "Tüm oyuncuların nüfus cüzdanı ön yüzü" },
    { key: "saglik", label: "Sağlık raporu / “spor yapmasında sakınca yoktur” belgesi", required: true },
    { key: "veli", label: "18 yaş altı oyuncular için veli muvafakatnamesi", required: true },
    { key: "logo", label: "Takım logosu", required: false, hint: "PNG/JPG, kare" },
  ];
  const futbolErkek = `futbol-erkekler-ligi-${slugify(seasonName)}`;
  const periods = [
    { id: "bahar-futbol-takim-basvurusu", title: "Bahar Dönemi Futbol Ligleri Takım Başvurusu", category: "SPOR", sport: "FUTBOL", gender: null, leagueId: futbolErkek, leagueName: "Futbol Erkekler Gençlik Ligi", startDate: at(-12), endDate: at(29, "23:59"),
      summary: "Erkek ve kadın U-21 futbol liglerinin bahar dönemi için yeni takım başvuruları alınıyor.",
      description: "Diyarbakır'ın tüm ilçelerinden mahalle takımları, okul takımları ve amatör kulüpler başvurabilir. Başvurular organizasyon komitesince incelenir; uygun bulunan takımlar kura çekimine davet edilir.",
      requirements: "Takım en az 14, en fazla 25 lisanslı oyuncudan oluşmalıdır.\nOyuncular 15-21 yaş aralığında olmalıdır.\nTüm oyuncuların Diyarbakır'da ikamet etmesi veya eğitim görmesi gerekir.\nTakımın 18 yaşını doldurmuş bir sorumlusu ve bir antrenörü bulunmalıdır.\nKatılım ücretsizdir; forma ve ekipman takımın sorumluluğundadır.\nBir oyuncu aynı sezonda yalnızca bir takımda oynayabilir.",
      requiredDocuments: docsSpor, minMembers: 14, maxMembers: 25, minAge: 15, maxAge: 21, quota: 24, fee: "Ücretsiz", contactInfo: "Spor Koordinasyon Birimi" },
    { id: "kadin-voleybol-basketbol-ek-kontenjan", title: "Kadın Voleybol & Basketbol Ek Kontenjan Başvurusu", category: "SPOR", sport: "VOLEYBOL", gender: "KADIN", startDate: at(-7), endDate: at(13, "23:59"),
      summary: "Kadın liglerine katılımı artırmak için voleybol ve basketbolda 4'er takımlık ek kontenjan açıldı.",
      requirements: "Takım en az 10 oyuncudan oluşmalıdır.\nOyuncular 14-19 yaş aralığında olmalıdır.\nSalon ve ulaşım desteği organizasyon tarafından sağlanır.",
      requiredDocuments: docsSpor, minMembers: 10, maxMembers: 15, minAge: 14, maxAge: 19, quota: 8, fee: "Ücretsiz" },
    { id: "genc-sesler-on-basvuru", title: "Genç Sesler Müzik Yarışması Yeni Sezon Ön Başvurusu", category: "MUZIK", startDate: at(30), endDate: at(74, "23:59"),
      summary: "Solo sanatçılar ve müzik grupları için yeni sezon ön başvuruları yakında açılıyor.",
      description: "Pop, rock, rap, halk müziği, dengbêj ve daha fazlası… Tüm türlere açık yarışmada ön elemeyi geçen yarışmacılar canlı sahnede jüri karşısına çıkar.",
      requirements: "15-25 yaş arası olmak.\nGruplarda üye sayısı en fazla 6 kişi olabilir.\nEn az bir özgün beste veya yorum içeren 3 dakikalık demo kaydı gönderilmelidir.\nDaha önce profesyonel albüm yayımlamış olmamak.",
      requiredDocuments: [{ key: "kimlik", label: "Kimlik fotokopisi (grup için tüm üyeler)", required: true }, { key: "demo", label: "Demo kayıt (MP3)", required: true, hint: "En fazla 5 MB" }, { key: "foto", label: "Sanatçı / grup fotoğrafı", required: false }],
      minMembers: 1, maxMembers: 6, minAge: 15, maxAge: 25, quota: 32, fee: "Ücretsiz" },
    { id: "tiyatro-festivali-topluluk-basvurusu", title: "Gençlik Tiyatro Festivali Topluluk Başvurusu", category: "TIYATRO", startDate: at(-17), endDate: at(59, "23:59"),
      summary: "Okul, üniversite ve amatör gençlik tiyatro toplulukları festival programı için oyunlarıyla başvurabilir.",
      description: "Seçilen oyunlar festival boyunca şehrin farklı sahnelerinde sahnelenecek, jüri değerlendirmesi sonucunda ödüller verilecektir.",
      requirements: "Topluluk üyelerinin %70'i 14-26 yaş aralığında olmalıdır.\nOyun süresi 40-110 dakika arasında olmalıdır.\nTelifli eserler için yazar/temsilci izni zorunludur.\nHer topluluk en fazla bir oyunla başvurabilir.",
      requiredDocuments: [{ key: "metin", label: "Oyun metni (PDF)", required: true }, { key: "izin", label: "Telif / yazar izin belgesi", required: true, hint: "Telifi serbest eserlerde beyan yeterlidir" }, { key: "kadro", label: "Oyuncu ve teknik ekip listesi", required: true }, { key: "afis", label: "Oyun afişi", required: false }],
      minMembers: 3, maxMembers: 30, minAge: 14, maxAge: 26, quota: 12, fee: "Ücretsiz" },
    { id: "genc-kalemler-oyun-yazarligi-basvurusu", title: "Genç Kalemler Oyun Yazarlığı Yarışması Başvurusu", category: "YAZARLIK", startDate: at(-5), endDate: at(45, "23:59"),
      summary: "15-26 yaş arası gençler Türkçe, Kurmancî veya Zazakî yazdıkları özgün tiyatro metinleriyle başvurabilir.",
      description: "Her dil kendi jürisiyle ayrı değerlendirilir. Finalist metinler festivalde okuma tiyatrosu olarak sahnelenir, birinci olan metin bir sonraki festivalde sahnelenir.",
      requirements: "15-26 yaş arası olmak.\nMetin özgün olmalı ve daha önce yayımlanmamış ya da sahnelenmemiş olmalıdır.\nMetin Türkçe, Kurmancî veya Zazakî yazılabilir.\nMetnin üzerinde yazarın adı bulunmamalı; yalnızca eser adı ve rumuz yazılmalıdır.\nHer yazar en fazla bir metinle başvurabilir.",
      requiredDocuments: [{ key: "metin", label: "Oyun metni (PDF veya Word)", required: true, hint: "Metnin üzerinde adınız olmasın; yalnızca eser adı ve rumuz yazın" }, { key: "ozgunluk", label: "İmzalı özgünlük beyanı", required: true }, { key: "kimlik", label: "Kimlik fotokopisi", required: true }, { key: "veli", label: "18 yaş altı için veli izin belgesi", required: false }],
      minMembers: 1, maxMembers: 3, minAge: 15, maxAge: 26, fee: "Ücretsiz", contactInfo: "Tiyatro Koordinasyon Birimi" },
    { id: "basketbol-hentbol-takim-basvurusu", title: "Sezon Başı Basketbol & Hentbol Takım Başvurusu", category: "SPOR", sport: "BASKETBOL", startDate: at(-90), endDate: at(-40, "23:59"),
      summary: "Sezon başı takım başvuruları tamamlandı.", requirements: "Takım en az 10 oyuncudan oluşmalıdır.", requiredDocuments: docsSpor, minMembers: 10, maxMembers: 16, minAge: 14, maxAge: 19, fee: "Ücretsiz" },
  ];
  for (const p of periods) put("periods", p.id, { ...p, id: undefined, slug: p.id, isPublished: true, createdAt: now });

  // Müzik yarışması
  const compId = `genc-sesler-${y}`;
  put("musicCompetitions", compId, {
    slug: compId, name: "Genç Sesler", edition: String(y), isCurrent: true, status: "ONGOING", votingOpen: true, createdAt: now,
    tagline: "Sahne senin. Ses senin. Diyarbakır seni dinliyor.",
    description: "Diyarbakır'ın genç yeteneklerini keşfetmek için düzenlenen, tüm müzik türlerine açık şehir çapında yarışma. Jüri puanı (%70) ve halk oylaması (%30) ile sonuçlar belirlenir.",
    prizes: "Birincilik: Profesyonel stüdyoda 3 şarkılık EP kaydı + 50.000 ₺ burs\nİkincilik: Klip çekimi + 30.000 ₺ burs\nÜçüncülük: Enstrüman seti + 20.000 ₺ burs\nHalkın Favorisi: Yaz konserinde açılış performansı",
    jury: [["Aynur Dicle", "Ses Eğitmeni & Sanatçı"], ["Mehmet Ali Fırat", "Müzik Prodüktörü"], ["Zelal Tekin", "Dengbêj Kültürü Araştırmacısı"], ["Can Bozkurt", "Konservatuvar Öğretim Görevlisi"]].map(([name, title]) => ({ name, title, bio: `${title} olarak uzun yıllardır genç müzisyenlerle çalışıyor.` })),
  });
  const cdata: [string, "SOLO" | "GRUP", string, string][] = [
    ["Berfin Aslan", "SOLO", "Pop", "Bağlar"], ["Kom Dicle", "GRUP", "Kürtçe Müzik", "Sur"], ["Azad Yıldız", "SOLO", "Rap / Hip-Hop", "Kayapınar"],
    ["Bazalt", "GRUP", "Rock", "Yenişehir"], ["Rojda Ekinci", "SOLO", "Dengbêj", "Lice"], ["Hevsel Akustik", "GRUP", "Akustik / Folk", "Sur"],
    ["Elif Kaya", "SOLO", "Türk Sanat Müziği", "Ergani"], ["Delil Bulut", "SOLO", "Türk Halk Müziği", "Silvan"], ["Sur Beats", "GRUP", "Elektronik", "Kayapınar"],
    ["Helin Polat", "SOLO", "Caz", "Yenişehir"], ["Mazlum Oral", "SOLO", "Arabesk", "Bismil"], ["Dengê Ciwan", "GRUP", "Kürtçe Müzik", "Bağlar"],
    ["Zeynep Turan", "SOLO", "Pop", "Çermik"], ["Kırklar Dağı", "GRUP", "Rock", "Sur"], ["Siyar Keskin", "SOLO", "Klasik", "Kayapınar"], ["Nupelda Acar", "SOLO", "Akustik / Folk", "Hani"],
  ];
  const contestants = cdata.map(([name, type, genre, district]) => {
    const id = uniq(name);
    return { id, name, type, genre, district, status: "ACTIVE" as string,
      members: type === "GRUP" ? [{ name: `${pick(MALE)} ${pick(LAST)}`, role: "Vokal" }, { name: `${pick(FEMALE)} ${pick(LAST)}`, role: "Gitar" }, { name: `${pick(MALE)} ${pick(LAST)}`, role: "Bateri" }, { name: `${pick(MALE)} ${pick(LAST)}`, role: "Bas Gitar" }] : [],
      bio: type === "GRUP" ? `${district}'dan bir araya gelen ${genre.toLowerCase()} grubu; özgün besteleriyle dikkat çekiyor.` : `${district} doğumlu genç ${genre.toLowerCase()} yorumcusu. Müziğe küçük yaşta mahalle düğünlerinde başladı.` };
  });
  const SONGS = ["Dersim Dört Dağ İçinde", "Leylim Ley", "Bir Ömür Yetmez", "Rindamin", "Ez Kevokim", "Uzun İnce Bir Yoldayım", "Bilmem Ki", "Sarı Gelin", "Lorke", "Ben Seni Sevduğumi", "Bêriya Te", "Yalnızlık Senfonisi", "Gesi Bağları", "Zalım", "Dilo", "Hey Gidi Diyarbakır"];
  const perf = (c: (typeof contestants)[number], song: string, order: number, extra: Record<string, unknown> = {}) => ({ contestantId: c.id, contestantName: c.name, contestantSlug: c.id, songTitle: song, order, advanced: false, ...extra });
  const score = () => { const j = ri(55, 97), p = ri(30, 99); return { juryScore: j, publicScore: p, totalScore: Math.round((j * 0.7 + p * 0.3) * 10) / 10 }; };
  const r1 = contestants.map((c, i) => ({ c, s: score(), song: SONGS[i % SONGS.length]! })).sort((a, b) => b.s.totalScore - a.s.totalScore);
  const r2 = r1.slice(0, 8).map((x, i) => ({ c: x.c, s: score(), song: SONGS[(i + 7) % SONGS.length]! })).sort((a, b) => b.s.totalScore - a.s.totalScore);
  const semi = r2.slice(0, 4);
  const roundDocs = [
    { name: "Ön Eleme", order: 1, date: at(-20, "19:00"), venue: stages[0]!, status: "COMPLETED", advanceCount: 8, youtubeUrl: DEMO_VIDEOS[1], description: "16 yarışmacı sahneye çıktı, 8 yarışmacı çeyrek finale yükseldi.",
      performances: r1.map((x, i) => perf(x.c, x.song, i + 1, { ...x.s, rank: i + 1, advanced: i < 8, juryComment: i < 8 ? "Sahne hâkimiyeti ve ses rengi çok etkileyici." : "Potansiyel çok yüksek, tekniğin üzerine çalışmaya devam!" })) },
    { name: "Çeyrek Final", order: 2, date: at(-6, "19:00"), venue: stages[1]!, status: "COMPLETED", advanceCount: 4, youtubeUrl: DEMO_VIDEOS[2], description: "Yarışmacılar bu turda kendi seçtikleri bir halk ezgisini yorumladı.",
      performances: r2.map((x, i) => perf(x.c, x.song, i + 1, { ...x.s, rank: i + 1, advanced: i < 4, youtubeUrl: i < 2 ? DEMO_VIDEOS[0] : null })) },
    { name: "Yarı Final", order: 3, date: at(8, "19:30"), venue: stages[1]!, status: "UPCOMING", advanceCount: 2, description: "Dört yarışmacı canlı orkestra eşliğinde sahne alacak.",
      performances: semi.map((x, i) => perf(x.c, SONGS[(i + 3) % SONGS.length]!, i + 1)) },
    { name: "Büyük Final", order: 4, date: at(22, "20:00"), venue: stages[3]!, status: "UPCOMING", advanceCount: null, description: "İçkale Açık Hava Sahnesi'nde, binlerce kişinin önünde büyük final gecesi!", performances: [] },
  ];
  for (const r of roundDocs) {
    const { venue, ...rest } = r;
    ops.push({ ref: newRef("musicRounds"), data: { ...rest, competitionId: compId, venueId: venue.id, venueName: venue.name } });
  }
  for (const c of contestants) {
    const elim = !semi.some((s) => s.c.id === c.id);
    put("musicContestants", c.id, { slug: c.id, competitionId: compId, name: c.name, type: c.type, genre: c.genre, district: c.district, members: c.members, bio: c.bio, status: elim ? "ELIMINATED" : "ACTIVE", photoUrl: null, instagram: null, youtubeUrl: null, createdAt: now });
  }
  semi.forEach((s, i) => {
    for (let k = 0; k < 40 - i * 7; k++) put("votes", `demo${i}-${k}_${today}`, { contestantId: s.c.id, uid: `demo${i}-${k}`, day: today, createdAt: now });
  });

  // Tiyatro festivali
  const festId = `genclik-tiyatro-festivali-${y}`;
  put("theatreFestivals", festId, {
    slug: festId, name: "Diyarbakır Gençlik Tiyatro Festivali", edition: "3.", isCurrent: true, status: "ONGOING",
    theme: "Surların Ardındaki Hikâyeler", tagline: "Perde açılıyor: 8 topluluk, 7 gün, 5 sahne",
    description: "Şehrin dört bir yanından gençlik tiyatro topluluklarının oyunlarını sahnelediği, atölyeler, söyleşiler ve sokak gösterileriyle süren bir haftalık festival.",
    startDate: at(-3), endDate: at(3, "23:00"), awards: [],
    workshops: [
      { id: "w1", title: "Beden ve Ses Atölyesi", instructor: "Barış Kılıç", date: at(-2, "11:00"), location: "Cegerxwîn Kültür Merkezi — Prova Salonu" },
      { id: "w2", title: "Dengbêj Geleneğinden Sahneye: Anlatıcılık", instructor: "Zelal Tekin", date: at(0, "14:00"), location: "Sur Dengbêj Evi" },
      { id: "w3", title: "Genç Oyun Yazarlığı", instructor: "Esra Güneş", date: at(1, "11:00"), location: "Sezai Karakoç Kültür Merkezi" },
      { id: "w4", title: "Söyleşi: Şehirde Tiyatro Yapmak", instructor: "Festival Jürisi", date: at(2, "16:00"), location: "İçkale Açık Hava Sahnesi" },
    ],
  });
  const groupsData = [
    ["Sur Sahne Topluluğu", "Sur", "Rojda Aslan"], ["Dicle Üniversitesi Tiyatro Kulübü", "Yenişehir", "Barış Kılıç"], ["Bağlar Gençlik Tiyatrosu", "Bağlar", "Dilan Erdem"],
    ["Kayapınar Doğaçlama Atölyesi", "Kayapınar", "Cihan Varol"], ["Ergani Halk Sahnesi", "Ergani", "Esra Güneş"], ["Silvan Perde Topluluğu", "Silvan", "Ferhat Ateş"],
    ["Ziya Gökalp Lisesi Drama", "Yenişehir", "Sevda Koç"], ["Hevsel Çocuk Tiyatrosu", "Sur", "Agit Tunç"],
  ] as const;
  const playsData = [
    ["Mem û Zîn", "Ehmedê Xanî (uyarlama)", "Dram", 80, "Kürtçe"], ["Kamyon", "Topluluk uyarlaması", "Trajikomedi", 70, "Türkçe"], ["Bir Delinin Hatıra Defteri", "Nikolay Gogol", "Tek Kişilik", 55, "Türkçe"],
    ["Sokakta Doğaçlama", "Topluluk", "Doğaçlama", 60, "Türkçe"], ["Bakır Ustası", "Esra Güneş", "Dram", 90, "Türkçe"], ["Köprüdeki Kız", "Ferhat Ateş", "Komedi", 75, "Türkçe"],
    ["Yaşar Ne Yaşar Ne Yaşamaz", "Aziz Nesin", "Komedi", 95, "Türkçe"], ["Masal Ağacı", "Agit Tunç", "Çocuk Oyunu", 45, "Türkçe & Kürtçe"],
  ] as const;
  let firstGroup = "";
  groupsData.forEach(([gname, district, director], i) => {
    const gid = uniq(gname);
    if (!firstGroup) firstGroup = gid;
    put("theatreGroups", gid, { slug: gid, name: gname, district, director, foundedYear: ri(2010, 2023), memberCount: ri(8, 30), logoUrl: null, description: `${district} merkezli ${gname}, gençlerin sahne sanatlarıyla buluştuğu köklü bir topluluk.` });
    const [title, playwright, genre, duration, language] = playsData[i]!;
    const pid = uniq(title);
    const day = new Date(at(-3, i % 2 === 0 ? "19:00" : "15:00").getTime() + Math.floor(i * 0.85) * 86_400_000);
    const shows = [{ id: `s${i}a`, date: day, venueId: stages[i % stages.length]!.id, venueName: stages[i % stages.length]!.name, ticketInfo: "Ücretsiz", status: day < now ? "DONE" : i === 6 ? "SOLD_OUT" : "SCHEDULED" }];
    if (i % 3 === 0) {
      const d2 = new Date(day.getTime() + 86_400_000);
      shows.push({ id: `s${i}b`, date: d2, venueId: stages[(i + 1) % stages.length]!.id, venueName: stages[(i + 1) % stages.length]!.name, ticketInfo: "Ücretsiz", status: d2 < now ? "DONE" : "SCHEDULED" });
    }
    put("theatrePlays", pid, {
      slug: pid, festivalId: festId, groupId: gid, groupName: gname, groupSlug: gid, title, playwright, director, genre, durationMin: duration, language,
      ageLimit: genre === "Çocuk Oyunu" ? "Genel İzleyici" : "+12", posterUrl: null,
      synopsis: `${title}, ${genre.toLowerCase()} türünde, gençlerin gözünden şehrin ve insanın hikâyesini anlatan bir oyun. Topluluk bu yapımı festival için aylarca hazırladı.`,
      cast: Array.from({ length: ri(3, 7) }, (_, k) => ({ name: `${pick(rnd() < 0.5 ? MALE : FEMALE)} ${pick(LAST)}`, role: `Karakter ${k + 1}` })),
      youtubeUrl: i < 3 ? DEMO_VIDEOS[i % 3] : null, inCompetition: genre !== "Çocuk Oyunu", shows, createdAt: now,
    });
  });
  const prevId = `genclik-tiyatro-festivali-${y - 1}`;
  const prevPlay = uniq("Dağkapı Hikâyeleri");
  put("theatrePlays", prevPlay, { slug: prevPlay, festivalId: prevId, groupId: firstGroup, groupName: "Sur Sahne Topluluğu", groupSlug: firstGroup, title: "Dağkapı Hikâyeleri", playwright: "Topluluk", director: "Rojda Aslan", genre: "Dram", durationMin: 70, language: "Türkçe", cast: [], shows: [], inCompetition: true, createdAt: now });
  put("theatreFestivals", prevId, {
    slug: prevId, name: "Diyarbakır Gençlik Tiyatro Festivali", edition: "2.", isCurrent: false, status: "COMPLETED", theme: "Kapılar",
    startDate: at(-360), endDate: at(-354), description: "İkinci festivalde 6 topluluk 9 gösterim gerçekleştirdi.", workshops: [],
    awards: [
      { id: "a1", category: "En İyi Oyun", winner: "Dağkapı Hikâyeleri — Sur Sahne Topluluğu", playId: prevPlay },
      { id: "a2", category: "En İyi Kadın Oyuncu", winner: "Dilan Erdem" }, { id: "a3", category: "En İyi Erkek Oyuncu", winner: "Cihan Varol" },
      { id: "a4", category: "En İyi Reji", winner: "Rojda Aslan" }, { id: "a5", category: "Seyirci Ödülü", winner: "Kayapınar Doğaçlama Atölyesi" },
    ],
  });

  // Genç Kalemler — oyun yazarlığı yarışması
  const step = (title: string, d: number | null, text: string) => ({ title, date: d == null ? null : at(d, "12:00"), text });
  put("writingContests", `genc-kalemler-${y}`, {
    slug: `genc-kalemler-${y}`, name: "Genç Kalemler", edition: "2.", isCurrent: true, status: "OPEN", deadline: at(45, "23:59"), minAge: 15, maxAge: 26,
    tagline: "15-26 yaş arası gençler Türkçe, Kurmancî veya Zazakî yazdıkları özgün tiyatro metinleriyle katılabilir. Kazanan metin bir sonraki festivalde sahnelenir.",
    description: "Genç Kalemler, şehrin genç yazarlarını tiyatro sahnesiyle buluşturmak için düzenlenen oyun yazarlığı yarışmasıdır. Her dil kendi jürisiyle ayrı değerlendirilir.",
    rules: "Metin özgün olmalı, daha önce yayımlanmamış ve sahnelenmemiş olmalıdır.\nMetnin üzerinde yazarın adı bulunmamalı; yalnızca eser adı ve rumuz yazılmalıdır.\nUzun oyunlar 40 dakika ve üzeri, kısa oyunlar 10-30 dakika olmalıdır.\nOrtak yazılan metinlerde en fazla üç yazar olabilir.\nJüri kararları kesindir; dereceye giren metinlerin ilk sahneleme hakkı organizasyona aittir.",
    prizes: ["Her dilde birinci olan metin festivalde sahnelenir", "Finalist metinler Genç Kalemler kitabında yayımlanır", "Dereceye girenlere yazarlık atölyesi bursu"],
    timeline: [step("Başvurular", 45, "Son başvuru tarihine kadar metinler kabul edilir"), step("Kısa liste", 75, "Her dilde kısa liste açıklanır"), step("Okuma tiyatrosu", 100, "Finalist metinler sahnede okunur"), step("Ödül töreni", 106, "Festival kapanış gecesi")],
    jury: [
      { name: "Berivan Kaya", title: "Oyun yazarı", language: "TR" }, { name: "Murat Demir", title: "Dramaturg", language: "TR" },
      { name: "Hêvî Zana", title: "Yazar, çevirmen", language: "KU" }, { name: "Serhat Bozkurt", title: "Tiyatro yönetmeni", language: "KU" },
      { name: "Roşan Hayig", title: "Şair", language: "ZA" }, { name: "Kemal Astare", title: "Oyun yazarı", language: "ZA" },
    ],
    entries: [], youtubeUrl: null, createdAt: now,
  });
  put("writingContests", `genc-kalemler-${y - 1}`, {
    slug: `genc-kalemler-${y - 1}`, name: "Genç Kalemler", edition: "1.", isCurrent: false, status: "COMPLETED", deadline: at(-320, "23:59"), minAge: 15, maxAge: 26,
    tagline: "İlk Genç Kalemler yarışmasına 3 dilde 41 metin katıldı.", prizes: [], timeline: [], jury: [], youtubeUrl: DEMO_VIDEOS[2], createdAt: now,
    entries: [
      { id: "e1", title: "Sûr û Bajar", author: "Zelal Aydın", language: "KU", category: "UZUN", status: "WINNER", synopsis: "Surların içindeki eski bir evde üç kuşağın vedalaşması." },
      { id: "e2", title: "Son Otobüs", author: "Emre Kılıç", language: "TR", category: "KISA", status: "WINNER", synopsis: "Gece yarısı son otobüsü bekleyen iki yabancı." },
      { id: "e3", title: "Dara Vengan", author: "Rojhat Polat", language: "ZA", category: "UZUN", status: "WINNER", synopsis: "Köyün meydanındaki yaşlı ağacın dilinden bir hikâye." },
      { id: "e4", title: "Kayıp Anahtar", author: "Elif Şahin", language: "TR", category: "COCUK", status: "MENTION", synopsis: "Bir çocuğun büyükannesinin sandığındaki gizemli anahtarı araması." },
    ],
  });

  // Duyurular & videolar
  const ann = [
    ["Bahar dönemi futbol takım başvuruları başladı", "BASVURU", true, "Erkek ve kadın U-21 futbol ligleri için yeni takım başvuruları başladı."],
    ["Genç Sesler yarı final davetiyeleri ücretsiz dağıtılıyor", "MUZIK", false, "Yarı final için davetiyeler gençlik merkezlerinden temin edilebilir."],
    ["3. Gençlik Tiyatro Festivali perdelerini açtı", "TIYATRO", false, "Sekiz topluluğun katıldığı festival bir hafta boyunca beş farklı sahnede sürüyor."],
    ["Kadın liglerinde rekor katılım", "SPOR", false, "Bu sezon kadın liglerinde 24 takım ve 270'i aşkın sporcu mücadele ediyor."],
    ["Hakem ve gönüllü eğitim programı", "GENEL", false, "Organizasyonda görev almak isteyen gençler için hakemlik ve gönüllülük eğitimleri başlıyor."],
  ] as const;
  ann.forEach(([title, category, isPinned, excerpt], i) => {
    const id = uniq(title);
    put("announcements", id, { slug: id, title, category, isPinned, excerpt, isPublished: true, coverUrl: null, publishedAt: at(-i * 3, "10:00"),
      content: `${excerpt}\n\nDiyarbakır Gençlik Organizasyonları olarak şehrin tüm ilçelerindeki gençlerin spor, müzik ve tiyatro etkinliklerine eşit şekilde katılabilmesi için çalışmaya devam ediyoruz.\n\nAyrıntılı bilgi için başvuru sayfasını inceleyebilir ya da iletişim formu üzerinden bize ulaşabilirsiniz.` });
  });
  [["Sezon Açılış Töreni", DEMO_VIDEOS[0], "GENEL", true], ["Genç Sesler — Ön Eleme Özeti", DEMO_VIDEOS[1], "MUZIK", true], ["Tiyatro Festivali Tanıtım Filmi", DEMO_VIDEOS[2], "TIYATRO", false], ["Haftanın Golleri", DEMO_VIDEOS[0], "SPOR", false]]
    .forEach(([title, youtubeUrl, category, isFeatured], i) => ops.push({ ref: newRef("videos"), data: { title, youtubeUrl, category, isFeatured, publishedAt: at(-i, "09:00") } }));

  ops.push({ ref: ref("config", "demo"), data: { loadedAt: now, day: isoDay(now) } });

  onProgress?.(`${ops.length} kayıt yazılıyor…`);
  await batchWrite(ops, (n) => onProgress?.(`${n} / ${ops.length} kayıt yazıldı…`));
  // Manşet, öne çıkanlar, Gençliğin Sesi, sezon arşivi, gönüllü dönemi
  const extra = await seedExtras(onProgress);
  onProgress?.("Tamamlandı!");
  return ops.length + extra;
}
