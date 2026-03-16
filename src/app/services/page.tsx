import ServicesClient from "./ServicesClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Services",
  description: "Custom software services including website development, web & mobile apps, and business process automation — for businesses ready to grow.",
};

export default function ServicesPage() {
  return <ServicesClient />;
}
