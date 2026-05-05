export const SITE_ORIGIN = "https://www.xn--dedimi-vxa.com";
export const SITE_NAME = "Ödedimi";

export type SeoPageSlug =
  | "freelance-odeme-takibi"
  | "fatura-takip-programi"
  | "tahsilat-takip-paneli"
  | "freelancerlar-icin-odeme-takibi"
  | "freelance-tahsilat-takibi"
  | "proje-odeme-takibi"
  | "fatura-odeme-takibi"
  | "freelancer-odeme-takip-programi"
  | "odeme-takip-tablosu";

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
  {
    slug: "freelance-tahsilat-takibi",
    title: "Freelance Tahsilat Takibi | Ödedimi",
    description:
      "Freelance işler için tahsilat durumunu, ödenen ve bekleyen tutarları proje bazında takip edin.",
    h1: "Freelance tahsilat takibini sadeleştir",
    lead:
      "Freelance çalışanlar için tahsilat takibi; teslim edilen işlerin, kesilen faturaların ve bekleyen ödemelerin düzenli görülmesini sağlar. Ödedimi, bu akışı tek panelde toparlamak için tasarlanmıştır.",
    sections: [
      {
        title: "Bekleyen ödemeleri net gör",
        body:
          "Hangi işin ödendiğini, hangi işin beklediğini ve hangi kayıt için fatura kesildiğini ayrı ayrı takip edebilirsin. Böylece müşterilerle yapılan ödeme konuşmaları daha kontrollü ilerler.",
      },
      {
        title: "Proje bazlı tahsilat akışı",
        body:
          "Her proje kendi kayıtlarıyla ayrılır. Bölüm bölüm ödeme alınan işler, tek seferlik teslimler veya devam eden çalışmalar aynı panelde düzenli tutulabilir.",
      },
      {
        title: "Hızlı dışa aktarım",
        body:
          "Tahsilat kayıtlarını Word, Excel veya PDF olarak dışa aktarabilir, müşteri veya muhasebe paylaşımı için temiz çıktı alabilirsin.",
      },
    ],
    faqs: [
      {
        question: "Freelance tahsilat takibi kimler için uygundur?",
        answer:
          "Freelancerlar, danışmanlar, küçük ajanslar ve proje bazlı çalışan kişiler için uygundur.",
      },
      {
        question: "Ödenen ve bekleyen tutarlar ayrı görülebilir mi?",
        answer:
          "Evet. Panelde toplam, ödenen ve kalan tutarlar ayrı özetlenebilir.",
      },
      {
        question: "Tahsilat takibi mobilde yapılabilir mi?",
        answer:
          "Evet. Ödedimi mobil tarayıcıdan kullanılabilir ve PWA olarak telefona eklenebilir.",
      },
    ],
  },
  {
    slug: "proje-odeme-takibi",
    title: "Proje Ödeme Takibi | Ödedimi",
    description:
      "Projeler için ödeme alındı, ödenmedi ve fatura kesildi durumlarını tek panelde takip edin.",
    h1: "Proje ödeme takibi için net bir panel",
    lead:
      "Birden fazla proje yürütürken ödeme durumlarını hafızada tutmak zorlaşır. Ödedimi, proje ödeme takibini düzenli ve anlaşılır hale getirir.",
    sections: [
      {
        title: "Her projeyi ayrı takip et",
        body:
          "Projeler sol panelde ayrılır; her projenin kendi kayıtları, tutarları ve ödeme durumları bulunur.",
      },
      {
        title: "Durumları tek bakışta gör",
        body:
          "Ödeme alındı, ödenmedi ve fatura kesildi durumları satır bazında izlenebilir. Bu yapı teslim ve tahsilat sürecini karıştırmadan yönetmeyi kolaylaştırır.",
      },
      {
        title: "Toplu düzenleme desteği",
        body:
          "Seçilen kayıtlar üzerinde tek kayda yapılan değişiklikleri toplu uygulayarak yoğun proje listelerinde zaman kazanabilirsin.",
      },
    ],
    faqs: [
      {
        question: "Proje ödeme takibi ne işe yarar?",
        answer:
          "Projelerin ödeme ve fatura durumlarını düzenli göstererek hangi işlerin tahsilat beklediğini netleştirir.",
      },
      {
        question: "Bir projede birden fazla ödeme kaydı tutulabilir mi?",
        answer:
          "Evet. Aynı proje içinde birden fazla iş kalemi veya ödeme kaydı oluşturulabilir.",
      },
      {
        question: "Kayıtlar dışa aktarılabilir mi?",
        answer:
          "Evet. Proje kayıtları Word, Excel ve PDF formatlarında dışa aktarılabilir.",
      },
    ],
  },
  {
    slug: "fatura-odeme-takibi",
    title: "Fatura Ödeme Takibi | Ödedimi",
    description:
      "Fatura kesildi mi, ödeme alındı mı ve kalan tutar ne kadar sorularını proje bazında takip edin.",
    h1: "Fatura ve ödeme takibini aynı ekranda yönet",
    lead:
      "Fatura ve ödeme durumları ayrı tutulduğunda takip zorlaşır. Ödedimi, fatura kesildi ve ödeme alındı bilgilerini aynı kayıt üzerinde görmeni sağlar.",
    sections: [
      {
        title: "Fatura durumunu kayda bağla",
        body:
          "Her ödeme kaydında fatura kesildi bilgisini tutabilir, gerekiyorsa fatura eklerini aynı kayıtla ilişkilendirebilirsin.",
      },
      {
        title: "Ödeme durumuyla birlikte izle",
        body:
          "Bir faturanın kesilmiş olması ödemenin geldiği anlamına gelmez. Bu yüzden fatura ve ödeme durumları ayrı ama aynı satırda izlenir.",
      },
      {
        title: "Vergi seçeneklerini not al",
        body:
          "KDV ve GVK gibi seçenekleri kayıt düzeyinde tutarak tutarların günlük takipte daha anlamlı görünmesini sağlayabilirsin.",
      },
    ],
    faqs: [
      {
        question: "Fatura ödeme takibi nasıl yapılır?",
        answer:
          "Her kayıt için fatura durumu, ödeme durumu, tarih ve tutar bilgisi düzenli tutulur.",
      },
      {
        question: "Fatura eki yüklenebilir mi?",
        answer:
          "Evet. Desteklenen dosya formatlarıyla fatura ekleri kayıtlara bağlanabilir.",
      },
      {
        question: "Ödedimi muhasebe programı yerine geçer mi?",
        answer:
          "Hayır. Ödedimi günlük ödeme ve tahsilat takibine odaklanan sade bir paneldir.",
      },
    ],
  },
  {
    slug: "freelancer-odeme-takip-programi",
    title: "Freelancer Ödeme Takip Programı | Ödedimi",
    description:
      "Freelancerlar için proje, fatura, ödeme ve tahsilat durumlarını düzenli takip eden mobil uyumlu panel.",
    h1: "Freelancer ödeme takip programı",
    lead:
      "Freelancer olarak farklı müşterilerden gelen ödemeleri takip etmek için sade, hızlı ve mobil uyumlu bir panel kullanabilirsin.",
    sections: [
      {
        title: "Müşteri ve proje karmaşasını azalt",
        body:
          "Projeleri ayrı tutarak hangi müşteriden hangi ödeme beklediğini daha kolay görürsün.",
      },
      {
        title: "Freelance iş akışına uygun",
        body:
          "Tasarım, yazılım, video, içerik ve danışmanlık gibi proje bazlı işlerde ödeme durumlarını sade şekilde takip etmeye uygundur.",
      },
      {
        title: "Kendi verini sadece sen gör",
        body:
          "Her kullanıcı kendi hesabıyla giriş yapar ve kendi kayıtlarını görür. Ekip yapısı olmadan bireysel kullanım odaklıdır.",
      },
    ],
    faqs: [
      {
        question: "Freelancer ödeme takip programı ücretsiz kullanılabilir mi?",
        answer:
          "Ödedimi web tabanlı bir ödeme takip paneli olarak bireysel kullanım için tasarlanmıştır.",
      },
      {
        question: "Google ve Facebook ile giriş yapılabilir mi?",
        answer:
          "Evet. Google, Facebook ve e-posta ile giriş seçenekleri desteklenir.",
      },
      {
        question: "Mobil uyumlu mu?",
        answer:
          "Evet. Panel mobil ekranlarda kullanılacak şekilde uyarlanmıştır.",
      },
    ],
  },
  {
    slug: "odeme-takip-tablosu",
    title: "Ödeme Takip Tablosu | Ödedimi",
    description:
      "Excel benzeri ödeme takip tablosu yerine proje bazlı, mobil uyumlu ve dışa aktarılabilir ödeme paneli.",
    h1: "Ödeme takip tablosunu daha düzenli hale getir",
    lead:
      "Ödeme takip tablosu çoğu zaman Excel veya not defteriyle başlar; kayıtlar arttıkça kontrol zorlaşır. Ödedimi bu tablo mantığını proje bazlı ve daha okunabilir bir panele taşır.",
    sections: [
      {
        title: "Tablo düzeni, panel rahatlığı",
        body:
          "Kayıtları satır satır takip ederken toplam, ödenen ve kalan tutarları panel özetlerinde görebilirsin.",
      },
      {
        title: "Sıralama ve durum takibi",
        body:
          "Kayıtları taşıyabilir, durumlarını güncelleyebilir ve ödeme akışını daha düzenli yönetebilirsin.",
      },
      {
        title: "Excel ve PDF çıktısı",
        body:
          "Tablo verilerini gerektiğinde Excel veya PDF olarak dışa aktarabilir, paylaşılabilir çıktılar oluşturabilirsin.",
      },
    ],
    faqs: [
      {
        question: "Ödeme takip tablosu yerine neden panel kullanılmalı?",
        answer:
          "Panel; durum, özet, dışa aktarım ve mobil kullanım gibi ihtiyaçları tabloya göre daha düzenli sunar.",
      },
      {
        question: "Excel çıktısı alınabilir mi?",
        answer:
          "Evet. Ödeme kayıtları Excel formatında dışa aktarılabilir.",
      },
      {
        question: "Ödeme kayıtları sıralanabilir mi?",
        answer:
          "Evet. Kayıtların sırası değiştirilebilir ve proje içinde düzenlenebilir.",
      },
    ],
  },
];

export const getSeoPage = (slug: SeoPageSlug) =>
  seoPages.find((page) => page.slug === slug);
