import AboutClient from "./AboutClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description:
    "I’m Kyle Greer, a Middle Georgia software developer and founder of KYGR Solutions. I build custom websites and web apps for small businesses, realtors, and organizations, and I stand behind the work long after launch.",
  alternates: {
    canonical: "/about",
  },
};

export default function AboutPage() {
  return <AboutClient />;
}
