import type { Metadata } from "next";
import IdxClient from "./IdxClient";
import { idxOffering } from "@/data/idx";

const description =
  "KYGR Solutions is an approved IDX vendor for Central Georgia MLS. Custom, branded property search on your own domain, with listings updated throughout the day. Contact for pricing.";

export const metadata: Metadata = {
  title: "IDX for Real Estate",
  description,
  keywords: [
    "IDX",
    "IDX vendor",
    "Central Georgia MLS",
    "property search",
    "real estate website",
    "KYGR Solutions",
  ],
  alternates: {
    canonical: "/idx",
  },
  openGraph: {
    title: idxOffering.headline,
    description,
    url: "/idx",
  },
};

export default function IdxPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: idxOffering.headline,
    serviceType: "IDX property search",
    description,
    url: "https://kygrsolutions.com/idx",
    provider: {
      "@type": "ProfessionalService",
      name: "KYGR Solutions",
      url: "https://kygrsolutions.com",
    },
    areaServed: "Central Georgia",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <IdxClient />
    </>
  );
}
