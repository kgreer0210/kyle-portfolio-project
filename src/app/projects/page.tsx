import ProjectsClient from "./ProjectsClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Projects",
  description: "Websites, apps, and automations I've built for local businesses, ministries, and my own household.",
};

export default function ProjectsPage() {
  return <ProjectsClient />;
}
