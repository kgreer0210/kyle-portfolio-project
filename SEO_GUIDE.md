# SEO Guide for KYGR Solutions Portfolio

This guide explains how SEO works in a custom Next.js application and provides a walkthrough of everything you need to set up to ensure your website is visible to local customers by January.

## 1. How SEO Works in Custom Apps (Next.js)

Unlike simple HTML files, Next.js uses the **App Router Metadata API**. This allows us to define SEO tags (title, description, keywords, etc.) directly in the code.

### Core Concepts:

- **Server-Side Rendering (SSR):** Next.js renders your pages on the server. This means Google's "crawlers" see the full content of your page immediately, which is much better for SEO than traditional React apps.
- **Metadata API:** We use a special `metadata` object in `layout.tsx` or `page.tsx` files. Next.js automatically injects these into the `<head>` of your HTML.
- **Dynamic Metadata:** For pages like project case studies, we can generate metadata dynamically based on the project title.

---

## 2. On-Page SEO Checklist (Codebase)

### A. Global Metadata (`src/app/layout.tsx`)

This sets the default title and description for every page.

- [x] **Title:** Should include your brand name and primary keywords.
- [x] **Description:** A 150-160 character summary that "sells" your link in search results.
- [ ] **Open Graph (OG):** How your site looks when shared on Facebook/LinkedIn.
- [ ] **Twitter Cards:** How your site looks on X (formerly Twitter).

### B. Page-Specific Metadata

Each page (`/about`, `/services`, `/contact`) should have its own unique title and description.

- **Rule:** Never use the exact same metadata on two different pages.

### C. Technical SEO

- [ ] **Sitemap (`sitemap.ts`):** A list of all your pages so Google can find them.
- [ ] **Robots.txt (`robots.ts`):** Tells search engines which pages they are allowed to crawl.
- [ ] **Canonical URLs:** Prevents "duplicate content" issues by telling Google which version of a URL is the "master" one.

---

## 3. Google & Search Engine Setup

To be seen by local people, you **must** register with the search engines.

### Step 1: Google Search Console (GSC)

1. Go to [Google Search Console](https://search.google.com/search-console/).
2. Add your domain (e.g., `kygrsolutions.com`).
3. **Verify ownership:** You'll usually do this by adding a DNS record to your domain provider (GoDaddy, Namecheap, etc.) or a meta tag.
4. **Submit Sitemap:** Once verified, paste the link to your sitemap (usually `https://yourdomain.com/sitemap.xml`) into the Sitemaps section.

### Step 2: Google Business Profile (CRITICAL for Local SEO)

Since you want to target people in your "immediate area," this is the most important step.

1. Go to [Google Business Profile](https://www.google.com/business/).
2. Create a profile for **KYGR Solutions**.
3. Use a physical address (can be hidden) and define your service area.
4. **Keywords:** Ensure your profile mentions "Website Development," "Software Solutions," and the specific cities you serve.

### Step 3: Bing Webmaster Tools

1. Go to [Bing Webmaster Tools](https://www.bing.com/webmasters/).
2. You can actually "Import" your settings directly from Google Search Console to save time.

---

## 4. Local SEO Strategy

To win in your local area:

1. **Location Keywords:** Add your city/region to your metadata (e.g., "Web Development in [Your City]").
2. **Schema.org (JSON-LD):** This is "hidden code" that tells Google specifically that you are a `LocalBusiness`. I will help you implement this.
3. **Backlinks:** Ask local business owners you know to link to your site.
4. **Google Maps:** Once your Google Business Profile is verified, you will start showing up in the "Map Pack" (the top 3 results on Google Maps).

---

## 5. Performance & Mobile-First

Google ranks fast sites higher.

- **Next/Image:** Always use the `<Image />` component from Next.js (already being used!).
- **Core Web Vitals:** Next.js is optimized for this out of the box, but keep your images compressed.

---

## Summary of Next Steps for You:

1. **Verify your domain** on Google Search Console.
2. **Create/Update your Google Business Profile.**
3. **Add local keywords** to the descriptions on your site.

I will now proceed to implement the technical parts (`sitemap.ts`, `robots.ts`, and enhanced metadata) in your codebase.
