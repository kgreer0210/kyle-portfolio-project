import ProjectsClient from "./ProjectsClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Projects",
  description: "Websites, apps, and automations I’ve built for small businesses, realtors, and organizations in Middle Georgia and beyond.",
  alternates: {
    canonical: "/projects",
  },
};

export default function ProjectsPage() {
  return <ProjectsClient />;
}
