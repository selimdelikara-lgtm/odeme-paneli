import type { Metadata, Viewport } from "next";
import "./globals.css";
import PwaRegister from "./pwa-register";

const siteUrl = new URL("https://www.xn--dedimi-vxa.com");
const siteTitle = "Ödedimi | Freelance Ödeme ve Tahsilat Takip Paneli";
const siteDescription =
  "Freelance projelerde ödeme, fatura ve tahsilat durumunu tek panelden takip et. Kayıtlarını düzenle, dışa aktar ve mobilde kolayca yönet.";

export const metadata: Metadata = {
  metadataBase: siteUrl,
  applicationName: "Ödedimi",
  title: {
    default: siteTitle,
    template: "%s | Ödedimi",
  },
  description: siteDescription,
  manifest: "/manifest.webmanifest",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: "/",
    siteName: "Ödedimi",
    locale: "tr_TR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  appleWebApp: {
    capable: true,
    title: "Ödedimi",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/images/odedimi-logo.svg", type: "image/svg+xml" },
    ],
    apple: "/images/odedimi-logo.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#1D4ED8",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Ödedimi",
    alternateName: "Ödedi mi",
    url: siteUrl.toString(),
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    inLanguage: "tr-TR",
    description: siteDescription,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "TRY",
    },
    featureList: [
      "Freelance ödeme takibi",
      "Fatura takip paneli",
      "Tahsilat takibi",
      "PDF ve Excel dışa aktarım",
      "Mobil uyumlu PWA",
    ],
  };

  return (
    <html lang="tr" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
