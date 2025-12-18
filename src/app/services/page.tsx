import ServicesClient from "./ServicesClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Services",
  description: "Custom software services for local businesses including website development, web & mobile apps, and business process automation.",
};

export default function ServicesPage() {
  return <ServicesClient />;
}
