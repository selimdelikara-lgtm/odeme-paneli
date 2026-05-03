export const SITE_ORIGIN = "https://www.xn--dedimi-vxa.com";
export const SITE_NAME = "Ödedimi";

export type SeoPageSlug =
  | "freelance-odeme-takibi"
  | "fatura-takip-programi"
  | "tahsilat-takip-paneli"
  | "freelancerlar-icin-odeme-takibi";

export type SeoPage = {
  slug: SeoPageSlug;
  title: string;
  description: string;
  h1: string;
  lead: string;
  sections: Array<{
    title: string;
    body: string;
  }>;
  faqs: Array<{
    question: string;
    answer: string;
  }>;
};

export const seoPages: SeoPage[] = [
  {
    slug: "freelance-odeme-takibi",
    title: "Freelance Ödeme Takibi | Ödedimi",
    description:
      "Freelance işlerde ödeme alındı, ödenmedi ve fatura kesildi durumlarını tek panelden takip edin.",
    h1: "Freelance ödeme takibi için sade panel",
    lead:
      "Freelance çalışanlar için en zor konulardan biri işi teslim ettikten sonra hangi ödemenin geldiğini, hangisinin beklediğini ve hangi iş için fatura kesildiğini düzenli takip etmektir. Ödedimi bu süreci tek ekranda toparlar.",
    sections: [
      {
        title: "Projelerini ödeme durumuna göre ayır",
        body:
          "Her proje için ödeme alındı, ödenmedi ve fatura kesildi durumlarını ayrı ayrı izleyebilirsin. Böylece not defteri, mesaj geçmişi veya dağınık tablolar arasında kaybolmadan hangi işin tahsilat beklediğini hızlıca görürsün.",
      },
      {
        title: "Freelancer akışına uygun kayıt düzeni",
        body:
          "Tek seferlik işler, bölüm bölüm ödeme alınan projeler veya birden fazla teslim kalemi olan çalışmalar aynı yapıda takip edilebilir. Kayıtları sıralayabilir, güncelleyebilir ve gerektiğinde dışa aktarabilirsin.",
      },
      {
        title: "Mobil kullanım için tasarlandı",
        body:
          "Müşteri görüşmesi, saha işi veya seyahat sırasında paneli telefondan açıp ödeme durumunu kontrol edebilirsin. Amaç muhasebe karmaşası yaratmak değil, günlük tahsilat takibini hızlı ve anlaşılır tutmaktır.",
      },
    ],
    faqs: [
      {
        question: "Freelance ödeme takibi neden önemli?",
        answer:
          "Teslim edilen işlerin tahsilat durumunu düzenli görmek nakit akışını kontrol etmeyi kolaylaştırır ve unutulan ödemelerin önüne geçer.",
      },
      {
        question: "Ödedimi muhasebe programı mı?",
        answer:
          "Ödedimi kapsamlı bir muhasebe programı değil; freelance projelerde ödeme, fatura ve tahsilat durumlarını takip etmeye odaklanan sade bir paneldir.",
      },
      {
        question: "Mobilde kullanılabilir mi?",
        answer:
          "Evet. Panel mobil tarayıcıdan kullanılabilir ve PWA olarak telefona eklenebilir.",
      },
    ],
  },
  {
    slug: "fatura-takip-programi",
    title: "Fatura Takip Programı | Ödedimi",
    description:
      "Kesilen ve bekleyen faturaları proje bazında takip edin; ödeme durumlarıyla birlikte düzenli görün.",
    h1: "Fatura takip programı yerine pratik bir tahsilat paneli",
    lead:
      "Fatura kesildi mi, ödeme geldi mi, hangi kayıt bekliyor? Ödedimi fatura durumlarını ödeme kayıtlarıyla birlikte göstererek freelance çalışanların ve küçük ekiplerin günlük takibini sadeleştirir.",
    sections: [
      {
        title: "Fatura ve ödeme aynı satırda",
        body:
          "Bir kaydın fatura durumu ile ödeme durumunu ayrı yerlerde tutmak yerine aynı panelde görebilirsin. Bu yaklaşım özellikle proje bazlı çalışanlar için gereksiz karmaşayı azaltır.",
      },
      {
        title: "Ek dosya ve dışa aktarım",
        body:
          "Fatura dosyalarını kayıtlarla ilişkilendirebilir, ödeme tablonu Word, Excel veya PDF formatında dışa aktarabilirsin. Bu sayede müşteri veya ekip içi paylaşım için temiz çıktı alırsın.",
      },
      {
        title: "Vergi notlarını takip et",
        body:
          "KDV ve GVK gibi vergi seçeneklerini kayıt düzeyinde tutarak tutarları daha anlamlı izleyebilirsin. Panel, günlük takip için hızlı bir özet oluşturur.",
      },
    ],
    faqs: [
      {
        question: "Fatura takip programı kimler için kullanışlıdır?",
        answer:
          "Freelancerlar, danışmanlar, küçük ajanslar ve proje bazlı çalışan kişiler için fatura ve tahsilat durumunu düzenli takip etmekte kullanışlıdır.",
      },
      {
        question: "PDF veya Excel çıktı alınabilir mi?",
        answer:
          "Evet. Kayıtlar Word, Excel ve PDF formatlarında dışa aktarılabilir.",
      },
      {
        question: "Fatura dosyası yüklenebilir mi?",
        answer:
          "Evet. Desteklenen dosya formatlarıyla fatura eklerini kayıtlarla ilişkilendirebilirsin.",
      },
    ],
  },
  {
    slug: "tahsilat-takip-paneli",
    title: "Tahsilat Takip Paneli | Ödedimi",
    description:
      "Ödenen, kalan ve bekleyen tutarları proje bazında takip eden mobil uyumlu tahsilat paneli.",
    h1: "Tahsilat takip paneli ile gelir akışını netleştir",
    lead:
      "Tahsilat takibi yalnızca toplam tutarı görmek değildir. Hangi projenin ödendiğini, hangisinin beklediğini ve kalan tutarın ne olduğunu düzenli görmek gerekir. Ödedimi bunu sade bir panelde toplar.",
    sections: [
      {
        title: "Toplam, ödenen ve kalan tutar",
        body:
          "Ana ekranda toplam kayıt, ödeme alınan işler, kesilen faturalar ve kalan tahsilat gibi metrikleri hızlıca görebilirsin. Bu özet günlük finans kontrolünü hızlandırır.",
      },
      {
        title: "Proje bazlı tahsilat görünümü",
        body:
          "Her proje kendi kayıtlarıyla ayrılır. Böylece müşteriye, işe veya kampanyaya göre hangi tahsilatların tamamlandığını karıştırmadan izleyebilirsin.",
      },
      {
        title: "Gizlilik modu",
        body:
          "Panel açıkken ekrandaki rakamların görünmesini istemediğinde gizleme modu kullanabilirsin. Bu özellik ortak alanlarda çalışırken finansal tutarları korumaya yardımcı olur.",
      },
    ],
    faqs: [
      {
        question: "Tahsilat takip paneli ne işe yarar?",
        answer:
          "Ödenen, bekleyen ve kalan tutarları proje bazında takip ederek gelir akışını daha görünür hale getirir.",
      },
      {
        question: "Müşterilere göre takip yapılabilir mi?",
        answer:
          "Projeleri müşteri veya iş adıyla ayırarak her müşteri için ayrı tahsilat akışı oluşturabilirsin.",
      },
      {
        question: "Rakamları ekranda gizlemek mümkün mü?",
        answer:
          "Evet. Gizlilik modu finansal rakamları ekranda görünmeyecek şekilde maskeleyebilir.",
      },
    ],
  },
  {
    slug: "freelancerlar-icin-odeme-takibi",
    title: "Freelancerlar İçin Ödeme Takibi | Ödedimi",
    description:
      "Freelancerlar için proje, fatura ve ödeme durumlarını düzenli takip etmeye yarayan sade ödeme paneli.",
    h1: "Freelancerlar için ödeme takibini kolaylaştır",
    lead:
      "Freelancer olarak birden fazla müşteriyle çalışırken ödeme takibini sadece hafızaya bırakmak risklidir. Ödedimi, iş kalemlerini ve ödeme durumlarını daha düzenli yönetmek için tasarlanmıştır.",
    sections: [
      {
        title: "İş kalemlerini unutma",
        body:
          "Tek bir proje içinde birden fazla kayıt oluşturabilir, teslim bölümlerini ayrı ayrı takip edebilirsin. Bu yapı özellikle video, tasarım, yazılım, danışmanlık ve içerik işleri için uygundur.",
      },
      {
        title: "Basit ama odaklı",
        body:
          "Amaç ağır bir finans yazılımı kullanmak zorunda kalmadan ödeme durumunu net görmek. Bu yüzden panel kayıt, durum, tarih, tutar ve dışa aktarım gibi temel ihtiyaçlara odaklanır.",
      },
      {
        title: "Her yerden erişim",
        body:
          "Web tabanlı yapı sayesinde bilgisayardan veya telefondan giriş yapabilir, kendi hesabındaki verileri görebilirsin. Her kullanıcı kendi verisini görür.",
      },
    ],
    faqs: [
      {
        question: "Freelancerlar için ödeme takibi nasıl yapılmalı?",
        answer:
          "Her iş kalemi için proje adı, tutar, fatura durumu ve ödeme durumunu düzenli kaydetmek en pratik yöntemdir.",
      },
      {
        question: "Ödedimi ekip kullanımı için mi?",
        answer:
          "Şu an odak bireysel kullanımdır. Her kullanıcı kendi hesabıyla giriş yapar ve kendi verilerini görür.",
      },
      {
        question: "Google veya Facebook ile giriş yapılabilir mi?",
        answer:
          "Evet. Desteklenen OAuth sağlayıcıları üzerinden giriş yapılabilir; ayrıca e-posta ile hesap oluşturma akışı da bulunur.",
      },
    ],
  },
];

export const getSeoPage = (slug: SeoPageSlug) =>
  seoPages.find((page) => page.slug === slug);
