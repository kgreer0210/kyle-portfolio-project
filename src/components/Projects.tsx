"use client";

import { motion } from "motion/react";
import Image from "next/image";

// Define the project data structure
interface Screenshot {
  id: string;
  title: string;
  description: string;
  image: string;
  features: string[];
}

interface Project {
  id: string;
  title: string;
  description: string;
  image: string;
  technologies: string[];
  liveUrl?: string;
  githubUrl?: string;
  status?: "completed" | "in-progress" | "planned";
  backendShowcase?: {
    available: boolean;
    description: string;
    screenshots: Screenshot[];
  };
}

export default function Projects() {
  // Replace this array with your actual project data
  const projects: Project[] = [
    {
      id: "tacosAndMariscosOfelia",
      title: "Tacos and Mariscos Ofelia",
      description:
        "A website for a local restaurant that allows customers to view the menu, place orders, and view the restaurant's information. This project was a collaboration with a local restaurant owner to create a website that would help them reach more customers and increase their sales.",
      image: "/tacosAndMariscosOfeliaScreenshot.png",
      technologies: [
        "Next.js",
        "Tailwind CSS",
        "Convex",
        "Motion",
        "Vercel",
        "React",
        "TypeScript",
      ],
      liveUrl: "https://tacos-and-mariscos-ofelia.vercel.app/",
      githubUrl: "https://github.com/kgreer0210/tacos-and-mariscos-ofelia",
      status: "completed",
      backendShowcase: {
        available: true,
        description:
          "Backend architecture for Tacos and Mariscos Ofelia, showcasing menu management, order processing, kitchen display, and administrative systems.",
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
              "Revenue analytics",
              "Staff performance metrics",
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
              "Bulk editing operations",
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
              "Customer communication",
              "Payment processing integration",
              "Order history and analytics",
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
              "Multiple station views",
              "Order completion tracking",
              "Performance metrics",
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
              "Split billing capabilities",
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
              "Staff scheduling",
              "User permissions management",
              "Activity logging",
              "Account management",
              "Security settings",
            ],
          },
          {
            id: "restaurant-settings",
            title: "Restaurant Settings Dashboard",
            description:
              "Central configuration hub for restaurant settings, business rules, and system preferences.",
            image:
              "/projects/tacos-and-mariscos-ofelia/backend-screenshots/Restaurant Settings Dashboard.png",
            features: [
              "Business hours management",
              "Payment gateway configuration",
              "Tax and fee settings",
              "Notification preferences",
              "System customization",
              "Integration settings",
            ],
          },
        ],
      },
    },
    {
      id: "lexisFreshSlateCleanings",
      title: "Lexis Fresh Slate Cleanings",
      description:
        "A website for a local cleaning company that allows customers to view the services they offer, view the company's information, and contact the company.",
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
      githubUrl: "https://github.com/kgreer0210/lexis-fresh-slate-cleaning",
      status: "in-progress",
      backendShowcase: {
        available: true,
        description:
          "Backend architecture for Lexis Fresh Slate Cleanings, showcasing service management, booking system, staff management, and customer portal.",
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
          {
            id: "staff-management",
            title: "Staff Management Dashboard",
            description:
              "Complete staff scheduling and management system with performance tracking.",
            image:
              "/projects/lexis-fresh-slate-cleanings/backend-screenshots/03-staff-management-dashboard.png",
            features: [
              "Staff scheduling",
              "Performance metrics",
              "Task assignment",
              "Time tracking",
              "Communication tools",
            ],
          },
          {
            id: "inventory-tracking",
            title: "Inventory & Equipment Tracking",
            description:
              "Real-time inventory management for cleaning supplies and equipment maintenance.",
            image:
              "/projects/lexis-fresh-slate-cleanings/backend-screenshots/04-inventory-tracking.png",
            features: [
              "Supply inventory tracking",
              "Equipment maintenance scheduling",
              "Low stock alerts",
              "Vendor management",
              "Usage analytics",
            ],
          },
          {
            id: "customer-portal",
            title: "Customer Management Portal",
            description:
              "Comprehensive customer relationship management with booking history and preferences.",
            image:
              "/projects/lexis-fresh-slate-cleanings/backend-screenshots/05-customer-portal.png",
            features: [
              "Customer profiles",
              "Booking history",
              "Service preferences",
              "Communication logs",
              "Satisfaction tracking",
            ],
          },
        ],
      },
    },
  ];

  return (
    <motion.section
      id="projects"
      className="py-20 mb-20"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true, margin: "-100px" }}
    >
      <motion.h2
        className="text-3xl font-bold text-(--color-text-headings) mb-8 text-center drop-shadow-lg"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        viewport={{ once: true }}
      >
        Featured Projects
      </motion.h2>
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        viewport={{ once: true }}
      >
        {projects.map((project, index) => (
          <motion.div
            key={project.id}
            className="card bg-(--color-oxford-blue)/90 backdrop-blur-sm border border-(--color-penn-blue) rounded-2xl overflow-hidden shadow-xl flex flex-col"
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            whileHover={{
              scale: 1.05,
              y: -10,
              borderColor: "#0094c6",
              boxShadow: "0 25px 50px -12px rgba(0, 148, 198, 0.25)",
            }}
            transition={{
              duration: 0.5,
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
            viewport={{ once: true }}
          >
            <motion.div
              className="h-48 bg-(--color-penn-blue)/50 backdrop-blur-sm relative overflow-hidden"
              whileHover={{ backgroundColor: "rgba(0, 18, 66, 0.7)" }}
            >
              {project.image ? (
                <Image
                  src={project.image}
                  alt={`${project.title} screenshot`}
                  fill
                  className="object-cover transition-transform duration-300 hover:scale-110"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              ) : (
                <motion.div className="h-full flex items-center justify-center">
                  <motion.span
                    className="text-(--color-text-secondary)"
                    whileHover={{ scale: 1.1, color: "#e0e6f0" }}
                  >
                    Project Image
                  </motion.span>
                </motion.div>
              )}
              {project.status && (
                <div className="absolute top-2 right-2">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      project.status === "completed"
                        ? "bg-green-500/80 text-white"
                        : project.status === "in-progress"
                        ? "bg-yellow-500/80 text-white"
                        : "bg-blue-500/80 text-white"
                    }`}
                  >
                    {project.status === "in-progress"
                      ? "In Progress"
                      : project.status === "completed"
                      ? "Completed"
                      : "Planned"}
                  </span>
                </div>
              )}
            </motion.div>
            <div className="p-6 flex flex-col flex-grow">
              <motion.h3
                className="text-xl font-semibold text-(--color-text-headings) mb-3"
                whileHover={{ color: "#0094c6" }}
              >
                {project.title}
              </motion.h3>
              <motion.div
                className="relative group flex-grow"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                viewport={{ once: true }}
              >
                <motion.p className="text-(--color-text-secondary) mb-4 line-clamp-3 group-hover:line-clamp-none transition-all duration-300">
                  {project.description}
                </motion.p>
              </motion.div>
              <motion.div
                className="flex flex-wrap gap-2 mb-4"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                viewport={{ once: true }}
              >
                {project.technologies.map((tech, techIndex) => (
                  <motion.span
                    key={techIndex}
                    className="px-3 py-1 bg-(--color-penn-blue)/70 backdrop-blur-sm text-(--color-text-primary) text-sm rounded-full"
                    whileHover={{
                      scale: 1.1,
                      backgroundColor: "rgba(0, 148, 198, 0.3)",
                    }}
                  >
                    {tech}
                  </motion.span>
                ))}
              </motion.div>
              <motion.div
                className="flex gap-3 mt-auto"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
                viewport={{ once: true }}
              >
                {project.liveUrl && (
                  <motion.a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-(--color-blue-ncs) hover:text-(--color-lapis-lazuli) transition-colors duration-300 font-medium"
                    whileHover={{ scale: 1.1, x: 5 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    View Site
                  </motion.a>
                )}
                {project.githubUrl && (
                  <motion.a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-(--color-blue-ncs) hover:text-(--color-lapis-lazuli) transition-colors duration-300 font-medium"
                    whileHover={{ scale: 1.1, x: 5 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    View Code
                  </motion.a>
                )}
                {project.backendShowcase &&
                  project.backendShowcase.available && (
                    <motion.a
                      href={`/projects/${project.id}/backend`}
                      className="text-(--color-blue-ncs) hover:text-(--color-lapis-lazuli) transition-colors duration-300 font-medium"
                      whileHover={{ scale: 1.1, x: 5 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      View Backend
                    </motion.a>
                  )}
              </motion.div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.section>
  );
}
