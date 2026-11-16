import type { Metadata } from "next";
import WebsiteDesignMiddleGeorgiaClient from "./WebsiteDesignMiddleGeorgiaClient";
import {
  EMAIL,
  PHONE_SCHEMA,
  WEBSITE_DESIGN_MG_PATH,
  websiteDesignMgAreaServed,
  websiteDesignMgDescription,
  websiteDesignMgFaqs,
  websiteDesignMgH1,
  websiteDesignMgTitle,
} from "@/data/websiteDesignMiddleGeorgia";

export const metadata: Metadata = {
  // The root layout title template appends " | KYGR Solutions".
  title: websiteDesignMgTitle,
  description: websiteDesignMgDescription,
  keywords: [
    "web designer Warner Robins GA",
    "website design Macon GA",
    "web design Perry GA",
    "web design Byron GA",
    "Middle Georgia web designer",
    "custom website small business Georgia",
    "KYGR Solutions",
  ],
  alternates: {
    canonical: WEBSITE_DESIGN_MG_PATH,
  },
  openGraph: {
    title: websiteDesignMgH1,
    description: websiteDesignMgDescription,
    url: WEBSITE_DESIGN_MG_PATH,
  },
};

export default function WebsiteDesignMiddleGeorgiaPage() {
  const professionalService = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: "KYGR Solutions",
    url: "https://kygrsolutions.com",
    telephone: PHONE_SCHEMA,
    email: EMAIL,
    description: websiteDesignMgDescription,
    founder: { "@type": "Person", name: "Kyle Greer" },
    areaServed: [
      ...websiteDesignMgAreaServed.map((name) => ({
        "@type": "City",
        name,
      })),
      { "@type": "AdministrativeArea", name: "Middle Georgia" },
      { "@type": "State", name: "Georgia" },
    ],
  };

  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: websiteDesignMgFaqs.map((faq) => ({
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(professionalService) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPage) }}
      />
      <WebsiteDesignMiddleGeorgiaClient />
    </>
  );
}
