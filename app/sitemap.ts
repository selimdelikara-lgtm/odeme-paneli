import type { MetadataRoute } from "next";
import { seoPages, SITE_ORIGIN } from "./seo-pages";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: `${SITE_ORIGIN}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_ORIGIN}/privacy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.35,
    },
    {
      url: `${SITE_ORIGIN}/data-deletion`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.35,
    },
    ...seoPages.map((page) => ({
      url: `${SITE_ORIGIN}/${page.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.82,
    })),
  ];
}
