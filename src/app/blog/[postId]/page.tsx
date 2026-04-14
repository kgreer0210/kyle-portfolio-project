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
    authors: [{ name: "Kyle Greer" }],
    keywords: post.tags,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      url: `https://kygrsolutions.com/blog/${post.slug}`,
      publishedTime: post.publishedAt,
      images: [{ url: "/logo.png", width: 1200, height: 630, alt: post.title }],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { postId } = await params;
  const post = await getBlogPost(postId);
  if (!post) notFound();

  const related = await getRelatedPosts(post.category, post.slug);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: post.title,
            description: post.description,
            datePublished: post.publishedAt,
            author: { "@type": "Person", name: "Kyle Greer" },
            publisher: {
              "@type": "Organization",
              name: "KYGR Solutions",
              url: "https://kygrsolutions.com",
            },
            url: `https://kygrsolutions.com/blog/${post.slug}`,
            keywords: post.tags.join(", "),
          }),
        }}
      />
      <BlogPostClient post={post} related={related} />
    </>
  );
}
