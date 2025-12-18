import ProjectDetailClient from "./ProjectDetailClient";
import { projects } from "../../../data/projects";
import { Metadata } from "next";

type Props = {
  params: Promise<{ projectId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { projectId } = await params;
  const project = projects.find((p) => p.id === projectId);

  if (!project) {
    return {
      title: "Project Not Found",
    };
  }

  return {
    title: project.title,
    description: project.description,
    openGraph: {
      title: `${project.title} | KYGR Solutions Case Study`,
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

export default function ProjectDetailPage() {
  return <ProjectDetailClient />;
}
