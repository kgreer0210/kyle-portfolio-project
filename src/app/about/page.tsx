import AboutClient from "./AboutClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "Meet Kyle Greer, founder of KYGR Solutions. He's a husband, father, and man of faith who turns the ideas people carry around into software that makes their lives easier.",
};

export default function AboutPage() {
  return <AboutClient />;
}
