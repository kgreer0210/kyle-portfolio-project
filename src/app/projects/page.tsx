import ProjectsClient from "./ProjectsClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Projects",
  description: "Explore our portfolio of custom software solutions, web applications, and business automations built for real-world impact.",
};

export default function ProjectsPage() {
  return <ProjectsClient />;
}
