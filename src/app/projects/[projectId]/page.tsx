import ProjectDetailClient from "./ProjectDetailClient";
import { isComingSoonProject, projects } from "../../../data/projects";
import { Metadata } from "next";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ projectId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { projectId } = await params;
  const project = projects.find((p) => p.id === projectId);

  if (!project || isComingSoonProject(project)) {
    return {
      title: "Project Not Found",
    };
  }

  return {
    title: project.title,
    description: project.description,
    openGraph: {
      title: `${project.title} | KYGR Solutions Project`,
      description: project.description,
      images: [
        {
          url: project.image,
          width: 1200,
          height: 630,
          alt: project.title,
        },
      ],
    },
  };
}

export default async function ProjectDetailPage({ params }: Props) {
  const { projectId } = await params;
  const project = projects.find((p) => p.id === projectId);

  // Coming-soon placeholders have no detail page.
  if (project && isComingSoonProject(project)) {
    notFound();
  }

  return <ProjectDetailClient />;
}
