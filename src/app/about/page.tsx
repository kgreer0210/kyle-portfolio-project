import AboutClient from "./AboutClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "Learn more about KYGR Solutions, our mission, and our founder, Kyle Greer. We build purposeful software for local businesses.",
};

export default function AboutPage() {
  return <AboutClient />;
}
