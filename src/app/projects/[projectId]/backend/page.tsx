"use client";

import { motion } from "motion/react";
import { useParams } from "next/navigation";
import BackendShowcase from "@/components/BackendShowcase";
import Particles from "@/Particles/Particles";

// Define the project data structure
interface Screenshot {
  id: string;
  title: string;
  description: string;
  image: string;
  features: string[];
}

interface ProjectBackendData {
  [key: string]: {
    title: string;
    screenshots: Screenshot[];
  };
}

// Sample backend data - in a real app, this would come from a database or API
const backendShowcaseData: ProjectBackendData = {
  lexisFreshSlateCleanings: {
    title: "Lexis Fresh Slate Cleanings",
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
          "Self-service customer portal allowing clients to manage their appointments, update their profile information, edit service addresses, and customize their notification preferences for a personalized experience.",
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
};

export default function BackendShowcasePage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const projectData = backendShowcaseData[projectId];

  if (!projectData) {
    return (
      <motion.div
        className="min-h-screen bg-rich-black text-text-primary relative flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="text-center">
          <h1 className="text-4xl font-bold text-text-headings mb-4">
            Backend Showcase Not Found
          </h1>
          <p className="text-text-secondary mb-8">
            The backend showcase for this project is not available yet.
          </p>
          <motion.a
            href="/"
            className="btn-primary px-8 py-4 rounded-lg font-medium text-lg hover:bg-lapis-lazuli transition-all duration-300 shadow-lg hover:shadow-xl"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Back to Portfolio
          </motion.a>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-rich-black text-text-primary relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      {/* Animated Particles Background */}
      <div className="fixed inset-0 z-0">
        <Particles
          particleCount={1000}
          particleSpread={22}
          speed={1}
          particleColors={[
            "#0094c6", // blue-ncs (main accent)
            "#005e7c", // lapis-lazuli (secondary accent)
            "#001242", // penn-blue (subtle)
            "#e0e6f0", // text-primary (subtle white)
            "#a8b2d1", // text-secondary (muted)
          ]}
          moveParticlesOnHover={true}
          particleHoverFactor={1}
          alphaParticles={true}
          particleBaseSize={500}
          sizeRandomness={0.8}
          cameraDistance={25}
          disableRotation={true}
          className="opacity-30"
        />
      </div>

      {/* Content Layer */}
      <div className="relative z-10">
        {/* Back to Home Button */}
        <div className="fixed top-6 left-6 z-20">
          <motion.a
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-oxford-blue/90 backdrop-blur-sm border border-penn-blue text-text-primary rounded-lg hover:bg-penn-blue/70 transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Home
          </motion.a>
        </div>

        <BackendShowcase
          projectTitle={projectData.title}
          screenshots={projectData.screenshots}
        />
      </div>
    </motion.div>
  );
}
