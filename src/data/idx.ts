export const IDX_PATH = "/idx";
export const IDX_SUBJECT = "IDX";
export const IDX_CONTACT_HREF = `/contact?subject=${IDX_SUBJECT}`;

export const idxOffering = {
  headline: "Custom IDX for Central Georgia agents",
  subhead: "An approved IDX vendor for Central Georgia MLS.",
  body: "KYGR Solutions is an approved IDX vendor for Central Georgia MLS. We build fast, fully branded property search right into your website, on your own domain, with no clunky third-party pages. Listings update throughout the day, and MLS display requirements are built in, so you can focus on clients.",
  features: [
    "Search by city, price, beds, baths, property type, and map area",
    "Listing detail pages with photos",
    "A My Listings / Office Listings section",
    "Design matched to your site",
    "Listings updated every 15 minutes",
    "MLS display rules (listing firm attribution, source credit, required disclaimers) handled for you",
    "We handle the MLS paperwork with your broker",
  ],
  note: "Available to agents and brokerages that are Central Georgia MLS participants. Your participating broker opts in in writing.",
  pricing: "Contact for pricing",
  cta: "Talk to us about IDX for your site",
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
