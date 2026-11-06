import {
  getPublishedProjects,
  projects as portfolioProjects,
} from "@/data/projects";
import type { Project } from "@/types";

// Keep the derived block small enough that it never crowds out the rules.
const MAX_PROJECTS = 12;
const MAX_TECHNOLOGIES = 10;
const MAX_FIELD_CHARS = 500;

function clip(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trimEnd()}…`;
}

/**
 * Projects the assistant may talk about as finished work: published (not
 * coming-soon) and completed. In-progress and planned entries are excluded so
 * the assistant never claims unfinished work as a delivered client project.
 */
export function selectKnowledgeProjects(
  list: Project[] = portfolioProjects,
): Project[] {
  return getPublishedProjects(list)
    .filter((project) => !project.status || project.status === "completed")
    .slice(0, MAX_PROJECTS);
}

/**
 * Renders the portfolio into prompt text. This is the single source of truth
 * for project facts: nothing from `backendShowcase` (screenshot captions,
 * feature bullets) or `challenge` is included, so the assistant cannot
 * describe screenshots or repeat unbounded detail.
 */
export function buildProjectKnowledge(
  list: Project[] = portfolioProjects,
): string {
  const selected = selectKnowledgeProjects(list);
  if (selected.length === 0) {
    return "(No published projects are available. Do not name any past project.)";
  }

  return selected
    .map((project) => {
      const lines = [`## ${project.title}`];
      if (project.description) {
        lines.push(`What it is: ${clip(project.description, MAX_FIELD_CHARS)}`);
      }
      if (project.role) {
        lines.push(`My role: ${clip(project.role, MAX_FIELD_CHARS)}`);
      }
      if (project.technologies.length > 0) {
        lines.push(
          `Built with: ${project.technologies.slice(0, MAX_TECHNOLOGIES).join(", ")}`,
        );
      }
      if (project.outcome) {
        lines.push(`Outcome: ${clip(project.outcome, MAX_FIELD_CHARS)}`);
      }
      if (project.liveUrl) {
        lines.push(`Live site: ${project.liveUrl}`);
      }
      return lines.join("\n");
    })
    .join("\n\n");
}
