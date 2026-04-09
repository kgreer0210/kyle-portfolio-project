import type { Metadata } from "next";
import AuthCallbackHandler from "@/components/crm/AuthCallbackHandler";

export const metadata: Metadata = {
  title: "Completing sign-in...",
};

interface AuthCallbackPageProps {
  searchParams?: Promise<{
    code?: string;
    next?: string;
    type?: string;
  }>;
}

export default async function AuthCallbackPage({
  searchParams,
}: AuthCallbackPageProps) {
  const params = (await searchParams) || {};

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(0,148,198,0.22),_transparent_35%),linear-gradient(180deg,#000022_0%,#040f16_50%,#040f16_100%)] px-4 py-16 text-text-primary">
      <div className="mx-auto flex min-h-[80vh] max-w-6xl items-center justify-center">
        <div className="w-full max-w-md overflow-hidden rounded-[2rem] border border-penn-blue bg-oxford-blue/80 p-8 shadow-2xl lg:p-12">
          <div className="space-y-6">
            <div className="space-y-2">
              <span className="inline-flex rounded-full border border-blue-ncs/40 bg-blue-ncs/10 px-4 py-2 text-sm font-medium text-blue-ncs">
                KYGR Client Portal
              </span>
              <h1 className="text-2xl font-semibold text-white">
                Signing you in
              </h1>
            </div>

            <AuthCallbackHandler
              code={params.code}
              next={params.next}
              type={params.type}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
