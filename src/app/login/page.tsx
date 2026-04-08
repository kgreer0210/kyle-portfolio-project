import type { Metadata } from "next";
import LoginForm from "@/components/crm/LoginForm";

export const metadata: Metadata = {
  title: "Portal Login",
  description: "Access the KYGR client portal and CRM dashboard.",
};

interface LoginPageProps {
  searchParams?: Promise<{
    next?: string;
    error?: string;
  }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = (await searchParams) || {};

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(0,148,198,0.22),_transparent_35%),linear-gradient(180deg,#000022_0%,#040f16_50%,#040f16_100%)] px-4 py-16 text-text-primary">
      <div className="mx-auto flex min-h-[80vh] max-w-6xl items-center justify-center">
        <div className="grid w-full max-w-5xl gap-8 overflow-hidden rounded-[2rem] border border-penn-blue bg-oxford-blue/80 shadow-2xl lg:grid-cols-[1.05fr_0.95fr]">
          <section className="flex flex-col justify-between border-b border-penn-blue p-8 lg:border-b-0 lg:border-r lg:p-12">
            <div className="space-y-6">
              <span className="inline-flex rounded-full border border-blue-ncs/40 bg-blue-ncs/10 px-4 py-2 text-sm font-medium text-blue-ncs">
                KYGR Client Portal
              </span>
              <div className="space-y-4">
                <h1 className="text-4xl font-semibold text-white md:text-5xl">
                  Manage onboarding and support in one place.
                </h1>
                <p className="max-w-xl text-base leading-7 text-text-secondary">
                  Clients can complete onboarding, submit requests, report issues,
                  and track replies without jumping between email threads.
                </p>
              </div>
            </div>

            <div className="grid gap-4 pt-10 text-sm text-text-secondary md:grid-cols-3">
              <div className="rounded-3xl border border-penn-blue bg-rich-black/50 p-4">
                Guided onboarding
              </div>
              <div className="rounded-3xl border border-penn-blue bg-rich-black/50 p-4">
                Centralized ticket history
              </div>
              <div className="rounded-3xl border border-penn-blue bg-rich-black/50 p-4">
                Role-based admin access
              </div>
            </div>
          </section>

          <section className="p-8 lg:p-12">
            <div className="mx-auto max-w-md space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold text-white">Sign in</h2>
                <p className="text-sm leading-6 text-text-secondary">
                  Use the email address tied to your client invite or admin account.
                </p>
              </div>

              <LoginForm next={params.next} initialError={params.error} />

              <div className="rounded-2xl border border-penn-blue bg-rich-black/50 p-4 text-sm text-text-secondary">
                New clients should use the invite email first. If your invite link
                signs you in automatically, you will be routed into the portal after
                confirmation.
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
