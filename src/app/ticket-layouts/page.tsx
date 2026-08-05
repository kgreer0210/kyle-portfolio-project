import type { Metadata } from "next";
import TicketLayoutConcepts from "./TicketLayoutConcepts";

export const metadata: Metadata = {
  title: "Ticket Layout Concepts",
  robots: { index: false, follow: false },
};

export default function TicketLayoutsPage() {
  return <TicketLayoutConcepts />;
}
