import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ödedimi - Freelance Ödeme Takibi",
    short_name: "Ödedimi",
    description:
      "Freelance projelerde ödeme, fatura ve tahsilat durumunu tek panelden takip et.",
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
