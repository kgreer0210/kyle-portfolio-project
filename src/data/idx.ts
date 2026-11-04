export const IDX_PATH = "/idx";
export const IDX_SUBJECT = "IDX";
export const IDX_CONTACT_HREF = `/contact?subject=${IDX_SUBJECT}`;

export const idxOffering = {
  headline: "Custom IDX for Georgia agents",
  subhead:
    "Property search built on listing data from Georgia MLS and Central Georgia MLS.",
  body: "KYGR Solutions is an approved IDX vendor, and I have IDX access to both Georgia MLS and Central Georgia MLS. I build fast, fully branded property search right into your website, on your own domain, with no clunky third-party pages. Listings update throughout the day, a home listed on both MLSs shows up once, and each MLS's display requirements are built in, so you can focus on clients.",
  features: [
    "Search by city, price, beds, baths, property type, and map area",
    "Listing detail pages with photos",
    "A My Listings / Office Listings section",
    "Design matched to your site",
    "Listings updated every 15 minutes",
    "Each MLS's display rules (listing firm attribution, source credit, required disclaimers) handled for you",
    "I handle the MLS paperwork with your broker",
  ],
  note: "Available to agents and brokerages that participate in Georgia MLS or Central Georgia MLS. Your participating broker opts in in writing.",
  pricing: "Contact for pricing",
  cta: "Talk to me about IDX for your site",
} as const;

export const idxPublicCopy = [
  idxOffering.headline,
  idxOffering.subhead,
  idxOffering.body,
  ...idxOffering.features,
  idxOffering.note,
  idxOffering.pricing,
  idxOffering.cta,
];
