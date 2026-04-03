import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Odeme Paneli",
  description: "Projeler ve odemeler icin takip paneli",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
