import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ÖDEDİ Mİ",
    short_name: "ÖDEDİ Mİ",
    description: "Projeler ve ödemeler için tahsilat paneli",
    start_url: "/",
    display: "standalone",
    background_color: "#0B1626",
    theme_color: "#1D4ED8",
    orientation: "portrait",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
