import HomeClient from "./HomeClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "KYGR Solutions | Custom Software for Growing Businesses",
  description: "Custom websites, apps, and automations from Georgia, built with care for wherever you are. I turn the idea you've been carrying around into software that gives you your time back.",
};

export default function Home() {
  return <HomeClient />;
}
