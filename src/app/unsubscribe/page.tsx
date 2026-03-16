import { Suspense } from "react";
import UnsubscribePageClient from "./UnsubscribePageClient";

export const metadata = {
  title: "Unsubscribe — KYGR Blog",
  description: "Unsubscribe from KYGR Blog email notifications.",
};

export default function UnsubscribePage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <UnsubscribePageClient />
    </Suspense>
  );
}
