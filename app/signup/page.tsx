import Link from "next/link";
import { prisma } from "@/lib/prisma";
import SignupForm from "./SignupForm";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = searchParams.token;

  const application = token
    ? await prisma.application.findUnique({
        where: { inviteToken: token },
        include: { user: true },
      })
    : null;

  const isValid =
    !!application &&
    application.status === "APPROVED" &&
    application.user.status === "INVITED";

  if (!isValid) {
    return (
      <main className="flex flex-1 items-center justify-center px-6">
        <div className="glass max-w-md rounded-2xl p-10 text-center">
          <h1 className="font-display text-4xl tracking-wide text-orange">
            INVALID INVITE
          </h1>
          <p className="mt-4 font-body text-off-white/70">
            This invite link is invalid, expired, or has already been used.
          </p>
          <Link
            href="/apply"
            className="mt-8 inline-block rounded-lg border border-off-white/15 px-6 py-2 font-body text-off-white/90 transition hover:border-cyan/50 hover:text-cyan"
          >
            Apply for access
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="mb-8 text-center font-display text-5xl tracking-wide">
          WELCOME TO <span className="text-gradient">TRIFORGE</span>
        </h1>
        <SignupForm token={token as string} email={application!.user.email} />
      </div>
    </main>
  );
}
