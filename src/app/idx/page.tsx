import type { Metadata } from "next";
import IdxClient from "./IdxClient";
import {
  IDX_PAGE_DESCRIPTION,
  IDX_PAGE_H1,
  IDX_PAGE_PATH,
  IDX_PAGE_TITLE,
  IDX_PAGE_TWITTER_TITLE,
  idxFaqs,
} from "@/data/idxPage";
import { CANONICAL_SITE_URL } from "@/lib/siteUrl";

export const metadata: Metadata = {
  // The root layout title template appends " | KYGR Solutions".
  title: IDX_PAGE_TITLE,
  description: IDX_PAGE_DESCRIPTION,
  keywords: [
    "IDX",
    "IDX vendor",
    "Georgia MLS",
    "Central Georgia MLS",
    "property search",
    "real estate website",
    "KYGR Solutions",
  ],
  alternates: {
    canonical: IDX_PAGE_PATH,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "KYGR Solutions",
    title: IDX_PAGE_H1,
    description: IDX_PAGE_DESCRIPTION,
    url: IDX_PAGE_PATH,
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "KYGR Solutions Logo",
      },
    ],
  },
  // Metadata is merged shallowly, so a page-level twitter object replaces the
  // layout's. Repeat the card, image, and creator so they are not lost.
  twitter: {
    card: "summary_large_image",
    title: IDX_PAGE_TWITTER_TITLE,
    description: IDX_PAGE_DESCRIPTION,
    images: ["/logo.png"],
    creator: "@kygrsolutions",
  },
};

export default function IdxPage() {
  const pageUrl = `${CANONICAL_SITE_URL}${IDX_PAGE_PATH}`;

  const service = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: IDX_PAGE_H1,
    serviceType: "IDX property search",
    description: IDX_PAGE_DESCRIPTION,
    url: pageUrl,
    provider: {
      "@type": "ProfessionalService",
      name: "KYGR Solutions",
      url: CANONICAL_SITE_URL,
    },
    areaServed: "Georgia",
  };

  // Built from the same array as the visible accordion so they cannot drift.
  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    url: pageUrl,
    mainEntity: idxFaqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(service) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPage) }}
      />
      <IdxClient />
    </>
  );
}
