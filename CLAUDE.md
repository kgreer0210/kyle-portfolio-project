# CLAUDE.md - Kyle Greer Portfolio Project

## Project Overview

This is a personal portfolio website showcasing Kyle Greer's work as a software developer. Built with Next.js 16, React 19, and Tailwind CSS, it features smooth animations, a responsive design, and interactive elements.

## Tech Stack

- **Next.js 16.0.7** - React framework with App Router
- **React 19.2.1** - UI library
- **TypeScript 5** - Type safety
- **Tailwind CSS 4** - Styling framework
- **Framer Motion** - Animation library (referred to as "motion" in package.json)
- **OGL 1.0.11** - WebGL library for graphics
- **Resend 6.4.1** - Email service for contact form
- **Retell SDK** - AI voice agent webhook integration
- **Supabase** - Database for storing call records
- **Twilio** - SMS notifications for incoming calls

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Home page
│   ├── layout.tsx            # Root layout
│   ├── api/
│   │   ├── contact/
│   │   │   └── route.ts      # Contact form API endpoint
│   │   └── retell/
│   │       └── webhook/
│   │           └── route.ts  # Retell AI webhook handler
│   └── projects/
│       └── [projectId]/
│           └── backend/
│               └── page.tsx  # Project detail page
├── components/
│   ├── Hero.tsx              # Hero section
│   ├── About.tsx             # About section
│   ├── Projects.tsx          # Projects showcase
│   ├── Contact.tsx           # Contact section
│   ├── Testimonials.tsx      # Testimonials section
│   ├── Header.tsx            # Navigation header
│   ├── ScrollHeader.tsx       # Sticky header on scroll
│   ├── BackToTop.tsx         # Back to top button
│   ├── Footer.tsx            # Footer
│   ├── BackendShowcase.tsx   # Backend project showcase
│   └── index.ts              # Component exports
├── lib/
│   ├── supabase.ts           # Supabase server client
│   └── notifications.ts      # Twilio SMS + Discord webhook helpers
└── Particles/
    └── Particles.tsx         # Particle animation component
```

## Key Features

- **Responsive Design** - Works on mobile, tablet, and desktop
- **Smooth Animations** - Powered by Framer Motion and OGL
- **Contact Form** - Integrated with Resend for email functionality
- **Project Showcase** - Display of featured projects with details
- **Testimonials** - Client/colleague feedback section
- **Performance** - Built with Next.js App Router and Turbopack

## Scripts

- `npm run dev` - Start development server with Turbopack on http://localhost:3000
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Important Files

- `DESIGN_SYSTEM.md` - UI/component design guidelines
- `CONTACT_FORM_SETUP.md` - Contact form configuration and setup instructions
- `tsconfig.json` - TypeScript configuration
- `next.config.ts` - Next.js configuration

## Setup & Development

1. Install dependencies: `npm install`
2. Run development server: `npm run dev`
3. Open http://localhost:3000 in browser
4. Edit components in `src/components/` - hot reload enabled

## API Routes

- `POST /api/contact` - Contact form submission endpoint (sends email via Resend)
- `POST /api/retell/webhook` - Retell AI voice agent webhook (handles `call_started`, `call_ended`, `call_analyzed` events; stores calls in Supabase, sends SMS + Discord notifications)

## Styling

The project uses Tailwind CSS 4 with PostCSS configuration. Global styles and component-specific styles are defined using Tailwind utility classes.

## Notes for Claude

- The contact form uses the Resend service for email - refer to CONTACT_FORM_SETUP.md for configuration
- Design system guidelines are documented in DESIGN_SYSTEM.md
- Project uses TypeScript with strict typing enabled
- Next.js App Router is used for routing (not Pages Router)
- The "motion" package in package.json is the Framer Motion animation library
