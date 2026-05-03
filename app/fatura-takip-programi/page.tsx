import type { Metadata } from "next";
import { MarketingPage } from "../_components/MarketingPage";
import { getSeoPage, SITE_ORIGIN } from "../seo-pages";

const page = getSeoPage("fatura-takip-programi")!;

export const metadata: Metadata = {
  title: page.title,
  description: page.description,
  alternates: {
    canonical: `${SITE_ORIGIN}/${page.slug}`,
  },
};

export default function FaturaTakipProgramiPage() {
  return <MarketingPage page={page} />;
}
