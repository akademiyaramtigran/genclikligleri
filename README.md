# Diyarbakır Gençlik Ligleri 🏆🎤🎭

Diyarbakır'ın 17 ilçesindeki gençlik organizasyonunu **tek bir platformda** yöneten web sitesi:

- **Spor:** Futbol, basketbol, voleybol, hentbol — **erkek ve kadın** ligleri; puan durumu, fikstür, krallık, oyuncu profilleri, YouTube maç videoları
- **Müzik:** “Genç Sesler” yarışması — turlar, jüri puanı, halk oylaması
- **Tiyatro:** Gençlik Tiyatro Festivali — gün gün program, oyunlar, topluluklar, ödüller
- **Başvurular:** Dönemli başvurular, şartlar, belge yükleme, takip kodu
- **Yönetim paneli:** Birim bazlı yetkilerle (Spor / Müzik / Tiyatro) tüm organizasyonun yönetimi

**Altyapı:** GitHub Pages (site) + Firebase (Authentication + Firestore). Sunucu yok, aylık sunucu ücreti yok.

---

## Canlıya Alma (bir kez yapılır)

### 1. Firebase projesi
1. [console.firebase.google.com](https://console.firebase.google.com) → **Proje ekle**
2. **Authentication → Sign-in method:** *E-posta/Şifre* ve *Anonim* sağlayıcılarını etkinleştirin
3. **Authentication → Settings → Authorized domains:** `<kullanıcı-adınız>.github.io` ekleyin
4. **Firestore Database → Veritabanı oluştur** (konum: `eur3`, üretim modu)
5. **Firestore → Kurallar:** bu depodaki [`firestore.rules`](firestore.rules) dosyasının tamamını yapıştırıp **Yayınla**
6. **Proje ayarları → Uygulamalarınız → Web `</>`:** çıkan `firebaseConfig` değerlerini [`src/firebase-config.ts`](src/firebase-config.ts) dosyasına yazın

> Firebase Storage gerekmez. Başvuru belgeleri Firestore'da parçalı olarak (dosya başına 5 MB'a kadar) saklanır; logo ve fotoğraflar tarayıcıda otomatik sıkıştırılır.

### 2. GitHub Pages
1. Depo → **Settings → Pages → Source: GitHub Actions**
2. Kodu `main` dalına alın. [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) siteyi otomatik derleyip yayınlar.
3. Site adresi: `https://<kullanıcı-adınız>.github.io/<depo-adı>/`

### 3. İlk yönetici
1. `https://…/yonetim/kurulum/` adresine gidin
2. Süper yönetici hesabınızı oluşturun (bu ekran yalnızca **bir kez** çalışır)
3. İsterseniz **Demo Verisi Yükle** ile örnek içerik (8 lig, ~550 oyuncu, 240 maç, müzik yarışması, tiyatro festivali) ekleyin

Sonraki yöneticileri panelden **Kullanıcılar** bölümünde eklersiniz (Spor / Müzik / Tiyatro birim yetkisiyle).

---

## Özellikler

### Genel site
| Sayfa | Adres |
|---|---|
| Ana sayfa (Spor / Müzik / Tiyatro geçişi, skor bandı, açık başvuru geri sayımı) | `/` |
| Lig Merkezi (Erkek / Kadın geçişi) | `/spor?cinsiyet=kadin` |
| Lig (puan durumu, fikstür, istatistik, disiplin, kurallar) | `/spor/lig?s=…` |
| Takım / Oyuncu / Maç (YouTube videosu) | `/spor/takim?s=…`, `/spor/oyuncu?s=…`, `/spor/mac?id=…` |
| Fikstür, Krallık, Takımlar, Oyuncular | `/spor/fikstur`, `/spor/krallik`, … |
| Müzik yarışması + halk oylaması (günde 1 oy) | `/muzik` |
| Tiyatro festivali programı | `/tiyatro` |
| Başvurular, 5 adımlı başvuru formu, takip | `/basvuru`, `/basvuru/detay?s=…`, `/basvuru/takip` |
| Videolar, Duyurular, Tesisler, Arama, İletişim, KVKK | |

### Puanlama (otomatik)
Futbol G3-B1-M0 · Basketbol G2-M1 · Voleybol 3-0/3-1→3P, 3-2→2P, 2-3→1P · Hentbol G2-B1-M0 · ceza puanı desteği

### Yönetim paneli (`/yonetim`)
- Başvuru inceleme, belge indirme, **tek tıkla onay** → takım + tüm oyuncular / yarışmacı / topluluk + oyun otomatik oluşur
- Başvuru dönemleri (şartlar, yaş/kişi sınırı, istenen belgeler)
- Ligler, **otomatik fikstür** (round-robin, tek/çift devre), takımlar, oyuncular, maç sonucu, olay ve oyuncu istatistiği girişi
- Müzik: tur yönetimi, jüri puanı, halk oyunu puana çevirme, **turu sonuçlandırma**
- Tiyatro: gösterim programı, atölyeler, ödüller
- Duyurular, videolar, mesajlar, kullanıcılar, işlem kayıtları

## Güvenlik
Ziyaretçiler veritabanına doğrudan bağlandığı için tüm yetki kontrolü [`firestore.rules`](firestore.rules) içindedir:
başvurular, belgeler, T.C. kimlik numaraları ve mesajlar yalnızca yetkili yöneticilerce okunabilir; ziyaretçiler yalnızca
başvuru/mesaj oluşturabilir ve günde bir oy kullanabilir; birim yöneticileri yalnızca kendi birimlerine yazabilir.

## Geliştirme
```bash
npm install
npm run dev            # src/firebase-config.ts içindeki gerçek projeye bağlanır
```
Yerel emülatörle (gerçek veriye dokunmadan) test:
```bash
npx firebase-tools emulators:start --only auth,firestore --project demo-dgl
npm run dev:emu        # ardından http://localhost:3000/yonetim/kurulum
```

## Teknik Yapı
Next.js 15 (statik dışa aktarma) · TypeScript · Tailwind CSS · Firebase Auth + Firestore
```
src/app/(site)/     Genel site
src/app/yonetim/    Yönetim paneli
src/actions/        Yazma işlemleri (spor, kultur, genel, public)
src/lib/            Veri katmanı, puan durumu, istatistik, dosya saklama, demo verisi
firestore.rules     Güvenlik kuralları
```
