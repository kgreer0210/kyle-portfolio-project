import { supabase } from "./supabase";
import { BlogPost } from "../types";

interface BlogPostRow {
  id: string;
  slug: string;
  title: string;
  description: string;
  content: string[];
  category: BlogPost["category"];
  tags: string[];
  read_time: string;
  published_at: string;
  featured: boolean;
}

function rowToPost(row: BlogPostRow): BlogPost {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    content: row.content,
    category: row.category,
    tags: row.tags,
    readTime: row.read_time,
    publishedAt: row.published_at,
    featured: row.featured,
  };
}

export async function getBlogPosts(): Promise<BlogPost[]> {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .order("published_at", { ascending: false });

  if (error) {
    console.error("Error fetching blog posts:", error);
    return [];
  }

  return (data as BlogPostRow[]).map(rowToPost);
}

export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !data) return null;
  return rowToPost(data as BlogPostRow);
}

export async function getRelatedPosts(
  category: string,
  excludeSlug: string,
  limit = 3
): Promise<BlogPost[]> {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("category", category)
    .neq("slug", excludeSlug)
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return (data as BlogPostRow[]).map(rowToPost);
}
