import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBlogPost, getRelatedPosts } from "@/lib/blog";
import BlogPostClient from "./BlogPostClient";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ postId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { postId } = await params;
  const post = await getBlogPost(postId);
  if (!post) return { title: "Post Not Found | KYGR Blog" };

  return {
    title: `${post.title} | KYGR Blog`,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.publishedAt,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { postId } = await params;
  const post = await getBlogPost(postId);
  if (!post) notFound();

  const related = await getRelatedPosts(post.category, post.slug);

  return <BlogPostClient post={post} related={related} />;
}
