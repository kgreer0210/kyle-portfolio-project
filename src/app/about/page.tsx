import AboutClient from "./AboutClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description:
    "I’m Kyle Greer, founder of KYGR Solutions: a husband, father, and man of faith who turns the ideas people carry around into software that makes their lives easier.",
  alternates: {
    canonical: "/about",
  },
};

export default function AboutPage() {
  return <AboutClient />;
}
