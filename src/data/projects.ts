import { Project } from "../types";

/**
 * Coming-soon projects show a placeholder card on /projects. They have no
 * detail page, are skipped by the homepage featured work, and are not listed
 * in the sitemap.
 */
export function isComingSoonProject(project: Project): boolean {
  return project.status === "coming-soon";
}

/** Projects that can be linked to and featured. */
export function getPublishedProjects(list: Project[] = projects): Project[] {
  return list.filter((project) => !isComingSoonProject(project));
}

export const projects: Project[] = [
  {
    id: "dexter-gordy-realtor",
    title: "Dexter Gordy Realtor",
    description:
      "A custom website for Middle Georgia Realtor Dexter Gordy, with IDX home search across Central Georgia MLS and Georgia MLS, his featured and recently sold listings, and quick ways for buyers to reach him.",
    image: "/projects/dexter-gordy-realtor/hero.png",
    technologies: [
      "Next.js",
      "TypeScript",
      "Tailwind CSS",
      "Vercel",
      "KYGR IDX API",
      "Google Maps",
      "Resend",
    ],
    liveUrl: "https://dextergordyrealtor.net",
    status: "completed",
    role: "Design, full-stack development, and IDX integration",
    challenge:
      "Dexter needed more than a brochure site. Buyers want to search homes, so the site pulls IDX listing data from two sources, Central Georgia MLS and Georgia MLS, into one map-based search that starts in Middle Georgia and opens up with a single \"Search all of Georgia\" option. A home listed on both MLSs shows up once, and every listing carries the attribution and disclaimers its MLS requires.",
    outcome:
      "Buyers can search homes on a map, browse Dexter's featured listings and recent sales, and call, text, or send a Dream Home request from any listing, all on a site that's built to keep MLS attribution right.",
    backendShowcase: {
      available: true,
      title: "Inside the Site",
      subtitle:
        "A closer look at the IDX home search, with listing data provided by Central Georgia MLS and Georgia MLS, and the page of homes Dexter has recently sold.",
      description:
        "A look at the IDX home search and the sold properties page built for Dexter Gordy Realtor.",
      screenshots: [
        {
          id: "home-search",
          title: "Home search",
          description:
            "Map-based home search over listing data provided by Central Georgia MLS and Georgia MLS. It defaults to Middle Georgia, with a one-click option to search all of Georgia.",
          image: "/projects/dexter-gordy-realtor/listings.png",
          features: [
            "Map-based search that starts in Middle Georgia",
            "\"Search all of Georgia\" option",
            "One merged feed with duplicate listings shown once",
            "Each listing attributed to its source MLS",
            "Listing detail pages with a photo gallery and call/text buttons",
          ],
        },
        {
          id: "sold-properties",
          title: "Sold properties",
          description:
            "A page of homes Dexter has sold recently, alongside his featured listings on the homepage.",
          image: "/projects/dexter-gordy-realtor/sold.png",
          features: [
            "Dexter's recently sold homes",
            "Featured listings on the homepage",
            "Dream Home and contact lead forms",
            "MLS-compliant attribution on every listing",
          ],
        },
      ],
    },
  },
  {
    id: "mise-ai",
    title: "Mise AI",
    description:
      "A private, invite-only cooking app I built for my family. It brings AI recipe creation and refinement, saved recipes, weekly meal planning with Busy Week planning, and grocery lists together.",
    image: "/projects/mise-ai/landing.png",
    technologies: [
      "Next.js 16",
      "TypeScript",
      "Tailwind CSS",
      "Supabase",
      "OpenRouter",
      "Zustand",
      "Motion",
      "Vercel",
    ],
    liveUrl: "https://mise-ai.app/",
    status: "completed",
    role: "Product design, UX, and full-stack development",
    challenge:
      "Built out of a personal desire to see an actual AI recipe generation app that did exactly what my wife and I needed. The challenge was to create a seamless flow from AI inspiration to a practical, organized grocery list that actually works for a busy household.",
    outcome:
      "Gives my family one place to go from an AI recipe idea to a planned week and a grocery list.",
    backendShowcase: {
      available: true,
      title: "Inside the App",
      subtitle:
        "A closer look at recipe generation, saved recipes, and Chef's Week, the weekly dinner planner.",
      description:
        "A look at the recipe generator, a generated recipe, and Chef's Week planning in Mise AI.",
      screenshots: [
        {
          id: "recipe-generator",
          title: "Recipe generator",
          description:
            "Pick a cuisine, or switch to Pantry mode to cook from what's on hand, and Mise AI generates a recipe to match.",
          image: "/projects/mise-ai/recipe-generator.png",
          features: [
            "Classic and Pantry modes",
            "Cuisine picker to start from a craving",
            "More than a dozen cuisines to choose from",
          ],
        },
        {
          id: "recipe-result",
          title: "Generated recipe",
          description:
            "Every recipe comes with adjustable servings, step-by-step instructions, and one-tap actions to cook it, schedule it, or add it to the grocery list.",
          image: "/projects/mise-ai/recipe-result.png",
          features: [
            "Adjustable servings that rescale ingredients",
            "Step-by-step instructions",
            "Add to Grocery List and scheduling",
            "Cuisine, meal, and protein tags",
          ],
        },
        {
          id: "chefs-week",
          title: "Chef's Week",
          description:
            "Chef's Week fills open nights on the weekly meal plan with new dinners, guided by cuisine, meal style, and protein.",
          image: "/projects/mise-ai/chefs-week.png",
          features: [
            "Weekly meal plan grid",
            "Cuisine, meal style, and protein preferences",
            "Warns before replacing a planned dinner",
            "Build a grocery list from the week",
          ],
        },
      ],
    },
  },
  {
    id: "lisa-dunn-real-estate",
    title: "Lisa Dunn Real Estate",
    description:
      "A bilingual English and Spanish website for Central Georgia Realtor Lisa Rodriguez Dunn of CENTURY 21 Homes & Investments, with IDX home search on a map, a page that highlights her own listings, and contact and lead forms.",
    image: "/projects/lisa-dunn/hero.png",
    technologies: [
      "Next.js 16",
      "TypeScript",
      "next-intl",
      "Resend",
      "Vercel",
      "Google Maps",
      "IDX API",
    ],
    liveUrl: "https://lisardunnrealtor.com",
    status: "completed",
    role: "Design, full-stack development, IDX integration, hosting, and domain cutover",
    challenge:
      "Lisa's old WordPress site needed to become a modern website in both English and Spanish. I rebuilt it from scratch, brought her listings in through the Central Georgia MLS IDX approval process, and followed her brokerage's licensing and disclaimer rules, so her license and the office license show up correctly.",
    outcome:
      "Central Georgia MLS approved the site for IDX, and it launched on Lisa's own domain on November 4, 2026. Visitors can browse active listings across Central Georgia, with Lisa's own listings highlighted, in English or Spanish.",
    backendShowcase: {
      available: true,
      title: "Inside the Site",
      subtitle:
        "A closer look at Lisa's listings, the IDX home search, and the Spanish version of the site, with listing data provided by Central Georgia MLS.",
      description:
        "A look at the listings page, home search, listing map, and Spanish home page built for Lisa Dunn Real Estate.",
      screenshots: [
        {
          id: "portfolio",
          title: "Lisa's listings",
          description:
            "A portfolio page that highlights Lisa's own listings, with listing data provided by Central Georgia MLS.",
          image: "/projects/lisa-dunn/listings.png",
          features: [
            "Lisa's own listings highlighted",
            "Photo, status, and key details on each listing",
            "Listing firm and license shown with each listing",
            "Source credit to Central Georgia MLS",
          ],
        },
        {
          id: "home-search",
          title: "Home search",
          description:
            "Map-based home search over listing data provided by Central Georgia MLS, with filters to narrow the results.",
          image: "/projects/lisa-dunn/search.png",
          features: [
            "Search by city, beds, baths, and property type",
            "Map of matching homes across Central Georgia",
            "Sort options",
          ],
        },
        {
          id: "listing-map",
          title: "Listing map",
          description:
            "Listing detail pages include a map of the home's location, with an option to ask Lisa about the home.",
          image: "/projects/lisa-dunn/detail.png",
          features: [
            "Google Map on each listing",
            "Ask Lisa about this home",
            "Lisa's license shown in the site header",
          ],
        },
        {
          id: "spanish",
          title: "Spanish version",
          description:
            "The site is bilingual, with a language switch in the header, so visitors can read it in English or Spanish.",
          image: "/projects/lisa-dunn/spanish.png",
          features: [
            "English and Spanish versions of the site",
            "One-click EN / ES language switch",
            "License and brokerage shown in the header",
          ],
        },
      ],
    },
  },
  {
    id: "lexisFreshSlateCleanings",
    title: "Lexi's Fresh Slate Cleanings",
    description:
      "A web app for my first official client, a local cleaning company. One-button text reminders tied to her calendar replaced hours of weekend copy-and-paste, alongside customer and employee portals, booking, staff scheduling, and estimate requests.",
    image: "/lexisFreshSlateCleaningsScreenshot.png",
    technologies: [
      "Next.js",
      "Tailwind CSS",
      "Vercel",
      "React",
      "TypeScript",
      "Convex",
    ],
    liveUrl: "https://lexis-fresh-slate-cleaning.vercel.app/",
    status: "completed",
    role: "Product discovery, UX/UI, and full-stack development",
    challenge:
      "Lexi's Fresh Slate Cleanings was my first official client. Every weekend, Lexi spent hours copying and pasting reminder texts to customers. I needed to build a system powerful enough to run her business and simple enough for her customers and staff to use without thinking. Getting business texting approved meant working through carrier registration paperwork. It was the least fun part, but it's what the job took.",
    outcome:
      "A whole week of reminders now goes out with one button, pulled from her calendar. Lexi says it gave her weekends back.",
    backendShowcase: {
      available: true,
      description:
        "Backend architecture for Lexi's Fresh Slate Cleanings, showcasing service management, booking system, staff management, and customer portal.",
      screenshots: [
        {
          id: "admin-portal-dashboard",
          title: "Admin Portal Dashboard",
          description:
            "Central administrative dashboard providing comprehensive overview of business operations, key metrics, and quick access to all management modules.",
          image:
            "/projects/lexis-fresh-slate-cleaning/backend-screenshots/Admin Portal Dashboard.png",
          features: [
            "Business performance metrics",
            "Quick access navigation",
            "Instant notifications",
            "Client Invite Management",
            "Revenue analytics",
          ],
        },
        {
          id: "admin-services-management",
          title: "Admin Services Management",
          description:
            "Complete service catalog management interface for configuring cleaning services, pricing tiers, and service availability.",
          image:
            "/projects/lexis-fresh-slate-cleaning/backend-screenshots/Admin Services Management.png",
          features: [
            "Service creation and editing",
            "Dynamic pricing management",
            "Service availability controls",
            "Category organization",
            "Bulk operations",
          ],
        },
        {
          id: "admin-client-management",
          title: "Admin Client Management",
          description:
            "Comprehensive client relationship management system with detailed profiles, booking history, and communication tracking.",
          image:
            "/projects/lexis-fresh-slate-cleaning/backend-screenshots/Admin Client Management.png",
          features: [
            "Client profile management",
            "Booking history tracking",
            "Communication logs",
            "Client preferences",
          ],
        },
        {
          id: "admin-calendar",
          title: "Admin Calendar Management",
          description:
            "Advanced scheduling interface for managing appointments, staff assignments, and resource allocation across all locations. While showing this site to a new client, I noticed this page loading slowly behind its loading animation. Nobody had complained, but it wasn't up to my standard, so I fixed the slow queries.",
          image:
            "/projects/lexis-fresh-slate-cleaning/backend-screenshots/Admin Calendar.png",
          features: [
            "Drag-and-drop scheduling",
            "Staff assignment optimization",
            "Multi-location management",
            "Service Schedule Management",
            "Service Image Management",
          ],
        },
        {
          id: "admin-cleaning-add-ons",
          title: "Admin Cleaning Add-Ons Management",
          description:
            "Specialized interface for managing additional cleaning services, premium options, and custom service packages.",
          image:
            "/projects/lexis-fresh-slate-cleaning/backend-screenshots/Admin Cleaning Add On Management.png",
          features: [
            "Add-on service configuration",
            "Pricing strategy management",
            "Add-on service management",
            "Add-on service pricing management",
          ],
        },
        {
          id: "admin-business-settings",
          title: "Admin Business Settings Management",
          description:
            "Centralized business configuration hub for managing operational settings, business rules, and system preferences.",
          image:
            "/projects/lexis-fresh-slate-cleaning/backend-screenshots/Admin Business Settings Management.png",
          features: [
            "Business hours management",
            "Operational policies",
            "Notification preferences",
            "System customization",
          ],
        },
        {
          id: "admin-employee-management",
          title: "Admin Employee Management",
          description:
            "Comprehensive employee management system allowing Lexi to oversee all aspects of employee operations including time tracking, point system management, time off requests, and point reward approvals.",
          image:
            "/projects/lexis-fresh-slate-cleaning/backend-screenshots/Admin Employee Management.png",
          features: [
            "Employee profile management",
            "Time tracking and attendance oversight",
            "Point system administration",
            "Time off request approval",
            "Point reward request approval",
            "Employee performance tracking",
          ],
        },
        {
          id: "admin-estimate-request-management",
          title: "Admin Estimate Request Management",
          description:
            "Streamlined interface for managing customer estimate requests with instant notifications. Features a notification icon that alerts Lexi when new estimate requests are available, ensuring prompt response to potential customers.",
          image:
            "/projects/lexis-fresh-slate-cleaning/backend-screenshots/Admin Estimate Request Management.png",
          features: [
            "Instant estimate request alerts",
            "Notification icon indicator",
            "Request status management",
            "Customer communication tracking",
            "Quote generation and management",
          ],
        },
        {
          id: "admin-sms-reminder",
          title: "Admin SMS Reminder System",
          description:
            "Sends the whole week's appointment reminders with one button, pulled from the calendar. That replaced hours of copy-and-paste every weekend. It also handles employee and customer invites.",
          image:
            "/projects/lexis-fresh-slate-cleaning/backend-screenshots/Admin SMS Reminder.png",
          features: [
            "Weekly SMS appointment reminders",
            "Automated employee invite system",
            "Automated customer invite system",
            "Twilio integration",
            "Message customization",
            "Delivery status tracking",
          ],
        },
        {
          id: "employee-portal",
          title: "Employee Portal",
          description:
            "Comprehensive self-service portal for employees to manage their work schedule, track time, request time off, and manage their reward points. Features a detailed calendar view of upcoming appointments with full details.",
          image:
            "/projects/lexis-fresh-slate-cleaning/backend-screenshots/Employee Portal.png",
          features: [
            "Clock in/out functionality",
            "Time off request submission",
            "Point balance viewing and spending",
            "Calendar view of assigned appointments",
            "Appointment details and notes",
            "Point reward request submission",
          ],
        },
        {
          id: "customer-portal",
          title: "Customer Portal",
          description:
            "Self-service customer portal allowing clients to manage their appointments, update their profile information, edit service addresses, and customize their notification preferences for personalized experience.",
          image:
            "/projects/lexis-fresh-slate-cleaning/backend-screenshots/Customer Portal.png",
          features: [
            "Upcoming appointments view",
            "Profile information editing",
            "Service address management",
            "Notification preferences customization",
            "Appointment history access",
            "Account settings management",
          ],
        },
      ],
    },
  },
  {
    id: "f3-warner-robins",
    title: "F3 Warner Robins",
    description:
      "A regional website for F3 Warner Robins, a free peer-led outdoor workout group focused on fitness, fellowship, and faith. Features event management, workout schedules, and community engagement tools.",
    image: "/f3-warner-robins-screenshot.png",
    technologies: ["Next.js", "React", "TypeScript", "Tailwind CSS"],
    liveUrl: "https://f3-warner-robins.vercel.app/",
    status: "completed",
    role: "Product design, UX/UI, and full-stack development",
    challenge:
      "There was a need for our F3 region to have its own website where we could list out our schedule for workouts and their locations and times with links to the map as well as all of our logos on a rotating carousel on the front page and information about how to join in on the workouts that are free of charge.",
    outcome:
      "Delivered a polished, user-friendly website that effectively showcases workout schedules, locations, and regional information, making it easy for the community to participate in free outdoor fitness activities.",
    backendShowcase: {
      available: false,
      description: "",
      screenshots: [],
    },
  },
  {
    id: "mid-state-baptist-association",
    title: "Mid-State Baptist Association",
    description:
      "A modernized website for the Mid-State Baptist Association, replacing their legacy Weebly site. Features a searchable church finder across 5 counties, event listings, a downloadable resource library, ministry information, and a party trailer rental request form.",
    image: "/midstatebaptistassociationscreenshot.png",
    technologies: [
      "Next.js 16",
      "TypeScript",
      "Tailwind CSS",
      "Convex",
      "Clerk",
      "shadcn/ui",
      "Resend",
    ],
    liveUrl: "https://midstatebaptistassociation.org/",
    status: "completed",
    role: "Product design, UX/UI, and full-stack development",
    challenge:
      "The association needed a modern replacement for their dated Weebly site that could manage 38 churches across 5 counties, surface events and resources, and give the leadership team an admin portal to keep content current — without requiring technical expertise to operate.",
    outcome:
      "Delivered a clean, accessible website that makes it easy for the community to find churches, browse events, and download resources, with a protected admin system for staff to manage all content.",
    backendShowcase: {
      available: true,
      description:
        "Admin tools for the Mid-State Baptist Association, letting staff keep events, resources, and site content current without a developer.",
      screenshots: [
        {
          id: "admin-dashboard",
          title: "Admin Dashboard",
          description:
            "A simple starting point for staff, with a card for each area of the site they manage.",
          image:
            "/projects/mid-state-baptist-association/backend-screenshots/admin-dashboard.png",
          features: [
            "Section cards for contacts, churches, events, resources, trailer requests, and settings",
            "One-click access to each management area",
            "Admin access and permissions in one place",
          ],
        },
        {
          id: "admin-churches",
          title: "Churches Management",
          description:
            "Staff keep the public church finder up to date, managing each church's listing, county, and contact details in one place.",
          image:
            "/projects/mid-state-baptist-association/backend-screenshots/admin-churches.png",
          features: [
            "Add, edit, and remove church listings",
            "Search by name or address",
            "Filter by county",
            "Feeds the public church finder",
          ],
        },
        {
          id: "admin-events",
          title: "Events Management",
          description:
            "Staff post and update association events themselves, so the public calendar stays current without waiting on a developer.",
          image:
            "/projects/mid-state-baptist-association/backend-screenshots/admin-events.png",
          features: [
            "Create, edit, and delete events",
            "Search by title or location and filter by status",
            "Categories and featured events",
            "Track how many people plan to attend",
          ],
        },
        {
          id: "admin-resources",
          title: "Resources Management",
          description:
            "A managed library of downloadable PDFs that churches can browse on the public site.",
          image:
            "/projects/mid-state-baptist-association/backend-screenshots/admin-resources.png",
          features: [
            "Upload and organize PDF resources",
            "Search by title, file name, or tags",
            "Filter by category",
            "See download counts for each resource",
          ],
        },
      ],
    },
  },
];

// The home page Featured Work section shows these projects, in this order.
export const FEATURED_PROJECT_IDS = [
  "dexter-gordy-realtor",
  "lexisFreshSlateCleanings",
] as const;

export function getFeaturedProjects(): Project[] {
  return FEATURED_PROJECT_IDS.flatMap((id) => {
    const project = projects.find((p) => p.id === id);
    return project ? [project] : [];
  });
}
