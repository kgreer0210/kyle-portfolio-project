import { Metadata } from "next";
import BlogClient from "./BlogClient";
import { getBlogPosts } from "@/lib/blog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blog | KYGR Solutions",
  description:
    "Insights, tutorials, and case studies from building software for real businesses in middle Georgia.",
  robots: {
    index: true,
    follow: true,
  },
};

export default async function BlogPage() {
  const posts = await getBlogPosts();
  return <BlogClient posts={posts} />;
}
