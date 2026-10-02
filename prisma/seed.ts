/* Demo verisi: npm run db:seed  (mevcut veriyi siler!) */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

// Tekrarlanabilir rastgelelik
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

const TR: Record<string, string> = { ç: "c", ğ: "g", ı: "i", İ: "i", ö: "o", ş: "s", ü: "u", Ç: "c", Ğ: "g", Ö: "o", Ş: "s", Ü: "u", â: "a", ê: "e", î: "i", û: "u" };
const slugify = (s: string) =>
  s.split("").map((c) => TR[c] ?? c).join("").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const usedSlugs = new Set<string>();
const uniq = (base: string) => {
  let s = slugify(base);
  let i = 2;
  while (usedSlugs.has(s)) s = `${slugify(base)}-${i++}`;
  usedSlugs.add(s);
  return s;
};

/** İstanbul saatiyle tarih */
const at = (date: string, time = "12:00") => new Date(`${date}T${time}:00+03:00`);
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86_400_000);

const MALE = ["Ahmet", "Mehmet", "Mustafa", "Yusuf", "Emre", "Baran", "Berat", "Rojhat", "Serhat", "Delil", "Azad", "Furkan", "Eren", "Kerem", "Mert", "Ömer", "Hüseyin", "Ali", "Hasan", "İbrahim", "Burak", "Enes", "Şervan", "Agit", "Mazlum", "Welat", "Ramazan", "Siyar", "Ferhat", "Botan", "Umut", "Doğan", "Cihan", "Barış", "Eyüp", "Halil"];
const FEMALE = ["Zeynep", "Elif", "Ayşe", "Fatma", "Berfin", "Rojda", "Dilan", "Zelal", "Hêvî", "Şilan", "Merve", "Esra", "Büşra", "Sevda", "Nupelda", "Ronahi", "Helin", "Delal", "Beritan", "Medine", "Gülistan", "Selin", "Ecrin", "Nisa", "Hilal", "Rabia", "Melek", "Sinem", "Berivan", "Jiyan", "Asya", "Defne", "Evin", "Leyla"];
const LAST = ["Yılmaz", "Kaya", "Demir", "Aslan", "Çelik", "Akbaş", "Tekin", "Polat", "Özdemir", "Ekinci", "Bulut", "Yıldız", "Kılıç", "Oral", "Duman", "Erdem", "Turan", "Güneş", "Doğru", "Baran", "Ayhan", "Sevim", "Kurt", "Karakaya", "Bozkurt", "Keskin", "Şahin", "Altun", "Ateş", "Koç", "Tunç", "Varol", "Acar", "Akın", "Bingöl", "Dicle", "Fırat", "Zengin"];
const SCHOOLS = ["Ziya Gökalp Anadolu Lisesi", "Diyarbakır Fen Lisesi", "Dicle Üniversitesi", "Cahit Sıtkı Tarancı Lisesi", "Kayapınar Spor Lisesi", "Bağlar Mesleki ve Teknik Anadolu Lisesi", "Sur Anadolu Lisesi", "Ergani Anadolu Lisesi", "Silvan Anadolu Lisesi", "Bismil Anadolu Lisesi"];

const DISTRICT_LIST = ["Bağlar", "Kayapınar", "Sur", "Yenişehir", "Bismil", "Çermik", "Çınar", "Ergani", "Silvan", "Lice", "Kulp", "Hazro", "Dicle", "Eğil", "Hani", "Kocaköy", "Çüngüş"];

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

// Blender Foundation açık lisanslı filmleri — demo amaçlı yer tutucu videolar
const DEMO_VIDEOS = ["https://www.youtube.com/watch?v=aqz-KE-bpKQ", "https://www.youtube.com/watch?v=eRsGyueVLvQ", "https://www.youtube.com/watch?v=R6MlUcmOul8"];

async function main() {
  console.log("🧹 Veriler temizleniyor…");
  await db.$transaction([
    db.musicVote.deleteMany(), db.musicPerformance.deleteMany(), db.musicRound.deleteMany(), db.musicJury.deleteMany(), db.musicContestant.deleteMany(), db.musicCompetition.deleteMany(),
    db.theatreAward.deleteMany(), db.theatreShow.deleteMany(), db.theatreWorkshop.deleteMany(), db.theatrePlay.deleteMany(), db.theatreGroup.deleteMany(), db.theatreFestival.deleteMany(),
    db.applicationDocument.deleteMany(), db.application.deleteMany(), db.applicationPeriod.deleteMany(),
    db.matchEvent.deleteMany(), db.match.deleteMany(), db.leagueEntry.deleteMany(), db.player.deleteMany(), db.team.deleteMany(), db.league.deleteMany(), db.season.deleteMany(),
    db.venue.deleteMany(), db.announcement.deleteMany(), db.video.deleteMany(), db.contactMessage.deleteMany(), db.activityLog.deleteMany(), db.user.deleteMany(),
  ]);

  console.log("👤 Yönetici hesapları…");
  const pw = await bcrypt.hash("Diyarbakir2026!", 10);
  const admin = await db.user.create({ data: { name: "Genel Koordinatör", email: "admin@diyarbakirgenclik.org", passwordHash: pw, role: "SUPER_ADMIN", scope: "ALL" } });
  await db.user.createMany({
    data: [
      { name: "Spor Koordinatörü", email: "spor@diyarbakirgenclik.org", passwordHash: pw, role: "ADMIN", scope: "SPOR" },
      { name: "Müzik Koordinatörü", email: "muzik@diyarbakirgenclik.org", passwordHash: pw, role: "ADMIN", scope: "MUZIK" },
      { name: "Tiyatro Koordinatörü", email: "tiyatro@diyarbakirgenclik.org", passwordHash: pw, role: "ADMIN", scope: "TIYATRO" },
    ],
  });

  console.log("🏟️  Tesisler…");
  const venueData = [
    { name: "Diyarbakır Stadyumu Yan Saha", type: "SAHA", district: "Bağlar", capacity: 3000 },
    { name: "Seyrantepe Sentetik Çim Sahası", type: "SAHA", district: "Yenişehir", capacity: 800 },
    { name: "Kayapınar Gençlik Spor Tesisleri", type: "SAHA", district: "Kayapınar", capacity: 1200 },
    { name: "Ergani İlçe Stadı", type: "SAHA", district: "Ergani", capacity: 2500 },
    { name: "Diyarbakır Spor Salonu", type: "SALON", district: "Yenişehir", capacity: 2500 },
    { name: "Bağlar Kapalı Spor Salonu", type: "SALON", district: "Bağlar", capacity: 1000 },
    { name: "Kayapınar Kapalı Spor Salonu", type: "SALON", district: "Kayapınar", capacity: 1500 },
    { name: "Cegerxwîn Kültür Merkezi", type: "SAHNE", district: "Bağlar", capacity: 450 },
    { name: "Sezai Karakoç Kültür Merkezi", type: "SAHNE", district: "Yenişehir", capacity: 650 },
    { name: "Sur Dengbêj Evi Avlusu", type: "ACIK_HAVA", district: "Sur", capacity: 300 },
    { name: "İçkale Açık Hava Sahnesi", type: "ACIK_HAVA", district: "Sur", capacity: 1500 },
  ];
  const venues = [];
  for (const v of venueData) {
    venues.push(await db.venue.create({ data: { ...v, slug: uniq(v.name), address: `${v.district} / Diyarbakır`, description: `${v.district} ilçesinde bulunan, organizasyon etkinliklerine ev sahipliği yapan tesis.` } }));
  }
  const fields = venues.filter((v) => v.type === "SAHA");
  const halls = venues.filter((v) => v.type === "SALON");
  const stages = venues.filter((v) => v.type === "SAHNE" || v.type === "ACIK_HAVA");

  console.log("📅 Sezon & ligler…");
  const season = await db.season.create({ data: { name: "2026-2027", startDate: at("2026-09-01"), endDate: at("2027-06-30"), isActive: true } });

  const leagueStart = at("2026-09-05", "10:00");
  const now = new Date("2026-10-02T12:00:00+03:00");
  let playerSeq = 1;

  for (const sport of SPORTS) {
    for (const gender of ["ERKEK", "KADIN"] as const) {
      const gLabel = gender === "ERKEK" ? "Erkekler" : "Kadınlar";
      const league = await db.league.create({
        data: {
          slug: uniq(`${sport.label} ${gLabel} Ligi 2026-2027`),
          name: `${sport.label} ${gLabel} Gençlik Ligi`,
          sport: sport.key, gender, ageGroup: sport.key === "FUTBOL" ? "U-21" : "U-19",
          status: "ONGOING", seasonId: season.id,
          description: `Diyarbakır genelindeki ${gender === "ERKEK" ? "erkek" : "kadın"} gençlik ${sport.label.toLowerCase()} takımlarının mücadele ettiği ${season.name} sezonu ligi.`,
          rules: "Maçlar federasyon kurallarına göre oynanır.\nHer takım maç saatinden 30 dakika önce lisans kontrolü için hazır bulunur.\nÜst üste iki maça çıkmayan takım ligden ihraç edilir.\nSportmenlik dışı davranışlar disiplin kuruluna sevk edilir.",
        },
      });

      // Takımlar
      const count = 6;
      const pool = shuffle(TEAM_POOL).slice(0, count);
      const teams = [];
      for (const t of pool) {
        const suffix = gender === "KADIN" ? " Kadın" : "";
        const team = await db.team.create({
          data: {
            slug: uniq(`${t.name} ${sport.label}${suffix}`),
            name: `${t.name}${suffix}`,
            shortName: t.short,
            sport: sport.key, gender, district: t.district,
            primaryColor: t.colors[0], secondaryColor: t.colors[1],
            foundedYear: ri(2008, 2024),
            coachName: `${pick(gender === "ERKEK" ? MALE : FEMALE)} ${pick(LAST)}`,
            managerName: `${pick(MALE)} ${pick(LAST)}`,
            contactPhone: `05${ri(30, 55)} ${ri(100, 999)} ${ri(10, 99)} ${ri(10, 99)}`,
            description: `${t.district} ilçesinin gençlerinden oluşan ${t.name}, ${sport.label.toLowerCase()} branşında şehrin iddialı ekiplerinden biri.`,
            venueId: (sport.key === "FUTBOL" ? pick(fields) : pick(halls)).id,
          },
        });
        teams.push(team);
        await db.leagueEntry.create({ data: { leagueId: league.id, teamId: team.id } });

        // Oyuncular
        for (let n = 0; n < sport.squad; n++) {
          const first = pick(gender === "ERKEK" ? MALE : FEMALE);
          const last = pick(LAST);
          const pos = n === 0 && (sport.key === "FUTBOL" || sport.key === "HENTBOL") ? "Kaleci" : pick(sport.positions);
          await db.player.create({
            data: {
              slug: uniq(`${first} ${last}`),
              firstName: first, lastName: last, gender,
              birthDate: at(`${ri(2004, 2010)}-${String(ri(1, 12)).padStart(2, "0")}-${String(ri(1, 28)).padStart(2, "0")}`),
              position: pos,
              jerseyNumber: n === 0 ? 1 : ri(2, 99),
              heightCm: gender === "ERKEK" ? ri(168, sport.key === "BASKETBOL" || sport.key === "VOLEYBOL" ? 205 : 192) : ri(158, sport.key === "BASKETBOL" || sport.key === "VOLEYBOL" ? 190 : 178),
              weightKg: gender === "ERKEK" ? ri(60, 92) : ri(50, 75),
              strongSide: pick(["Sağ", "Sağ", "Sağ", "Sol", "Her ikisi"]),
              district: t.district,
              school: pick(SCHOOLS),
              licenseNo: `DGL-${String(playerSeq++).padStart(5, "0")}`,
              isCaptain: n === 1,
              status: rnd() < 0.05 ? "INJURED" : "ACTIVE",
              teamId: team.id,
              bio: `${t.district} doğumlu, takımının ${pos.toLowerCase()} pozisyonundaki önemli isimlerinden.`,
            },
          });
        }
      }

      // Fikstür: tek devreli lig (çember yöntemi) + rövanş
      const ids = teams.map((t) => t.id);
      const rounds: [string, string][][] = [];
      const arr = [...ids];
      for (let r = 0; r < arr.length - 1; r++) {
        const pairs: [string, string][] = [];
        for (let i = 0; i < arr.length / 2; i++) {
          const a = arr[i]!, b = arr[arr.length - 1 - i]!;
          pairs.push(r % 2 === 0 ? [a, b] : [b, a]);
        }
        rounds.push(pairs);
        arr.splice(1, 0, arr.pop()!);
      }
      const all = [...rounds, ...rounds.map((p) => p.map(([a, b]) => [b, a] as [string, string]))];

      for (let r = 0; r < all.length; r++) {
        const roundDate = addDays(leagueStart, r * 7 + (gender === "KADIN" ? 1 : 0));
        for (let i = 0; i < all[r]!.length; i++) {
          const [home, away] = all[r]![i]!;
          const date = new Date(roundDate.getTime() + i * 2 * 3_600_000);
          const finished = date < now;
          const homeTeam = teams.find((t) => t.id === home)!;
          const venueId = homeTeam.venueId;
          let hs: number | null = null, as: number | null = null, periodScores: string | null = null;
          if (finished) {
            if (sport.key === "FUTBOL") { hs = ri(0, 4); as = ri(0, 3); periodScores = `${Math.min(hs, ri(0, hs))}-${Math.min(as, ri(0, as))}`; }
            if (sport.key === "BASKETBOL") { hs = ri(52, 88); as = ri(50, 86); if (hs === as) hs += 3; }
            if (sport.key === "HENTBOL") { hs = ri(18, 34); as = ri(17, 33); }
            if (sport.key === "VOLEYBOL") {
              const winnerHome = rnd() < 0.55;
              const loserSets = ri(0, 2);
              hs = winnerHome ? 3 : loserSets; as = winnerHome ? loserSets : 3;
              const sets: string[] = [];
              let h = 0, a = 0;
              while (h < hs || a < as) {
                const homeWinsSet = (h < hs && a >= as) || (h < hs && rnd() < 0.5);
                const last = h + a === 4;
                const win = last ? 15 : 25, lose = ri(last ? 8 : 15, (last ? 15 : 25) - 2);
                sets.push(homeWinsSet ? `${win}-${lose}` : `${lose}-${win}`);
                homeWinsSet ? h++ : a++;
              }
              periodScores = sets.join(", ");
            }
          }
          const match = await db.match.create({
            data: {
              leagueId: league.id, round: r + 1, homeTeamId: home, awayTeamId: away, date, venueId,
              status: finished ? "FINISHED" : "SCHEDULED",
              homeScore: hs, awayScore: as, periodScores,
              referee: `${pick(MALE)} ${pick(LAST)}`,
              attendance: finished ? ri(80, 900) : null,
              youtubeUrl: finished && rnd() < 0.45 ? pick(DEMO_VIDEOS) : null,
              summary: finished ? "Tribünlerin dolduğu karşılaşmada iki takım da centilmence bir mücadele ortaya koydu." : null,
            },
          });

          if (finished) {
            const squads = await db.player.findMany({ where: { teamId: { in: [home, away] } } });
            const sq = (tid: string) => squads.filter((p) => p.teamId === tid);
            const events: { matchId: string; teamId: string; playerId: string; type: string; value: number; minute: number | null }[] = [];
            const add = (tid: string, type: string, value = 1, minute: number | null = null, outfield = true) => {
              const list = sq(tid).filter((p) => !outfield || p.position !== "Kaleci");
              const pl = pick(list.length ? list : sq(tid));
              events.push({ matchId: match.id, teamId: tid, playerId: pl.id, type, value, minute });
            };
            for (const [tid, score] of [[home, hs!], [away, as!]] as const) {
              if (sport.key === "FUTBOL") {
                for (let g = 0; g < score; g++) {
                  add(tid, rnd() < 0.12 ? "PENALTY_GOAL" : "GOAL", 1, ri(1, 90));
                  if (rnd() < 0.7) add(tid, "ASSIST", 1, null);
                }
                for (let y = 0; y < ri(0, 3); y++) add(tid, "YELLOW_CARD", 1, ri(10, 90));
                if (rnd() < 0.08) add(tid, "RED_CARD", 1, ri(40, 90));
              }
              if (sport.key === "BASKETBOL") {
                // Sayıyı 5-8 oyuncuya böl
                const scorers = shuffle(sq(tid)).slice(0, ri(5, 8));
                let left = score;
                scorers.forEach((p, idx) => {
                  const pts = idx === scorers.length - 1 ? left : Math.min(left, ri(2, Math.max(2, Math.round(score / 3))));
                  left -= pts;
                  if (pts > 0) events.push({ matchId: match.id, teamId: tid, playerId: p.id, type: "POINTS", value: pts, minute: null });
                  if (pts > 6 && rnd() < 0.6) events.push({ matchId: match.id, teamId: tid, playerId: p.id, type: "THREE_POINT", value: ri(1, 4), minute: null });
                  events.push({ matchId: match.id, teamId: tid, playerId: p.id, type: "REBOUND", value: ri(1, 11), minute: null });
                  if (rnd() < 0.6) events.push({ matchId: match.id, teamId: tid, playerId: p.id, type: "ASSIST", value: ri(1, 7), minute: null });
                });
              }
              if (sport.key === "VOLEYBOL") {
                const scorers = shuffle(sq(tid).filter((p) => p.position !== "Libero")).slice(0, 6);
                scorers.forEach((p) => {
                  events.push({ matchId: match.id, teamId: tid, playerId: p.id, type: "POINTS", value: ri(2, 9) + score * 2, minute: null });
                  if (rnd() < 0.5) events.push({ matchId: match.id, teamId: tid, playerId: p.id, type: "ACE", value: ri(1, 3), minute: null });
                  if (rnd() < 0.5) events.push({ matchId: match.id, teamId: tid, playerId: p.id, type: "BLOCK", value: ri(1, 4), minute: null });
                });
              }
              if (sport.key === "HENTBOL") {
                const scorers = shuffle(sq(tid).filter((p) => p.position !== "Kaleci")).slice(0, ri(5, 7));
                let left = score;
                scorers.forEach((p, idx) => {
                  const g = idx === scorers.length - 1 ? left : Math.min(left, ri(1, Math.max(1, Math.round(score / 3))));
                  left -= g;
                  if (g > 0) events.push({ matchId: match.id, teamId: tid, playerId: p.id, type: "GOAL", value: g, minute: null });
                  if (rnd() < 0.5) events.push({ matchId: match.id, teamId: tid, playerId: p.id, type: "ASSIST", value: ri(1, 5), minute: null });
                });
                const gk = sq(tid).find((p) => p.position === "Kaleci");
                if (gk) events.push({ matchId: match.id, teamId: tid, playerId: gk.id, type: "SAVE", value: ri(6, 16), minute: null });
                for (let s = 0; s < ri(0, 3); s++) add(tid, "SUSPENSION", 1, ri(5, 60));
              }
            }
            if (events.length) await db.matchEvent.createMany({ data: events });
            // Maçın oyuncusu: en çok skor üreten
            const top = events.filter((e) => ["GOAL", "PENALTY_GOAL", "POINTS"].includes(e.type)).sort((a, b) => b.value - a.value)[0];
            if (top) await db.match.update({ where: { id: match.id }, data: { mvpPlayerId: top.playerId } });
          }
        }
      }
      console.log(`   ✓ ${league.name}`);
    }
  }

  console.log("📝 Başvuru dönemleri…");
  const futbolErkek = await db.league.findFirst({ where: { sport: "FUTBOL", gender: "ERKEK" } });
  const docsSpor = JSON.stringify([
    { key: "kimlik", label: "Oyuncu kimlik fotokopileri (tek PDF)", required: true, hint: "Tüm oyuncuların nüfus cüzdanı ön yüzü" },
    { key: "saglik", label: "Sağlık raporu / “spor yapmasında sakınca yoktur” belgesi", required: true },
    { key: "veli", label: "18 yaş altı oyuncular için veli muvafakatnamesi", required: true },
    { key: "logo", label: "Takım logosu", required: false, hint: "PNG/JPG, kare" },
  ]);
  const periods = await Promise.all([
    db.applicationPeriod.create({
      data: {
        slug: "2027-bahar-futbol-takim-basvurusu", title: "Bahar Dönemi Futbol Ligleri Takım Başvurusu", category: "SPOR", sport: "FUTBOL", gender: null,
        leagueId: futbolErkek?.id, startDate: at("2026-09-20"), endDate: at("2026-10-31", "23:59"),
        summary: "Erkek ve kadın U-21 futbol liglerinin bahar dönemi için yeni takım başvuruları alınıyor.",
        description: "Diyarbakır'ın tüm ilçelerinden mahalle takımları, okul takımları ve amatör kulüpler başvurabilir. Başvurular organizasyon komitesince incelenir; uygun bulunan takımlar kura çekimine davet edilir.",
        requirements: "Takım en az 14, en fazla 25 lisanslı oyuncudan oluşmalıdır.\nOyuncular 2005 ve sonrası doğumlu olmalıdır.\nTüm oyuncuların Diyarbakır'da ikamet etmesi veya eğitim görmesi gerekir.\nTakımın 18 yaşını doldurmuş bir sorumlusu ve bir antrenörü bulunmalıdır.\nKatılım ücretsizdir; forma ve ekipman takımın sorumluluğundadır.\nBir oyuncu aynı sezonda yalnızca bir takımda oynayabilir.",
        requiredDocuments: docsSpor, minMembers: 14, maxMembers: 25, minAge: 15, maxAge: 21, quota: 24, fee: "Ücretsiz",
        contactInfo: "Spor Koordinasyon Birimi — spor@diyarbakirgenclik.org",
      },
    }),
    db.applicationPeriod.create({
      data: {
        slug: "kadin-voleybol-basketbol-ek-kontenjan", title: "Kadın Voleybol & Basketbol Ek Kontenjan Başvurusu", category: "SPOR", sport: "VOLEYBOL", gender: "KADIN",
        startDate: at("2026-09-25"), endDate: at("2026-10-15", "23:59"),
        summary: "Kadın liglerine katılımı artırmak için voleybol ve basketbolda 4'er takımlık ek kontenjan açıldı.",
        requirements: "Takım en az 10 oyuncudan oluşmalıdır.\nOyuncular 2007 ve sonrası doğumlu olmalıdır.\nTakım sorumlusunun kadın antrenör veya öğretmen olması tercih sebebidir.\nSalon ve ulaşım desteği organizasyon tarafından sağlanır.",
        requiredDocuments: docsSpor, minMembers: 10, maxMembers: 15, minAge: 14, maxAge: 19, quota: 8, fee: "Ücretsiz",
      },
    }),
    db.applicationPeriod.create({
      data: {
        slug: "genc-sesler-2027-on-basvuru", title: "Genç Sesler 2027 Müzik Yarışması Ön Başvurusu", category: "MUZIK",
        startDate: at("2026-11-01"), endDate: at("2026-12-15", "23:59"),
        summary: "Solo sanatçılar ve müzik grupları için yeni sezon ön başvuruları Kasım'da açılıyor.",
        description: "Pop, rock, rap, halk müziği, dengbêj ve daha fazlası… Tüm türlere açık yarışmada ön elemeyi geçen yarışmacılar canlı sahnede jüri karşısına çıkar.",
        requirements: "15-25 yaş arası olmak.\nGruplarda üye sayısı en fazla 6 kişi olabilir.\nEn az bir özgün beste veya yorum içeren 3 dakikalık demo kaydı gönderilmelidir.\nTürkçe, Kürtçe, Zazaca, Süryanice, Ermenice, Arapça veya İngilizce eserlerle başvurulabilir.\nDaha önce profesyonel albüm yayımlamış olmamak.",
        requiredDocuments: JSON.stringify([
          { key: "kimlik", label: "Kimlik fotokopisi (grup için tüm üyeler)", required: true },
          { key: "demo", label: "Demo kayıt (MP3)", required: true, hint: "En fazla 15 MB" },
          { key: "veli", label: "18 yaş altı için veli izin belgesi", required: false },
          { key: "foto", label: "Sanatçı / grup fotoğrafı", required: false },
        ]),
        minMembers: 1, maxMembers: 6, minAge: 15, maxAge: 25, quota: 32, fee: "Ücretsiz",
      },
    }),
    db.applicationPeriod.create({
      data: {
        slug: "tiyatro-festivali-2027-katilim", title: "4. Gençlik Tiyatro Festivali Topluluk Başvurusu", category: "TIYATRO",
        startDate: at("2026-09-15"), endDate: at("2026-11-30", "23:59"),
        summary: "Okul, üniversite ve amatör gençlik tiyatro toplulukları festival programı için oyunlarıyla başvurabilir.",
        description: "Seçilen oyunlar festival boyunca şehrin farklı sahnelerinde sahnelenecek, jüri değerlendirmesi sonucunda ödüller verilecektir.",
        requirements: "Topluluk üyelerinin %70'i 14-26 yaş aralığında olmalıdır.\nOyun süresi 40-110 dakika arasında olmalıdır.\nTelifli eserler için yazar/temsilci izni zorunludur.\nDekor kurulum süresi en fazla 45 dakikadır.\nHer topluluk en fazla bir oyunla başvurabilir.",
        requiredDocuments: JSON.stringify([
          { key: "metin", label: "Oyun metni (PDF)", required: true },
          { key: "izin", label: "Telif / yazar izin belgesi", required: true, hint: "Telifi serbest eserlerde beyan yeterlidir" },
          { key: "kadro", label: "Oyuncu ve teknik ekip listesi", required: true },
          { key: "afis", label: "Oyun afişi", required: false },
        ]),
        minMembers: 3, maxMembers: 30, minAge: 14, maxAge: 26, quota: 12, fee: "Ücretsiz",
      },
    }),
    db.applicationPeriod.create({
      data: {
        slug: "2026-2027-basketbol-hentbol-takim-basvurusu", title: "2026-2027 Basketbol & Hentbol Ligleri Takım Başvurusu", category: "SPOR", sport: "BASKETBOL",
        startDate: at("2026-07-01"), endDate: at("2026-08-20", "23:59"),
        summary: "Sezon başı takım başvuruları tamamlandı. Kura çekimi 25 Ağustos'ta yapıldı.",
        requirements: "Takım en az 10 oyuncudan oluşmalıdır.\nOyuncular 2007 ve sonrası doğumlu olmalıdır.",
        requiredDocuments: docsSpor, minMembers: 10, maxMembers: 16, minAge: 14, maxAge: 19, fee: "Ücretsiz",
      },
    }),
  ]);

  // Örnek başvurular
  const codes = ["DGL7K2QX", "DGLM4TP9", "DGLR8VNA"];
  await db.application.create({
    data: {
      trackingCode: codes[0]!, periodId: periods[0].id, status: "IN_REVIEW", title: "Dağkapı Gençlik FK",
      applicantName: "Serhat Ekinci", applicantEmail: "serhat@example.com", applicantPhone: "0532 000 00 01", applicantRole: "Takım Sorumlusu", district: "Sur",
      data: JSON.stringify({ shortName: "DGK", gender: "ERKEK", coachName: "Mehmet Kaya", primaryColor: "#0f766e", secondaryColor: "#ffffff", note: "Mahalle takımı olarak 3 yıldır birlikte oynuyoruz." }),
      members: JSON.stringify(Array.from({ length: 15 }, (_, i) => ({ firstName: pick(MALE), lastName: pick(LAST), birthDate: `200${ri(5, 9)}-0${ri(1, 9)}-1${ri(0, 9)}`, position: pick(["Kaleci", "Defans", "Orta Saha", "Forvet"]), jerseyNumber: i + 1 }))),
      kvkkConsent: true,
    },
  });
  await db.application.create({
    data: {
      trackingCode: codes[1]!, periodId: periods[3].id, status: "PENDING", title: "Sur Sahne Topluluğu — “Mem û Zîn”",
      applicantName: "Rojda Aslan", applicantEmail: "rojda@example.com", applicantPhone: "0533 000 00 02", applicantRole: "Yönetmen", district: "Sur",
      data: JSON.stringify({ playTitle: "Mem û Zîn", playwright: "Ehmedê Xanî (uyarlama)", genre: "Dram", durationMin: 75 }),
      members: JSON.stringify(Array.from({ length: 9 }, () => ({ firstName: pick(FEMALE), lastName: pick(LAST), role: "Oyuncu" }))),
      kvkkConsent: true,
    },
  });
  await db.application.create({
    data: {
      trackingCode: codes[2]!, periodId: periods[1].id, status: "NEEDS_REVISION", title: "Silvan Kadın Voleybol",
      applicantName: "Elif Polat", applicantEmail: "elif@example.com", applicantPhone: "0534 000 00 03", applicantRole: "Antrenör", district: "Silvan",
      publicNote: "Sağlık raporlarından 3 tanesi eksik. Lütfen en geç 10 Ekim'e kadar iletin.",
      data: JSON.stringify({ shortName: "SLV", gender: "KADIN", coachName: "Elif Polat" }),
      members: JSON.stringify(Array.from({ length: 11 }, (_, i) => ({ firstName: pick(FEMALE), lastName: pick(LAST), birthDate: `200${ri(7, 9)}-0${ri(1, 9)}-2${ri(0, 8)}`, position: pick(["Pasör", "Smaçör", "Libero"]), jerseyNumber: i + 1 }))),
      kvkkConsent: true,
    },
  });

  console.log("🎤 Müzik yarışması…");
  const comp = await db.musicCompetition.create({
    data: {
      slug: "genc-sesler-2026", name: "Genç Sesler", edition: "2026", isCurrent: true, status: "ONGOING", votingOpen: true,
      tagline: "Sahne senin. Ses senin. Diyarbakır seni dinliyor.",
      description: "Diyarbakır'ın genç yeteneklerini keşfetmek için düzenlenen, tüm müzik türlerine açık şehir çapında yarışma. Jüri puanı (%70) ve halk oylaması (%30) ile sonuçlar belirlenir.",
      prizes: "Birincilik: Profesyonel stüdyoda 3 şarkılık EP kaydı + 50.000 ₺ burs\nİkincilik: Klip çekimi + 30.000 ₺ burs\nÜçüncülük: Enstrüman seti + 20.000 ₺ burs\nHalkın Favorisi: Yaz konserinde açılış performansı",
    },
  });
  const juryData = [
    ["Aynur Dicle", "Ses Eğitmeni & Sanatçı"], ["Mehmet Ali Fırat", "Müzik Prodüktörü"], ["Zelal Tekin", "Dengbêj Kültürü Araştırmacısı"], ["Can Bozkurt", "Konservatuvar Öğretim Görevlisi"],
  ] as const;
  for (const [i, [name, title]] of juryData.entries()) {
    await db.musicJury.create({ data: { competitionId: comp.id, name, title, order: i, bio: `${title} olarak uzun yıllardır genç müzisyenlerle çalışıyor.` } });
  }
  const contestantNames: [string, "SOLO" | "GRUP", string, string][] = [
    ["Berfin Aslan", "SOLO", "Pop", "Bağlar"], ["Kom Dicle", "GRUP", "Kürtçe Müzik", "Sur"], ["Azad Yıldız", "SOLO", "Rap / Hip-Hop", "Kayapınar"],
    ["Bazalt", "GRUP", "Rock", "Yenişehir"], ["Rojda Ekinci", "SOLO", "Dengbêj", "Lice"], ["Hevsel Akustik", "GRUP", "Akustik / Folk", "Sur"],
    ["Elif Kaya", "SOLO", "Türk Sanat Müziği", "Ergani"], ["Delil Bulut", "SOLO", "Türk Halk Müziği", "Silvan"], ["Sur Beats", "GRUP", "Elektronik", "Kayapınar"],
    ["Helin Polat", "SOLO", "Caz", "Yenişehir"], ["Mazlum Oral", "SOLO", "Arabesk", "Bismil"], ["Dengê Ciwan", "GRUP", "Kürtçe Müzik", "Bağlar"],
    ["Zeynep Turan", "SOLO", "Pop", "Çermik"], ["Kırklar Dağı", "GRUP", "Rock", "Sur"], ["Siyar Keskin", "SOLO", "Klasik", "Kayapınar"], ["Nupelda Acar", "SOLO", "Akustik / Folk", "Hani"],
  ];
  const contestants = [];
  for (const [name, type, genre, district] of contestantNames) {
    contestants.push(
      await db.musicContestant.create({
        data: {
          slug: uniq(name), competitionId: comp.id, name, type, genre, district,
          members: type === "GRUP" ? JSON.stringify([{ name: `${pick(MALE)} ${pick(LAST)}`, role: "Vokal" }, { name: `${pick(FEMALE)} ${pick(LAST)}`, role: "Gitar" }, { name: `${pick(MALE)} ${pick(LAST)}`, role: "Bateri" }, { name: `${pick(MALE)} ${pick(LAST)}`, role: "Bas Gitar" }]) : "[]",
          bio: type === "GRUP" ? `${district}'dan bir araya gelen ${genre.toLowerCase()} grubu; özgün besteleriyle dikkat çekiyor.` : `${district} doğumlu genç ${genre.toLowerCase()} yorumcusu. Müziğe küçük yaşta mahalle düğünlerinde başladı.`,
          instagram: `https://instagram.com/${slugify(name).replace(/-/g, "")}`,
        },
      }),
    );
  }
  const SONGS = ["Dersim Dört Dağ İçinde", "Leylim Ley", "Bir Ömür Yetmez", "Rindamin", "Ez Kevokim", "Uzun İnce Bir Yoldayım", "Bilmem Ki", "Sarı Gelin", "Lorke", "Ben Seni Sevduğumi", "Bêriya Te", "Yalnızlık Senfonisi", "Gesi Bağları", "Zalım", "Dilo", "Hey Gidi Diyarbakır"];
  const rounds = [
    await db.musicRound.create({ data: { competitionId: comp.id, name: "Ön Eleme", order: 1, date: at("2026-09-12", "19:00"), venueId: stages[0]!.id, status: "COMPLETED", advanceCount: 8, youtubeUrl: DEMO_VIDEOS[1], description: "16 yarışmacı sahneye çıktı, 8 yarışmacı çeyrek finale yükseldi." } }),
    await db.musicRound.create({ data: { competitionId: comp.id, name: "Çeyrek Final", order: 2, date: at("2026-09-26", "19:00"), venueId: stages[1]!.id, status: "COMPLETED", advanceCount: 4, youtubeUrl: DEMO_VIDEOS[2], description: "Yarışmacılar bu turda kendi seçtikleri bir halk ezgisini yorumladı." } }),
    await db.musicRound.create({ data: { competitionId: comp.id, name: "Yarı Final", order: 3, date: at("2026-10-10", "19:30"), venueId: stages[1]!.id, status: "UPCOMING", advanceCount: 2, description: "Dört yarışmacı canlı orkestra eşliğinde sahne alacak." } }),
    await db.musicRound.create({ data: { competitionId: comp.id, name: "Büyük Final", order: 4, date: at("2026-10-24", "20:00"), venueId: stages[3]!.id, status: "UPCOMING", description: "İçkale Açık Hava Sahnesi'nde, binlerce kişinin önünde büyük final gecesi!" } }),
  ];
  // Ön eleme
  const r1 = contestants.map((c, i) => ({ c, jury: ri(55, 96), pub: ri(30, 98), song: SONGS[i % SONGS.length]! }));
  r1.forEach((x) => ((x as { total?: number }).total = Math.round((x.jury * 0.7 + x.pub * 0.3) * 10) / 10));
  const r1s = [...r1].sort((a, b) => ((b as { total?: number }).total ?? 0) - ((a as { total?: number }).total ?? 0));
  for (const [i, x] of r1s.entries()) {
    await db.musicPerformance.create({ data: { roundId: rounds[0]!.id, contestantId: x.c.id, songTitle: x.song, order: r1.indexOf(x) + 1, juryScore: x.jury, publicScore: x.pub, totalScore: (x as { total?: number }).total, rank: i + 1, advanced: i < 8, juryComment: i < 8 ? "Sahne hâkimiyeti ve ses rengi çok etkileyici." : "Potansiyel çok yüksek, tekniğin üzerine çalışmaya devam!" } });
  }
  const qf = r1s.slice(0, 8);
  const r2 = qf.map((x, i) => ({ c: x.c, jury: ri(65, 97), pub: ri(40, 99), song: SONGS[(i + 7) % SONGS.length]! })).map((x) => ({ ...x, total: Math.round((x.jury * 0.7 + x.pub * 0.3) * 10) / 10 }));
  const r2s = [...r2].sort((a, b) => b.total - a.total);
  for (const [i, x] of r2s.entries()) {
    await db.musicPerformance.create({ data: { roundId: rounds[1]!.id, contestantId: x.c.id, songTitle: x.song, order: r2.indexOf(x) + 1, juryScore: x.jury, publicScore: x.pub, totalScore: x.total, rank: i + 1, advanced: i < 4, youtubeUrl: i < 2 ? DEMO_VIDEOS[0] : null } });
  }
  const semi = r2s.slice(0, 4);
  for (const [i, x] of semi.entries()) {
    await db.musicPerformance.create({ data: { roundId: rounds[2]!.id, contestantId: x.c.id, songTitle: SONGS[(i + 3) % SONGS.length]!, order: i + 1 } });
  }
  const eliminated = contestants.filter((c) => !semi.some((s) => s.c.id === c.id));
  await db.musicContestant.updateMany({ where: { id: { in: eliminated.map((c) => c.id) } }, data: { status: "ELIMINATED" } });
  // Halk oylaması örnekleri
  for (const [i, s] of semi.entries()) {
    const votes = Array.from({ length: 40 - i * 7 }, (_, k) => ({ contestantId: s.c.id, voterHash: `seed-${i}-${k}`, dayKey: "2026-10-01" }));
    await db.musicVote.createMany({ data: votes });
  }

  console.log("🎭 Tiyatro festivali…");
  const fest = await db.theatreFestival.create({
    data: {
      slug: "genclik-tiyatro-festivali-2026", name: "Diyarbakır Gençlik Tiyatro Festivali", edition: "3.", isCurrent: true, status: "ONGOING",
      theme: "Surların Ardındaki Hikâyeler", tagline: "Perde açılıyor: 8 topluluk, 7 gün, 5 sahne",
      description: "Şehrin dört bir yanından gençlik tiyatro topluluklarının oyunlarını sahnelediği, atölyeler, söyleşiler ve sokak gösterileriyle süren bir haftalık festival.",
      startDate: at("2026-09-28"), endDate: at("2026-10-04", "23:00"),
    },
  });
  const groupsData = [
    ["Sur Sahne Topluluğu", "Sur", "Rojda Aslan"], ["Dicle Üniversitesi Tiyatro Kulübü", "Yenişehir", "Barış Kılıç"], ["Bağlar Gençlik Tiyatrosu", "Bağlar", "Dilan Erdem"],
    ["Kayapınar Doğaçlama Atölyesi", "Kayapınar", "Cihan Varol"], ["Ergani Halk Sahnesi", "Ergani", "Esra Güneş"], ["Silvan Perde Topluluğu", "Silvan", "Ferhat Ateş"],
    ["Ziya Gökalp Lisesi Drama", "Yenişehir", "Sevda Koç"], ["Hevsel Çocuk Tiyatrosu", "Sur", "Agit Tunç"],
  ] as const;
  const playsData = [
    ["Mem û Zîn", "Ehmedê Xanî (uyarlama)", "Dram", 80, "Kürtçe"], ["Kamyon", "Cüneyt Gökçer'e saygı", "Trajikomedi", 70, "Türkçe"], ["Bir Delinin Hatıra Defteri", "Nikolay Gogol", "Tek Kişilik", 55, "Türkçe"],
    ["Sokakta Doğaçlama", "Topluluk", "Doğaçlama", 60, "Türkçe"], ["Bakır Ustası", "Esra Güneş", "Dram", 90, "Türkçe"], ["Köprüdeki Kız", "Ferhat Ateş", "Komedi", 75, "Türkçe"],
    ["Yaşar Ne Yaşar Ne Yaşamaz", "Aziz Nesin", "Komedi", 95, "Türkçe"], ["Masal Ağacı", "Agit Tunç", "Çocuk Oyunu", 45, "Türkçe & Kürtçe"],
  ] as const;
  const plays = [];
  for (const [i, [gname, district, director]] of groupsData.entries()) {
    const group = await db.theatreGroup.create({ data: { slug: uniq(gname), name: gname, district, director, foundedYear: ri(2010, 2023), memberCount: ri(8, 30), description: `${district} merkezli ${gname}, gençlerin sahne sanatlarıyla buluştuğu köklü bir topluluk.` } });
    const [title, playwright, genre, duration, language] = playsData[i]!;
    const play = await db.theatrePlay.create({
      data: {
        slug: uniq(title), festivalId: fest.id, groupId: group.id, title, playwright, director, genre, durationMin: duration, language,
        ageLimit: genre === "Çocuk Oyunu" ? "Genel İzleyici" : "+12",
        synopsis: `${title}, ${genre.toLowerCase()} türünde, gençlerin gözünden şehrin ve insanın hikâyesini anlatan bir oyun. Topluluk bu yapımı festival için aylarca hazırladı.`,
        cast: JSON.stringify(Array.from({ length: ri(3, 7) }, (_, k) => ({ name: `${pick(rnd() < 0.5 ? MALE : FEMALE)} ${pick(LAST)}`, role: `Karakter ${k + 1}` }))),
        youtubeUrl: i < 3 ? DEMO_VIDEOS[i % 3] : null,
        inCompetition: genre !== "Çocuk Oyunu",
      },
    });
    plays.push(play);
    const day = addDays(at("2026-09-28", i % 2 === 0 ? "19:00" : "15:00"), Math.floor(i * 0.85));
    await db.theatreShow.create({ data: { playId: play.id, venueId: stages[i % stages.length]!.id, date: day, status: day < now ? "DONE" : i === 6 ? "SOLD_OUT" : "SCHEDULED" } });
    if (i % 3 === 0) await db.theatreShow.create({ data: { playId: play.id, venueId: stages[(i + 1) % stages.length]!.id, date: addDays(day, 1), status: addDays(day, 1) < now ? "DONE" : "SCHEDULED" } });
  }
  await db.theatreWorkshop.createMany({
    data: [
      { festivalId: fest.id, title: "Beden ve Ses Atölyesi", instructor: "Barış Kılıç", date: at("2026-09-29", "11:00"), location: "Cegerxwîn Kültür Merkezi — Prova Salonu" },
      { festivalId: fest.id, title: "Dengbêj Geleneğinden Sahneye: Anlatıcılık", instructor: "Zelal Tekin", date: at("2026-10-01", "14:00"), location: "Sur Dengbêj Evi" },
      { festivalId: fest.id, title: "Genç Oyun Yazarlığı", instructor: "Esra Güneş", date: at("2026-10-03", "11:00"), location: "Sezai Karakoç Kültür Merkezi" },
      { festivalId: fest.id, title: "Söyleşi: Şehirde Tiyatro Yapmak", instructor: "Festival Jürisi", date: at("2026-10-04", "16:00"), location: "İçkale Açık Hava Sahnesi" },
    ],
  });
  // Geçen yılın festivali ve ödülleri (arşiv)
  const prev = await db.theatreFestival.create({
    data: { slug: "genclik-tiyatro-festivali-2025", name: "Diyarbakır Gençlik Tiyatro Festivali", edition: "2.", status: "COMPLETED", theme: "Kapılar", startDate: at("2025-10-06"), endDate: at("2025-10-12"), description: "İkinci festivalde 6 topluluk 9 gösterim gerçekleştirdi." },
  });
  const prevPlay = await db.theatrePlay.create({ data: { slug: uniq("Dağkapı Hikâyeleri"), festivalId: prev.id, groupId: (await db.theatreGroup.findFirstOrThrow({ where: { name: "Sur Sahne Topluluğu" } })).id, title: "Dağkapı Hikâyeleri", playwright: "Topluluk", director: "Rojda Aslan", genre: "Dram", durationMin: 70 } });
  await db.theatreAward.createMany({
    data: [
      { festivalId: prev.id, category: "En İyi Oyun", winner: "Dağkapı Hikâyeleri — Sur Sahne Topluluğu", playId: prevPlay.id },
      { festivalId: prev.id, category: "En İyi Kadın Oyuncu", winner: "Dilan Erdem" },
      { festivalId: prev.id, category: "En İyi Erkek Oyuncu", winner: "Cihan Varol" },
      { festivalId: prev.id, category: "En İyi Reji", winner: "Rojda Aslan" },
      { festivalId: prev.id, category: "Seyirci Ödülü", winner: "Kayapınar Doğaçlama Atölyesi" },
    ],
  });

  console.log("📰 Duyurular & videolar…");
  const ann = [
    ["Bahar dönemi futbol takım başvuruları başladı", "BASVURU", true, "Erkek ve kadın U-21 futbol ligleri için yeni takım başvuruları 31 Ekim'e kadar sürecek."],
    ["Genç Sesler yarı final biletleri ücretsiz dağıtılıyor", "MUZIK", false, "10 Ekim'deki yarı final için davetiyeler gençlik merkezlerinden temin edilebilir."],
    ["3. Gençlik Tiyatro Festivali perdelerini açtı", "TIYATRO", false, "Sekiz topluluğun katıldığı festival bir hafta boyunca beş farklı sahnede sürüyor."],
    ["Kadın liglerinde rekor katılım", "SPOR", false, "Bu sezon kadın liglerinde 24 takım ve 270'i aşkın sporcu mücadele ediyor."],
    ["Hakem ve gönüllü eğitim programı", "GENEL", false, "Organizasyonda görev almak isteyen gençler için hakemlik ve gönüllülük eğitimleri başlıyor."],
  ] as const;
  for (const [i, [title, category, pinned, excerpt]] of ann.entries()) {
    await db.announcement.create({
      data: {
        slug: uniq(title), title, category, isPinned: pinned, excerpt,
        content: `${excerpt}\n\nDiyarbakır Gençlik Organizasyonu olarak şehrin tüm ilçelerindeki gençlerin spor, müzik ve tiyatro etkinliklerine eşit şekilde katılabilmesi için çalışmaya devam ediyoruz.\n\nAyrıntılı bilgi için başvuru sayfasını inceleyebilir ya da iletişim formu üzerinden bize ulaşabilirsiniz.`,
        publishedAt: addDays(now, -i * 3),
      },
    });
  }
  await db.video.createMany({
    data: [
      { title: "Sezon Açılış Töreni 2026-2027", youtubeUrl: DEMO_VIDEOS[0]!, category: "GENEL", isFeatured: true, description: "Diyarbakır Stadyumu'nda gerçekleşen görkemli açılış töreni." },
      { title: "Genç Sesler — Ön Eleme Özeti", youtubeUrl: DEMO_VIDEOS[1]!, category: "MUZIK", isFeatured: true },
      { title: "Tiyatro Festivali Tanıtım Filmi", youtubeUrl: DEMO_VIDEOS[2]!, category: "TIYATRO" },
      { title: "Haftanın Golleri — 3. Hafta", youtubeUrl: DEMO_VIDEOS[0]!, category: "SPOR" },
    ],
  });

  await db.contactMessage.create({ data: { name: "Hasan Turan", email: "hasan@example.com", subject: "Gönüllülük", message: "Hakemlik eğitimine katılmak istiyorum, nasıl başvurabilirim?" } });
  await db.activityLog.create({ data: { userId: admin.id, action: "SEED", entity: "Sistem", details: "Demo verisi yüklendi" } });

  console.log("\n✅ Hazır! Yönetici girişi: admin@diyarbakirgenclik.org / Diyarbakir2026!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
