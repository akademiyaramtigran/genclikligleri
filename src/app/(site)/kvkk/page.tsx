import type { Metadata } from "next";
import { SITE } from "@/lib/constants";
import { PageHero } from "@/components/ui";

export const metadata: Metadata = { title: "KVKK Aydınlatma Metni" };

export default function KvkkPage() {
  const sections: [string, string][] = [
    ["Veri Sorumlusu", `${SITE.org} (“Organizasyon”), 6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) kapsamında veri sorumlusudur.`],
    ["İşlenen Kişisel Veriler", "Başvuru sahibine ve katılımcılara ait ad-soyad, doğum tarihi, T.C. kimlik numarası, iletişim bilgileri, ilçe, okul bilgisi, fotoğraf, sağlık raporu, veli muvafakatnamesi ve başvuru kapsamında yüklenen belgeler ile maç, performans ve gösterimlere ait görüntü ve video kayıtları."],
    ["İşleme Amaçları", "Liglere, yarışmalara ve festivale katılım başvurularının alınması ve değerlendirilmesi; lisans ve kadro işlemleri; fikstür, puan durumu ve istatistiklerin yayımlanması; etkinliklerin kayıt altına alınarak yayımlanması; katılımcılarla iletişim ve güvenliğin sağlanması."],
    ["Kamuya Açık Bilgiler", "Oyuncu ve sanatçıların adı-soyadı, takımı/grubu, mevkii, forma numarası, yaşı, fotoğrafı, bireysel istatistikleri ve etkinlik videoları sitede yayımlanabilir. T.C. kimlik numarası, iletişim bilgileri, sağlık belgeleri ve diğer başvuru evrakı hiçbir şekilde yayımlanmaz; yalnızca yetkili yöneticiler tarafından görülebilir."],
    ["Aktarım", "Kişisel veriler, yasal yükümlülükler kapsamında yetkili kamu kurum ve kuruluşlarıyla ve etkinliğin gerçekleşmesi için zorunlu olan tesis yönetimleriyle sınırlı olarak paylaşılabilir."],
    ["Saklama Süresi", "Başvuru belgeleri ilgili sezonun bitiminden itibaren 2 yıl, istatistik ve sonuç verileri arşiv amacıyla süresiz saklanır."],
    ["Haklarınız", `KVKK'nın 11. maddesi uyarınca verilerinizin işlenip işlenmediğini öğrenme, düzeltilmesini veya silinmesini talep etme haklarına sahipsiniz. Taleplerinizi ${SITE.email} adresine iletebilirsiniz.`],
    ["18 Yaş Altı Katılımcılar", "18 yaşından küçük katılımcıların başvuruları ancak veli/vasi onayı ile kabul edilir; veli muvafakatnamesi başvuru belgeleri arasında talep edilir."],
  ];
  return (
    <>
      <PageHero eyebrow="Yasal" title="KVKK Aydınlatma Metni" />
      <div className="container-x max-w-3xl space-y-6 py-10">
        {sections.map(([t, b]) => (
          <section key={t} className="card p-6">
            <h2 className="mb-2 font-semibold">{t}</h2>
            <p className="text-sm leading-relaxed text-basalt-600">{b}</p>
          </section>
        ))}
      </div>
    </>
  );
}
