import HomeClient from "./HomeClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "KYGR Solutions | Custom Software for Local Businesses",
  description: "Helping local businesses grow through custom websites, apps, and automation. Reclaim your time and win more leads.",
};

export default function Home() {
  return <HomeClient />;
}
