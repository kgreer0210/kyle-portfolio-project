import { Project } from "../types";

export const projects: Project[] = [
  {
    id: "mise-ai",
    title: "Mise AI",
    description:
      'A modern SaaS application built to solve the eternal "What\'s for dinner?" problem for my household. Features AI recipe generation, interactive weekly meal planning, and smart grocery list aggregation.',
    image: "/mise-ai-screenshot.png",
    technologies: [
      "Next.js 16",
      "TypeScript",
      "Tailwind CSS",
      "Supabase",
      "OpenAI API",
      "Zustand",
      "Motion",
    ],
    liveUrl: "https://mise-ai.app/",
    status: "completed",
    role: "Product design, UX, and full-stack development",
    challenge:
      "Built out of a personal desire to see an actual AI recipe generation app that did exactly what my wife and I needed. The challenge was to create a seamless flow from AI inspiration to a practical, organized grocery list that actually works for a busy household.",
    outcome:
      "Reduces meal-planning friction with AI recipes, weekly planners, and smart grocery lists households actually use.",
    backendShowcase: {
      available: false,
      description: "",
      screenshots: [],
    },
  },
  {
    id: "lexisFreshSlateCleanings",
    title: "Lexis Fresh Slate Cleanings",
    description:
      "A comprehensive web application for a local cleaning company featuring customer and employee portals, an admin dashboard with service management, booking system, staff scheduling, client management, estimate requests, and automated SMS reminders.",
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
      "As the primary developer on this project, I was responsible for transforming the client's vision into a high-performance digital solution. The main challenge was to create a system that was both powerful for the business owner and intuitive for the end-users.",
    outcome:
      "Streamlined scheduling, client communication, and staff coordination for a growing cleaning company; less back-office busywork.",
    backendShowcase: {
      available: true,
      description:
        "Backend architecture for Lexis Fresh Slate Cleanings, showcasing service management, booking system, staff management, and customer portal.",
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
            "Real-time notifications",
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
            "Advanced scheduling interface for managing appointments, staff assignments, and resource allocation across all locations.",
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
            "Streamlined interface for managing customer estimate requests with real-time notifications. Features a notification icon that alerts Lexi when new estimate requests are available, ensuring prompt response to potential customers.",
          image:
            "/projects/lexis-fresh-slate-cleaning/backend-screenshots/Admin Estimate Request Management.png",
          features: [
            "Real-time estimate request notifications",
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
            "Integrated Twilio SMS system for automated communications. Enables sending weekly SMS reminders for upcoming appointments, new employee invites, and customer invitations to keep everyone informed and engaged.",
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
];
