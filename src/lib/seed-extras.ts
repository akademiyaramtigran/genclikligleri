"use client";

/* Ek demo içerikleri: manşet, haftanın öne çıkanları, Gençliğin Sesi akışı, sezon arşivi,
   hakem & gönüllü başvuru dönemi. Eksik olanları ekler, mevcut verilere dokunmaz.
   (Demo verisi önceden yüklenmiş canlı sitede yönetim panosundan çalıştırılabilir.) */

import { getDocs, collection, query, where, limit as qlimit } from "firebase/firestore";
import { fdb } from "./firebase";
import { batchWrite, ref, newRef, changed } from "./admin";
import { getAll } from "./data";
import { dayKey, slugify } from "./utils";
import { sportDef } from "./constants";
import type { League, Player, Team } from "./types";

const at = (offsetDays: number, time = "12:00") => new Date(new Date(`${dayKey()}T${time}:00+03:00`).getTime() + offsetDays * 86_400_000);
const isEmpty = async (col: string, ...w: Parameters<typeof where>[]) =>
  (await getDocs(query(collection(fdb(), col), ...w.map((x) => where(...x)), qlimit(1)))).empty;

// ───── Demo görselleri (SVG illüstrasyon; gerçek fotoğraflar yönetim panelinden yüklenir) ─────
const svg = (body: string, w = 1600, h = 900) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice">${body}</svg>`)}`;

export const DEMO_IMG = {
  stadium: svg(`<defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1530"/><stop offset=".55" stop-color="#1e3a5f"/><stop offset="1" stop-color="#0a0d15"/></linearGradient><radialGradient id="l" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#15803d"/><stop offset="1" stop-color="#14532d"/></linearGradient></defs><rect width="1600" height="900" fill="url(#s)"/><circle cx="220" cy="120" r="140" fill="url(#l)"/><circle cx="1380" cy="120" r="140" fill="url(#l)"/><path d="M220 120 L-200 900 L700 900Z" fill="#fff" opacity=".06"/><path d="M1380 120 L900 900 L1800 900Z" fill="#fff" opacity=".06"/><path d="M0 520 Q800 470 1600 520 L1600 900 L0 900Z" fill="#111827"/><g fill="#1f2937">${Array.from({ length: 60 }, (_, i) => `<circle cx="${i * 27 + 10}" cy="${505 + (i % 3) * 6}" r="9"/>`).join("")}</g><path d="M-100 900 L420 590 L1180 590 L1700 900Z" fill="url(#g)"/><path d="M420 590 L1180 590 M800 590 L800 900 M300 900 L560 700 L1040 700 L1300 900" stroke="#fff" stroke-opacity=".55" stroke-width="5" fill="none"/><ellipse cx="800" cy="740" rx="120" ry="34" stroke="#fff" stroke-opacity=".5" stroke-width="5" fill="none"/><g fill="#0a0d15"><circle cx="640" cy="690" r="16"/><rect x="628" y="704" width="24" height="60" rx="10"/><circle cx="940" cy="720" r="18"/><rect x="926" y="736" width="28" height="70" rx="12"/></g><circle cx="790" cy="770" r="12" fill="#fff"/>`),
  stage: svg(`<defs><linearGradient id="c" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3b0b0b"/><stop offset=".5" stop-color="#7f1d1d"/><stop offset="1" stop-color="#3b0b0b"/></linearGradient><radialGradient id="sp" cx=".5" cy="1" r=".7"><stop offset="0" stop-color="#fde68a" stop-opacity=".85"/><stop offset="1" stop-color="#fde68a" stop-opacity="0"/></radialGradient></defs><rect width="1600" height="900" fill="#0c0c0e"/>${Array.from({ length: 12 }, (_, i) => `<rect x="${i * 26}" y="0" width="22" height="900" fill="${i % 2 ? "#5c0f0f" : "#7f1d1d"}"/><rect x="${1600 - (i + 1) * 26}" y="0" width="22" height="900" fill="${i % 2 ? "#5c0f0f" : "#7f1d1d"}"/>`).join("")}<rect x="0" y="0" width="1600" height="90" fill="url(#c)"/><path d="M800 0 L520 760 L1080 760Z" fill="#fde68a" opacity=".12"/><ellipse cx="800" cy="770" rx="420" ry="70" fill="url(#sp)"/><rect x="0" y="760" width="1600" height="140" fill="#1c1917"/><g fill="#0c0c0e"><circle cx="720" cy="560" r="34"/><path d="M680 600 Q720 580 760 600 L780 760 L660 760Z"/><circle cx="890" cy="540" r="36"/><path d="M846 584 Q890 560 934 584 L960 760 L820 760Z"/><path d="M934 600 L1010 520" stroke="#0c0c0e" stroke-width="18" stroke-linecap="round"/></g><g fill="#f43f5e" opacity=".9"><circle cx="1010" cy="510" r="14"/></g>`),
  music: svg(`<defs><linearGradient id="b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a0b2e"/><stop offset="1" stop-color="#0b0614"/></linearGradient></defs><rect width="1600" height="900" fill="url(#b)"/><path d="M300 0 L700 900 L560 900Z" fill="#d946ef" opacity=".25"/><path d="M1300 0 L900 900 L1040 900Z" fill="#22d3ee" opacity=".22"/><path d="M800 0 L720 900 L880 900Z" fill="#fff" opacity=".08"/>${Array.from({ length: 40 }, (_, i) => `<rect x="${i * 40 + 6}" y="${780 - ((i * 37) % 160)}" width="22" height="${120 + ((i * 37) % 160)}" rx="11" fill="${i % 2 ? "#a855f7" : "#e879f9"}" opacity=".55"/>`).join("")}<g fill="#0b0614"><circle cx="800" cy="480" r="46"/><path d="M740 540 Q800 510 860 540 L900 900 L700 900Z"/></g><rect x="858" y="470" width="14" height="90" rx="7" fill="#cbd5e1" transform="rotate(25 865 515)"/><circle cx="890" cy="455" r="20" fill="#e2e8f0"/>`),
  court: svg(`<defs><linearGradient id="w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b45309"/><stop offset="1" stop-color="#78350f"/></linearGradient></defs><rect width="1600" height="900" fill="#111827"/><rect y="0" width="1600" height="420" fill="#1f2937"/><path d="M-200 900 L380 420 L1220 420 L1800 900Z" fill="url(#w)"/>${Array.from({ length: 14 }, (_, i) => `<path d="M${380 + i * 60} 420 L${-200 + i * 143} 900" stroke="#000" stroke-opacity=".12" stroke-width="3"/>`).join("")}<path d="M560 420 Q800 560 1040 420" stroke="#fff" stroke-opacity=".7" stroke-width="5" fill="none"/><rect x="740" y="180" width="120" height="80" fill="#fff" opacity=".9"/><rect x="770" y="215" width="60" height="40" stroke="#ef4444" stroke-width="5" fill="none"/><path d="M770 262 L830 262 L820 320 L780 320Z" stroke="#fff" stroke-width="4" fill="none" opacity=".8"/><circle cx="960" cy="300" r="34" fill="#ea580c"/><path d="M926 300 L994 300 M960 266 L960 334" stroke="#7c2d12" stroke-width="4"/>`),
};

export async function seedExtras(onProgress?: (msg: string) => void) {
  const ops: { ref: ReturnType<typeof ref>; data: Record<string, unknown> }[] = [];
  const put = (col: string, id: string | null, data: Record<string, unknown>) => ops.push({ ref: id ? ref(col, id) : newRef(col), data });
  const [leagues, players, teams] = await Promise.all([getAll<League>("leagues"), getAll<Player>("players"), getAll<Team>("teams")]);
  const teamById = new Map(teams.map((t) => [t.id, t]));
  const active = leagues.filter((l) => l.seasonActive);

  // 1) Sezon arşivi: geçen sezonun tamamlanmış ligleri (aktif liglerden türetilir)
  if (active.length && !leagues.some((l) => !l.seasonActive)) {
    onProgress?.("Sezon arşivi hazırlanıyor…");
    const y = Number((active[0]!.seasonName ?? "").slice(0, 4)) || new Date().getFullYear();
    const prev = `${y - 1}-${y}`;
    put("seasons", prev, { name: prev, startDate: new Date(`${y - 1}-09-01T12:00:00+03:00`), endDate: new Date(`${y}-06-30T12:00:00+03:00`), isActive: false });
    for (const l of active) {
      const rows = [...(l.summary?.standings ?? [])];
      if (!rows.length) continue;
      rows.push(rows.shift()!); rows.reverse(); // farklı bir sıralama
      const def = sportDef(l.sport);
      const played = (rows.length - 1) * 2;
      const standings = rows.map((r, i) => {
        const won = Math.max(0, played - 1 - i * 2), drawn = def.allowsDraw ? Math.min(2, played - won) : 0, lost = played - won - drawn;
        const pts = l.sport === "FUTBOL" ? won * 3 + drawn : l.sport === "HENTBOL" ? won * 2 + drawn : l.sport === "VOLEYBOL" ? won * 3 : won * 2 + lost;
        return { ...r, position: i + 1, played, won, drawn, lost, points: pts, diff: (rows.length - i * 2) * 3, form: [] };
      });
      const leaders = Object.fromEntries(Object.entries(l.summary?.leaders ?? {}).map(([k, list]) => [k, list.slice(0, 5).map((r, i) => ({ ...r, total: Math.round(r.total * 2.4) + 6 - i, matches: played }))]));
      const id = slugify(`${l.name} ${prev}`);
      put("leagues", id, {
        slug: id, name: l.name, sport: l.sport, gender: l.gender, ageGroup: l.ageGroup ?? null, status: "COMPLETED", seasonId: prev, seasonName: prev, seasonActive: false,
        entries: l.entries, description: `${prev} sezonu tamamlandı.`, rules: l.rules ?? null,
        summary: JSON.parse(JSON.stringify({ standings, leaders, discipline: [], stats: { ...(l.summary?.stats ?? {}), played: played * rows.length / 2, total: played * rows.length / 2 }, updatedAt: null })),
        createdAt: new Date(),
      });
    }
  }

  // 2) Manşet
  if (await isEmpty("announcements", ["isHeadline", "==", true])) {
    put("announcements", "kulp-tiyatro-ekibi-ilk-sahnesini-aldi", {
      slug: "kulp-tiyatro-ekibi-ilk-sahnesini-aldi", title: "Kulp ilçesi tiyatro ekibi ilk sahnesini aldı!", kicker: "Haftanın Olayı · Kulp", category: "TIYATRO",
      excerpt: "Kulp'tan 14 gencin kurduğu topluluk, festivalin açılış gecesinde ayakta alkışlandı. Salon kapasitesi ilk kez doldu.",
      content: "Kulp'tan 14 gencin kurduğu tiyatro topluluğu, Gençlik Tiyatro Festivali'nin açılış gecesinde ilk kez sahneye çıktı.\n\nKendi yazdıkları oyunla seyirci karşısına çıkan gençler, gösterimin sonunda dakikalarca ayakta alkışlandı. Topluluğun yönetmeni, provaların altı ay boyunca okul spor salonunda yapıldığını anlattı.\n\nOrganizasyon komitesi, ilçelerden gelen toplulukların sayısının bu yıl iki katına çıktığını açıkladı.",
      coverUrl: DEMO_IMG.stage, isPinned: false, isPublished: true, isHeadline: true, publishedAt: at(-1, "18:00"),
    });
    put("announcements", "hani-ve-lice-dostluk-maci", {
      slug: "hani-ve-lice-dostluk-maci", title: "Hani ve Lice ilçelerinin dostluk maçı nefes kesti", kicker: "Spor · Dostluk Maçı", category: "SPOR",
      excerpt: "Son dakikada gelen golle 3-3 biten maçta iki takımın oyuncuları maç sonunda formalarını değiştirdi.",
      content: "Hani ve Lice gençlik takımları arasında oynanan dostluk maçı 3-3 sona erdi.\n\nMaçın son dakikasında gelen beraberlik golünün ardından iki takımın oyuncuları sahada kucaklaştı ve formalarını değiştirdi. Tribünlerde iki ilçeden yaklaşık 600 kişi vardı.",
      coverUrl: DEMO_IMG.stadium, isPinned: false, isPublished: true, isHeadline: true, publishedAt: at(-4, "20:00"),
    });
  }

  // 3) Haftanın öne çıkanları
  if (await isEmpty("highlights")) {
    onProgress?.("Haftanın öne çıkanları ekleniyor…");
    const picks = players.filter((p) => p.teamId).slice(0, 40);
    const p1 = picks[3], p2 = picks[17];
    const team = (p?: Player) => (p?.teamId ? teamById.get(p.teamId) : undefined);
    const list = [
      p1 && { kind: "PLAYER", weekOf: at(-2), name: `${p1.firstName} ${p1.lastName}`, subtitle: `${team(p1)?.name ?? ""} · ${p1.position ?? ""}`, story: "Hafta sonu oynanan derbide iki gol ve bir asistle takımını galibiyete taşıdı. Antrenörüne göre sezon başından beri antrenmanlara ilk gelen ve en son çıkan oyuncu.", link: `/spor/oyuncu?s=${p1.id}`, section: "SPOR" },
      { kind: "ARTIST", weekOf: at(-2), name: "Zelal Aydın", subtitle: "Genç Sesler · Dengbêj", story: "Çeyrek finalde seslendirdiği dengbêj kılamıyla jüriden tam puan aldı. Halk oylamasında da haftanın en çok oy alan yarışmacısı oldu.", link: "/muzik", section: "MUZIK" },
      { kind: "FAIRPLAY", weekOf: at(-2), name: "Bağlar ve Sur kadın voleybol takımları", subtitle: "Kadın Voleybol Ligi", story: "Maç sırasında sakatlanan rakip oyuncuyu iki takımın kaptanları birlikte kenara taşıdı; seyirciler iki takımı birlikte alkışladı. Maç sonunda takımlar ortak fotoğraf çektirdi.", link: null, section: "SPOR" },
      p2 && { kind: "PLAYER", weekOf: at(-9), name: `${p2.firstName} ${p2.lastName}`, subtitle: `${team(p2)?.name ?? ""}`, story: "Kaleci olarak üç maçtır gol yemiyor. Penaltı kurtarışıyla takımına bir puan kazandırdı.", link: `/spor/oyuncu?s=${p2.id}`, section: "SPOR" },
      { kind: "FAIRPLAY", weekOf: at(-9), name: "Sur Sahne Topluluğu", subtitle: "Gençlik Tiyatro Festivali", story: "Dekoru yolda hasar gören Ergani Halk Sahnesi'ne kendi dekor parçalarını ödünç verdi; iki topluluk aynı akşam iki ayrı oyunu aynı dekorla sahneledi.", link: "/tiyatro", section: "TIYATRO" },
    ].filter(Boolean) as Record<string, unknown>[];
    for (const h of list) put("highlights", null, { ...h, photoUrl: null, isPublished: true, createdAt: new Date() });
  }

  // 4) Gençliğin Sesi
  if (await isEmpty("posts")) {
    onProgress?.("Gençliğin Sesi paylaşımları ekleniyor…");
    const posts = [
      { kind: "ROPORTAJ", section: "SPOR", title: "“Mahallede top oynarken bir gün lig maçına çıkacağımı hayal bile etmezdim”", author: "Rojda Kılıç", authorRole: "Kaptan · Bağlar Kadın Voleybol", body: "Bağlar kadın voleybol takımının 17 yaşındaki kaptanıyla sezonu, okulu ve hayallerini konuştuk.", qa: [{ q: "Voleybola nasıl başladın?", a: "Okulun spor salonunda beden eğitimi öğretmenimiz bir takım kurdu. Önce sadece eğlence içindi, sonra her gün antrenmana gelir olduk." }, { q: "Kaptan olmak nasıl bir duygu?", a: "Sorumluluk. Maç kötü giderken herkes yüzüme bakıyor; o an sakin kalmayı öğrendim." }, { q: "Genç kızlara ne söylemek istersin?", a: "Salona gelin. İlk gün korkuyorsunuz, bir ay sonra takım arkadaşlarınız aileniz oluyor." }], photos: [DEMO_IMG.court], d: -1 },
      { kind: "KOSE", section: "YAZARLIK", title: "Surların gölgesinde bir prova", author: "Berfin Demir", authorRole: "Genç Kalemler finalisti", body: "Akşamüstü Dağkapı'dan geçerken bir grup gencin duvarın dibinde replik çalıştığını gördüm. Ellerinde fotokopi metinler, rüzgâr sayfaları savuruyordu.\n\nBiri “Bir kez daha, bu sefer bağırmadan” dedi. Sonra hepsi sustu ve sessizlik bir sahne kadar büyüdü.\n\nTiyatro bence tam olarak bu: Şehrin gürültüsünün ortasında birkaç kişinin aynı sessizliği paylaşması.", photos: [], d: -2 },
      { kind: "FOTO", section: "SPOR", title: "Hafta sonu sahalardan kareler", author: "Medya Ekibi", authorRole: "Gönüllü fotoğrafçılar", body: "Futbol, basketbol ve voleybol liglerinde hafta sonu oynanan maçlardan seçtiğimiz kareler.", photos: [DEMO_IMG.stadium, DEMO_IMG.court], d: -2 },
      { kind: "HABER", section: "MUZIK", title: "Genç Sesler çeyrek finali tamamlandı: 8 yarışmacı yarı finalde", author: "Organizasyon", authorRole: "Müzik Birimi", body: "Cegerxwîn Kültür Merkezi'nde yapılan çeyrek finalde 16 yarışmacı sahneye çıktı. Jüri puanı ve halk oylamasının birleşimiyle 8 yarışmacı yarı finale yükseldi.", photos: [DEMO_IMG.music], d: -3 },
      { kind: "ROPORTAJ", section: "SPOR", title: "Antrenör Mehmet Yıldız: “Skor değil, sahada kalmaları önemli”", author: "Mehmet Yıldız", authorRole: "Antrenör · Sur Gençlik SK", body: "Sur Gençlik SK'nın 12 yıllık antrenörüyle gençlik liglerinin mahalleye etkisini konuştuk.", qa: [{ q: "Ligin en büyük katkısı ne oldu?", a: "Çocuklar artık hafta sonunu sokakta değil sahada geçiriyor. Aileler de tribüne geliyor." }, { q: "Kazanmak ne kadar önemli?", a: "Önemli ama ilk hedefimiz hiçbir çocuğun takımı bırakmaması." }], photos: [], d: -4 },
      { kind: "KOSE", section: "YAZARLIK", title: "Dicle'ye mektup", author: "Hejar Aslan", authorRole: "Genç Kalemler · Kurmancî", body: "Sevgili Dicle, sana her baktığımda annemin anlattığı hikâyeleri hatırlıyorum.\n\nKöprünün on gözünden her biri ayrı bir hikâye anlatıyor gibi. Bu yıl yazdığım oyunu senin kıyında geçen bir gece üzerine kurdum.", photos: [], d: -5 },
      { kind: "FOTO", section: "TIYATRO", title: "Festival provalarından", author: "Medya Ekibi", authorRole: "Gönüllü fotoğrafçılar", body: "Açılış gecesi öncesi son provalardan kulis kareleri.", photos: [DEMO_IMG.stage], d: -6 },
      { kind: "HABER", section: "GENEL", title: "Hakem ve gönüllü başvuruları başladı", author: "Organizasyon", authorRole: "Gönüllü Koordinasyonu", body: "Liglerde ve festivallerde görev almak isteyen gençler için hakemlik, masa görevliliği, sahne ekibi ve medya gönüllülüğü başvuruları açıldı. Başvuranlara ücretsiz eğitim verilecek.", photos: [], d: -7 },
    ];
    for (const p of posts) {
      const slug = slugify(p.title).slice(0, 70);
      const { d, ...rest } = p;
      put("posts", slug, { ...rest, slug, authorPhoto: null, publishedAt: at(d, "10:00"), isPublished: true, createdAt: new Date() });
    }
  }

  // 5) Hakem & gönüllü başvuru dönemi
  if (await isEmpty("periods", ["category", "==", "GONULLU"])) {
    put("periods", "hakem-ve-gonullu-basvurusu", {
      slug: "hakem-ve-gonullu-basvurusu", title: "Hakem & Gönüllü Başvurusu", category: "GONULLU", startDate: at(-3), endDate: at(60, "23:59"),
      summary: "Liglerde ve festivallerde hakem, masa görevlisi, sahne ekibi, fotoğraf-video ve organizasyon gönüllüsü olarak görev al.",
      description: "Başvuranlar ücretsiz hakemlik ve ilk yardım eğitimine davet edilir. Görevler hafta sonları ve akşam saatlerinde planlanır.",
      requirements: "16 yaşını doldurmuş olmak (18 yaş altı için veli izni).\nDiyarbakır'da ikamet etmek veya eğitim görmek.\nEğitim programına katılmak.",
      requiredDocuments: [{ key: "kimlik", label: "Kimlik fotokopisi", required: true }, { key: "belge", label: "Hakemlik / ilk yardım belgesi", required: false, hint: "Varsa" }, { key: "veli", label: "18 yaş altı için veli izin belgesi", required: false }],
      minMembers: 1, maxMembers: 1, minAge: 16, maxAge: 30, fee: "Ücretsiz", contactInfo: "Gönüllü Koordinasyonu", isPublished: true, applicationCount: 0, createdAt: new Date(),
    });
  }

  if (!ops.length) { onProgress?.("Eklenecek yeni demo içeriği yok (hepsi zaten mevcut)."); return 0; }
  onProgress?.(`${ops.length} kayıt yazılıyor…`);
  await batchWrite(ops);
  changed();
  onProgress?.("Tamamlandı!");
  return ops.length;
}
