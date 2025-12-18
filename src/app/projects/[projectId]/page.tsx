"use client";

import { motion } from "motion/react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { projects } from "../../../data/projects";
import { BackendShowcase, Breadcrumb } from "../../../components";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const project = projects.find((p) => p.id === projectId);

  if (!project) {
    return (
      <div className="pt-32 pb-20 text-center">
        <h1 className="text-2xl text-text-primary">Project not found</h1>
        <button 
          onClick={() => router.push("/projects")}
          className="mt-4 text-blue-ncs hover:underline"
        >
          Back to all projects
        </button>
      </div>
    );
  }

  return (
    <main className="pt-24 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <Breadcrumb />
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex flex-wrap gap-2 mb-4">
            {project.technologies.map((tech, idx) => (
              <span key={idx} className="px-3 py-1 bg-blue-ncs/10 text-blue-ncs text-xs font-bold rounded-full">
                {tech}
              </span>
            ))}
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-text-headings mb-6">
            {project.title}
          </h1>
          <p className="text-xl text-text-secondary max-w-3xl leading-relaxed">
            {project.description}
          </p>
        </motion.div>

        <motion.div
          className="aspect-video relative rounded-3xl overflow-hidden border border-penn-blue shadow-2xl mb-16"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
        >
          <Image
            src={project.image}
            alt={project.title}
            fill
            className="object-cover"
            priority
          />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-20">
          <div className="md:col-span-2 space-y-12">
            <section>
              <h2 className="text-3xl font-bold text-text-headings mb-6">The Challenge & Role</h2>
              <div className="text-lg text-text-primary space-y-4">
                <p>Role: {project.role}</p>
                <p>
                  As the primary developer on this project, I was responsible for transforming the client&apos;s vision into a high-performance digital solution. The main challenge was to create a system that was both powerful for the business owner and intuitive for the end-users.
                </p>
              </div>
            </section>

            {project.outcome && (
              <section className="p-8 rounded-3xl bg-blue-ncs/10 border border-blue-ncs/20">
                <h2 className="text-2xl font-bold text-blue-ncs mb-4">The Outcome</h2>
                <p className="text-xl text-text-primary italic leading-relaxed">
                  &ldquo;{project.outcome}&rdquo;
                </p>
              </section>
            )}
          </div>

          <div className="md:col-span-1">
            <div className="sticky top-32 p-8 rounded-3xl bg-oxford-blue/50 border border-penn-blue">
              <h3 className="text-xl font-bold text-text-headings mb-6">Project Details</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-blue-ncs uppercase tracking-wider mb-1">Status</h4>
                  <p className="text-text-primary capitalize">{project.status}</p>
                </div>
                {project.liveUrl && (
                  <div>
                    <h4 className="text-sm font-bold text-blue-ncs uppercase tracking-wider mb-1">Live Site</h4>
                    <a 
                      href={project.liveUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-text-primary hover:text-blue-ncs transition-colors break-all"
                    >
                      {project.liveUrl}
                    </a>
                  </div>
                )}
              </div>
              <motion.button
                onClick={() => router.push("/contact")}
                className="w-full mt-8 py-4 rounded-xl bg-blue-ncs text-white font-bold hover:bg-lapis-lazuli transition-colors shadow-lg shadow-blue-ncs/20"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Inquire About Similar Project
              </motion.button>
            </div>
          </div>
        </div>

        {project.backendShowcase?.available && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mb-20"
          >
            <div className="mb-12 text-center">
              <h2 className="text-3xl md:text-5xl font-bold text-text-headings mb-4">System Deep-Dive</h2>
              <p className="text-xl text-text-secondary max-w-2xl mx-auto">
                Exploring the backend architecture and administrative tools built for this solution.
              </p>
            </div>
            <BackendShowcase 
              projectTitle={project.title} 
              screenshots={project.backendShowcase.screenshots} 
            />
          </motion.div>
        )}
      </div>
    </main>
  );
}

