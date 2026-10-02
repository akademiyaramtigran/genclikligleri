# Diyarbakır Gençlik Ligleri 🏆🎤🎭

Diyarbakır'ın 17 ilçesindeki gençlik organizasyonunu **tek bir platformda** yöneten web uygulaması:

- **Spor:** Futbol, basketbol, voleybol ve hentbol — **erkek ve kadın** ligleri
- **Müzik:** “Genç Sesler” yarışması (turlar, jüri puanı, halk oylaması)
- **Tiyatro:** Gençlik Tiyatro Festivali (gün gün program, oyunlar, topluluklar, ödüller)
- **Başvurular:** Dönemli başvurular, şartlar, belge yükleme, takip kodu
- **Yönetim paneli:** Tüm organizasyonun tek merkezden, birim bazlı yetkilerle yönetimi

## Hızlı Başlangıç

```bash
npm install
cp .env.example .env        # AUTH_SECRET değerini değiştirin
npm run setup               # veritabanını oluşturur + demo verisi yükler
npm run dev                 # http://localhost:3000
```

**Yönetim paneli:** `http://localhost:3000/yonetim`

| Hesap | E-posta | Yetki |
|---|---|---|
| Genel Koordinatör | `admin@diyarbakirgenclik.org` | Süper yönetici (her şey) |
| Spor Koordinatörü | `spor@diyarbakirgenclik.org` | Yalnızca spor |
| Müzik Koordinatörü | `muzik@diyarbakirgenclik.org` | Yalnızca müzik |
| Tiyatro Koordinatörü | `tiyatro@diyarbakirgenclik.org` | Yalnızca tiyatro |

Demo şifresi: `Diyarbakir2026!` — **canlıya almadan önce değiştirin.**

> Demo verisindeki YouTube videoları, Blender Foundation'ın açık lisanslı filmleridir (yer tutucu).
> Gerçek maç kayıtlarınızın bağlantısını yönetim panelinden girdiğinizde sitede otomatik gömülür.

## Özellikler

### Genel site
| Sayfa | Adres | İçerik |
|---|---|---|
| Ana sayfa | `/` | Spor / Müzik / Tiyatro geçişleri, canlı skor bandı, açık başvuru geri sayımı, lig zirveleri, krallık yarışı, müzik ve tiyatro vitrinleri, videolar, duyurular |
| Lig Merkezi | `/spor?cinsiyet=erkek\|kadin` | Erkek/Kadın geçişi, 4 branşın puan durumu, skor liderleri, sıradaki maçlar |
| Lig sayfası | `/spor/lig/[slug]` | Puan durumu, haftalık fikstür, istatistikler (krallık, asist, ribaund, kurtarış…), disiplin tablosu, takımlar, kurallar |
| Takım | `/spor/takim/[slug]` | Kadro (mevkilere göre), form, sıralama, fikstür, takım skorerleri |
| Oyuncu profili | `/spor/oyuncu/[slug]` | Oyuncu kartı, kariyer istatistikleri, maç maç performans |
| Maç | `/spor/mac/[id]` | Skor, **YouTube maç videosu**, maç akışı, kartlar, oyuncu istatistikleri, maçın oyuncusu, aralarındaki maçlar |
| Fikstür | `/spor/fikstur` | Gün gün tüm maçlar ve sonuçlar (branş/cinsiyet filtreli) |
| Krallık | `/spor/krallik` | Kürsü + tüm bireysel istatistik sıralamaları |
| Takımlar / Oyuncular | `/spor/takimlar`, `/spor/oyuncular` | Filtreleme ve arama |
| Müzik | `/muzik` | Sahne/neon temalı yarışma sayfası: tur yolu, sonuç tabloları, **halk oylaması** (günde 1 oy), jüri, ödüller |
| Yarışmacı | `/muzik/yarismaci/[slug]` | Yarışma yolculuğu, puanlar, jüri yorumları, video |
| Tiyatro | `/tiyatro` | Perde/festival temalı: gün gün program, oyun afişleri, atölyeler, ödül arşivi |
| Oyun / Topluluk | `/tiyatro/oyun/[slug]`, `/tiyatro/topluluk/[slug]` | Künye, oyuncular, gösterimler, video |
| Başvurular | `/basvuru` | Açık / yaklaşan / kapanmış dönemler |
| Başvuru formu | `/basvuru/[slug]` | Şartlar, istenen belgeler, 5 adımlı form (kadro + belge yükleme + KVKK) |
| Başvuru takip | `/basvuru/takip` | Takip kodu + e-posta ile durum sorgulama |
| Diğer | `/videolar`, `/duyurular`, `/tesisler`, `/ara`, `/iletisim`, `/kvkk`, `/hakkimizda` | |

### Spor kuralları (otomatik hesaplanır)
- **Futbol:** G 3 · B 1 · M 0 — averaj, atılan gol
- **Basketbol:** G 2 · M 1 (beraberlik yok)
- **Voleybol:** 3-0/3-1 → 3 P, 3-2 → 2 P, 2-3 → 1 P — set averajı
- **Hentbol:** G 2 · B 1 · M 0
- Puan silme cezaları lig sayfasından girilir.

### Yönetim paneli (`/yonetim`)
- **Pano:** bekleyen başvurular, sonucu girilmemiş maçlar için **hızlı skor girişi**, son işlemler
- **Başvurular:** inceleme, belgeleri görüntüleme (yalnızca yetkililer), yaş sınırı kontrolü, durum + başvurana not,
  **“Onayla ve Kayıt Oluştur”** → takım + tüm oyuncular (veya yarışmacı / topluluk + oyun) otomatik oluşur
- **Başvuru dönemleri:** tarih, şartlar, kişi/yaş sınırları, kontenjan, istenen belge listesi
- **Ligler:** sezonlar, lig oluşturma, takım ekleme, ceza puanı, **otomatik fikstür (round-robin, tek/çift devre)**
- **Takımlar / Oyuncular:** logo/fotoğraf yükleme, kadro, lisans ve (gizli) T.C. kimlik no
- **Maçlar:** skor, set/periyot skorları, YouTube bağlantısı, hakem, seyirci, maçın oyuncusu,
  gol/kart/asist olayları, basketbol-voleybol-hentbol için **toplu oyuncu istatistiği** girişi
- **Müzik:** turlar, sahne sırası, jüri puanı, halk oylarını puana çevirme, **turu sonuçlandırma** (tur atlayanlar / elenenler / şampiyon)
- **Tiyatro:** festival, gösterim programı, atölyeler, ödüller, topluluklar ve oyunlar
- **İçerik:** duyurular, videolar, iletişim mesajları
- **Sistem:** kullanıcılar (rol + birim yetkisi), işlem kayıtları, şifre değiştirme

## Teknik Yapı

- **Next.js 15** (App Router, Server Components, Server Actions) + **TypeScript**
- **Prisma ORM** — geliştirmede SQLite, üretimde PostgreSQL önerilir
- **Tailwind CSS** — bazalt sur dokusundan esinlenen tasarım dili; spor/müzik/tiyatro için ayrı temalar
- Oturum: imzalı JWT çerez (`jose`), şifreler `bcrypt`
- Yüklenen dosyalar `STORAGE_DIR` altında: `documents/` (başvuru belgeleri — yalnızca yöneticiler, `/api/belge/[id]`) ve `media/` (logo, fotoğraf, afiş — `/medya/[ad]`)

```
src/
  app/(site)/        Genel site sayfaları
  app/yonetim/       Yönetim paneli (giriş + (panel))
  actions/           Sunucu işlemleri (spor, kultur, genel)
  components/        Arayüz bileşenleri
  lib/               Veritabanı, yetki, puan durumu, istatistik, sabitler
prisma/              Şema ve demo verisi
```

## Canlıya Alma

1. `prisma/schema.prisma` içinde `provider = "postgresql"` yapın, `.env` içinde `DATABASE_URL`'i PostgreSQL adresinizle değiştirin.
2. `AUTH_SECRET` için uzun, rastgele bir değer verin (`openssl rand -base64 48`).
3. `STORAGE_DIR` kalıcı bir diske işaret etmeli (Docker'da volume).
4. Komutlar:
   ```bash
   npm ci
   npx prisma db push
   npx tsx prisma/seed.ts     # yalnızca demo verisi isteniyorsa — mevcut veriyi SİLER
   npm run build && npm start
   ```
5. İlk girişten sonra demo kullanıcı şifrelerini değiştirin veya silin.

## Komutlar

| Komut | Açıklama |
|---|---|
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` / `npm start` | Üretim derlemesi / sunucusu |
| `npm run typecheck` | TypeScript kontrolü |
| `npm run db:push` | Şemayı veritabanına uygula |
| `npm run db:seed` | Demo verisini yükle (mevcut veriyi siler) |
| `npm run db:reset` | Veritabanını sıfırla + demo verisi |
