import ContactClient from "./ContactClient";
import { Metadata } from "next";
import { firstParam } from "@/lib/searchParams";

export const metadata: Metadata = {
  title: "Contact",
  description: "Tell me what you're trying to take off your plate. The first call is free, and we'll figure out what it would take.",
  alternates: {
    canonical: "/contact",
  },
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
