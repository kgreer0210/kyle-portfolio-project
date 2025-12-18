export interface Screenshot {
  id: string;
  title: string;
  description: string;
  image: string;
  features: string[];
}

export interface Project {
  id: string;
  title: string;
  description: string;
  image: string;
  technologies: string[];
  liveUrl?: string;
  status?: "completed" | "in-progress" | "planned";
  role?: string;
  challenge?: string;
  outcome?: string;
  backendShowcase?: {
    available: boolean;
    description: string;
    screenshots: Screenshot[];
  };
}

export interface Service {
  title: string;
  description?: string;
  points: string[];
  icon?: string;
}

export interface Skill {
  title: string;
  skills: string;
}

export interface Testimonial {
  id: number;
  name: string;
  role: string;
  quote: string | string[];
  company: string;
}

export interface NavItem {
  label: string;
  href: string;
}

