import ContactClient from "./ContactClient";
import { Metadata } from "next";
import { firstParam } from "@/lib/searchParams";

export const metadata: Metadata = {
  title: "Contact",
  description: "Tell me about the idea you've been carrying around. The first call is free, and we'll figure out what it would take.",
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
