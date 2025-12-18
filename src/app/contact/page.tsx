import ContactClient from "./ContactClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "Ready to reclaim your time and scale your operations? Reach out today for a free consultation about your software needs.",
};

export default function ContactPage() {
  return <ContactClient />;
}
