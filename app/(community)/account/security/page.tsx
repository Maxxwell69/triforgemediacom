import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import ChangeEmailForm from "../ChangeEmailForm";
import ChangePasswordForm from "../ChangePasswordForm";
import BroadcastEmailPreference from "@/components/account/BroadcastEmailPreference";
import AccountPageShell from "@/components/account/AccountPageShell";

export default async function AccountSecurityPage() {
  const { user } = await requireProfile();
  const prefsRow = await prisma.user.findUnique({
    where: { id: user.id },
    select: { broadcastEmailsOptIn: true },
  });
  const broadcastEmailsOptIn = prefsRow?.broadcastEmailsOptIn ?? true;

  return (
    <AccountPageShell
      crumbs={[{ label: "Security" }]}
      title={
        <>
          <span className="text-gradient">SECURITY</span>
        </>
      }
      description="Keep your login and notification preferences up to date."
    >
      <h2 className="font-display text-lg tracking-wide text-off-white/70">
        Email preferences
      </h2>
      <div className="mt-3">
        <BroadcastEmailPreference initialOptIn={broadcastEmailsOptIn} />
      </div>

      <h2 className="mt-10 font-display text-lg tracking-wide text-off-white/70">
        Change email
      </h2>
      <div className="mt-3">
        <ChangeEmailForm currentEmail={user.email ?? ""} />
      </div>

      <h2 className="mt-10 font-display text-lg tracking-wide text-off-white/70">
        Change password
      </h2>
      <div className="mt-3">
        <ChangePasswordForm />
      </div>
    </AccountPageShell>
  );
}
