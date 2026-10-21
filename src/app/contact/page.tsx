import ContactClient from "./ContactClient";
import { Metadata } from "next";
import { firstParam } from "@/lib/searchParams";

export const metadata: Metadata = {
  title: "Contact",
  description: "Ready to reclaim your time and scale your operations? Reach out today for a free consultation about your software needs.",
};

interface ContactPageProps {
  searchParams?: Promise<{
    subject?: string | string[];
  }>;
}

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const params = (await searchParams) ?? {};
  return <ContactClient initialSubject={firstParam(params.subject)} />;
}
