# Portfolio to Business Site Conversion Plan

## Overview

This document outlines the tasks required to convert the current single-page portfolio site into a robust multi-page business website with dedicated pages for different services, projects, and content areas.

## Phase 1: Project Architecture & Structure

### 1.1 Create New Page Routes

- [ ] Create `/about` page route (move About section from home)
  - Serve as detailed business/personal background
  - Extended services and expertise breakdown
  - Team information (if applicable)
- [ ] Create `/services` page route
  - Dedicated services listing
  - Service descriptions with detailed information
  - Service-specific CTAs
  - Pricing information (optional)
- [ ] Create `/projects` page route
  - Portfolio/case studies grid
  - Project filtering/categorization
  - Project detail pages at `/projects/[projectId]`
  - Client testimonials per project
- [ ] Create `/contact` page route
  - Full contact form page
  - Contact information display
  - Embedded calendar/scheduling
  - Map or office location information
- [ ] Create `/blog` or `/resources` page (optional)
  - Articles/insights
  - Educational content
  - Industry updates
- [ ] Create `/terms`, `/privacy`, and other legal pages
  - Terms of service
  - Privacy policy
  - Cookie policy

### 1.2 Update Routing Structure

- [ ] Create a navigation data structure (constants/navigation.ts)
  - Define all main routes and subroutes
  - Configure breadcrumb generation
- [ ] Set up proper URL slugs for projects (currently using camelCase IDs)
- [ ] Create a dynamic project detail page template at `/projects/[projectId]`

## Phase 2: Navigation & Layout

### 2.1 Update Navigation Components

- [ ] Refactor Header component for multi-page navigation
  - Replace scroll-link navigation with route-based links
  - Keep mobile hamburger menu
  - Add active route indicator
  - Update navigation items to link to new pages
- [ ] Update Footer component
  - Add site map/footer navigation
  - Organize footer links by category
  - Add social links
- [ ] Remove or repurpose ScrollHeader
  - May no longer be needed with dedicated pages
  - Or adapt as a fixed header component

### 2.2 Create Layout Hierarchy

- [ ] Create `/projects/layout.tsx` for project pages
- [ ] Create `/contact/layout.tsx` if needed
- [ ] Update root `layout.tsx` with consistent header/footer
- [ ] Consider shared layout components across pages

## Phase 3: Page Implementation

### 3.1 Home Page (/)

- [ ] Refactor to serve as landing/business entry point
  - Keep Hero section (possibly simplified)
  - Add value proposition section
  - Add featured projects carousel
  - Add call-to-action sections
  - Remove full About, Services, Projects sections (move to dedicated pages)
  - Keep Contact CTA

### 3.2 About Page (/about)

- [ ] Move About section from home page
- [ ] Expand with additional content:
  - Detailed background/story
  - Professional experience timeline
  - Team members (if applicable)
  - Core values/mission statement
  - Skills matrix or expertise areas
- [ ] Add professional headshot or hero image

### 3.3 Services Page (/services)

- [ ] Extract services from About section
- [ ] Create detailed service cards with:
  - Service description
  - Key benefits
  - Process/methodology
  - Deliverables
  - Estimated timeline/pricing (optional)
- [ ] Add comparison table for service tiers (if applicable)

### 3.4 Projects/Portfolio Page (/projects)

- [ ] Create projects listing/grid
  - Filter by project type/category
  - Search functionality (optional)
  - Pagination or infinite scroll
- [ ] Create individual project detail page at `/projects/[projectId]`
  - Project overview and description
  - Client/company information
  - Technologies used
  - Screenshots/media gallery
  - Results/metrics/testimonial
  - Backend showcase carousel (if applicable)
  - Call-to-action for similar projects

### 3.5 Contact Page (/contact)

- [ ] Move contact form to dedicated page
- [ ] Expand with:
  - Contact information (email, phone, address)
  - Multiple contact methods (form, email, phone, chat)
  - Embedded calendar/scheduling link (Calendly)
  - Office location map
  - Response time expectations
  - FAQ section (optional)

### 3.6 Project Detail Pages (/projects/[projectId])

- [ ] Expand current backend showcase pages
  - Add project overview section
  - Add project challenge/solution section
  - Add results and metrics
  - Add client testimonial
  - Add related projects carousel
  - Update styling to match new design

## Phase 4: Content Management & Data Structure

### 4.1 Create Data Models

- [ ] Define TypeScript interfaces for:
  - `Project` type with all project fields
  - `Service` type with service details
  - `TeamMember` type (if applicable)
  - `Testimonial` type
  - `BlogPost` type (if applicable)

### 4.2 Move Content to Data Files

- [ ] Create `data/projects.ts` with project definitions
  - Extract current projects from components
  - Add new projects to the list
  - Include all metadata (slug, title, description, image, technologies, results)
- [ ] Create `data/services.ts` with service definitions
- [ ] Create `data/team.ts` if team page is needed

### 4.3 Database/CMS Consideration (Optional)

- [ ] Evaluate need for database/CMS for dynamic content
  - Could use Sanity, Strapi, or Contentful
  - Or keep content in TypeScript files for now
- [ ] Plan for scalability as content grows

## Phase 5: Component Refactoring

### 5.1 Extract Home Page Sections

- [ ] Extract current About component
- [ ] Extract current Projects component
- [ ] Extract current Testimonials component
- [ ] Extract current Contact component
- [ ] Create new Home-specific components for landing page

### 5.2 Create New Components

- [ ] `ProjectCard` - Reusable project card component
- [ ] `ProjectDetail` - Full project detail view
- [ ] `ServiceCard` - Reusable service card component
- [ ] `ContactForm` - Contact form component
- [ ] `ContactInfo` - Contact information display
- [ ] `Breadcrumb` - Breadcrumb navigation
- [ ] `SideNavigation` - Side navigation for complex pages (optional)

### 5.3 Shared Components

- [ ] Ensure Header, Footer work across all pages
- [ ] Create shared layout wrappers
- [ ] Update BackToTop to work on all pages
- [ ] Ensure Particles background is consistent (or make page-specific)

## Phase 6: Styling & Design Updates

### 6.1 Typography & Spacing

- [ ] Create page heading styles (h1-h6 consistency)
- [ ] Define spacing system for new pages
- [ ] Create container/max-width classes

### 6.2 Page-Specific Styling

- [ ] Style About page
- [ ] Style Services page
- [ ] Style Projects page and project detail pages
- [ ] Style Contact page
- [ ] Ensure consistent color and design language across pages

### 6.3 Responsive Design

- [ ] Test all new pages on mobile, tablet, desktop
- [ ] Ensure hamburger menu works on all pages
- [ ] Adjust layout for different screen sizes

## Phase 7: Functionality & Features

### 7.1 Search & Filtering

- [ ] Add search functionality to projects page
- [ ] Add category/technology filter to projects
- [ ] Add sorting options (date, name, complexity, etc.)

### 7.2 Related Content

- [ ] Implement related projects carousel
- [ ] Show related services on project detail pages
- [ ] Add "See more" suggestions

### 7.3 Contact Form Enhancement

- [ ] Keep existing rate limiting and validation
- [ ] Add form field for service interest
- [ ] Add project type field
- [ ] Improve success/error messaging

## Phase 8: SEO & Performance

### 8.1 SEO Optimization

- [ ] Update metadata for each new page
  - Title tags
  - Meta descriptions
  - Open Graph tags
- [ ] Create sitemap generation
- [ ] Add structured data/schema markup
- [ ] Create robots.txt if needed
- [ ] Ensure proper heading hierarchy on all pages

### 8.2 Performance

- [ ] Optimize images for new pages
- [ ] Lazy load images where appropriate
- [ ] Consider code splitting for new pages
- [ ] Monitor bundle size growth
- [ ] Test Core Web Vitals

### 8.3 Analytics

- [ ] Update Google Analytics to track new pages
- [ ] Add event tracking for CTAs
- [ ] Monitor user flow through new pages

## Phase 9: Testing & Quality Assurance

### 9.1 Functional Testing

- [ ] Test all navigation links across all pages
- [ ] Test forms submission (contact form)
- [ ] Test dynamic routes and parameters
- [ ] Test back/forward browser buttons
- [ ] Test mobile responsiveness on all pages

### 9.2 Browser Testing

- [ ] Test on Chrome, Firefox, Safari, Edge
- [ ] Test on various device sizes
- [ ] Test on slow network speeds

### 9.3 Accessibility

- [ ] Ensure WCAG 2.1 AA compliance
- [ ] Test keyboard navigation
- [ ] Test screen reader compatibility
- [ ] Check color contrast ratios

## Phase 10: Deployment & Migration

### 10.1 Pre-Deployment

- [ ] Set up 301 redirects for old URLs (if applicable)
- [ ] Ensure all environment variables are configured
- [ ] Run full build and test
- [ ] Create deployment checklist

### 10.2 Deployment

- [ ] Deploy to staging environment
- [ ] Run smoke tests on staging
- [ ] Get stakeholder approval
- [ ] Deploy to production
- [ ] Monitor for errors post-deployment

### 10.3 Post-Deployment

- [ ] Monitor analytics for unusual patterns
- [ ] Collect user feedback
- [ ] Fix any reported issues
- [ ] Update documentation

## Phase 11: Optional Enhancements

- [ ] Add blog/resources section with articles
- [ ] Implement dark/light mode toggle
- [ ] Add newsletter signup
- [ ] Add live chat support
- [ ] Add project filtering by technology stack
- [ ] Add testimonials/reviews management
- [ ] Implement caching strategies
- [ ] Add email notification for contact submissions
- [ ] Create admin dashboard for content management
- [ ] Add social media integration/feeds

## Dependencies & Considerations

### Technology Stack (Keep Existing)

- Next.js 16 with App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Motion library for animations
- Resend for email

### New Considerations

- Choose between static data files vs. database
- Decide on pagination strategy for projects
- Plan for future content growth
- Consider SEO impact of removing sections from home page
- Plan URL structure (kebab-case vs. others)

## Success Criteria

- [x] All pages are accessible from main navigation
- [x] Information is well-organized and logical
- [x] Mobile experience is seamless
- [x] Performance is maintained or improved
- [x] SEO is optimized for new pages
- [x] User can easily find services and projects
- [x] Contact methods are clear and accessible
- [x] Conversion paths are well-designed

## Timeline Recommendations (by priority, not duration)

### High Priority (Core Business Site)

1. Create `/services` page
2. Create `/projects` page and project details
3. Refactor home page as landing page
4. Create `/about` page
5. Move `/contact` to dedicated page

### Medium Priority (User Experience)

6. Add search/filtering to projects
7. Update navigation system
8. SEO optimization
9. Add breadcrumbs
10. Responsive design testing

### Low Priority (Nice-to-Have)

11. Blog/resources section
12. Admin dashboard
13. Additional filtering options
14. Enhanced analytics
