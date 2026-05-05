import Link from "next/link";
import { SITE_NAME, SITE_ORIGIN, type SeoPage, seoPages } from "../seo-pages";

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at 12% 8%, rgba(37,99,235,0.20), transparent 34%), linear-gradient(180deg, #071326 0%, #0B1626 45%, #F4F7FB 45%, #F4F7FB 100%)",
    color: "#14213D",
    fontFamily: 'Satoshi, Inter, "Segoe UI", Arial, sans-serif',
  },
  shell: {
    width: "min(1120px, calc(100% - 32px))",
    margin: "0 auto",
    padding: "28px 0 56px",
  },
  nav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    color: "#FFFFFF",
    marginBottom: 48,
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontWeight: 900,
    fontSize: 20,
  },
  logo: {
    width: 34,
    height: 34,
    borderRadius: 12,
    background: "#FFFFFF",
    color: "#0B1626",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 900,
  },
  navLink: {
    color: "#DCEBFF",
    textDecoration: "none",
    fontWeight: 800,
    fontSize: 14,
  },
  hero: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.1fr) minmax(300px, 0.9fr)",
    gap: 28,
    alignItems: "stretch",
    marginBottom: 28,
  },
  heroCard: {
    borderRadius: 28,
    padding: 36,
    background: "rgba(255,255,255,0.96)",
    border: "1px solid rgba(226,232,240,0.92)",
    boxShadow: "0 24px 70px rgba(15,23,42,0.16)",
  },
  kicker: {
    color: "#2563EB",
    fontWeight: 900,
    letterSpacing: 1.1,
    fontSize: 12,
    textTransform: "uppercase" as const,
    marginBottom: 14,
  },
  h1: {
    margin: 0,
    fontSize: "clamp(34px, 6vw, 62px)",
    lineHeight: 0.98,
    letterSpacing: "-2px",
    fontWeight: 950,
    color: "#111827",
  },
  lead: {
    margin: "20px 0 0",
    color: "#526173",
    fontSize: 18,
    lineHeight: 1.65,
    fontWeight: 650,
  },
  ctaRow: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: 12,
    marginTop: 28,
  },
  primaryCta: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 46,
    padding: "0 18px",
    borderRadius: 14,
    background: "#2563EB",
    color: "#FFFFFF",
    textDecoration: "none",
    fontWeight: 900,
  },
  secondaryCta: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 46,
    padding: "0 18px",
    borderRadius: 14,
    background: "#EEF4FF",
    color: "#1D4ED8",
    textDecoration: "none",
    fontWeight: 900,
  },
  aside: {
    borderRadius: 28,
    padding: 28,
    background: "linear-gradient(135deg, #123A8F, #0B1F45)",
    color: "#FFFFFF",
    boxShadow: "0 24px 70px rgba(15,23,42,0.18)",
    display: "grid",
    alignContent: "center",
    gap: 16,
  },
  metric: {
    borderRadius: 20,
    padding: 18,
    background: "rgba(255,255,255,0.10)",
    border: "1px solid rgba(255,255,255,0.14)",
  },
  metricLabel: {
    color: "#BFD3FF",
    fontSize: 12,
    fontWeight: 900,
    textTransform: "uppercase" as const,
    letterSpacing: 0.8,
  },
  metricValue: {
    marginTop: 8,
    fontSize: 32,
    fontWeight: 950,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 16,
    marginTop: 22,
  },
  sectionCard: {
    background: "#FFFFFF",
    border: "1px solid #E3EAF5",
    borderRadius: 22,
    padding: 22,
    boxShadow: "0 16px 44px rgba(15,23,42,0.08)",
  },
  sectionTitle: {
    margin: 0,
    fontSize: 19,
    fontWeight: 950,
    color: "#111827",
  },
  sectionBody: {
    margin: "12px 0 0",
    color: "#5B677A",
    lineHeight: 1.65,
    fontSize: 15,
    fontWeight: 600,
  },
  faq: {
    marginTop: 18,
    background: "#FFFFFF",
    border: "1px solid #E3EAF5",
    borderRadius: 24,
    padding: 28,
    boxShadow: "0 16px 44px rgba(15,23,42,0.08)",
  },
  faqTitle: {
    margin: "0 0 16px",
    fontSize: 26,
    fontWeight: 950,
  },
  details: {
    borderTop: "1px solid #E6ECF5",
    padding: "16px 0",
  },
  summary: {
    cursor: "pointer",
    fontWeight: 900,
    color: "#111827",
  },
  footerLinks: {
    marginTop: 24,
    display: "flex",
    flexWrap: "wrap" as const,
    gap: 10,
  },
  footerLink: {
    color: "#1D4ED8",
    textDecoration: "none",
    fontWeight: 850,
  },
};

export function MarketingPage({ page }: { page: SeoPage }) {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: page.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: SITE_NAME,
        item: `${SITE_ORIGIN}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: page.h1,
        item: `${SITE_ORIGIN}/${page.slug}`,
      },
    ],
  };

  return (
    <main style={styles.page}>
      <style>{`
        @media (max-width: 820px) {
          .marketing-shell { width: min(100% - 24px, 1120px) !important; padding-top: 18px !important; }
          .marketing-nav { margin-bottom: 24px !important; }
          .marketing-hero { grid-template-columns: 1fr !important; gap: 14px !important; }
          .marketing-hero-card { padding: 24px !important; border-radius: 22px !important; }
          .marketing-aside { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; padding: 14px !important; border-radius: 22px !important; }
          .marketing-metric { padding: 12px !important; border-radius: 16px !important; }
          .marketing-metric-value { font-size: 18px !important; }
          .marketing-grid { grid-template-columns: 1fr !important; gap: 12px !important; }
          .marketing-faq { padding: 20px !important; border-radius: 20px !important; }
        }
        @media (max-width: 520px) {
          .marketing-aside { grid-template-columns: 1fr !important; }
          .marketing-cta-row { flex-direction: column !important; }
          .marketing-cta-row a { width: 100% !important; }
        }
      `}</style>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div style={styles.shell} className="marketing-shell">
        <nav style={styles.nav} className="marketing-nav" aria-label="Ana navigasyon">
          <Link href="/" style={styles.brand}>
            <span style={styles.logo}>Ö</span>
            <span>{SITE_NAME}</span>
          </Link>
          <Link href="/" style={styles.navLink}>
            Panele giriş yap
          </Link>
        </nav>

        <section style={styles.hero} className="marketing-hero">
          <div style={styles.heroCard} className="marketing-hero-card">
            <div style={styles.kicker}>Ödeme ve tahsilat takibi</div>
            <h1 style={styles.h1}>{page.h1}</h1>
            <p style={styles.lead}>{page.lead}</p>
            <div style={styles.ctaRow} className="marketing-cta-row">
              <Link href="/" style={styles.primaryCta}>
                Ücretsiz başla
              </Link>
              <Link href="/tahsilat-takip-paneli" style={styles.secondaryCta}>
                Tahsilat panelini incele
              </Link>
            </div>
          </div>
          <aside style={styles.aside} className="marketing-aside" aria-label="Ödedimi özellik özeti">
            <div style={styles.metric} className="marketing-metric">
              <div style={styles.metricLabel}>Takip</div>
              <div style={styles.metricValue} className="marketing-metric-value">Proje + Fatura</div>
            </div>
            <div style={styles.metric} className="marketing-metric">
              <div style={styles.metricLabel}>Durumlar</div>
              <div style={styles.metricValue} className="marketing-metric-value">Ödendi / Bekliyor</div>
            </div>
            <div style={styles.metric} className="marketing-metric">
              <div style={styles.metricLabel}>Çıktı</div>
              <div style={styles.metricValue} className="marketing-metric-value">PDF / Excel</div>
            </div>
          </aside>
        </section>

        <section style={styles.grid} className="marketing-grid" aria-label="Öne çıkan özellikler">
          {page.sections.map((section) => (
            <article key={section.title} style={styles.sectionCard}>
              <h2 style={styles.sectionTitle}>{section.title}</h2>
              <p style={styles.sectionBody}>{section.body}</p>
            </article>
          ))}
        </section>

        <section style={styles.faq} className="marketing-faq">
          <h2 style={styles.faqTitle}>Sık sorulan sorular</h2>
          {page.faqs.map((faq) => (
            <details key={faq.question} style={styles.details}>
              <summary style={styles.summary}>{faq.question}</summary>
              <p style={styles.sectionBody}>{faq.answer}</p>
            </details>
          ))}
          <div style={styles.footerLinks}>
            {seoPages
              .filter((item) => item.slug !== page.slug)
              .map((item) => (
                <Link key={item.slug} href={`/${item.slug}`} style={styles.footerLink}>
                  {item.h1}
                </Link>
              ))}
          </div>
        </section>

        <p style={{ ...styles.sectionBody, marginTop: 22, color: "#718096" }}>
          Kalıcı bağlantı: {SITE_ORIGIN}/{page.slug}
        </p>
      </div>
    </main>
  );
}
