import { Service, Skill } from "../types";

export const services: Service[] = [
  {
    title: "Website Development",
    description: "Conversion-focused marketing sites built to capture local leads and grow your business.",
    points: [
      "Conversion-focused marketing sites that capture local leads",
      "Clear offers, fast load times, and easy editing",
      "SEO optimized structure for local visibility",
      "Mobile-responsive designs that work on any device",
    ],
  },
  {
    title: "Web & Mobile Apps",
    description: "Custom software solutions that streamline your service delivery and operations.",
    points: [
      "Customer and staff portals that streamline service delivery",
      "Mobile-friendly experiences for teams and clients on the go",
      "Real-time data synchronization and offline support",
      "Secure user authentication and data management",
    ],
  },
  {
    title: "Automation & Integrations",
    description: "Intelligent workflows that remove manual busywork and reduce operational errors.",
    points: [
      "Remove manual busywork with workflows and integrations",
      "Fewer errors, faster handoffs, and better visibility",
      "Connect your favorite tools (CRMs, Email, SMS, etc.)",
      "Custom reporting and notification systems",
    ],
  },
];

export const skills: Skill[] = [
  {
    title: "Frontend",
    skills: "React, Next.js, TypeScript, Tailwind CSS, Motion",
  },
  {
    title: "Backend",
    skills: "Node.js, Express, PostgreSQL, Vite, Convex",
  },
  {
    title: "Infrastructure & Tools",
    skills: "Git, Docker, Vercel, Supabase, Cloudflare",
  },
];

export const processSteps = [
  {
    title: "Assess",
    detail: "Understand your goals, bottlenecks, and the outcomes you want.",
  },
  {
    title: "Build",
    detail: "Design and develop the site/app/automation with clear milestones.",
  },
  {
    title: "Launch & Optimize",
    detail: "Deploy, measure, and tune so it keeps delivering results.",
  },
];

