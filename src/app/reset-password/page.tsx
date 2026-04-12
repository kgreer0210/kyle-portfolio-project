import type { Metadata } from "next";
import ResetPasswordForm from "@/components/crm/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Reset your KYGR client portal password.",
};

interface ResetPasswordPageProps {
  searchParams?: Promise<{
    code?: string;
    token_hash?: string;
    type?: string;
    recovery?: string;
    mode?: string;
    next?: string;
    error_description?: string;
  }>;
}

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const params = (await searchParams) || {};
  const isInviteMode = params.mode === "invite";
  const title = isInviteMode
    ? "Create your portal password."
    : "Reset your portal password.";
  const description = isInviteMode
    ? "Finish setting up your account by choosing a password before entering the portal."
    : "Request a secure reset email, or finish updating your password if you already opened a recovery link.";
  const panelTitle = isInviteMode ? "Create password" : "Password reset";
  const panelDescription = isInviteMode
    ? "Choose the password you'll use the next time you sign in to the client portal."
    : "Use your account email to request a reset, then follow the link in your inbox to set a new password.";

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
                  {title}
                </h1>
                <p className="max-w-xl text-base leading-7 text-text-secondary">
                  {description}
                </p>
              </div>
            </div>

            <div className="grid gap-4 pt-10 text-sm text-text-secondary md:grid-cols-3">
              <div className="rounded-3xl border border-penn-blue bg-rich-black/50 p-4">
                {isInviteMode ? "Secure first login" : "Secure email recovery"}
              </div>
              <div className="rounded-3xl border border-penn-blue bg-rich-black/50 p-4">
                Password update required
              </div>
              <div className="rounded-3xl border border-penn-blue bg-rich-black/50 p-4">
                Works for admins and clients
              </div>
            </div>
          </section>

          <section className="p-8 lg:p-12">
            <div className="mx-auto max-w-md space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold text-white">
                  {panelTitle}
                </h2>
                <p className="text-sm leading-6 text-text-secondary">
                  {panelDescription}
                </p>
              </div>

              <ResetPasswordForm
                initialCode={params.code}
                initialTokenHash={params.token_hash}
                initialType={params.type}
                isRecoveryRedirect={params.recovery === "1"}
                initialMode={params.mode}
                next={params.next}
                initialErrorDescription={params.error_description}
              />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
