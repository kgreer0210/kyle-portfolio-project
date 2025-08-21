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
  tacosAndMariscosOfelia: {
    title: "Tacos and Mariscos Ofelia",
    screenshots: [
      {
        id: "admin-dashboard",
        title: "Admin Dashboard",
        description:
          "Central command center for restaurant management with real-time analytics, order tracking, and system overview.",
        image:
          "/projects/tacos-and-mariscos-ofelia/backend-screenshots/Admin Dashboard.png",
        features: [
          "Real-time order tracking",
          "System health monitoring",
          "Quick access to all modules",
        ],
      },
      {
        id: "menu-management",
        title: "Menu Management Dashboard",
        description:
          "Comprehensive interface for managing menu items, categories, pricing, and availability in real-time.",
        image:
          "/projects/tacos-and-mariscos-ofelia/backend-screenshots/Menu Management Dashboard.png",
        features: [
          "Dynamic menu updates",
          "Category management",
          "Real-time price adjustments",
          "Item availability controls",
          "Menu analytics and reporting",
        ],
      },
      {
        id: "orders-dashboard",
        title: "Orders Dashboard",
        description:
          "Complete order management system with real-time order tracking, status updates, and customer communication.",
        image:
          "/projects/tacos-and-mariscos-ofelia/backend-screenshots/Orders Dashboard.png",
        features: [
          "Real-time order processing",
          "Order status management",
          "Priority queue management",
        ],
      },
      {
        id: "kitchen-display",
        title: "Kitchen Display System",
        description:
          "Real-time order management system designed specifically for kitchen efficiency and order tracking.",
        image:
          "/projects/tacos-and-mariscos-ofelia/backend-screenshots/Kitchen Display System.png",
        features: [
          "Real-time order notifications",
          "Order prioritization",
          "Preparation time tracking",
          "Order completion tracking",
        ],
      },
      {
        id: "dine-in-ordering",
        title: "Dine In Server Ordering",
        description:
          "Intuitive ordering interface for restaurant servers to manage table orders efficiently.",
        image:
          "/projects/tacos-and-mariscos-ofelia/backend-screenshots/Dine In Server Ordering.png",
        features: [
          "Table management",
          "Server-specific order tracking",
          "Real-time order submission",
          "Customer preference notes",
          "Integration with kitchen display",
        ],
      },
      {
        id: "user-management",
        title: "User Management Dashboard",
        description:
          "Comprehensive user and staff management system with role-based access control.",
        image:
          "/projects/tacos-and-mariscos-ofelia/backend-screenshots/User Management Dashboard.png",
        features: [
          "Role-based access control",
          "User permissions management",
          "Activity logging",
        ],
      },
      {
        id: "restaurant-settings",
        title: "Restaurant Settings Dashboard",
        description:
          "Central configuration hub for restaurant settings, business rules, and system preferences. **Information displayed is not real and is for demonstration purposes only**",
        image:
          "/projects/tacos-and-mariscos-ofelia/backend-screenshots/Restaurant Settings Dashboard.png",
        features: [
          "Business hours management",
          "Tax and fee settings",
          "System customization",
          "Integration settings",
        ],
      },
    ],
  },
  "lexis-fresh-slate-cleanings": {
    title: "Lexis Fresh Slate Cleanings",
    screenshots: [
      {
        id: "service-management",
        title: "Service Management Dashboard",
        description:
          "Comprehensive interface for managing cleaning services, pricing, and availability.",
        image:
          "/projects/lexis-fresh-slate-cleanings/backend-screenshots/01-service-management-dashboard.png",
        features: [
          "Service category management",
          "Pricing adjustments",
          "Availability controls",
          "Bulk operations",
          "Analytics",
        ],
      },
      {
        id: "booking-interface",
        title: "Customer Booking Interface",
        description:
          "Intuitive interface for customers to book cleaning services and view their history.",
        image:
          "/projects/lexis-fresh-slate-cleanings/backend-screenshots/02-booking-interface.png",
        features: [
          "Real-time booking availability",
          "Customer booking history",
          "Service customization options",
          "Payment processing",
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
        className="min-h-screen bg-(--color-rich-black) text-(--color-text-primary) relative flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="text-center">
          <h1 className="text-4xl font-bold text-(--color-text-headings) mb-4">
            Backend Showcase Not Found
          </h1>
          <p className="text-(--color-text-secondary) mb-8">
            The backend showcase for this project is not available yet.
          </p>
          <motion.a
            href="/"
            className="inline-block px-6 py-3 bg-(--color-blue-ncs) text-white rounded-lg hover:bg-(--color-lapis-lazuli) transition-colors shadow-lg"
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
      className="min-h-screen bg-(--color-rich-black) text-(--color-text-primary) relative"
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
            className="inline-flex items-center gap-2 px-4 py-2 bg-(--color-oxford-blue)/90 backdrop-blur-sm border border-(--color-penn-blue) text-(--color-text-primary) rounded-lg hover:bg-(--color-penn-blue)/70 transition-all duration-300"
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
