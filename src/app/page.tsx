import HomeClient from "./HomeClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "KYGR Solutions | Custom Software for Growing Businesses",
  description: "Custom websites, apps, and automations from Georgia, built with care for wherever you are. I build the site, app, or automation you’ve been picturing, so you get your time back.",
  alternates: {
    canonical: "/",
  },
};

export default function Home() {
  return <HomeClient />;
}
