import { IDX_PATH, idxOffering } from "./idx";
import { WEBSITE_DESIGN_MG_PATH } from "./websiteDesignMiddleGeorgia";

/**
 * Copy and metadata that only the expanded /idx page uses. The short shared
 * offering in `idx.ts` still feeds the homepage and /services; do not move
 * page-only claims into it.
 */

// The root layout title template appends " | KYGR Solutions".
export const IDX_PAGE_TITLE = "Custom IDX for Georgia MLS Agents";
export const IDX_PAGE_TWITTER_TITLE = `${IDX_PAGE_TITLE} | KYGR Solutions`;
export const IDX_PAGE_DESCRIPTION =
  "Approved IDX vendor for Georgia MLS and Central Georgia MLS. Branded property search on your own domain, including one search across both feeds.";
export const IDX_PAGE_H1 =
  "Custom IDX for Georgia MLS and Central Georgia MLS agents";

export const IDX_PAGE_PATH = IDX_PATH;

export const DEXTER_PROJECT_PATH = "/projects/dexter-gordy-realtor";
export const LISA_PROJECT_PATH = "/projects/lisa-dunn-real-estate";
export const DEXTER_LIVE_URL = "https://dextergordyrealtor.net";
export const LISA_LIVE_URL = "https://lisardunnrealtor.com";

// Official sources named on the page.
export const GAMLS_WEBSITE_URL =
  "https://www.gamls.com/products/officeagentwebsite";
export const GAMLS_LISTING_DATA_URL =
  "https://www.gamls.com/membership/listingdata";
export const GAMLS_RETS_FAQ_URL = "https://www.gamls.com/vendors/retsfaq";

export const idxPageIntro =
  "I'm Kyle Greer, an approved IDX vendor for Georgia MLS and Central Georgia MLS. I build branded property search into your own website, on your domain — not a clunky third-party page. If you belong to both MLSs, buyers can search them in one place, and a home listed on both shows up once. I handle the paperwork with your broker, and I don't stop until the search works the way you expect.";

/**
 * Extras that appear only on /idx. Each is already live on the Dexter Gordy
 * or Lisa Dunn project pages. Do not add them to `idxOffering.features`,
 * which the homepage and /services render.
 */
export const idxPageExtraFeatures = [
  "Map-based home search, as on the Dexter Gordy and Lisa Dunn sites",
  "Lead forms on listing pages, such as a Dream Home request or an “ask me about this home” form",
] as const;

export const idxBuildIntro =
  "This is what goes into the search I build for an agent's site.";
export const idxBuildExtrasIntro =
  "Two more things I have built into agent sites, both on the project pages below:";

export const idxWhyCustom = {
  heading:
    "Do you need a custom IDX if Georgia MLS already gives you a website?",
  intro:
    "Maybe not. Georgia MLS includes a branded office and agent website with every membership, at no additional cost. Its listing data updates every 30 minutes, and it comes with a private client portal and mobile-friendly themes.",
  linkLabel: "Georgia MLS office and agent website",
  outro:
    "If that site already does what you need, you may not need a custom build, and I will tell you so. A custom build is worth talking about when you want:",
  reasons: [
    "Search on your own domain, matching the rest of your site.",
    "One search across both Georgia MLS and Central Georgia MLS, if you participate in both.",
    "Something the included site does not give you, such as a bilingual site (Lisa Dunn's is in English and Spanish), a map that starts in Middle Georgia (Dexter Gordy's does), or a lead flow built around how you work (the Dream Home request on Dexter's listings).",
    "To work directly with the person building it, until the search works the way you expect.",
  ],
} as const;

export const idxBothMls = {
  heading: "One search for Georgia MLS and Central Georgia MLS",
  intro:
    "Many Middle Georgia agents participate in both MLSs. Buyers should not have to search twice, and a home listed on both should not appear twice.",
  dexter:
    "On Dexter Gordy's site I built a map-based search that starts in Middle Georgia, with a one-click “Search all of Georgia” option. It merges both feeds, and a home listed on both MLSs shows up once.",
  cgmlsOnly:
    "If you are only on Central Georgia MLS, that is enough for a custom search on that feed. Lisa Dunn's site is the example: it searches Central Georgia MLS only, not both MLSs.",
} as const;

export const idxWhatIs = {
  heading: "What IDX is — and what this page is not",
  body: "IDX, or Internet Data Exchange, is a mutual agreement between brokers that allows them to advertise each other's listings on their websites, and brokers must follow the display rules.",
  linkLabel: "Georgia MLS explains listing data",
  after:
    "IDX on an agent's website is not the same as listing syndication to consumer portals such as Zillow. This page is a short introduction, not a full explainer.",
} as const;

export const idxDifferent = {
  heading: "How working with me is different",
  points: [
    {
      title: "You work with me",
      body: "One person, an approved vendor for both MLSs, from the first conversation through launch.",
    },
    {
      title: "The search lives on your domain",
      body: "The design is matched to your site, with no clunky third-party pages.",
    },
    {
      title: "I handle the paperwork with your broker",
      body: "Your broker signs a form approving your website, I keep it on file for MLS audits, and I handle that paperwork.",
    },
    {
      title: "I don't stop until it works the way you expect",
      body: "I check each MLS's display rules, fix what feels off, and stay with the site after launch.",
    },
  ],
} as const;

export const idxWork = {
  heading: "Work I've done for Georgia agents",
  dexter: {
    title: "Dexter Gordy Realtor",
    body: "A custom website for a Middle Georgia realtor, with IDX home search across Central Georgia MLS and Georgia MLS, featured listings, and quick ways for buyers to reach him: call, text, or a Dream Home request from a listing. The map search starts in Middle Georgia, with a one-click “Search all of Georgia” option, and a home listed on both MLSs shows up once.",
  },
  lisa: {
    title: "Lisa Dunn Real Estate",
    body: "A bilingual English and Spanish website for Central Georgia realtor Lisa Rodriguez Dunn of CENTURY 21 Homes & Investments, with map-based IDX search over Central Georgia MLS only, a page that highlights her own listings, and contact and lead forms. The site is set up for IDX listings under CGMLS rules, I followed her brokerage's licensing and disclaimer rules, and the site launched on her own domain on November 4, 2026.",
  },
  more: "More work lives on the",
} as const;

export const idxSteps = [
  {
    number: "01",
    title: "Talk through the site",
    body: "You tell me about the site you want and which MLS or MLSs you belong to: Georgia MLS, Central Georgia MLS, or both. A free 30-minute consult is the first step.",
  },
  {
    number: "02",
    title: "I handle the paperwork",
    body: "I handle the MLS paperwork with your broker. For Georgia MLS, adding a client website involves a broker-signed reciprocity form sent to the MLS.",
    linkLabel: "Georgia MLS vendor FAQ",
    linkUrl: GAMLS_RETS_FAQ_URL,
  },
  {
    number: "03",
    title: "I build the search",
    body: "I build the search into your site and build in each MLS's display requirements.",
  },
  {
    number: "04",
    title: "Launch and follow-through",
    body: "The site launches on your domain. After that I keep the listings updating every 15 minutes and fix what still feels off.",
  },
] as const;

/**
 * Single source for the visible accordion and the FAQPage JSON-LD. The first
 * three are the answer-ready questions; the rest support them.
 */
const WEBSITE_DESIGN_LINK_TEXT = "my website design page for Middle Georgia";

export const idxFaqs = [
  {
    question: "Do I need a custom IDX if Georgia MLS already gives me a website?",
    answer:
      "Not always. Georgia MLS includes a branded office and agent website with every membership, at no additional cost, with listing data that updates throughout the day and a private client portal. That is enough for some agents. A custom IDX is worth talking about if you want branded property search on your own domain, a search that also includes Central Georgia MLS, or a site built around how you actually work with buyers — and if you want someone who will keep going until that search works the way you expect.",
  },
  {
    question: "Can one website search both Georgia MLS and Central Georgia MLS?",
    answer:
      "Yes, if you participate in both. I am an approved IDX vendor with access to Georgia MLS and Central Georgia MLS, and I can build one search across both feeds on your own domain. A home listed on both MLSs shows up once.",
  },
  {
    question: "What is IDX for realtors?",
    answer:
      "IDX, or Internet Data Exchange, is a mutual agreement between brokers that allows them to advertise each other's listings on their own websites, following each MLS's display rules. On your site, that means buyers can search for-sale listings on your domain, with the listing firm and the MLS credited as required. It is not the same thing as syndicating listings to consumer portals such as Zillow.",
  },
  {
    question:
      "Are you an approved IDX vendor for Georgia MLS and Central Georgia MLS?",
    answer:
      "Yes. KYGR Solutions is an approved IDX vendor, and I have IDX access to both Georgia MLS and Central Georgia MLS.",
  },
  {
    question: "How often do listings update on the site?",
    answer: "Listings on the sites I build are updated every 15 minutes.",
  },
  {
    question: "Who is this for?",
    answer:
      "Agents and brokerages that participate in Georgia MLS or Central Georgia MLS. Your broker signs a form approving your website, I keep it on file for MLS audits, and I handle that paperwork.",
  },
  {
    question: "How much does a custom IDX website cost?",
    answer:
      "Contact me for pricing. It depends on the site and on whether I am building search into an existing website or building the site as well. I don't publish a one-size price.",
  },
  {
    question: "Can you also design the rest of the website, not just the search?",
    answer: `Yes. For some agents I build the whole site, including the IDX search. For a Middle Georgia realtor I built dual-MLS search on his own domain; for a Central Georgia realtor I rebuilt her site in English and Spanish with Central Georgia MLS search. If you also need a marketing site, see ${WEBSITE_DESIGN_LINK_TEXT}.`,
    /** The part of the answer the page renders as a link. */
    link: { text: WEBSITE_DESIGN_LINK_TEXT, href: WEBSITE_DESIGN_MG_PATH },
  },
] as const;

export const idxFaqHeading = "Questions agents usually ask";

export const idxFinalCta = {
  heading: idxOffering.cta,
  body: "I'm an approved IDX vendor for Georgia MLS and Central Georgia MLS. Hard problems welcome. Tell me about your site and which MLSs you belong to, and I'll tell you honestly whether a custom build makes sense. Contact for pricing.",
} as const;

/** Every sentence of page-only copy, for the public-copy tests. */
export const idxPageCopy: string[] = [
  IDX_PAGE_TITLE,
  IDX_PAGE_DESCRIPTION,
  IDX_PAGE_H1,
  idxPageIntro,
  idxBuildIntro,
  ...idxOffering.features,
  idxBuildExtrasIntro,
  ...idxPageExtraFeatures,
  idxWhyCustom.heading,
  idxWhyCustom.intro,
  idxWhyCustom.outro,
  ...idxWhyCustom.reasons,
  idxBothMls.heading,
  idxBothMls.intro,
  idxBothMls.dexter,
  idxBothMls.cgmlsOnly,
  idxWhatIs.heading,
  idxWhatIs.body,
  idxWhatIs.after,
  idxDifferent.heading,
  ...idxDifferent.points.flatMap((point) => [point.title, point.body]),
  idxWork.heading,
  idxWork.dexter.title,
  idxWork.dexter.body,
  idxWork.lisa.title,
  idxWork.lisa.body,
  idxWork.more,
  ...idxSteps.flatMap((step) => [step.title, step.body]),
  idxFaqHeading,
  ...idxFaqs.flatMap((faq) => [faq.question, faq.answer]),
  idxFinalCta.heading,
  idxFinalCta.body,
  idxOffering.pricing,
];
