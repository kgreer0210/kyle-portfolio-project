import { Metadata } from "next";
import BlogClient from "./BlogClient";

export const metadata: Metadata = {
  title: "Blog | KYGR Solutions",
  description:
    "Insights, tutorials, and case studies from building software for real businesses in middle Georgia. Coming soon.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function BlogPage() {
  return <BlogClient />;
}
