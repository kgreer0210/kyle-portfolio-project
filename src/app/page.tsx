import HomeClient from "./HomeClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "KYGR Solutions | Custom Software for Growing Businesses",
  description: "Helping businesses grow through custom websites, apps, and automation — based in Georgia, working everywhere. Reclaim your time and win more leads.",
};

export default function Home() {
  return <HomeClient />;
}
